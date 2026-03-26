-- =============================================================================
-- Cayena PAP — esquema inicial (PostgreSQL)
-- Objetivo: multi-usuário (cada consultor vê só os próprios clientes / visitas).
-- Ajuste nomes se usar Supabase (auth.users + profiles) ou outro provedor de auth.
-- =============================================================================

-- Opcional: UUID v4 (PostgreSQL 13+ tem gen_random_uuid() nativo)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- USUÁRIOS (app)
-- Se usar Supabase Auth: NÃO crie senha aqui; use tabela profiles ligada a auth.users.
-- Se usar API própria (Node, etc.): password_hash com bcrypt/argon2.
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT,                    -- NULL se só login social / magic link via provedor
  full_name       TEXT NOT NULL,
  phone           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at   TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users (email);

-- -----------------------------------------------------------------------------
-- CLIENTES (equivalente ao array DB[] do front; sempre ligados a um usuário)
-- -----------------------------------------------------------------------------
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,

  nome            TEXT NOT NULL,
  tipo            TEXT,                    -- ex.: Restaurante, Bar / Boteco…
  status          TEXT NOT NULL DEFAULT 'novo'
                    CHECK (status IN ('novo', 'reat')),

  cnpj            TEXT,
  tel             TEXT,
  email_cliente   TEXT,                    -- e-mail do estabelecimento (evita colidir com users.email)

  rua             TEXT,
  num             TEXT,
  comp            TEXT,
  bairro          TEXT,
  cidade          TEXT,
  estado          TEXT,
  cep             TEXT,

  lat             DOUBLE PRECISION,        -- WGS84
  lng             DOUBLE PRECISION,
  obs             TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_user ON clients (user_id);
CREATE INDEX idx_clients_bairro ON clients (user_id, bairro);
CREATE INDEX idx_clients_geo ON clients (user_id, lat, lng);

-- -----------------------------------------------------------------------------
-- VISITAS (histórico por cliente; antes vinha em JSON dentro do cliente)
-- result: conv | nao | reag | aus (igual ao app atual)
-- -----------------------------------------------------------------------------
CREATE TABLE visits (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,

  visit_date        DATE NOT NULL,
  result            TEXT NOT NULL
                      CHECK (result IN ('conv', 'nao', 'reag', 'aus')),

  rep_name          TEXT,                  -- legado: "Rafael Vasconcelos"; depois pode virar só user_id
  obs               TEXT,

  cel_comprador     TEXT,
  nome_comprador    TEXT,
  tam_estab         TEXT,                  -- Pequeno | Grande
  tipo_estab_chip   TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_visits_client ON visits (client_id, visit_date DESC);
CREATE INDEX idx_visits_user ON visits (user_id, visit_date DESC);

-- -----------------------------------------------------------------------------
-- LEMBRETES (fluxo "Novo lembrete" no FAB — antes só toast)
-- -----------------------------------------------------------------------------
CREATE TABLE reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES clients (id) ON DELETE CASCADE,

  remind_at       TIMESTAMPTZ NOT NULL,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'done', 'cancelled')),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_user_time ON reminders (user_id, remind_at);
CREATE INDEX idx_reminders_pending ON reminders (user_id, status) WHERE status = 'pending';

-- -----------------------------------------------------------------------------
-- SESSÕES (só se o back-end guardar refresh token / sessão em banco)
-- Muitos projetos usam JWT stateless e não precisam desta tabela.
-- -----------------------------------------------------------------------------
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,       -- nunca armazene o token em claro
  expires_at      TIMESTAMPTZ NOT NULL,
  user_agent      TEXT,
  ip_inet         INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_expires ON sessions (expires_at);

-- =============================================================================
-- Próximos passos sugeridos (fora deste arquivo)
-- - Políticas RLS (Supabase) ou WHERE user_id = :auth em todas as queries
-- - Trigger updated_at em clients / users / reminders
-- - Unique (user_id, cnpj) se CNPJ for obrigatório e único por consultor
-- =============================================================================
