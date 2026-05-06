-- Export de leads PAP alinhado ao modelo XLSX do Cayena PAP (import em massa).
-- Versão validada no Redshift + import no app (campos, ordem e nomes de colunas).
-- Opcional: acrescente ao final do SELECT as colunas "ID vendedor" e "E-mail vendedor"
-- se quiser atribuir por linha sem usar só o vendedor padrão na tela de importação.

-- BASE DE LEADS PAP - APENAS DO MÊS ATUAL
WITH historico_pedidos AS (
    SELECT
        order_supplier_bank_id_hex,
        document_number,
        LAG(order_date) OVER (PARTITION BY document_number ORDER BY order_date) IS NULL AS is_first_order,
        EXTRACT(DAY FROM (order_date - LAG(order_date) OVER (PARTITION BY document_number ORDER BY order_date))) AS diferenca_dias
    FROM analytics_facts.order_supplier_deliveries_all
    WHERE macro_status <> 'cancelado'
),
vendas_no_periodo AS (
    SELECT
        kam.document_number,
        CASE WHEN hist.is_first_order = TRUE OR hist.is_first_order IS NULL THEN 1 ELSE 0 END AS flag_Novo,
        hist.diferenca_dias
    FROM analytics_facts.order_supplier_deliveries_all_kam AS kam
    LEFT JOIN historico_pedidos AS hist
        ON kam.order_supplier_bank_id_hex = hist.order_supplier_bank_id_hex
    WHERE kam.business_unit_do_prover = 'PAP'
      AND kam.macro_status IN ('aberto', 'confirmado')
      AND kam.account_manager = 'tatiane.machado@cayena.com'
      AND DATE_TRUNC('month', kam.order_date) = DATE_TRUNC('month', CURRENT_DATE)
),
consolidado_por_cnpj AS (
    SELECT
        document_number,
        CASE
            WHEN SUM(flag_Novo) > 0 THEN 'Novo'
            WHEN MAX(diferenca_dias) >= 30 THEN 'Reativação'
            ELSE 'Ativação'
        END AS status_final
    FROM vendas_no_periodo
    GROUP BY document_number
),
ultima_compra_pap AS (
    SELECT
        document_number,
        MAX(order_date) AS data_ultima_compra_pap
    FROM analytics_facts.order_supplier_deliveries_all_kam
    WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE)
      AND order_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
      AND business_unit_do_prover = 'PAP'
      AND macro_status IN ('aberto', 'confirmado')
      AND account_manager = 'tatiane.machado@cayena.com'
    GROUP BY document_number
),
dados_compra_pap AS (
    SELECT DISTINCT
        osd.document_number,
        osd.seller_name,
        osd.username,
        osd.store_name,
        osd.order_supplier_bank_id_hex AS ultimo_pedido_id,
        ucp.data_ultima_compra_pap
    FROM ultima_compra_pap ucp
    JOIN analytics_facts.order_supplier_deliveries_all_kam osd
        ON ucp.document_number = osd.document_number
        AND ucp.data_ultima_compra_pap = osd.order_date
        AND osd.business_unit_do_prover = 'PAP'
        AND osd.macro_status IN ('aberto', 'confirmado')
        AND osd.account_manager = 'tatiane.machado@cayena.com'
),
compras_posteriores_nao_pap_ranked AS (
    SELECT
        dcp.document_number,
        osd.order_supplier_date,
        osd.business_unit_do_prover,
        osd.sub_business_unit_do_prover,
        ROW_NUMBER() OVER (PARTITION BY dcp.document_number ORDER BY osd.order_supplier_date DESC) AS rn
    FROM dados_compra_pap dcp
    JOIN analytics_facts.order_supplier_deliveries_all_kam osd
        ON dcp.document_number = osd.document_number
        AND osd.order_supplier_date > dcp.data_ultima_compra_pap
        AND osd.business_unit_do_prover != 'PAP'
        AND osd.macro_status IN ('aberto', 'confirmado')
),
compras_posteriores_nao_pap AS (
    SELECT
        document_number,
        order_supplier_date AS data_ultima_compra_nao_pap,
        business_unit_do_prover AS ultima_bu_nao_pap,
        sub_business_unit_do_prover AS ultima_sub_bu_nao_pap
    FROM compras_posteriores_nao_pap_ranked
    WHERE rn = 1
),
itens_ultimo_pedido AS (
    SELECT
        opa.document_number,
        opa.order_supplier_bank_id_hex,
        LISTAGG(
            opa.supplier_at_order
            || ' | ' || opa.product_desc
            || ' | ' || CAST(ROUND(opa.quantity, 0) AS VARCHAR) || ' un'
            || ' | R$' || CAST(ROUND(opa.customer_order_amount, 0) AS VARCHAR),
            ' // '
        ) WITHIN GROUP (ORDER BY opa.customer_order_amount DESC) AS resumo_itens
    FROM analytics_facts.order_products_all opa
    WHERE opa.business_unit_do_prover = 'PAP'
      AND opa.macro_status IN ('aberto', 'confirmado')
      AND opa.account_manager = 'tatiane.machado@cayena.com'
      AND DATE_TRUNC('month', opa.order_date) = DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY opa.document_number, opa.order_supplier_bank_id_hex
),
metodos_pagamento AS (
    SELECT
        document_number,
        LISTAGG(DISTINCT
            CASE payment_method_type
                WHEN 'BANK_SLIP'   THEN 'Boleto'
                WHEN 'PIX'         THEN 'Pix'
                WHEN 'CREDIT_CARD' THEN 'Cartão de crédito'
                WHEN 'DEBIT_CARD'  THEN 'Cartão de débito'
                WHEN 'CASH'        THEN 'Dinheiro'
                ELSE payment_method_type
            END,
        ', ') WITHIN GROUP (ORDER BY payment_method_type) AS metodos
    FROM analytics_facts.order_products_all
    WHERE business_unit_do_prover = 'PAP'
      AND macro_status IN ('aberto', 'confirmado')
      AND account_manager = 'tatiane.machado@cayena.com'
      AND DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY document_number
)
SELECT
    REGEXP_REPLACE(dcp.document_number, '[^0-9]', '')                        AS "CNPJ",
    dcp.store_name                                                            AS "Nome",
    CASE
        WHEN sd.type_store IS NOT NULL AND sd.type_store <> 'outros' THEN sd.type_store
        WHEN UPPER(dcp.store_name) LIKE '%PIZZA%'
          OR UPPER(dcp.store_name) LIKE '%PIZZARIA%'                         THEN 'pizzarias'
        WHEN UPPER(dcp.store_name) LIKE '%PADARIA%'
          OR UPPER(dcp.store_name) LIKE '%PANIFICADORA%'                     THEN 'padaria'
        WHEN UPPER(dcp.store_name) LIKE '%SUPERMERCADO%'
          OR UPPER(dcp.store_name) LIKE '%MERCADO%'
          OR UPPER(dcp.store_name) LIKE '%MERCEARIA%'                        THEN 'mercado'
        WHEN UPPER(dcp.store_name) LIKE '%LANCHONETE%'
          OR UPPER(dcp.store_name) LIKE '%LANCHE%'                           THEN 'lanchonete'
        WHEN UPPER(dcp.store_name) LIKE '%CHURRASCO%'
          OR UPPER(dcp.store_name) LIKE '%CHURRASQUEIRA%'                    THEN 'churrascaria'
        WHEN UPPER(dcp.store_name) LIKE '%BAR %'
          OR UPPER(dcp.store_name) LIKE '% BAR'
          OR UPPER(dcp.store_name) LIKE '%BOTECO%'                           THEN 'bar'
        WHEN UPPER(dcp.store_name) LIKE '%RESTAURANTE%'
          OR UPPER(dcp.store_name) LIKE '%REFEICAO%'                         THEN 'restaurante'
        WHEN UPPER(dcp.store_name) LIKE '%HOTEL%'
          OR UPPER(dcp.store_name) LIKE '%POUSADA%'                          THEN 'hotel'
        WHEN UPPER(dcp.store_name) LIKE '%DISTRIBUIDORA%'
          OR UPPER(dcp.store_name) LIKE '%ATACADO%'                          THEN 'distribuidor'
        WHEN UPPER(dcp.store_name) LIKE '%SORVETERIA%'
          OR UPPER(dcp.store_name) LIKE '%SORVETE%'                          THEN 'sorveteria'
        WHEN UPPER(dcp.store_name) LIKE '%SALGADO%'
          OR UPPER(dcp.store_name) LIKE '%CONFEITARIA%'                      THEN 'confeitaria'
        ELSE 'outros'
    END                                                                       AS "Tipo",
    CASE
        WHEN sd.owner_phone_number IS NOT NULL THEN
            REGEXP_REPLACE(REGEXP_REPLACE(sd.owner_phone_number, '[^0-9]', ''), '^55', '')
        WHEN sd.phone_number IS NOT NULL THEN
            REGEXP_REPLACE(REGEXP_REPLACE(sd.phone_number, '[^0-9]', ''), '^55', '')
        WHEN sd.fintech_phone_number IS NOT NULL THEN
            REGEXP_REPLACE(REGEXP_REPLACE(sd.fintech_phone_number, '[^0-9]', ''), '^55', '')
        ELSE NULL
    END                                                                       AS "Telefone",
    sd.owner_email                                                            AS "E-mail",
    sd.address                                                                AS "Rua",
    sd.number                                                                 AS "Número",
    sd.complement                                                             AS "Complemento",
    sd.neighborhood_name                                                      AS "Bairro",
    sd.city                                                                   AS "Cidade",
    sd.state                                                                  AS "Estado",
    sd.zip_code                                                               AS "CEP",
    CAST(sd.latitude AS VARCHAR(50))                                          AS "Latitude",
    CAST(sd.longitude AS VARCHAR(50))                                         AS "Longitude",
    CAST(NULL AS VARCHAR(500))                                                AS "Observações",
    dcp.seller_name                                                           AS "Nome do último vendedor",
    COALESCE(
        NULLIF(sd.store_tag, ''),
        CASE
            WHEN UPPER(dcp.store_name) LIKE '%PIZZA%'                        THEN 'Pizza'
            WHEN UPPER(dcp.store_name) LIKE '%PADARIA%'
              OR UPPER(dcp.store_name) LIKE '%PANIFICADORA%'                 THEN 'Padaria'
            WHEN UPPER(dcp.store_name) LIKE '%CHURRASCO%'                    THEN 'Churrascaria'
            WHEN UPPER(dcp.store_name) LIKE '%SALGADO%'
              OR UPPER(dcp.store_name) LIKE '%CONFEITARIA%'                  THEN 'Salgados/Confeitaria'
            WHEN UPPER(dcp.store_name) LIKE '%SUSHI%'
              OR UPPER(dcp.store_name) LIKE '%JAPONESA%'                     THEN 'Japonesa'
            WHEN UPPER(dcp.store_name) LIKE '%ITALIANA%'                     THEN 'Italiana'
            WHEN UPPER(dcp.store_name) LIKE '%BRASILEIRA%'
              OR UPPER(dcp.store_name) LIKE '%NORDESTINA%'                   THEN 'Brasileira'
            WHEN UPPER(dcp.store_name) LIKE '%BAR %'
              OR UPPER(dcp.store_name) LIKE '% BAR'
              OR UPPER(dcp.store_name) LIKE '%BOTECO%'                       THEN 'Bar/Boteco'
            ELSE NULL
        END
    )                                                                         AS "Tipo de cozinha",
    CASE
        WHEN DATEDIFF('day', CAST(dcp.data_ultima_compra_pap AS DATE), CURRENT_DATE) BETWEEN 0   AND 7   THEN '1 a 7 dias'
        WHEN DATEDIFF('day', CAST(dcp.data_ultima_compra_pap AS DATE), CURRENT_DATE) BETWEEN 8   AND 30  THEN '7 a 30 dias'
        WHEN DATEDIFF('day', CAST(dcp.data_ultima_compra_pap AS DATE), CURRENT_DATE) BETWEEN 31  AND 60  THEN '30 a 60 dias'
        WHEN DATEDIFF('day', CAST(dcp.data_ultima_compra_pap AS DATE), CURRENT_DATE) BETWEEN 61  AND 120 THEN '60 a 120 dias'
        WHEN DATEDIFF('day', CAST(dcp.data_ultima_compra_pap AS DATE), CURRENT_DATE) BETWEEN 121 AND 180 THEN '120 a 180 dias'
        WHEN DATEDIFF('day', CAST(dcp.data_ultima_compra_pap AS DATE), CURRENT_DATE) BETWEEN 181 AND 360 THEN '180 a 360 dias'
        WHEN DATEDIFF('day', CAST(dcp.data_ultima_compra_pap AS DATE), CURRENT_DATE) > 360               THEN 'Acima de 360 dias'
    END                                                                       AS "Recência do cliente",
    CAST(sd.approved_limit AS VARCHAR(64))                                    AS "Limite aprovado",
    sd.owner_name                                                             AS "Nome do proprietário",
    CASE
        WHEN sd.max_term IS NULL THEN 'Sem prazo'
        ELSE CAST(sd.max_term AS VARCHAR) || ' dias'
    END                                                                       AS "Prazo de pagamento",
    COALESCE(mp.metodos, 'Não informado')                                     AS "Método de pagamento",
    COALESCE(iup.resumo_itens, 'Sem detalhes')                               AS "Informações do último pedido",
    sd.type_store                                                             AS "Tipo do estabelecimento",
    'PAP'                                                                     AS "Origem do lead"
FROM dados_compra_pap dcp
JOIN consolidado_por_cnpj cf
    ON dcp.document_number = cf.document_number
LEFT JOIN compras_posteriores_nao_pap cpnp
    ON dcp.document_number = cpnp.document_number
LEFT JOIN analytics_dimensions.store_dimension_finance sd
    ON dcp.document_number = sd.document_number
LEFT JOIN itens_ultimo_pedido iup
    ON dcp.ultimo_pedido_id = iup.order_supplier_bank_id_hex
LEFT JOIN metodos_pagamento mp
    ON dcp.document_number = mp.document_number
WHERE cf.status_final IN ('Novo', 'Reativação')
ORDER BY DATEDIFF('day', CAST(dcp.data_ultima_compra_pap AS DATE), CURRENT_DATE);
