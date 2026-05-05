const now = new Date();
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const pad = (n) => String(n).padStart(2, '0');

function normalizeCnpjDigits(s) {
  return String(s || '')
    .replace(/\D/g, '')
    .slice(0, 14);
}

function formatCnpjDisplay(digits) {
  const d = String(digits || '')
    .replace(/\D/g, '')
    .slice(0, 14);
  if (d.length !== 14) return '';
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

document.getElementById('gdate').textContent =
  DIAS[now.getDay()] + ', ' + now.getDate() + ' de ' + MESES[now.getMonth()];

const MOCK_DB_SEED = [
  {
    id: 0,
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    nome: 'Pizzaria do Zé',
    tipo: 'Restaurante',
    status: 'novo',
    cnpj: '12.345.678/0001-90',
    tel: '(11) 97777-1234',
    email: 'ze@pizzariadoze.com.br',
    rua: 'R. Fradique Coutinho',
    num: '88',
    comp: '',
    bairro: 'Vila Madalena',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '05416-010',
    lat: '-23.5562',
    lng: '-46.6901',
    obs: 'Dono atende 11h-23h. Interessado em laticínios.',
    visitas: [],
    lembretes: [],
  },
  {
    id: 1,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    nome: 'Açougue Central',
    tipo: 'Açougue',
    status: 'reat',
    cnpj: '98.765.432/0001-10',
    tel: '(11) 96666-5678',
    email: 'contato@acouguecentral.com',
    rua: 'R. Oscar Freire',
    num: '55',
    comp: 'Loja 2',
    bairro: 'Pinheiros',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01426-000',
    lat: '-23.5648',
    lng: '-46.6782',
    obs: 'Último pedido há 75 dias. Qualificado para reativação.',
    visitas: [
      {
        data: '18/03/2026',
        res: 'nao',
        rep: 'Consultor',
        obs: 'Cliente viajando, retornar semana que vem.',
      },
      {
        data: '10/02/2026',
        res: 'reag',
        rep: 'Consultor',
        obs: 'Reunião com fornecedor. Agendou para 18/03.',
      },
    ],
    lembretes: [],
  },
  {
    id: 2,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    nome: 'Bar do Carlinhos',
    tipo: 'Bar / Boteco',
    status: 'reat',
    cnpj: '45.678.901/0001-23',
    tel: '(11) 94444-9012',
    email: 'carlinhos@bardocarlinhos.com',
    rua: 'R. Pamplona',
    num: '300',
    comp: '',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01321-000',
    lat: '-23.5612',
    lng: '-46.6521',
    obs: 'Comprava regularmente até dez/2025.',
    visitas: [
      {
        data: '20/03/2026',
        res: 'conv',
        rep: 'Consultor',
        obs: 'Pedido R$890 — frango e linguiça calabresa.',
      },
    ],
    lembretes: [],
  },
  {
    id: 3,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    nome: 'Restaurante Vegano SP',
    tipo: 'Restaurante',
    status: 'novo',
    cnpj: '33.221.100/0001-55',
    tel: '(11) 93333-4567',
    email: 'contato@veganospsp.com.br',
    rua: 'Al. Itu',
    num: '220',
    comp: '',
    bairro: 'Jardins',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01421-001',
    lat: '-23.5660',
    lng: '-46.6644',
    obs: 'Foco em vegetais e proteínas vegetais.',
    visitas: [],
    lembretes: [],
  },
];

/** @type {typeof MOCK_DB_SEED} */
let DB = [];

let supabaseClient = null;
let supabaseReadyPromise = null;

function isSupabaseConfigured() {
  const u = window.SUPABASE_URL;
  const k = window.SUPABASE_ANON_KEY;
  return !!(u && k && String(u).startsWith('http'));
}

function updateAuthSkipVisibility() {
  const skip = document.getElementById('auth-btn-skip');
  if (!skip) return;
  skip.style.display = isSupabaseConfigured() ? 'none' : '';
}

async function ensureSupabase() {
  if (supabaseClient) return supabaseClient;
  if (!isSupabaseConfigured()) return null;
  if (!supabaseReadyPromise) {
    supabaseReadyPromise = import('https://esm.sh/@supabase/supabase-js@2')
      .then(function (mod) {
        supabaseClient = mod.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        });
        return supabaseClient;
      })
      .catch(function (e) {
        console.warn(e);
        supabaseReadyPromise = null;
        return null;
      });
  }
  return supabaseReadyPromise;
}

function mapVisitRow(v) {
  let dataStr = '';
  if (v.visit_date) {
    const raw = String(v.visit_date).split('T')[0];
    const p = raw.split('-');
    if (p.length === 3) {
      dataStr = p[2] + '/' + p[1] + '/' + p[0];
    }
  }
  if (!dataStr && v.created_at) {
    const dt = new Date(v.created_at);
    dataStr = pad(dt.getDate()) + '/' + pad(dt.getMonth() + 1) + '/' + dt.getFullYear();
  }
  const created_at_ts = v.created_at ? new Date(v.created_at).getTime() : 0;
  const saxSale =
    v.sax_sale_reasons == null
      ? []
      : Array.isArray(v.sax_sale_reasons)
        ? v.sax_sale_reasons
        : [];
  const saxNo =
    v.sax_no_sale_reasons == null
      ? []
      : Array.isArray(v.sax_no_sale_reasons)
        ? v.sax_no_sale_reasons
        : [];
  return {
    data: dataStr,
    res: v.result,
    rep: v.rep_name || '',
    obs:
      v.business_unit === 'SAX'
        ? v.sax_obs_extra || v.obs || ''
        : v.obs || '',
    celComprador: v.cel_comprador || '',
    nomeComprador: v.nome_comprador || '',
    tamEstab: v.tam_estab || '',
    tipoEstabChip: v.tipo_estab_chip || '',
    businessUnit:
      v.business_unit === 'SAX' || v.visit_team === 'farmer' ? 'SAX' : 'PAP',
    created_at_ts: created_at_ts,
    saxSold: v.sax_sold || '',
    saxSaleReasons: saxSale,
    saxNoSaleReasons: saxNo,
    saxDecisorName: v.sax_decisor_name || '',
    saxDecisorContact: v.sax_decisor_contact || '',
    saxBestContactTime: v.sax_best_contact_time || '',
    saxPhotoFachadaUrl: v.sax_photo_fachada_url || '',
    saxPhotoCardapioUrl: v.sax_photo_cardapio_url || '',
    saxObsExtra: v.sax_obs_extra || '',
  };
}

function mapReminderRow(r) {
  const remindAt = r.remind_at ? new Date(r.remind_at) : null;
  let dataStr = '';
  let horaStr = '';
  let remind_at_ms = 0;
  if (remindAt && !isNaN(remindAt.getTime())) {
    remind_at_ms = remindAt.getTime();
    dataStr = pad(remindAt.getDate()) + '/' + pad(remindAt.getMonth() + 1) + '/' + remindAt.getFullYear();
    horaStr = pad(remindAt.getHours()) + ':' + pad(remindAt.getMinutes());
  }
  return {
    id: r.id,
    remind_at: r.remind_at,
    remind_at_ms: remind_at_ms,
    dataStr: dataStr,
    horaStr: horaStr,
    notes: r.notes || '',
    status: r.status || 'pending',
  };
}

function sortLembretesDesc(lembretes) {
  return (lembretes || []).slice().sort(function (a, b) {
    return (b.remind_at_ms || 0) - (a.remind_at_ms || 0);
  });
}

function visitSortTimestamp(v) {
  if (v && v.created_at_ts) return v.created_at_ts;
  const pa = String((v && v.data) || '').split('/').map(Number);
  if (pa.length < 3) return 0;
  return new Date(pa[2], pa[1] - 1, pa[0], 12, 0, 0).getTime();
}

function sortVisitasDesc(visitas) {
  return (visitas || []).slice().sort(function (a, b) {
    const pa = String(a.data).split('/').map(Number);
    const pb = String(b.data).split('/').map(Number);
    if (pa.length < 3 || pb.length < 3) return 0;
    const da = new Date(pa[2], pa[1] - 1, pa[0]);
    const db = new Date(pb[2], pb[1] - 1, pb[0]);
    return db - da;
  });
}

function mapClientRow(row) {
  const visitas = sortVisitasDesc((row.visits || []).map(mapVisitRow));
  const lembretes = sortLembretesDesc((row.reminders || []).map(mapReminderRow));
  const cnpjShown =
    row.cnpj_display || row.cnpj || formatCnpjDisplay(row.cnpj_normalized) || '';
  return {
    id: row.id,
    nome: row.nome,
    tipo: row.tipo || 'Outro',
    status: row.status || 'novo',
    cnpj: cnpjShown,
    tel: row.tel || '',
    email: row.email_cliente || '',
    rua: row.rua || '',
    num: row.num || '',
    comp: row.comp || '',
    bairro: row.bairro || '',
    cidade: row.cidade || '',
    estado: row.estado || '',
    cep: row.cep || '',
    lat: row.lat != null ? String(row.lat) : '',
    lng: row.lng != null ? String(row.lng) : '',
    obs: row.obs || '',
    visitas: visitas,
    lembretes: lembretes,
    created_at: row.created_at || null,
  };
}

function clientCreatedDate(c) {
  if (!c || !c.created_at) return null;
  const d = new Date(c.created_at);
  return isNaN(d.getTime()) ? null : d;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeekMonday(d) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function countCreatedInRange(clients, start, end) {
  return clients.filter(function (c) {
    const dt = clientCreatedDate(c);
    if (!dt) return false;
    return dt >= start && dt <= end;
  }).length;
}

function countCreatedOnCalendarDay(clients, day) {
  const d0 = startOfDay(day);
  const d1 = new Date(d0);
  d1.setDate(d1.getDate() + 1);
  return clients.filter(function (c) {
    const dt = clientCreatedDate(c);
    if (!dt) return false;
    return dt >= d0 && dt < d1;
  }).length;
}

function relativeTimePt(d) {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora há pouco';
  if (m < 60) return 'há ' + m + ' min';
  const h = Math.floor(m / 60);
  if (h < 24) return 'há ' + h + ' h';
  const days = Math.floor(h / 24);
  if (days === 1) return 'ontem';
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
}

function tipoEmoji(tipo) {
  const t = String(tipo || '').toLowerCase();
  if (t.includes('pizza') || t.includes('restaur')) return '🍕';
  if (t.includes('açou') || t.includes('acou')) return '🥩';
  if (t.includes('bar') || t.includes('boteco')) return '🍺';
  if (t.includes('vegan') || t.includes('salad')) return '🥗';
  if (t.includes('padar')) return '🥖';
  if (t.includes('merc')) return '🛒';
  return '🏪';
}

function deltaVersusSemana(curr, prev) {
  if (prev === 0 && curr === 0) return '—';
  if (prev === 0) return curr > 0 ? '↑ ' + curr + ' vs 0 na sem. anterior' : '—';
  const d = curr - prev;
  if (d > 0) return '↑ ' + d + ' vs sem. anterior';
  if (d < 0) return '↓ ' + Math.abs(d) + ' vs sem. anterior';
  return 'Igual à sem. anterior';
}

function pctVsMesAnterior(curr, prev) {
  if (prev === 0 && curr === 0) return '—';
  if (prev === 0) return curr > 0 ? '↑ 100% vs mês anterior' : '—';
  const pct = Math.round(((curr - prev) / prev) * 100);
  if (pct > 0) return '↑ ' + pct + '% vs mês anterior';
  if (pct < 0) return '↓ ' + Math.abs(pct) + '% vs mês anterior';
  return '0% vs mês anterior';
}

function renderDashboard() {
  const list = DB || [];
  const now = new Date();
  const y = now.getFullYear();
  const mo = now.getMonth();

  const startThisMonth = new Date(y, mo, 1);
  const startNextMonth = new Date(y, mo + 1, 1);
  const startPrevMonth = new Date(y, mo - 1, 1);
  const endPrevMonth = new Date(startThisMonth.getTime() - 1);

  const mesAtual = countCreatedInRange(list, startThisMonth, endOfDay(now));
  const mesAnterior = countCreatedInRange(list, startPrevMonth, endPrevMonth);

  const wkStart = startOfWeekMonday(now);
  const wkPrevEnd = new Date(wkStart.getTime() - 1);
  const wkPrevStart = new Date(wkStart);
  wkPrevStart.setDate(wkPrevStart.getDate() - 7);
  const semAtual = countCreatedInRange(list, wkStart, endOfDay(now));
  const semAnterior = countCreatedInRange(list, wkPrevStart, wkPrevEnd);

  const todayStart = startOfDay(now);
  const yesterday = new Date(todayStart);
  yesterday.setDate(yesterday.getDate() - 1);
  const hoje = countCreatedOnCalendarDay(list, now);
  const ontem = countCreatedOnCalendarDay(list, yesterday);

  const elMes = document.getElementById('dash-k-mes');
  const elMesDelta = document.getElementById('dash-k-mes-delta');
  const elSem = document.getElementById('dash-k-sem');
  const elSemDelta = document.getElementById('dash-k-sem-delta');
  const elHoje = document.getElementById('khoje');
  const elHojeSub = document.getElementById('dash-k-hoje-sub');
  if (elMes) elMes.textContent = String(mesAtual);
  if (elMesDelta) {
    elMesDelta.textContent = pctVsMesAnterior(mesAtual, mesAnterior);
    elMesDelta.className = 'kt ' + (mesAtual >= mesAnterior ? 'kt-up' : 'kt-warn');
  }
  if (elSem) elSem.textContent = String(semAtual);
  if (elSemDelta) {
    elSemDelta.textContent = deltaVersusSemana(semAtual, semAnterior);
    elSemDelta.className = 'kt ' + (semAtual >= semAnterior ? 'kt-up' : 'kt-warn');
  }
  if (elHoje) elHoje.textContent = String(hoje);
  if (elHojeSub) {
    if (ontem === 0 && hoje === 0) elHojeSub.textContent = '—';
    else if (ontem === 0) elHojeSub.textContent = hoje > 0 ? '1º cadastro hoje' : '—';
    else {
      const d = hoje - ontem;
      if (d > 0) elHojeSub.textContent = '↑ ' + d + ' vs ontem';
      else if (d < 0) elHojeSub.textContent = '↓ ' + Math.abs(d) + ' vs ontem';
      else elHojeSub.textContent = 'Igual a ontem';
    }
    elHojeSub.className = 'kt ' + (hoje >= ontem ? 'kt-up' : 'kt-warn');
  }

  const chartEl = document.getElementById('dash-chart-rows');
  if (chartEl) {
    const days = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(12, 0, 0, 0);
      days.push({ d: d, cnt: countCreatedOnCalendarDay(list, d) });
    }
    const maxv = Math.max(1, ...days.map(function (x) { return x.cnt; }));
    chartEl.innerHTML = days
      .map(function (x) {
        const dayIdx = x.d.getDay();
        const label = DIAS_SHORT[dayIdx];
        const pct = Math.round((x.cnt / maxv) * 100);
        const dim = x.cnt === 0 ? ' dim' : '';
        return (
          '<div class="br"><span class="bday">' +
          label +
          '</span><div class="btrack"><div class="bfill' +
          dim +
          '" style="width:' +
          pct +
          '%"></div></div><span class="bnum">' +
          x.cnt +
          '</span></div>'
        );
      })
      .join('');
  }

  const recentEl = document.getElementById('dash-recent-list');
  if (recentEl) {
    const sorted = list
      .slice()
      .sort(function (a, b) {
        const da = clientCreatedDate(a);
        const db = clientCreatedDate(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db - da;
      })
      .slice(0, 8);
    if (!sorted.length) {
      recentEl.innerHTML =
        '<div class="empty" style="padding:20px">Nenhum cadastro ainda. Toque no + para incluir um cliente.</div>';
    } else {
      recentEl.innerHTML = sorted
        .map(function (c) {
          const dt = clientCreatedDate(c);
          const when = dt ? relativeTimePt(dt) : '—';
          const badge = c.status === 'reat' ? 'REATIVADO' : 'NOVO';
          const bcls = c.status === 'reat' ? 'b-reat' : 'b-novo';
          const bairro = c.bairro || '—';
          const idEsc = String(c.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          return (
            '<div class="arow" onclick="openCli(\'' +
            idEsc +
            '\')"><div class="aico">' +
            tipoEmoji(c.tipo) +
            '</div><div class="ainf"><div class="an">' +
            escapeHtml(c.nome) +
            '</div><div class="as">' +
            escapeHtml(bairro) +
            ' · ' +
            when +
            '</div></div><span class="badge ' +
            bcls +
            '">' +
            badge +
            '</span></div>'
          );
        })
        .join('');
    }
  }
}

/** Erro típico quando o navegador ainda executa JS antigo que consulta a tabela removida `clients`. */
function isLegacyClientsSchemaError(msg) {
  const m = String(msg || '');
  return (
    m.includes('public.clients') ||
    (m.includes('schema cache') && m.includes('clients')) ||
    /relation\s+["']?public\.clients["']?\s+does\s+not\s+exist/i.test(m)
  );
}

/** Toast só para erros “reais”; cache/JS antigo só vai para o console. */
function notifySupabaseListLoadError(msg, silent) {
  if (silent) return;
  if (isLegacyClientsSchemaError(msg)) {
    console.warn(
      '[Cayena PAP] Ignorando erro de schema antigo (tabela clients). Atualize o site (pap-app.js) e limpe o cache do navegador.',
      msg
    );
    return;
  }
  toast('Erro ao carregar clientes: ' + String(msg || ''));
}

/** Mesma lista de colunas usada em loadClientsFromSupabase (visitas + lembretes aninhados). */
const ESTABLISHMENT_SELECT_WITH_VISITS =
  'id,cnpj_normalized,cnpj_display,nome,tipo,status,tel,email_cliente,rua,num,comp,bairro,cidade,estado,cep,lat,lng,obs,created_at,updated_at,created_by,updated_by,visits(id,visit_date,result,rep_name,obs,cel_comprador,nome_comprador,tam_estab,tipo_estab_chip,business_unit,sax_sold,sax_sale_reasons,sax_no_sale_reasons,sax_decisor_name,sax_decisor_contact,sax_best_contact_time,sax_photo_fachada_url,sax_photo_cardapio_url,sax_obs_extra,created_at),reminders(id,remind_at,notes,status,created_at)';

function refreshOpenClientPickers() {
  const ovLem = document.getElementById('ov-lem');
  if (ovLem && ovLem.classList.contains('on')) {
    const lq = document.getElementById('lem-q');
    renderLemList(lq ? lq.value : '');
  }
  const ovPick = document.getElementById('ov-pick-cli');
  if (ovPick && ovPick.classList.contains('on')) {
    const pq = document.getElementById('pick-cli-q');
    renderPickCliList(pq ? pq.value : '');
  }
}

/**
 * Garante um estabelecimento no DB local após cadastro (útil se o reload completo falhar).
 */
async function mergeEstablishmentIntoDb(sb, establishmentId) {
  if (!sb || !establishmentId) return;
  let q = sb
    .from('establishments')
    .select(ESTABLISHMENT_SELECT_WITH_VISITS)
    .eq('id', establishmentId)
    .order('created_at', { ascending: false, foreignTable: 'visits' })
    .order('remind_at', { ascending: false, foreignTable: 'reminders' });
  const { data, error } = await q.maybeSingle();
  if (error || !data) return;
  const mapped = mapClientRow(data);
  const idx = DB.findIndex(function (c) {
    return String(c.id) === String(establishmentId);
  });
  if (idx >= 0) DB.splice(idx, 1);
  DB.unshift(mapped);
  DB.sort(function (a, b) {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  });
  renderDashboard();
  if (typeof refreshMapMarkers === 'function') {
    refreshMapMarkers({ doInitialFit: true });
  }
  const cl = document.getElementById('cli-list');
  if (cl && document.getElementById('scr-clis') && document.getElementById('scr-clis').classList.contains('on')) {
    renderCliList([...DB]);
  }
  refreshOpenClientPickers();
  onClientsLoaded();
}

/** @returns {Promise<boolean>} true se a lista foi carregada com sucesso */
async function loadClientsFromSupabase(opts) {
  const silent = opts && opts.silent;
  const sb = await ensureSupabase();
  if (!sb) return false;
  const { data: authData } = await sb.auth.getUser();
  const user = authData && authData.user;
  if (!user) return false;

  const { data: assigns, error: errAssign } = await sb
    .from('establishment_assignments')
    .select('establishment_id')
    .eq('user_id', user.id);
  if (errAssign) {
    notifySupabaseListLoadError(errAssign.message, silent);
    await loadMyProfile();
    return false;
  }
  const ids = (assigns || []).map(function (a) {
    return a.establishment_id;
  });
  if (ids.length === 0) {
    DB = [];
    renderDashboard();
    if (typeof refreshMapMarkers === 'function') {
      refreshMapMarkers({ doInitialFit: true });
    }
    const cl = document.getElementById('cli-list');
    if (cl && document.getElementById('scr-clis') && document.getElementById('scr-clis').classList.contains('on')) {
      renderCliList([...DB]);
    }
    refreshOpenClientPickers();
    await loadMyProfile();
    onClientsLoaded();
    return true;
  }

  let q = sb
    .from('establishments')
    .select(ESTABLISHMENT_SELECT_WITH_VISITS)
    .in('id', ids)
    .order('created_at', { ascending: false });
  q = q.order('created_at', { ascending: false, foreignTable: 'visits' });
  q = q.order('remind_at', { ascending: false, foreignTable: 'reminders' });
  const { data, error } = await q;
  if (error) {
    notifySupabaseListLoadError(error.message, silent);
    await loadMyProfile();
    return false;
  }
  DB = (data || []).map(mapClientRow);
  renderDashboard();
  if (typeof refreshMapMarkers === 'function') {
    refreshMapMarkers({ doInitialFit: true });
  }
  const cl = document.getElementById('cli-list');
  if (cl && document.getElementById('scr-clis') && document.getElementById('scr-clis').classList.contains('on')) {
    renderCliList([...DB]);
  }
  refreshOpenClientPickers();
  await loadMyProfile();
  onClientsLoaded();
  return true;
}

function showAuthOverlay() {
  const o = document.getElementById('ov-auth');
  if (o) {
    o.classList.add('on');
    o.setAttribute('aria-hidden', 'false');
  }
  document.body.classList.add('auth-screen-open');
  const pass = document.getElementById('auth-pass');
  if (pass) pass.value = '';
  authResetPassToggle();
  const msg = document.getElementById('auth-msg');
  if (msg) msg.textContent = '';
  setAuthFieldError(false);
  updateAuthSkipVisibility();
}

function hideAuthOverlay() {
  const o = document.getElementById('ov-auth');
  if (o) {
    o.classList.remove('on');
    o.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('auth-screen-open');
}

function greetFirstNameFromProfile(fullName) {
  if (!fullName || !String(fullName).trim()) return '';
  return String(fullName).trim().split(/\s+/)[0];
}

function updateDashboardGreet(user) {
  const span = document.getElementById('dash-greet-name');
  if (!span) return;
  if (sessionStorage.getItem('cayena_offline') === '1') {
    span.textContent = 'Consultor';
    return;
  }
  if (user && user.email) {
    const fromProfile = currentProfile && greetFirstNameFromProfile(currentProfile.full_name);
    span.textContent = fromProfile || user.email.split('@')[0] || 'Consultor';
    return;
  }
  span.textContent = 'Consultor';
}

function updateMoreMenuLoginRecover() {
  const el = document.getElementById('more-login-recover');
  const card = document.getElementById('more-card-conta');
  const title = document.getElementById('more-title-conta');
  if (!el) return;
  const show =
    isSupabaseConfigured() && sessionStorage.getItem('cayena_offline') === '1';
  el.style.display = show ? '' : 'none';
  if (card) card.style.display = show ? '' : 'none';
  if (title) title.style.display = show ? '' : 'none';
}

function updateHdrUser(user) {
  const session = document.getElementById('hdr-session');
  const el = document.getElementById('hdr-user');
  const roleEl = document.getElementById('hdr-role');
  const moreLogout = document.getElementById('more-logout');
  const show = !!user;
  if (session) session.style.display = show ? 'flex' : 'none';
  if (el) {
    el.textContent = user && user.email ? user.email.split('@')[0] : '';
  }
  if (roleEl) {
    const isAdm = show && currentProfile && currentProfile.role === 'admin';
    roleEl.style.display = isAdm ? 'inline-flex' : 'none';
  }
  if (moreLogout) {
    const canLogout = !!user && isSupabaseConfigured() && sessionStorage.getItem('cayena_offline') !== '1';
    moreLogout.style.display = canLogout ? '' : 'none';
  }
  updateMoreMenuLoginRecover();
  updateDashboardGreet(user);
}

function setAuthFieldError(on) {
  ['auth-fg-email', 'auth-fg-pass'].forEach(function (id) {
    const fg = document.getElementById(id);
    if (fg) fg.classList.toggle('fi-err', !!on);
  });
}

function authTogglePass() {
  const inp = document.getElementById('auth-pass');
  const btn = document.getElementById('auth-btn-showpass');
  if (!inp || !btn) return;
  const reveal = inp.type === 'password';
  inp.type = reveal ? 'text' : 'password';
  btn.classList.toggle('is-on', reveal);
  btn.setAttribute('aria-label', reveal ? 'Ocultar senha' : 'Mostrar senha');
  btn.setAttribute('aria-pressed', reveal ? 'true' : 'false');
}

function authResetPassToggle() {
  const inp = document.getElementById('auth-pass');
  const btn = document.getElementById('auth-btn-showpass');
  if (inp) inp.type = 'password';
  if (btn) {
    btn.classList.remove('is-on');
    btn.setAttribute('aria-label', 'Mostrar senha');
    btn.setAttribute('aria-pressed', 'false');
  }
}

function friendlyAuthError(msg) {
  const m = String(msg || '').toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid_credentials')) {
    return 'E-mail ou senha incorretos. Confira e tente de novo.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar (verifique a caixa de entrada).';
  }
  if (m.includes('too many requests')) {
    return 'Muitas tentativas. Espere um minuto e tente de novo.';
  }
  return msg || 'Não foi possível entrar.';
}

function openLogoutConfirm() {
  const ov = document.getElementById('ov-logout');
  if (ov) ov.classList.add('on');
}

async function confirmAuthSignOut() {
  closeOv('ov-logout');
  sessionStorage.removeItem('cayena_offline');
  const sb = await ensureSupabase();
  if (sb) await sb.auth.signOut();
  DB = [];
  currentProfile = { role: 'seller' };
  updateHdrUser(null);
  updateAdminEntry();
  showAuthOverlay();
  toast('Você saiu da conta');
}

async function authSignIn() {
  const msg = document.getElementById('auth-msg');
  const btn = document.getElementById('auth-btn-in');
  if (msg) msg.textContent = '';
  setAuthFieldError(false);
  const email = (document.getElementById('auth-email') && document.getElementById('auth-email').value) || '';
  const pass = (document.getElementById('auth-pass') && document.getElementById('auth-pass').value) || '';
  const sb = await ensureSupabase();
  if (!sb) {
    toast('Supabase não configurado');
    return;
  }
  if (btn) {
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    const prev = btn.textContent;
    btn.dataset.prevLabel = prev;
    btn.textContent = 'Entrando…';
  }
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pass });
  if (btn) {
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    btn.textContent = btn.dataset.prevLabel || 'Entrar';
  }
  if (error) {
    setAuthFieldError(true);
    const friendly = friendlyAuthError(error.message);
    if (msg) msg.textContent = friendly;
    toast(friendly);
    return;
  }
  sessionStorage.removeItem('cayena_offline');
  await loadClientsFromSupabase();
  authResetPassToggle();
  hideAuthOverlay();
  setAuthFieldError(false);
  toast('Conectado', true);
}

function authUseOffline() {
  sessionStorage.setItem('cayena_offline', '1');
  DB = JSON.parse(JSON.stringify(MOCK_DB_SEED));
  renderDashboard();
  hideAuthOverlay();
  updateHdrUser(null);
  currentProfile = { role: 'seller' };
  updateAdminEntry();
  updateMoreMenuLoginRecover();
  if (typeof refreshMapMarkers === 'function') {
    refreshMapMarkers({ doInitialFit: true });
  }
}

/**
 * Volta à tela de login (sai do modo offline e encerra sessão Supabase).
 * Use pelo menu ⋮ → "Entrar com e-mail" ou abra o app com ?login=1 na URL.
 */
async function recoverLoginScreen() {
  sessionStorage.removeItem('cayena_offline');
  const sb = await ensureSupabase();
  if (sb) {
    await sb.auth.signOut();
  }
  DB = [];
  currentProfile = { role: 'seller' };
  renderDashboard();
  updateHdrUser(null);
  updateAdminEntry();
  updateMoreMenuLoginRecover();
  if (typeof refreshMapMarkers === 'function') {
    refreshMapMarkers({ doInitialFit: true });
  }
  showAuthOverlay();
  toast('Faça login com seu e-mail e senha');
}

/** Perfil do usuário logado (role = admin | seller) */
let currentProfile = { role: 'seller' };

/** Nome do vendedor na visita: `profiles.full_name` ou parte local do e-mail. */
function sellerRepDisplayName(user) {
  const fromProfile = currentProfile && String(currentProfile.full_name || '').trim();
  if (fromProfile) return fromProfile;
  if (user && user.email) {
    const local = user.email.split('@')[0];
    if (local) return local;
  }
  return 'Consultor';
}

async function loadMyProfile() {
  const sb = await ensureSupabase();
  if (!sb || sessionStorage.getItem('cayena_offline') === '1') {
    currentProfile = { role: 'seller' };
    updateAdminEntry();
    return;
  }
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    currentProfile = { role: 'seller' };
    updateAdminEntry();
    return;
  }
  const { data, error } = await sb.from('profiles').select('role, full_name, phone, business_unit').eq('id', user.id).single();
  if (error) {
    console.warn(error);
    currentProfile = { role: 'seller' };
  } else {
    currentProfile = data || { role: 'seller' };
  }
  updateAdminEntry();
  updateHdrUser(user);
}

function updateAdminEntry() {
  const btn = document.getElementById('more-admin');
  const rp = document.getElementById('more-route-plan');
  const cardAdm = document.getElementById('more-card-admin');
  const show = currentProfile && currentProfile.role === 'admin';
  if (btn) btn.style.display = show ? '' : 'none';
  if (rp) rp.style.display = show ? '' : 'none';
  if (cardAdm) cardAdm.style.display = show ? '' : 'none';
  updateSellerRoutesMenu();
}

function updateSellerRoutesMenu() {
  const el = document.getElementById('more-my-routes');
  if (!el) return;
  const show =
    isSupabaseConfigured() &&
    sessionStorage.getItem('cayena_offline') !== '1' &&
    currentProfile &&
    currentProfile.role !== 'admin';
  el.style.display = show ? '' : 'none';
}

/** Normaliza valor vindo do Supabase (enum, null, casing). */
function normalizeBusinessUnit(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().toUpperCase();
  if (s === 'SAX') return 'SAX';
  if (s === 'PAP') return 'PAP';
  return null;
}

/** Business unit do perfil (PAP ou SAX). NULL ou inválido → PAP. */
function getBusinessUnit() {
  const n = normalizeBusinessUnit(currentProfile && currentProfile.business_unit);
  if (n) return n;
  return 'PAP';
}

const ADMIN_VISIT_BU_KEY = 'cayena_admin_visit_bu';

function ensureAdminVisitBuSession() {
  try {
    const a = sessionStorage.getItem(ADMIN_VISIT_BU_KEY);
    if (a === 'PAP' || a === 'SAX') return a;
    const b = normalizeBusinessUnit(currentProfile && currentProfile.business_unit) || 'PAP';
    sessionStorage.setItem(ADMIN_VISIT_BU_KEY, b);
    return b;
  } catch (e) {
    return 'PAP';
  }
}

function syncAdminVisitBuSeg() {
  let bu = 'PAP';
  try {
    const a = sessionStorage.getItem(ADMIN_VISIT_BU_KEY);
    if (a === 'PAP' || a === 'SAX') bu = a;
    else bu = normalizeBusinessUnit(currentProfile && currentProfile.business_unit) || 'PAP';
  } catch (e) {}
  const pap = document.getElementById('admin-bu-pap');
  const sax = document.getElementById('admin-bu-sax');
  if (pap) pap.className = 'seg-opt' + (bu === 'PAP' ? ' on' : '');
  if (sax) sax.className = 'seg-opt' + (bu === 'SAX' ? ' on' : '');
}

/** BU efetivo no sheet de visita: admin escolhe PAP/SAX; demais seguem o perfil. */
function getVisitFormBusinessUnit() {
  if (currentProfile && currentProfile.role === 'admin') {
    try {
      const a = sessionStorage.getItem(ADMIN_VISIT_BU_KEY);
      if (a === 'PAP' || a === 'SAX') return a;
    } catch (e) {}
    return normalizeBusinessUnit(currentProfile.business_unit) || 'PAP';
  }
  return getBusinessUnit();
}

function setAdminVisitBu(bu) {
  if (bu !== 'PAP' && bu !== 'SAX') return;
  try {
    sessionStorage.setItem(ADMIN_VISIT_BU_KEY, bu);
  } catch (e) {}
  syncAdminVisitBuSeg();
  applyVisitFormMode();
}

function applyVisitFormMode() {
  const bu = getVisitFormBusinessUnit();
  const papo = document.getElementById('vform-papo-section');
  const sax = document.getElementById('vform-sax-section');
  const tit = document.getElementById('vis-sheet-title');
  if (papo) papo.style.display = bu === 'PAP' ? '' : 'none';
  if (sax) sax.style.display = bu === 'SAX' ? '' : 'none';
  if (tit) {
    tit.textContent = bu === 'SAX' ? 'Registrar visita (SAX)' : 'Registrar visita (PAP)';
  }
  const fgCel = document.getElementById('visit-fg-cel');
  const fgNome = document.getElementById('visit-fg-nome');
  if (fgCel) fgCel.style.display = bu === 'PAP' ? '' : 'none';
  if (fgNome) fgNome.style.display = bu === 'PAP' ? '' : 'none';
  const obsLbl = document.getElementById('vis-obs-lbl');
  if (obsLbl) obsLbl.textContent = bu === 'SAX' ? 'Observações extras' : 'Observações';
  const celLbl = document.querySelector('#fw-cel')?.closest('.fg')?.querySelector('.flbl');
  const nomLbl = document.querySelector('#fw-nome')?.closest('.fg')?.querySelector('.flbl');
  if (bu === 'PAP') {
    if (celLbl) celLbl.innerHTML = 'Celular do comprador <span class="req">*</span>';
    if (nomLbl) nomLbl.innerHTML = 'Nome do comprador <span class="req">*</span>';
    const vn = document.getElementById('v-nome');
    if (vn) vn.placeholder = 'Ex: João da Padaria';
    const vo = document.getElementById('v-obs');
    if (vo) vo.placeholder = 'O que foi discutido, próximos passos, produtos de interesse...';
  } else {
    const vo = document.getElementById('v-obs');
    if (vo) vo.placeholder = 'Informações adicionais (opcional)';
  }
}

function getTamEstabFromForm() {
  if (getVisitFormBusinessUnit() === 'SAX') {
    return '';
  }
  return currSeg === 'peq' ? 'Pequeno' : 'Grande';
}

function getActiveChipText() {
  if (getVisitFormBusinessUnit() === 'SAX') {
    return '';
  }
  const grid = document.getElementById('chip-grid');
  const on = grid && grid.querySelector('.chip-opt.on');
  return on ? String(on.textContent || '').trim() : '';
}

function setSaxSold(val) {
  const sim = document.getElementById('sax-sold-sim');
  const nao = document.getElementById('sax-sold-nao');
  const wrapSale = document.getElementById('sax-wrap-sale-reasons');
  const wrapNo = document.getElementById('sax-wrap-no-sale-reasons');
  if (!sim || !nao) return;
  if (val === 'sim') {
    sim.classList.add('on');
    nao.classList.remove('on');
  } else if (val === 'nao') {
    nao.classList.add('on');
    sim.classList.remove('on');
  } else {
    sim.classList.remove('on');
    nao.classList.remove('on');
  }
  if (wrapSale) wrapSale.style.display = val === 'sim' ? '' : 'none';
  if (wrapNo) wrapNo.style.display = val === 'nao' ? '' : 'none';
}

function togSaxChip(el) {
  if (!el || !el.classList.contains('sax-chip')) return;
  el.classList.toggle('on');
}

function getSaxSold() {
  const sim = document.getElementById('sax-sold-sim');
  const nao = document.getElementById('sax-sold-nao');
  if (sim && sim.classList.contains('on')) return 'sim';
  if (nao && nao.classList.contains('on')) return 'nao';
  return null;
}

function getSaxSaleReasonsFromDom() {
  return Array.from(document.querySelectorAll('#sax-grid-sale .sax-chip.on'))
    .map(function (el) {
      return String(el.textContent || '').trim();
    })
    .filter(Boolean);
}

function getSaxNoSaleReasonsFromDom() {
  return Array.from(document.querySelectorAll('#sax-grid-no-sale .sax-chip.on'))
    .map(function (el) {
      return String(el.textContent || '').trim();
    })
    .filter(Boolean);
}

function resetSaxVisitForm() {
  setSaxSold(null);
  document.querySelectorAll('#sax-grid-sale .sax-chip, #sax-grid-no-sale .sax-chip').forEach(function (c) {
    c.classList.remove('on');
  });
  const sn = document.getElementById('sax-nome-decisor');
  const sc = document.getElementById('sax-cel-decisor');
  const sh = document.getElementById('sax-horario');
  if (sn) sn.value = '';
  if (sc) sc.value = '';
  if (sh) sh.selectedIndex = 0;
  ['sax-photo-fachada', 'sax-photo-cardapio'].forEach(function (id) {
    const inp = document.getElementById(id);
    if (inp) inp.value = '';
  });
  ['sax-preview-fachada', 'sax-preview-cardapio'].forEach(function (id) {
    const pr = document.getElementById(id);
    if (pr) {
      pr.style.display = 'none';
      const im = pr.querySelector('img');
      if (im) im.removeAttribute('src');
    }
  });
  const fg = document.getElementById('sax-fg-fachada');
  if (fg) fg.classList.remove('fi-err');
}

function previewSaxPhoto(inputEl, previewId, imgId) {
  const file = inputEl && inputEl.files && inputEl.files[0];
  const wrap = document.getElementById(previewId);
  const img = document.getElementById(imgId);
  if (!file || !wrap || !img) return;
  if (file.size > 5 * 1024 * 1024) {
    toast('Imagem deve ter no máximo 5 MB');
    inputEl.value = '';
    return;
  }
  const url = URL.createObjectURL(file);
  img.src = url;
  wrap.style.display = '';
}

function bindSaxPhotoInputsOnce() {
  if (bindSaxPhotoInputsOnce._done) return;
  bindSaxPhotoInputsOnce._done = true;
  const f = document.getElementById('sax-photo-fachada');
  const c = document.getElementById('sax-photo-cardapio');
  if (f) {
    f.addEventListener('change', function () {
      previewSaxPhoto(f, 'sax-preview-fachada', 'sax-img-fachada');
    });
  }
  if (c) {
    c.addEventListener('change', function () {
      previewSaxPhoto(c, 'sax-preview-cardapio', 'sax-img-cardapio');
    });
  }
}

async function uploadVisitPhotoToStorage(file, kind) {
  if (!file || !file.size) return null;
  const sb = await ensureSupabase();
  if (!sb) throw new Error('Supabase não configurado');
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error('Faça login');
  const ext = file.type && file.type.indexOf('png') >= 0 ? 'png' : 'jpg';
  const path = user.id + '/' + (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())) + '-' + kind + '.' + ext;
  const { error } = await sb.storage.from('visit-photos').upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  const { data: pub } = sb.storage.from('visit-photos').getPublicUrl(path);
  return pub.publicUrl;
}

function openAdminTab() {
  prevScr = document.querySelector('.scr.on')?.id?.replace('scr-', '') || 'ana';
  goScr('admin');
}

function goScrFromAdmin() {
  goScr(prevScr || 'ana');
}

function openRoutePlannerTab() {
  if (!currentProfile || currentProfile.role !== 'admin') {
    toast('Acesso restrito a administradores');
    return;
  }
  prevScr = document.querySelector('.scr.on')?.id?.replace('scr-', '') || 'ana';
  goScr('route-plan');
}

function goBackFromRoutePlan() {
  const root = document.getElementById('route-plan-root');
  if (root && root.classList.contains('is-route-editor')) {
    showRoutePlanHub();
    return;
  }
  goScr(prevScr || 'ana');
}

/** @deprecated use goBackFromRoutePlan */
function goScrFromRoutePlan() {
  goBackFromRoutePlan();
}

async function adminCreateSeller() {
  const msg = document.getElementById('adm-msg');
  if (msg) msg.textContent = '';
  const full_name = (document.getElementById('adm-nome') && document.getElementById('adm-nome').value.trim()) || '';
  const phone = (document.getElementById('adm-tel') && document.getElementById('adm-tel').value.trim()) || '';
  const email = (document.getElementById('adm-email') && document.getElementById('adm-email').value.trim()) || '';
  const password = (document.getElementById('adm-pass') && document.getElementById('adm-pass').value) || '';
  const sb = await ensureSupabase();
  if (!sb) {
    toast('Supabase não configurado');
    return;
  }
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) {
    toast('Faça login como administrador');
    return;
  }
  try {
    const res = await fetch('/api/admin-create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + session.access_token,
      },
      body: JSON.stringify({
        email,
        password,
        full_name,
        phone,
        business_unit: (document.getElementById('adm-bu') && document.getElementById('adm-bu').value) === 'SAX' ? 'SAX' : 'PAP',
      }),
    });
    const j = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) {
      const err = j.error || res.statusText || 'Erro';
      if (msg) msg.textContent = err;
      toast(err);
      return;
    }
    if (msg) msg.textContent = 'Vendedor criado: ' + (j.email || email);
    toast('✓ Vendedor criado', true);
    ['adm-nome', 'adm-tel', 'adm-email', 'adm-pass', 'adm-bu'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  } catch (e) {
    console.warn(e);
    const hint =
      'Rota /api só existe no deploy (Vercel) ou com `vercel dev`. Teste após publicar ou rode o projeto com vercel dev.';
    if (msg) msg.textContent = hint;
    toast('API indisponível neste ambiente');
  }
}

async function bootstrapAuth() {
  updateAuthSkipVisibility();
  var urlWantsLogin = false;
  try {
    var u = new URL(window.location.href);
    if (u.searchParams.get('login') === '1' || u.searchParams.get('entrar') === '1') {
      urlWantsLogin = true;
      sessionStorage.removeItem('cayena_offline');
      u.searchParams.delete('login');
      u.searchParams.delete('entrar');
      window.history.replaceState({}, '', u.pathname + u.search + u.hash);
    }
  } catch (e) {}
  if (!isSupabaseConfigured()) {
    DB = JSON.parse(JSON.stringify(MOCK_DB_SEED));
    renderDashboard();
    hideAuthOverlay();
    updateHdrUser(null);
    return;
  }
  try {
    await ensureSupabase();
  } catch (e) {
    console.warn(e);
    toast('Não foi possível carregar o Supabase. Modo offline.');
    DB = JSON.parse(JSON.stringify(MOCK_DB_SEED));
    renderDashboard();
    hideAuthOverlay();
    updateHdrUser(null);
    return;
  }
  if (!supabaseClient) {
    DB = JSON.parse(JSON.stringify(MOCK_DB_SEED));
    renderDashboard();
    hideAuthOverlay();
    updateHdrUser(null);
    updateMoreMenuLoginRecover();
    return;
  }
  if (urlWantsLogin) {
    await supabaseClient.auth.signOut();
    DB = [];
    currentProfile = { role: 'seller' };
    renderDashboard();
    updateHdrUser(null);
    updateAdminEntry();
    updateMoreMenuLoginRecover();
    if (typeof refreshMapMarkers === 'function') {
      refreshMapMarkers({ doInitialFit: true });
    }
  }
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (session && session.user) {
    await loadClientsFromSupabase();
    hideAuthOverlay();
  } else if (sessionStorage.getItem('cayena_offline') === '1') {
    DB = JSON.parse(JSON.stringify(MOCK_DB_SEED));
    renderDashboard();
    hideAuthOverlay();
  } else {
    updateHdrUser(null);
    showAuthOverlay();
  }
  updateMoreMenuLoginRecover();
  supabaseClient.auth.onAuthStateChange(function (event, sess) {
    if (event === 'TOKEN_REFRESHED') {
      return;
    }
    if (sess && sess.user) {
      loadClientsFromSupabase({ silent: event === 'INITIAL_SESSION' }).then(function () {
        hideAuthOverlay();
      });
    } else if (!sessionStorage.getItem('cayena_offline')) {
      DB = [];
      renderDashboard();
      currentProfile = { role: 'seller' };
      updateHdrUser(null);
      updateAdminEntry();
      if (isSupabaseConfigured()) showAuthOverlay();
    }
  });
}

function initCliListDelegation() {
  const el = document.getElementById('cli-list');
  if (!el || el._delegation) return;
  el._delegation = true;
  el.addEventListener('click', function (ev) {
    const card = ev.target.closest('.ccard');
    if (!card || !card.getAttribute('data-cid')) return;
    openCli(card.getAttribute('data-cid'));
  });
}

/** Clique nas listas de escolha (visita / lembrete): delegação evita bugs de onclick+UUID no mobile. */
function initPickListsDelegation() {
  const pickEl = document.getElementById('pick-cli-list');
  if (pickEl && !pickEl._delegation) {
    pickEl._delegation = true;
    pickEl.addEventListener('click', function (ev) {
      const row = ev.target.closest('.pick-cli-row');
      if (!row || row.getAttribute('data-cid') == null || row.getAttribute('data-cid') === '') return;
      ev.preventDefault();
      pickCliForVis(row.getAttribute('data-cid'));
    });
  }
  const lemEl = document.getElementById('lem-cli-list');
  if (lemEl && !lemEl._delegation) {
    lemEl._delegation = true;
    lemEl.addEventListener('click', function (ev) {
      const row = ev.target.closest('.pick-cli-row');
      if (!row || row.getAttribute('data-cid') == null || row.getAttribute('data-cid') === '') return;
      ev.preventDefault();
      pickLemCli(row.getAttribute('data-cid'));
    });
  }
}

function cliMatchesSearchQuery(c, qRaw) {
  const q = (qRaw || '').toLowerCase().trim();
  if (!q) return true;
  const nome = String(c.nome || '').toLowerCase();
  const bairro = String(c.bairro || '').toLowerCase();
  const cnpj = String(c.cnpj || '');
  return nome.includes(q) || bairro.includes(q) || cnpj.includes(q);
}

let currCli = null;
let prevScr = 'ana';
let pinIdx = null;
let lemPickId = null;
let cadStep = 1;
let currSeg = 'peq';
let currChip = null;

/** Evita duplo envio (duplo toque) em cadastro / lembrete / visita. */
const submitBusy = { cad: false, lem: false, vis: false };

function getCliById(id) {
  return DB.find((c) => String(c.id) === String(id));
}

/** Telas só de staff (admin): largura total, sem header/nav do app vendedor. */
function setAdminFullscreenShell(on) {
  const app = document.getElementById('app');
  if (!app) return;
  app.classList.toggle('app-admin-full', !!on);
}

function isAdminStaffScreen(id) {
  return id === 'admin' || id === 'route-plan';
}

function goScr(s) {
  const om = document.getElementById('ov-more');
  if (om) om.classList.remove('on');
  document.querySelectorAll('.scr').forEach((e) => e.classList.remove('on'));
  document.querySelectorAll('.ni').forEach((e) => e.classList.remove('on'));
  const scr = document.getElementById('scr-' + s);
  if (scr) scr.classList.add('on');
  const ni = document.getElementById('ni-' + s);
  if (ni) ni.classList.add('on');
  setAdminFullscreenShell(isAdminStaffScreen(s));
  closePopup();
  if (s === 'map') {
    setTimeout(function () {
      initLeafletMap();
    }, 150);
  }
  if (s === 'route-plan') {
    setTimeout(function () {
      initRoutePlanMap();
      loadRoutePlanningSellers().then(function () {
        showRoutePlanHub();
      });
    }, 150);
  }
  if (s === 'ana') {
    renderDashboard();
  }
  if (s === 'my-routes') {
    setTimeout(function () {
      if (myRoutesAfterCliBackRouteId) {
        const rid = myRoutesAfterCliBackRouteId;
        myRoutesAfterCliBackRouteId = null;
        openMyRouteDetail(rid);
      } else {
        showMyRoutesList();
        loadMyRoutesList();
      }
    }, 0);
  }
}

function goBack() {
  goScr(prevScr);
}

function applyClientDetailToDom(c) {
  document.getElementById('dname').textContent = c.nome;
  const b = document.getElementById('dbadge');
  if (c.status === 'reat') {
    b.className = 'badge b-reat';
    b.textContent = 'REATIVADO';
  } else {
    b.className = 'badge b-novo';
    b.textContent = 'NOVO';
  }
  document.getElementById('sfoot').style.display = '';
  document.getElementById('mmaddr').textContent = c.rua + ', ' + c.num + ' — ' + c.bairro;
  document.getElementById('dc-dados').innerHTML =
    '<div class="irow"><span class="il">Nome</span><span class="iv">' +
    c.nome +
    '</span></div><div class="irow"><span class="il">CNPJ</span><span class="iv">' +
    c.cnpj +
    '</span></div><div class="irow"><span class="il">Tipo</span><span class="iv">' +
    c.tipo +
    '</span></div>';
  document.getElementById('dc-cont').innerHTML =
    '<div class="irow"><span class="il">Telefone</span><span class="iv">' +
    c.tel +
    '</span></div><div class="irow"><span class="il">E-mail</span><span class="iv" style="font-size:12px">' +
    c.email +
    '</span></div>';
  document.getElementById('dc-end').innerHTML =
    '<div class="irow"><span class="il">Endereço</span><span class="iv">' +
    c.rua +
    ', ' +
    c.num +
    (c.comp ? ' — ' + c.comp : '') +
    '</span></div><div class="irow"><span class="il">Bairro</span><span class="iv">' +
    c.bairro +
    '</span></div><div class="irow"><span class="il">Cidade / UF</span><span class="iv">' +
    c.cidade +
    ' — ' +
    c.estado +
    '</span></div><div class="irow"><span class="il">CEP</span><span class="iv">' +
    c.cep +
    '</span></div><div class="irow"><span class="il">Coords.</span><span class="iv"><span class="cchip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>' +
    c.lat +
    ', ' +
    c.lng +
    '</span></span></div>' +
    (c.obs
      ? '<div class="irow" style="border-top:1px solid var(--zimbro);border-bottom:none"><span class="il">Obs.</span><span class="iv" style="font-style:italic;color:var(--cardamomo);font-size:12px">' +
        c.obs +
        '</span></div>'
      : '');
  buildHist(c);
}

function openCli(idx) {
  const c = getCliById(idx);
  if (!c) {
    toast('Cliente não encontrado');
    return;
  }
  currCli = c;
  prevScr = document.querySelector('.scr.on')?.id?.replace('scr-', '') || 'ana';
  applyClientDetailToDom(c);
  swTab('info');
  goScr('cli');
}

/**
 * Recarrega clientes do Supabase e atualiza História global e/ou tela do cliente aberta.
 * @param {{ silentToast?: boolean }} [opts] — silentToast: sem toast de sucesso (ex.: atualização ao chegar ao fim da lista)
 */
async function refreshHistoriaFromServer(opts) {
  opts = opts || {};
  const silentToast = opts.silentToast === true;
  if (sessionStorage.getItem('cayena_offline') === '1') {
    toast('Conecte-se à conta para atualizar os dados');
    return;
  }
  const sb = await ensureSupabase();
  if (!sb) {
    toast('Supabase não configurado');
    return;
  }
  let tab = 'info';
  if (document.getElementById('p-hist') && document.getElementById('p-hist').classList.contains('on')) tab = 'hist';
  else if (document.getElementById('p-campos') && document.getElementById('p-campos').classList.contains('on')) tab = 'campos';

  const ok = await loadClientsFromSupabase({ silent: true });
  if (!ok) {
    toast('Não foi possível atualizar');
    return;
  }

  if (document.getElementById('scr-hist') && document.getElementById('scr-hist').classList.contains('on')) {
    renderGlobalHist();
  }

  if (document.getElementById('scr-cli') && document.getElementById('scr-cli').classList.contains('on') && currCli) {
    const c = getCliById(currCli.id);
    if (c) {
      currCli = c;
      applyClientDetailToDom(c);
      swTab(tab);
    }
  }

  if (!silentToast) toast('✓ Lista atualizada', true);
}

/**
 * Atualiza dados da nuvem e a lista de rotas (pull-to-refresh / fim do scroll), no mesmo espírito da História.
 * @param {{ silentToast?: boolean }} [opts]
 */
async function refreshMyRoutesFromServer(opts) {
  opts = opts || {};
  const silentToast = opts.silentToast === true;
  if (sessionStorage.getItem('cayena_offline') === '1') {
    toast('Conecte-se à conta para atualizar os dados');
    return;
  }
  const sb = await ensureSupabase();
  if (!sb) {
    toast('Supabase não configurado');
    return;
  }
  const ok = await loadClientsFromSupabase({ silent: true });
  if (!ok) {
    toast('Não foi possível atualizar');
    return;
  }
  const detailEl = document.getElementById('my-routes-detail-view');
  const rid = myRoutesDetailRouteId;
  const onDetail = detailEl && detailEl.style.display !== 'none' && rid;
  await loadMyRoutesList();
  if (onDetail) {
    await openMyRouteDetail(rid);
  }
  if (!silentToast) toast('✓ Rotas atualizadas', true);
}

/**
 * Ao rolar até o fim da lista na aba História, sincroniza com o servidor (sem precisar F5).
 * Usa o evento scroll (mais confiável que IntersectionObserver em alguns navegadores).
 *
 * @param {HTMLElement} scrollEl
 * @param {() => void} [scrollEndRefreshFn] — se omitido, usa História ou Rotas conforme o id (legado).
 */
function initHistScrollEndRefresh(scrollEl, scrollEndRefreshFn) {
  if (!scrollEl || scrollEl._histBtmInit) return;
  scrollEl._histBtmInit = true;
  let lastAt = 0;
  const COOLDOWN_MS = 5000;
  const NEAR_BOTTOM_PX = 100;
  scrollEl.addEventListener(
    'scroll',
    function () {
      var sh = scrollEl.scrollHeight;
      var ch = scrollEl.clientHeight;
      if (sh <= ch + 24) return;
      if (scrollEl.scrollTop + ch < sh - NEAR_BOTTOM_PX) return;
      var now = Date.now();
      if (now - lastAt < COOLDOWN_MS) return;
      lastAt = now;
      if (typeof scrollEndRefreshFn === 'function') {
        scrollEndRefreshFn();
      } else if (scrollEl.id === 'scr-my-routes') {
        refreshMyRoutesFromServer({ silentToast: true });
      } else {
        refreshHistoriaFromServer({ silentToast: true });
      }
    },
    { passive: true }
  );
}

const PTR_THRESHOLD = 72;

/**
 * @param {HTMLElement | null} scrollEl — alvo principal (compat); com `opts.scrollTargets`, ouve todos.
 * @param {() => void | Promise<void>} onRefreshAsync
 * @param {{ scrollTargets?: HTMLElement[]; getScrollEl?: () => HTMLElement | null }} [opts]
 */
function initPullToRefresh(scrollEl, onRefreshAsync, opts) {
  opts = opts || {};
  const rawTargets = opts.scrollTargets && opts.scrollTargets.length ? opts.scrollTargets : [scrollEl];
  const targets = rawTargets.filter(Boolean);
  if (!targets.length || !onRefreshAsync) return;
  const marker = targets[0];
  if (marker._ptrInit) return;
  marker._ptrInit = true;

  const getScrollEl = typeof opts.getScrollEl === 'function' ? opts.getScrollEl : null;

  let startY = 0;
  let startTop = 0;
  let tracking = false;
  let pullAccum = 0;
  let ptrDown = false;
  /** @type {HTMLElement} */
  let activeScrollEl = targets[0];

  const ind = document.createElement('div');
  ind.className = 'ptr-hint';
  ind.setAttribute('aria-hidden', 'true');
  ind.textContent = '↓ Puxe e solte para atualizar';

  /** Dica no topo do elemento que rola (igual História); com getScrollEl, segue lista vs detalhe. */
  function placePtrHint() {
    var sc = getScrollEl ? getScrollEl() : targets[0];
    if (!sc) return;
    if (ind.parentNode === sc && sc.firstChild === ind) return;
    if (ind.parentNode) ind.parentNode.removeChild(ind);
    sc.insertBefore(ind, sc.firstChild);
  }

  placePtrHint();

  function resolveScrollEl(el) {
    if (getScrollEl) {
      var sc = getScrollEl();
      if (sc) return sc;
    }
    return el || targets[0];
  }

  function beginPull(clientY, el) {
    placePtrHint();
    activeScrollEl = resolveScrollEl(el);
    startY = clientY;
    startTop = activeScrollEl.scrollTop;
    tracking = startTop <= 2;
    pullAccum = 0;
  }

  function movePull(clientY) {
    if (!tracking) return;
    if (getScrollEl) {
      var sc = getScrollEl();
      if (sc) activeScrollEl = sc;
    }
    if (activeScrollEl.scrollTop > 2) {
      tracking = false;
      ind.classList.remove('ptr-visible', 'ptr-ready');
      return;
    }
    pullAccum = clientY - startY;
    if (pullAccum > 16) {
      ind.classList.add('ptr-visible');
      if (pullAccum >= PTR_THRESHOLD) ind.classList.add('ptr-ready');
      else ind.classList.remove('ptr-ready');
    } else {
      ind.classList.remove('ptr-visible', 'ptr-ready');
    }
  }

  function endPull() {
    if (!tracking) return;
    tracking = false;
    var scEnd = getScrollEl ? getScrollEl() || activeScrollEl : activeScrollEl;
    const fire = pullAccum >= PTR_THRESHOLD && scEnd.scrollTop <= 2;
    ind.classList.remove('ptr-visible', 'ptr-ready');
    pullAccum = 0;
    if (!fire) return;
    ind.textContent = 'Atualizando…';
    ind.classList.add('ptr-visible');
    Promise.resolve()
      .then(function () {
        return onRefreshAsync();
      })
      .catch(function (e) {
        console.warn(e);
        toast('Não foi possível atualizar');
      })
      .finally(function () {
        ind.textContent = '↓ Puxe e solte para atualizar';
        ind.classList.remove('ptr-visible');
      });
  }

  targets.forEach(function (t) {
    t.addEventListener(
      'touchstart',
      function (e) {
        if (e.touches.length !== 1) return;
        beginPull(e.touches[0].clientY, t);
      },
      { passive: true }
    );

    t.addEventListener(
      'touchmove',
      function (e) {
        if (!tracking || e.touches.length !== 1) return;
        movePull(e.touches[0].clientY);
      },
      { passive: true }
    );

    t.addEventListener(
      'touchend',
      function () {
        endPull();
      },
      { passive: true }
    );

    /* Mouse / trackpad: sem touch, o gesto de puxar não disparava. */
    t.addEventListener(
      'pointerdown',
      function (e) {
        if (e.pointerType === 'touch') return;
        if (e.button !== 0) return;
        ptrDown = true;
        beginPull(e.clientY, t);
      },
      { passive: true }
    );

    t.addEventListener(
      'pointermove',
      function (e) {
        if (e.pointerType === 'touch' || !ptrDown) return;
        movePull(e.clientY);
      },
      { passive: true }
    );

    t.addEventListener('pointerup', function (e) {
      if (e.pointerType === 'touch') return;
      ptrDown = false;
      endPull();
    });
    t.addEventListener('pointercancel', function (e) {
      if (e.pointerType === 'touch') return;
      ptrDown = false;
      tracking = false;
      ind.classList.remove('ptr-visible', 'ptr-ready');
      pullAccum = 0;
    });
  });
}

function reminderStatusLabel(st) {
  const m = { pending: 'Pendente', done: 'Feito', cancelled: 'Cancelado' };
  return m[st] || st || '—';
}

function buildTimelineEntriesForClient(c) {
  const entries = [];
  (c.visitas || []).forEach(function (v) {
    entries.push({ kind: 'visit', sort: visitSortTimestamp(v), visit: v });
  });
  (c.lembretes || []).forEach(function (r) {
    entries.push({ kind: 'reminder', sort: r.remind_at_ms || 0, reminder: r });
  });
  entries.sort(function (a, b) {
    return b.sort - a.sort;
  });
  return entries;
}

function buildGlobalTimelineEntries() {
  const entries = [];
  DB.forEach(function (c) {
    (c.visitas || []).forEach(function (v) {
      entries.push({
        kind: 'visit',
        sort: visitSortTimestamp(v),
        visit: v,
        clienteNome: c.nome,
      });
    });
    (c.lembretes || []).forEach(function (r) {
      entries.push({
        kind: 'reminder',
        sort: r.remind_at_ms || 0,
        reminder: r,
        clienteNome: c.nome,
      });
    });
  });
  entries.sort(function (a, b) {
    return b.sort - a.sort;
  });
  return entries;
}

function renderHistSummaryRow(entry, i) {
  const lbl = { conv: 'Convertido', nao: 'Não convertido', reag: 'Reagendado', aus: 'Ausente' };
  const cls = { conv: 'vconv', nao: 'vnao', reag: 'vreag', aus: 'vreag' };
  const cliHead = entry.clienteNome
    ? '<div class="hist-cli-name">' + escapeHtml(entry.clienteNome) + '</div>'
    : '';

  if (entry.kind === 'visit') {
    const v = entry.visit;
    const bu = v.businessUnit === 'SAX' ? 'SAX' : 'PAP';
    const saxHint =
      v.businessUnit === 'SAX' && v.saxSold
        ? v.saxSold === 'sim'
          ? 'Venda: sim'
          : 'Venda: não'
        : '';
    const rawObs = v.obs ? String(v.obs).trim() : '';
    const obsHtml =
      rawObs.length > 120
        ? escapeHtml(rawObs.slice(0, 120)) + '…'
        : escapeHtml(rawObs);
    return (
      '<div class="vc hist-item hist-card hist-card--visit" data-i="' +
      i +
      '" role="button" tabindex="0">' +
      cliHead +
      '<div class="hist-card-row">' +
      '<div class="hist-card-left">' +
      '<span class="hist-kind-pill hist-kind-pill--visit">Visita</span>' +
      '<span class="hist-bu-tag">' +
      escapeHtml(bu) +
      '</span>' +
      '<span class="vres ' +
      (cls[v.res] || 'vreag') +
      '">' +
      escapeHtml(lbl[v.res] || v.res || '—') +
      '</span>' +
      '</div>' +
      '<span class="hist-card-date">' +
      escapeHtml(v.data) +
      '</span>' +
      '</div>' +
      '<div class="hist-card-meta">' +
      '<span>👤 ' +
      escapeHtml(v.rep || '—') +
      '</span>' +
      (saxHint
        ? '<span class="hist-meta-sep" aria-hidden="true">·</span><span>' + escapeHtml(saxHint) + '</span>'
        : '') +
      '</div>' +
      (rawObs ? '<div class="hist-snippet">' + obsHtml + '</div>' : '') +
      '<div class="hist-tap-hint">Toque para ver o formulário completo</div></div>'
    );
  }
  const r = entry.reminder;
  const rawNotes = r.notes ? String(r.notes).trim() : '';
  const notesHtml =
    rawNotes.length > 100
      ? escapeHtml(rawNotes.slice(0, 100)) + '…'
      : escapeHtml(rawNotes);
  return (
    '<div class="vc hist-item hist-card hist-card--rem" data-i="' +
    i +
    '" role="button" tabindex="0">' +
    cliHead +
    '<div class="hist-card-row">' +
    '<div class="hist-card-left">' +
    '<span class="hist-kind-pill hist-kind-pill--rem">Lembrete</span>' +
    '<span class="vres vlem">' +
    escapeHtml(reminderStatusLabel(r.status)) +
    '</span>' +
    '</div>' +
    '<span class="hist-card-date">' +
    escapeHtml(r.dataStr + ' · ' + r.horaStr) +
    '</span>' +
    '</div>' +
    (rawNotes
      ? '<div class="hist-snippet">' + notesHtml + '</div>'
      : '<div class="hist-snippet hist-snippet--empty">Sem observações</div>') +
    '<div class="hist-tap-hint">Toque para ver data, hora e observações</div></div>'
  );
}

function openHistDetailFromIndex(i) {
  const items = window.__histDetailItems;
  if (!items || items[i] == null) return;
  const it = items[i];
  const tit = document.getElementById('hist-detail-tit');
  const body = document.getElementById('hist-detail-body');
  const clienteLine = it.clienteNome
    ? '<div class="hd-block hd-cli">🏪 ' + escapeHtml(it.clienteNome) + '</div>'
    : '';
  if (it.kind === 'visit') {
    const v = it.visit;
    tit.textContent = 'Visita';
    const lbl = { conv: 'Convertido', nao: 'Não convertido', reag: 'Reagendado', aus: 'Ausente' };
    const teamLbl = v.businessUnit === 'SAX' ? 'SAX' : 'PAP';
    let saxHtml = '';
    if (v.businessUnit === 'SAX' && v.saxSold) {
      saxHtml +=
        '<div class="hd-block"><span class="hdl">Conseguiu vender?</span><span class="hdv">' +
        escapeHtml(v.saxSold === 'sim' ? 'Sim' : 'Não') +
        '</span></div>';
      if (v.saxSaleReasons && v.saxSaleReasons.length) {
        saxHtml +=
          '<div class="hd-block"><span class="hdl">Motivo da venda</span><span class="hdv hd-mult">' +
          escapeHtml(v.saxSaleReasons.join(' · ')) +
          '</span></div>';
      }
      if (v.saxNoSaleReasons && v.saxNoSaleReasons.length) {
        saxHtml +=
          '<div class="hd-block"><span class="hdl">Motivo de não vender</span><span class="hdv hd-mult">' +
          escapeHtml(v.saxNoSaleReasons.join(' · ')) +
          '</span></div>';
      }
      if (v.saxBestContactTime) {
        saxHtml +=
          '<div class="hd-block"><span class="hdl">Melhor horário</span><span class="hdv">' +
          escapeHtml(v.saxBestContactTime) +
          '</span></div>';
      }
      if (v.saxPhotoFachadaUrl) {
        saxHtml +=
          '<div class="hd-block"><span class="hdl">Foto fachada</span><span class="hdv"><a href="' +
          escapeHtml(v.saxPhotoFachadaUrl) +
          '" target="_blank" rel="noopener noreferrer">Abrir imagem</a></span></div>';
      }
      if (v.saxPhotoCardapioUrl) {
        saxHtml +=
          '<div class="hd-block"><span class="hdl">Foto cardápio</span><span class="hdv"><a href="' +
          escapeHtml(v.saxPhotoCardapioUrl) +
          '" target="_blank" rel="noopener noreferrer">Abrir imagem</a></span></div>';
      }
      if (v.saxDecisorName) {
        saxHtml +=
          '<div class="hd-block"><span class="hdl">Nome do decisor</span><span class="hdv">' +
          escapeHtml(v.saxDecisorName) +
          '</span></div>';
      }
      if (v.saxDecisorContact) {
        saxHtml +=
          '<div class="hd-block"><span class="hdl">Contato do decisor</span><span class="hdv">' +
          escapeHtml(v.saxDecisorContact) +
          '</span></div>';
      }
    }
    body.innerHTML =
      clienteLine +
      '<div class="hd-block"><span class="hdl">Data</span><span class="hdv">' +
      escapeHtml(v.data || '—') +
      '</span></div>' +
      '<div class="hd-block"><span class="hdl">Business unit</span><span class="hdv">' +
      escapeHtml(teamLbl) +
      '</span></div>' +
      '<div class="hd-block"><span class="hdl">Resultado</span><span class="hdv">' +
      escapeHtml(lbl[v.res] || v.res || '—') +
      '</span></div>' +
      saxHtml +
      '<div class="hd-block"><span class="hdl">Representante</span><span class="hdv">' +
      escapeHtml(v.rep || '—') +
      '</span></div>' +
      '<div class="hd-block"><span class="hdl">' +
      (v.businessUnit === 'SAX' ? 'Observações extras' : 'Observações') +
      '</span><span class="hdv hd-mult">' +
      escapeHtml(v.obs || '—') +
      '</span></div>' +
      '<div class="hd-block"><span class="hdl">Celular comprador</span><span class="hdv">' +
      escapeHtml(v.celComprador || '—') +
      '</span></div>' +
      '<div class="hd-block"><span class="hdl">Nome comprador</span><span class="hdv">' +
      escapeHtml(v.nomeComprador || '—') +
      '</span></div>' +
      (v.businessUnit === 'PAP'
        ? '<div class="hd-block"><span class="hdl">Tamanho do estab.</span><span class="hdv">' +
          escapeHtml(v.tamEstab || '—') +
          '</span></div>' +
          '<div class="hd-block"><span class="hdl">Tipo (chip)</span><span class="hdv">' +
          escapeHtml(v.tipoEstabChip || '—') +
          '</span></div>'
        : '');
  } else {
    const r = it.reminder;
    tit.textContent = 'Lembrete';
    body.innerHTML =
      clienteLine +
      '<div class="hd-block"><span class="hdl">Data</span><span class="hdv">' +
      escapeHtml(r.dataStr || '—') +
      '</span></div>' +
      '<div class="hd-block"><span class="hdl">Hora</span><span class="hdv">' +
      escapeHtml(r.horaStr || '—') +
      '</span></div>' +
      '<div class="hd-block"><span class="hdl">Status</span><span class="hdv">' +
      escapeHtml(reminderStatusLabel(r.status)) +
      '</span></div>' +
      '<div class="hd-block"><span class="hdl">Observações</span><span class="hdv hd-mult">' +
      escapeHtml(r.notes || '—') +
      '</span></div>';
  }
  const ov = document.getElementById('ov-hist-detail');
  if (ov) {
    ov.classList.add('on');
    ov.setAttribute('aria-hidden', 'false');
  }
}

function closeHistDetail() {
  const ov = document.getElementById('ov-hist-detail');
  if (ov) {
    ov.classList.remove('on');
    ov.setAttribute('aria-hidden', 'true');
  }
}

function ensureHistClickDelegation(containerId) {
  const el = document.getElementById(containerId);
  if (!el || el._histDel) return;
  el._histDel = true;
  el.addEventListener('click', function (ev) {
    const row = ev.target.closest('.hist-item');
    if (!row) return;
    const idx = parseInt(row.getAttribute('data-i'), 10);
    if (!isNaN(idx)) openHistDetailFromIndex(idx);
  });
}

function buildHist(c) {
  const hc = document.getElementById('hcont');
  const entries = buildTimelineEntriesForClient(c);
  window.__histDetailItems = entries;
  if (!entries.length) {
    hc.innerHTML =
      '<div class="empty"><div class="emico">📋</div>Nenhuma visita ou lembrete neste cliente ainda.</div>';
    return;
  }
  hc.innerHTML = entries.map(function (e, i) {
    return renderHistSummaryRow(e, i);
  }).join('');
}

var _histCliTabLastSync = 0;

function swTab(t) {
  ['info', 'hist', 'campos'].forEach((id) => {
    document.getElementById('t-' + id).classList.toggle('on', id === t);
    document.getElementById('p-' + id).classList.toggle('on', id === t);
  });
  if (t === 'hist' && document.getElementById('scr-cli') && document.getElementById('scr-cli').classList.contains('on')) {
    var now = Date.now();
    if (now - _histCliTabLastSync > 5000) {
      _histCliTabLastSync = now;
      refreshHistoriaFromServer({ silentToast: true });
    }
  }
}

function showMapPopupFromClient(c) {
  pinIdx = c.id;
  document.getElementById('ppn').textContent = c.nome;
  document.getElementById('ppa').textContent = c.rua + ', ' + c.num + ' — ' + c.bairro;
  document.getElementById('ppbw').innerHTML =
    c.status === 'reat'
      ? '<span class="badge b-reat">REATIVADO</span>'
      : '<span class="badge b-novo">NOVO</span>';
  document.getElementById('popup').classList.add('on');
}

function closePopup() {
  document.getElementById('popup').classList.remove('on');
}

function pinAct() {
  closePopup();
  if (pinIdx != null && getCliById(pinIdx)) openCli(pinIdx);
  else toast('Cliente não encontrado');
}

let mapInstance = null;
let mapMarkersLayer = null;
let mapUserMarker = null;
let mapDidInitialFit = false;
const MAP_ROUTE_STORAGE_KEY = 'cayena_map_selected_route_id';
/** Valor em localStorage quando o vendedor escolhe ver o mapa sem rota */
const MAP_ROUTE_STORAGE_NONE = 'none';
/** Ordem das paradas na rota exibida (id estabelecimento → número 1..n) */
let mapSellerRouteStopOrder = {};
let mapSelectedRouteId = null;
/** Camadas Leaflet da rota (glow + traço) no mapa do vendedor */
let mapSellerRouteLayerGroup = null;

/** Tela Minhas rotas (vendedor) */
let myRoutesDetailRouteId = null;
let myRoutesAfterCliBackRouteId = null;

/** Planejador admin: mapa secundário e paradas */
let routePlanMapInstance = null;
let routePlanMarkersLayer = null;
let routePlanPolyline = null;
let routePlanSellerRows = [];
let routePlanStops = [];

function initRoutePlanMap() {
  if (typeof L === 'undefined') return;
  const el = document.getElementById('leaflet-route-map');
  if (!el) return;
  if (!routePlanMapInstance) {
    routePlanMapInstance = L.map(el, { zoomControl: false }).setView([-23.55, -46.63], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
    }).addTo(routePlanMapInstance);
    routePlanMarkersLayer = L.layerGroup().addTo(routePlanMapInstance);
  } else {
    setTimeout(function () {
      routePlanMapInstance.invalidateSize();
    }, 200);
  }
}

async function loadRoutePlanningSellers() {
  const sel = document.getElementById('route-seller');
  if (!sel) return;
  const keep = sel.value;
  sel.innerHTML = '<option value="">Selecione…</option>';
  const sb = await ensureSupabase();
  if (!sb) return;
  const { data, error } = await sb.from('profiles').select('id, full_name').eq('role', 'seller').order('full_name');
  if (error) {
    console.warn(error);
    return;
  }
  (data || []).forEach(function (p) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = (p.full_name && String(p.full_name).trim()) || String(p.id).slice(0, 8) + '…';
    sel.appendChild(opt);
  });
  if (keep && Array.prototype.some.call(sel.options, function (o) { return o.value === keep; })) {
    sel.value = keep;
  }
}

function setRoutePlanMode(mode) {
  const root = document.getElementById('route-plan-root');
  if (!root) return;
  root.classList.remove('is-route-hub', 'is-route-editor');
  root.classList.add(mode === 'editor' ? 'is-route-editor' : 'is-route-hub');
  const tit = document.getElementById('route-plan-main-title');
  if (tit) tit.textContent = mode === 'editor' ? 'Montar rota' : 'Rotas por vendedor';
}

function showRoutePlanHub() {
  setRoutePlanMode('hub');
  refreshRouteHubRoutesList();
}

async function refreshRouteHubRoutesList() {
  const listEl = document.getElementById('route-hub-list');
  const emptyEl = document.getElementById('route-hub-empty');
  const sel = document.getElementById('route-seller');
  if (!listEl || !sel) return;
  if (!sel.value) {
    listEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'none';
    return;
  }
  const sb = await ensureSupabase();
  if (!sb) return;
  const { data, error } = await sb
    .from('seller_routes')
    .select('id, name, updated_at')
    .eq('seller_user_id', sel.value)
    .order('updated_at', { ascending: false });
  if (error) {
    console.warn(error);
    return;
  }
  const routes = data || [];
  if (routes.length === 0) {
    listEl.innerHTML = '';
    if (emptyEl) {
      emptyEl.style.display = '';
      emptyEl.textContent = 'Nenhuma rota ainda para este vendedor.';
    }
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';
  listEl.innerHTML = routes
    .map(function (r) {
      const d = r.updated_at ? new Date(r.updated_at) : null;
      const dStr =
        d && !isNaN(d.getTime())
          ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—';
      const name = (r.name && String(r.name).trim()) || 'Rota';
      return (
        '<div class="route-hub-row">' +
        '<span class="route-hub-row-name">' +
        escapeHtml(name) +
        '</span>' +
        '<span class="route-hub-row-date">' +
        escapeHtml(dStr) +
        '</span>' +
        '</div>'
      );
    })
    .join('');
}

async function onRouteSellerHubChange() {
  await refreshRouteHubRoutesList();
}

function openRoutePlanEditorNew() {
  const sel = document.getElementById('route-seller');
  if (!sel || !sel.value) {
    toast('Selecione um vendedor primeiro');
    return;
  }
  const rn = document.getElementById('route-name');
  if (rn) rn.value = '';
  const msgEl = document.getElementById('route-plan-msg');
  if (msgEl) msgEl.textContent = '';
  routePlanStops = [];
  renderRouteStopList();
  if (routePlanPolyline && routePlanMapInstance) {
    routePlanMapInstance.removeLayer(routePlanPolyline);
    routePlanPolyline = null;
  }
  setRoutePlanMode('editor');
  setTimeout(function () {
    initRoutePlanMap();
    onRouteSellerChange();
  }, 150);
}

async function onRouteSellerChange() {
  routePlanStops = [];
  renderRouteStopList();
  if (routePlanPolyline && routePlanMapInstance) {
    routePlanMapInstance.removeLayer(routePlanPolyline);
    routePlanPolyline = null;
  }
  const sel = document.getElementById('route-seller');
  if (!sel || !sel.value) {
    routePlanSellerRows = [];
    if (routePlanMarkersLayer) routePlanMarkersLayer.clearLayers();
    return;
  }
  const sb = await ensureSupabase();
  if (!sb) return;
  const { data: assigns } = await sb.from('establishment_assignments').select('establishment_id').eq('user_id', sel.value);
  const ids = (assigns || []).map(function (a) {
    return a.establishment_id;
  });
  if (!ids.length) {
    routePlanSellerRows = [];
    toast('Este vendedor ainda não tem clientes atribuídos');
    if (routePlanMarkersLayer) routePlanMarkersLayer.clearLayers();
    return;
  }
  const { data: rows, error } = await sb.from('establishments').select('id, nome, lat, lng, status').in('id', ids);
  if (error) {
    toast(error.message);
    return;
  }
  routePlanSellerRows = rows || [];
  placeRoutePlanMarkers(true);
}

function routePlanStopIndexForEst(estId) {
  const i = routePlanStops.findIndex(function (s) {
    return String(s.id) === String(estId);
  });
  return i >= 0 ? i + 1 : 0;
}

function makeRoutePlanNumberedIcon(n) {
  return L.divIcon({
    className: 'route-plan-pin-ico',
    html: '<div class="rpn-num">' + n + '</div>',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -15],
  });
}

/** @param {boolean} [fitBounds] — true só ao carregar clientes do vendedor (evita zoom ao reordenar) */
function placeRoutePlanMarkers(fitBounds) {
  if (!routePlanMapInstance || !routePlanMarkersLayer) return;
  routePlanMarkersLayer.clearLayers();
  const pts = [];
  (routePlanSellerRows || []).forEach(function (est) {
    const lat = parseFloat(est.lat);
    const lng = parseFloat(est.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    const ord = routePlanStopIndexForEst(est.id);
    const isNovo = est.status !== 'reat';
    const icon = ord > 0 ? makeRoutePlanNumberedIcon(ord) : makeMapIcon(isNovo);
    const m = L.marker([lat, lng], { icon: icon });
    m.on('click', function () {
      addStopToRoutePlan(est);
    });
    m.addTo(routePlanMarkersLayer);
    pts.push([lat, lng]);
  });
  if (pts.length && fitBounds) {
    const b = L.latLngBounds(pts);
    routePlanMapInstance.fitBounds(b.pad(0.12));
  }
}

function refreshRoutePlanVisuals() {
  renderRouteStopList();
  placeRoutePlanMarkers(false);
  redrawRoutePlanPolylineOnly();
}

function addStopToRoutePlan(est) {
  const lat = parseFloat(est.lat);
  const lng = parseFloat(est.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return;
  if (routePlanStops.some(function (s) { return String(s.id) === String(est.id); })) {
    toast('Cliente já está na rota');
    return;
  }
  routePlanStops.push({
    id: est.id,
    nome: est.nome || 'Cliente',
    lat: lat,
    lng: lng,
  });
  refreshRoutePlanVisuals();
}

function renderRouteStopList() {
  const el = document.getElementById('route-stops-list');
  if (!el) return;
  if (!routePlanStops.length) {
    el.innerHTML =
      '<span style="font-size:12px;color:var(--cardamomo)">Toque nos pins na ordem das visitas.</span>';
    return;
  }
  el.innerHTML = routePlanStops
    .map(function (s, i) {
      return (
        '<div class="route-stop-row">' +
        '<span class="route-stop-n">' +
        (i + 1) +
        '</span><span class="route-stop-nome">' +
        escapeHtml(s.nome) +
        '</span>' +
        '<button type="button" aria-label="Subir" onclick="moveRouteStopIx(' +
        i +
        ',-1)">↑</button>' +
        '<button type="button" aria-label="Descer" onclick="moveRouteStopIx(' +
        i +
        ',1)">↓</button>' +
        '<button type="button" aria-label="Remover" onclick="removeRouteStopIx(' +
        i +
        ')">×</button>' +
        '</div>'
      );
    })
    .join('');
}

function moveRouteStopIx(i, d) {
  const j = i + d;
  if (j < 0 || j >= routePlanStops.length) return;
  const t = routePlanStops[i];
  routePlanStops[i] = routePlanStops[j];
  routePlanStops[j] = t;
  refreshRoutePlanVisuals();
}

function removeRouteStopIx(i) {
  routePlanStops.splice(i, 1);
  refreshRoutePlanVisuals();
}

function redrawRoutePlanPolylineOnly() {
  if (!routePlanMapInstance) return;
  if (routePlanPolyline) {
    routePlanMapInstance.removeLayer(routePlanPolyline);
    routePlanPolyline = null;
  }
  if (routePlanStops.length < 2) return;
  const latlngs = routePlanStops.map(function (s) {
    return [s.lat, s.lng];
  });
  routePlanPolyline = L.polyline(latlngs, {
    color: '#FF472F',
    weight: 4,
    opacity: 0.9,
  }).addTo(routePlanMapInstance);
}

async function saveSellerRoutePlan() {
  const msgEl = document.getElementById('route-plan-msg');
  if (msgEl) msgEl.textContent = '';
  if (!currentProfile || currentProfile.role !== 'admin') {
    toast('Apenas administradores');
    return;
  }
  const sellerId = document.getElementById('route-seller') && document.getElementById('route-seller').value;
  const nameRaw = document.getElementById('route-name') && document.getElementById('route-name').value;
  const name = (nameRaw || '').trim() || 'Rota';
  if (!sellerId) {
    toast('Selecione um vendedor');
    return;
  }
  if (routePlanStops.length < 2) {
    toast('Inclua pelo menos 2 paradas (toques no mapa)');
    return;
  }
  const sb = await ensureSupabase();
  if (!sb) return;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    toast('Faça login');
    return;
  }
  const { data: route, error: rErr } = await sb
    .from('seller_routes')
    .insert({
      seller_user_id: sellerId,
      name: name,
      created_by: user.id,
    })
    .select('id')
    .single();
  if (rErr) {
    toast(rErr.message);
    return;
  }
  const rows = routePlanStops.map(function (s, i) {
    return {
      route_id: route.id,
      establishment_id: s.id,
      stop_order: i + 1,
    };
  });
  const { error: sErr } = await sb.from('seller_route_stops').insert(rows);
  if (sErr) {
    toast(sErr.message);
    return;
  }

  const { data: sess } = await sb.auth.getSession();
  const tok = sess && sess.session && sess.session.access_token;
  if (tok) {
    fetch('/api/compute-route-geometry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + tok,
      },
      body: JSON.stringify({ routeId: route.id }),
    }).catch(function () {});
  }

  toast('Rota salva — o vendedor vê no mapa', true);
  if (msgEl) {
    msgEl.textContent =
      'O traçado pelas ruas é guardado no servidor (uma vez por rota); no mapa o vendedor só carrega essa linha.';
  }
  const rnClear = document.getElementById('route-name');
  if (rnClear) rnClear.value = '';
  routePlanStops = [];
  renderRouteStopList();
  if (routePlanPolyline && routePlanMapInstance) {
    routePlanMapInstance.removeLayer(routePlanPolyline);
    routePlanPolyline = null;
  }
  showRoutePlanHub();
}

function clearSellerRoutePolylines() {
  if (!mapInstance) return;
  if (mapSellerRouteLayerGroup) {
    mapInstance.removeLayer(mapSellerRouteLayerGroup);
    mapSellerRouteLayerGroup = null;
  }
}

/** Traço em duas camadas: halo suave + linha principal (sólida se seguir ruas) */
function drawSellerRoutePolylines(latlngs) {
  if (!mapInstance || latlngs.length < 2) return;
  clearSellerRoutePolylines();
  mapSellerRouteLayerGroup = L.layerGroup().addTo(mapInstance);
  const dense = latlngs.length > 24;
  L.polyline(latlngs, {
    color: '#FF472F',
    weight: dense ? 10 : 12,
    opacity: dense ? 0.18 : 0.22,
    lineCap: 'round',
    lineJoin: 'round',
  }).addTo(mapSellerRouteLayerGroup);
  const top = {
    color: '#FF472F',
    weight: 3,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round',
  };
  if (!dense) {
    top.dashArray = '14 10';
  }
  L.polyline(latlngs, top).addTo(mapSellerRouteLayerGroup);
}

/**
 * Um trecho entre dois pontos seguindo a rede viária (OSRM via /api/osrm-route).
 * @param {number[]} a [lat, lng]
 * @param {number[]} b [lat, lng]
 * @returns {Promise<number[][]|null>}
 */
async function fetchOsrmSegmentLatLngs(a, b) {
  const coords = a[1] + ',' + a[0] + ';' + b[1] + ',' + b[0];
  const qs = 'coords=' + encodeURIComponent(coords);
  const tryUrls = ['/api/osrm-route?' + qs];
  if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
    tryUrls.unshift(
      'https://router.project-osrm.org/route/v1/driving/' +
        coords +
        '?overview=full&geometries=geojson&steps=false'
    );
  }
  for (let u = 0; u < tryUrls.length; u++) {
    try {
      const r = await fetch(tryUrls[u]);
      if (!r.ok) continue;
      const j = await r.json();
      if (j.code !== 'Ok' || !j.routes || !j.routes[0]) continue;
      const geom = j.routes[0].geometry;
      if (!geom || geom.type !== 'LineString' || !geom.coordinates || geom.coordinates.length < 2) {
        continue;
      }
      return geom.coordinates.map(function (pt) {
        return [pt[1], pt[0]];
      });
    } catch (e) {
      /* tenta próxima URL */
    }
  }
  return null;
}

/** Liga várias paradas por trechos rodoviários; fallback em linha reta por trecho se OSRM falhar */
async function snapRouteToRoads(waypoints) {
  if (waypoints.length < 2) return waypoints;
  const merged = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const seg = await fetchOsrmSegmentLatLngs(a, b);
    if (!seg || seg.length < 2) {
      if (!merged.length) merged.push(a);
      merged.push(b);
      continue;
    }
    if (!merged.length) {
      for (let k = 0; k < seg.length; k++) merged.push(seg[k]);
    } else {
      for (let k = 1; k < seg.length; k++) merged.push(seg[k]);
    }
  }
  return merged.length >= 2 ? merged : waypoints;
}

/** GeoJSON LineString (lng,lat) → array Leaflet [lat,lng] */
function geoJsonLineStringToLatLngs(geom) {
  if (!geom || geom.type !== 'LineString' || !Array.isArray(geom.coordinates)) {
    return null;
  }
  const out = [];
  for (let i = 0; i < geom.coordinates.length; i++) {
    const pt = geom.coordinates[i];
    if (!Array.isArray(pt) || pt.length < 2) return null;
    out.push([parseFloat(pt[1]), parseFloat(pt[0])]);
  }
  return out.length >= 2 ? out : null;
}

async function fetchSellerRouteContextForMap() {
  const empty = { routes: [], selectedId: null, latlngs: [], stopOrder: {} };
  if (currentProfile && currentProfile.role === 'admin') return empty;
  const sb = await ensureSupabase();
  if (!sb) return empty;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return empty;

  const { data: routes } = await sb
    .from('seller_routes')
    .select('id, name, updated_at')
    .eq('seller_user_id', user.id)
    .order('updated_at', { ascending: false });

  if (!routes || !routes.length) return empty;

  let selectedId = null;
  if (mapSelectedRouteId === '') {
    selectedId = null;
  } else if (mapSelectedRouteId && routes.some(function (r) { return r.id === mapSelectedRouteId; })) {
    selectedId = mapSelectedRouteId;
  } else {
    let fromStorage = null;
    try {
      const saved = localStorage.getItem(MAP_ROUTE_STORAGE_KEY);
      if (saved === MAP_ROUTE_STORAGE_NONE) {
        fromStorage = MAP_ROUTE_STORAGE_NONE;
      } else if (saved && routes.some(function (r) { return r.id === saved; })) {
        fromStorage = saved;
      }
    } catch (e) {
      /* ignore */
    }
    if (fromStorage === MAP_ROUTE_STORAGE_NONE) {
      selectedId = null;
    } else if (fromStorage) {
      selectedId = fromStorage;
    } else {
      selectedId = routes[0].id;
    }
  }

  mapSelectedRouteId = selectedId == null ? '' : selectedId;

  if (selectedId == null) {
    return { routes, selectedId: null, latlngs: [], stopOrder: {} };
  }

  const { data: stops } = await sb
    .from('seller_route_stops')
    .select('establishment_id, stop_order')
    .eq('route_id', selectedId)
    .order('stop_order');

  if (!stops || stops.length < 2) {
    return { routes, selectedId, latlngs: [], stopOrder: {} };
  }

  const ids = stops.map(function (s) {
    return s.establishment_id;
  });
  const { data: ests } = await sb.from('establishments').select('id, lat, lng').in('id', ids);
  const byId = {};
  (ests || []).forEach(function (e) {
    byId[String(e.id)] = e;
  });

  const stopOrder = {};
  const straight = [];
  stops.forEach(function (st) {
    stopOrder[String(st.establishment_id)] = st.stop_order;
    const e = byId[String(st.establishment_id)];
    if (e && e.lat != null && e.lng != null) {
      straight.push([parseFloat(e.lat), parseFloat(e.lng)]);
    }
  });

  if (straight.length < 2) {
    return { routes, selectedId, latlngs: [], stopOrder };
  }

  const { data: routeRow } = await sb
    .from('seller_routes')
    .select('path_geojson')
    .eq('id', selectedId)
    .maybeSingle();

  const fromDb = geoJsonLineStringToLatLngs(routeRow && routeRow.path_geojson);
  if (fromDb && fromDb.length >= 2) {
    return { routes, selectedId, latlngs: fromDb, stopOrder };
  }

  let latlngs = straight;
  const snapped = await snapRouteToRoads(straight);
  if (snapped && snapped.length >= 2) {
    latlngs = snapped;
  }

  return { routes, selectedId, latlngs, stopOrder };
}

function populateMapRouteSelect(routes, selectedId) {
  const row = document.getElementById('map-route-row');
  const sel = document.getElementById('map-route-select');
  const clearBtn = document.getElementById('map-route-clear');
  if (!row || !sel) return;
  if (currentProfile && currentProfile.role === 'admin') {
    row.style.display = 'none';
    row.setAttribute('aria-hidden', 'true');
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }
  if (!routes || !routes.length) {
    row.style.display = 'none';
    row.setAttribute('aria-hidden', 'true');
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }
  row.style.display = 'flex';
  row.setAttribute('aria-hidden', 'false');
  sel.innerHTML = '';
  const optNone = document.createElement('option');
  optNone.value = '';
  optNone.textContent = 'Mapa normal (sem rota)';
  sel.appendChild(optNone);
  routes.forEach(function (r) {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = (r.name && String(r.name).trim()) || 'Rota';
    sel.appendChild(opt);
  });
  if (selectedId && Array.prototype.some.call(sel.options, function (o) { return o.value === selectedId; })) {
    sel.value = selectedId;
  } else {
    sel.value = '';
  }
  mapSelectedRouteId = sel.value === '' ? '' : sel.value;
  if (clearBtn) {
    clearBtn.style.display = mapSelectedRouteId ? '' : 'none';
  }
}

function onMapRouteSelectChange() {
  const sel = document.getElementById('map-route-select');
  if (!sel) return;
  mapSelectedRouteId = sel.value === '' ? '' : sel.value;
  try {
    if (mapSelectedRouteId) {
      localStorage.setItem(MAP_ROUTE_STORAGE_KEY, mapSelectedRouteId);
    } else {
      localStorage.setItem(MAP_ROUTE_STORAGE_KEY, MAP_ROUTE_STORAGE_NONE);
    }
  } catch (e) {
    /* ignore */
  }
  if (mapSelectedRouteId) {
    refreshMapMarkers({ fitSelectedRoute: true });
  } else {
    refreshMapMarkers({ refitAllClients: true });
  }
}

function clearMapRouteSelection() {
  const sel = document.getElementById('map-route-select');
  if (sel) sel.value = '';
  mapSelectedRouteId = '';
  try {
    localStorage.setItem(MAP_ROUTE_STORAGE_KEY, MAP_ROUTE_STORAGE_NONE);
  } catch (e) {
    /* ignore */
  }
  refreshMapMarkers({ refitAllClients: true });
}

function openMyRoutesTab() {
  if (sessionStorage.getItem('cayena_offline') === '1') {
    toast('Conecte-se à conta para gerenciar rotas');
    return;
  }
  if (currentProfile && currentProfile.role === 'admin') {
    return;
  }
  myRoutesAfterCliBackRouteId = null;
  prevScr = document.querySelector('.scr.on')?.id?.replace('scr-', '') || 'ana';
  goScr('my-routes');
}

function showMyRoutesList() {
  const list = document.getElementById('my-routes-list-view');
  const detail = document.getElementById('my-routes-detail-view');
  if (list) list.style.display = '';
  if (detail) detail.style.display = 'none';
  myRoutesDetailRouteId = null;
}

function goBackFromMyRoutes() {
  const detail = document.getElementById('my-routes-detail-view');
  if (detail && detail.style.display !== 'none') {
    showMyRoutesList();
    return;
  }
  goScr('map');
}

async function loadMyRoutesList() {
  const el = document.getElementById('my-routes-list');
  const emptyEl = document.getElementById('my-routes-empty');
  if (!el) return;
  el.innerHTML = '';
  const sb = await ensureSupabase();
  if (!sb) {
    el.innerHTML = '<p class="my-routes-lead">Nuvem indisponível.</p>';
    return;
  }
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    el.innerHTML = '<p class="my-routes-lead">Faça login para ver suas rotas.</p>';
    if (emptyEl) emptyEl.style.display = 'none';
    return;
  }
  const { data: rows, error } = await sb
    .from('seller_routes')
    .select('id, name, updated_at')
    .eq('seller_user_id', user.id)
    .order('updated_at', { ascending: false });
  if (error) {
    el.innerHTML = '<p class="my-routes-lead">' + escapeHtml(error.message) + '</p>';
    if (emptyEl) emptyEl.style.display = 'none';
    return;
  }
  if (!rows || !rows.length) {
    if (emptyEl) emptyEl.style.display = '';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';
  rows.forEach(function (r) {
    const name = (r.name && String(r.name).trim()) || 'Rota';
    const d = r.updated_at ? new Date(r.updated_at) : null;
    const dstr =
      d && !isNaN(d.getTime())
        ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'my-route-card';
    const rid = r.id;
    btn.onclick = function () {
      openMyRouteDetail(rid);
    };
    const nameSpan = document.createElement('span');
    nameSpan.className = 'my-route-card-name';
    nameSpan.textContent = name;
    btn.appendChild(nameSpan);
    if (dstr) {
      const dateSpan = document.createElement('span');
      dateSpan.className = 'my-route-card-date';
      dateSpan.textContent = 'Atualizada em ' + dstr;
      btn.appendChild(dateSpan);
    }
    el.appendChild(btn);
  });
}

async function openMyRouteDetail(routeId) {
  myRoutesDetailRouteId = routeId;
  const list = document.getElementById('my-routes-list-view');
  const detail = document.getElementById('my-routes-detail-view');
  const titleEl = document.getElementById('my-route-detail-title');
  const stopsEl = document.getElementById('my-route-detail-stops');
  if (list) list.style.display = 'none';
  if (detail) detail.style.display = '';
  if (stopsEl) stopsEl.innerHTML = '<p class="my-routes-loading">Carregando…</p>';

  const sb = await ensureSupabase();
  if (!sb) return;
  const { data: stops, error: stErr } = await sb
    .from('seller_route_stops')
    .select('establishment_id, stop_order')
    .eq('route_id', routeId)
    .order('stop_order');
  if (stErr || !stops || !stops.length) {
    if (stopsEl) stopsEl.innerHTML = '<p class="my-routes-lead">Não foi possível carregar as paradas.</p>';
    return;
  }
  const { data: routeRow } = await sb.from('seller_routes').select('name').eq('id', routeId).maybeSingle();
  if (titleEl) {
    titleEl.textContent = (routeRow && routeRow.name && String(routeRow.name).trim()) || 'Rota';
  }

  const ids = stops.map(function (s) {
    return s.establishment_id;
  });
  const { data: ests } = await sb.from('establishments').select('id, nome, bairro, tel, status').in('id', ids);
  const byId = {};
  (ests || []).forEach(function (e) {
    byId[String(e.id)] = e;
  });

  if (stopsEl) stopsEl.innerHTML = '';
  let any = false;
  stops.forEach(function (st) {
    const e = byId[String(st.establishment_id)];
    if (!e) return;
    any = true;
    const nome = e.nome || 'Cliente';
    const bairro = e.bairro || '—';
    const tel = e.tel || '';
    const isNovo = e.status !== 'reat';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'my-route-stop-row';
    const cid = String(e.id);
    btn.onclick = function () {
      openCliFromMyRoute(cid);
    };

    const n = document.createElement('span');
    n.className = 'my-route-stop-n';
    n.textContent = String(st.stop_order);
    btn.appendChild(n);

    const body = document.createElement('div');
    body.className = 'my-route-stop-body';

    const nameRow = document.createElement('div');
    nameRow.className = 'my-route-stop-name-row';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'my-route-stop-name';
    nameSpan.textContent = nome;
    nameRow.appendChild(nameSpan);
    const badge = document.createElement('span');
    badge.className = isNovo ? 'badge b-novo' : 'badge b-reat';
    badge.textContent = isNovo ? 'NOVO' : 'REATIVADO';
    nameRow.appendChild(badge);
    body.appendChild(nameRow);

    const sub = document.createElement('span');
    sub.className = 'my-route-stop-sub';
    sub.textContent = bairro + (tel ? ' · ' + tel : '');
    body.appendChild(sub);

    btn.appendChild(body);
    if (stopsEl) stopsEl.appendChild(btn);
  });

  if (stopsEl && !any) {
    stopsEl.innerHTML = '<p class="my-routes-lead">Nenhuma parada encontrada.</p>';
  }
}

function openCliFromMyRoute(clientId) {
  if (myRoutesDetailRouteId) {
    myRoutesAfterCliBackRouteId = myRoutesDetailRouteId;
  }
  openCli(clientId);
}

function openDeleteRouteConfirm() {
  if (!myRoutesDetailRouteId) return;
  const ov = document.getElementById('ov-delete-route');
  if (ov) {
    ov.classList.add('on');
    ov.setAttribute('aria-hidden', 'false');
  }
}

function closeDeleteRouteConfirm() {
  const ov = document.getElementById('ov-delete-route');
  if (ov) {
    ov.classList.remove('on');
    ov.setAttribute('aria-hidden', 'true');
  }
}

async function deleteMyRouteConfirmed() {
  closeDeleteRouteConfirm();
  if (!myRoutesDetailRouteId) return;
  const sb = await ensureSupabase();
  if (!sb) return;
  const rid = myRoutesDetailRouteId;
  const { error } = await sb.from('seller_routes').delete().eq('id', rid);
  if (error) {
    toast(error.message);
    return;
  }
  toast('Rota excluída', true);
  if (String(mapSelectedRouteId) === String(rid)) {
    mapSelectedRouteId = '';
    try {
      localStorage.setItem(MAP_ROUTE_STORAGE_KEY, MAP_ROUTE_STORAGE_NONE);
    } catch (e) {
      /* ignore */
    }
  }
  if (typeof mapInstance !== 'undefined' && mapInstance) {
    refreshMapMarkers({});
  }
  showMyRoutesList();
  loadMyRoutesList();
}

/** @deprecated use openDeleteRouteConfirm */
function confirmDeleteMyRoute() {
  openDeleteRouteConfirm();
}

function makeMapIcon(isNovo) {
  const cls = isNovo ? 'novo' : 'reat';
  return L.divIcon({
    className: 'map-pin-ico',
    html:
      '<div class="map-pin-dot ' +
      cls +
      '"></div><div class="map-pin-stem ' +
      cls +
      '"></div>',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
  });
}

function initLeafletMap() {
  if (typeof L === 'undefined') return;
  const el = document.getElementById('leaflet-map');
  if (!el) return;

  if (!mapInstance) {
    mapInstance = L.map(el, { zoomControl: false }).setView([-23.55, -46.63], 12);
    /* Tiles via CARTO (dados OSM): tile.openstreetmap.org bloqueia requisições sem Referer (WebView, alguns browsers). */
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
    }).addTo(mapInstance);
    mapMarkersLayer = L.layerGroup().addTo(mapInstance);
    refreshMapMarkers({ doInitialFit: true });
  } else {
    setTimeout(function () {
      mapInstance.invalidateSize();
    }, 200);
  }
}

async function refreshMapMarkers(opts) {
  if (typeof L === 'undefined' || !mapInstance || !mapMarkersLayer) return;
  opts = opts || {};
  clearSellerRoutePolylines();
  mapMarkersLayer.clearLayers();

  const routeCtx = await fetchSellerRouteContextForMap();
  mapSellerRouteStopOrder = routeCtx.stopOrder || {};
  populateMapRouteSelect(routeCtx.routes, routeCtx.selectedId);
  drawSellerRoutePolylines(routeCtx.latlngs);
  const pts = [];
  DB.forEach(function (c) {
    const lat = parseFloat(c.lat);
    const lng = parseFloat(c.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    const isNovo = c.status !== 'reat';
    const ord = mapSellerRouteStopOrder[String(c.id)] || 0;
    const icon = ord > 0 ? makeRoutePlanNumberedIcon(ord) : makeMapIcon(isNovo);
    const m = L.marker([lat, lng], { icon: icon });
    m.on('click', function () {
      showMapPopupFromClient(c);
    });
    m.addTo(mapMarkersLayer);
    pts.push([lat, lng]);
  });

  if (opts.focusClientId != null) {
    const c = getCliById(opts.focusClientId);
    if (c) {
      const la = parseFloat(c.lat);
      const lo = parseFloat(c.lng);
      if (!Number.isNaN(la) && !Number.isNaN(lo)) {
        mapInstance.flyTo([la, lo], 16, { duration: 0.6 });
      }
    }
    return;
  }

  if (opts.fitSelectedRoute && routeCtx.latlngs.length >= 2) {
    mapInstance.fitBounds(L.latLngBounds(routeCtx.latlngs).pad(0.14));
    return;
  }

  if (opts.refitAllClients && pts.length) {
    mapInstance.fitBounds(L.latLngBounds(pts).pad(0.14));
    return;
  }

  if (opts.doInitialFit && pts.length) {
    const b = L.latLngBounds(pts);
    mapInstance.fitBounds(b.pad(0.14));
    mapDidInitialFit = true;
  } else if (opts.doInitialFit && !pts.length) {
    mapInstance.setView([-23.55, -46.63], 12);
    mapDidInitialFit = true;
  }
}

function mapCenterOnUser() {
  if (typeof L === 'undefined' || !mapInstance) {
    initLeafletMap();
    setTimeout(mapCenterOnUser, 300);
    return;
  }
  if (!navigator.geolocation) {
    toast('Geolocalização não disponível');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    function (p) {
      const lat = p.coords.latitude;
      const lng = p.coords.longitude;
      mapInstance.setView([lat, lng], 15);
      if (mapUserMarker) {
        mapUserMarker.setLatLng([lat, lng]);
      } else {
        mapUserMarker = L.circleMarker([lat, lng], {
          radius: 8,
          color: '#fff',
          weight: 3,
          fillColor: '#FF472F',
          fillOpacity: 1,
        }).addTo(mapInstance);
      }
      toast('Localização atualizada', true);
    },
    function () {
      toast('Não foi possível obter sua localização');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function mapSearchClients() {
  if (typeof L === 'undefined') {
    toast('Mapa indisponível');
    return;
  }
  if (!mapInstance) {
    initLeafletMap();
    setTimeout(mapSearchClients, 280);
    return;
  }
  const raw = (document.getElementById('map-search') && document.getElementById('map-search').value) || '';
  const q = raw.toLowerCase().trim();
  if (!q) {
    toast('Digite nome, bairro ou CNPJ');
    return;
  }
  const matches = DB.filter(function (c) {
    return (
      c.nome.toLowerCase().includes(q) ||
      (c.cnpj && c.cnpj.includes(q)) ||
      c.bairro.toLowerCase().includes(q)
    );
  });
  const withCoords = matches.filter(function (c) {
    const la = parseFloat(c.lat);
    const lo = parseFloat(c.lng);
    return !Number.isNaN(la) && !Number.isNaN(lo);
  });
  if (!withCoords.length) {
    toast('Nenhum cliente encontrado com esse termo');
    return;
  }
  if (withCoords.length === 1) {
    const c = withCoords[0];
    mapInstance.flyTo([parseFloat(c.lat), parseFloat(c.lng)], 16, { duration: 0.5 });
    showMapPopupFromClient(c);
    return;
  }
  const bounds = L.latLngBounds(withCoords.map(function (c) {
    return [parseFloat(c.lat), parseFloat(c.lng)];
  }));
  mapInstance.fitBounds(bounds.pad(0.18));
  toast(withCoords.length + ' clientes na área');
}

function openCad() {
  resetCad();
  document.getElementById('ov-cad').classList.add('on');
}

function closeCad() {
  document.getElementById('ov-cad').classList.remove('on');
  setTimeout(resetCad, 350);
}

function closeOv(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('on');
  if (id === 'ov-notifications') el.setAttribute('aria-hidden', 'true');
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

/** Janela após o horário-alvo (10 min) para o scheduler de 60s não perder o disparo. */
var REMINDER_NOTIF_WINDOW_MS = 10 * 60 * 1000;
var reminderNotifIntervalId = null;

function getDayBeforeNineAmMs(visitMs) {
  const v = new Date(visitMs);
  return new Date(v.getFullYear(), v.getMonth(), v.getDate() - 1, 9, 0, 0, 0).getTime();
}

function reminderNotifStorageKey(kind, id) {
  return kind === 'day' ? 'cayena_notif_rem_day_' + id : 'cayena_notif_rem_hour_' + id;
}

function showReminderBrowserNotification(kind, clientNome, reminder) {
  const sub =
    reminder.dataStr +
    ' às ' +
    reminder.horaStr +
    (reminder.notes ? ' · ' + reminder.notes : '');
  const title =
    kind === 'day' ? 'Lembrete: visita amanhã' : 'Lembrete: visita em 1 hora';
  const body = clientNome + ' — ' + sub;
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body,
        tag: 'cayena-rem-' + String(reminder.id) + '-' + kind,
      });
    } catch (e) {
      console.warn(e);
      toast('🔔 ' + title + ': ' + clientNome, true);
    }
  } else {
    toast('🔔 ' + title + ': ' + clientNome, true);
  }
}

function checkReminderNotifications() {
  const now = Date.now();
  (DB || []).forEach(function (c) {
    (c.lembretes || []).forEach(function (r) {
      if (r.status !== 'pending') return;
      const visitMs = r.remind_at_ms;
      if (!visitMs || visitMs <= now) return;

      const idStr = String(r.id);

      const dayBefore9 = getDayBeforeNineAmMs(visitMs);
      if (now >= dayBefore9 && now < dayBefore9 + REMINDER_NOTIF_WINDOW_MS) {
        const keyDay = reminderNotifStorageKey('day', idStr);
        if (!localStorage.getItem(keyDay)) {
          localStorage.setItem(keyDay, '1');
          showReminderBrowserNotification('day', c.nome, r);
        }
      }

      const oneHourBefore = visitMs - 60 * 60 * 1000;
      if (now >= oneHourBefore && now < oneHourBefore + REMINDER_NOTIF_WINDOW_MS) {
        const keyHour = reminderNotifStorageKey('hour', idStr);
        if (!localStorage.getItem(keyHour)) {
          localStorage.setItem(keyHour, '1');
          showReminderBrowserNotification('hour', c.nome, r);
        }
      }
    });
  });
}

function countUpcomingRemindersSoon() {
  const now = Date.now();
  const week = now + 7 * 24 * 60 * 60 * 1000;
  let n = 0;
  (DB || []).forEach(function (c) {
    (c.lembretes || []).forEach(function (r) {
      if (r.status !== 'pending') return;
      const t = r.remind_at_ms;
      if (!t || t <= now) return;
      if (t <= week) n += 1;
    });
  });
  return n;
}

function updateNotificationBadge() {
  const el = document.getElementById('more-notif-badge');
  if (!el) return;
  const n = countUpcomingRemindersSoon();
  if (n > 0) {
    el.textContent = n > 99 ? '99+' : String(n);
    el.style.display = '';
    el.setAttribute('aria-hidden', 'false');
  } else {
    el.style.display = 'none';
    el.setAttribute('aria-hidden', 'true');
  }
}

function startReminderNotificationScheduler() {
  if (reminderNotifIntervalId != null) return;
  reminderNotifIntervalId = setInterval(function () {
    checkReminderNotifications();
    updateNotificationBadge();
  }, 60000);
  checkReminderNotifications();
  updateNotificationBadge();
}

function onClientsLoaded() {
  startReminderNotificationScheduler();
  updateNotificationBadge();
  checkReminderNotifications();
}

function renderNotificationsPanel() {
  const body = document.getElementById('notif-list-body');
  const statusEl = document.getElementById('notif-perm-status');
  const btn = document.getElementById('notif-perm-btn');
  if (typeof Notification === 'undefined') {
    if (statusEl) statusEl.textContent = 'Este navegador não suporta notificações no sistema.';
    if (btn) btn.style.display = 'none';
  } else {
    if (btn) btn.style.display = '';
    if (statusEl) {
      if (Notification.permission === 'granted') {
        statusEl.textContent = 'Alertas do sistema ativados.';
      } else if (Notification.permission === 'denied') {
        statusEl.textContent =
          'Notificações bloqueadas. Ative nas configurações do navegador.';
      } else {
        statusEl.textContent = 'Toque no botão para pedir permissão (recomendado).';
      }
    }
  }

  if (!body) return;
  const now = Date.now();
  const rows = [];
  (DB || []).forEach(function (c) {
    (c.lembretes || []).forEach(function (r) {
      if (r.status !== 'pending') return;
      if (!r.remind_at_ms || r.remind_at_ms <= now) return;
      rows.push({ client: c, reminder: r });
    });
  });
  rows.sort(function (a, b) {
    return a.reminder.remind_at_ms - b.reminder.remind_at_ms;
  });
  if (!rows.length) {
    body.innerHTML =
      '<div class="notif-empty">Nenhum lembrete futuro. Crie um pelo botão + → Novo lembrete.</div>';
    return;
  }
  body.innerHTML = rows
    .map(function (row) {
      const c = row.client;
      const r = row.reminder;
      return (
        '<div class="notif-card">' +
        '<div class="notif-card-title">' +
        escapeHtml(c.nome) +
        '</div>' +
        '<div class="notif-card-meta">' +
        escapeHtml(r.dataStr + ' às ' + r.horaStr) +
        '</div>' +
        (r.notes
          ? '<div class="notif-card-notes">' + escapeHtml(r.notes) + '</div>'
          : '') +
        '</div>'
      );
    })
    .join('');
}

function openNotificationsPanel() {
  closeOv('ov-more');
  renderNotificationsPanel();
  const ov = document.getElementById('ov-notifications');
  if (ov) {
    ov.classList.add('on');
    ov.setAttribute('aria-hidden', 'false');
  }
}

async function requestReminderNotificationPermission() {
  if (typeof Notification === 'undefined') return;
  try {
    const p = await Notification.requestPermission();
    renderNotificationsPanel();
    if (p === 'granted') {
      toast('✓ Notificações ativadas', true);
    }
  } catch (e) {
    console.warn(e);
  }
}

function openFabMenu() {
  const om = document.getElementById('ov-more');
  if (om) om.classList.remove('on');
  document.getElementById('ov-fab').classList.add('on');
}

function fabNovaCliente() {
  closeOv('ov-fab');
  openCad();
}

async function fabNovoFormulario() {
  closeOv('ov-fab');
  const q = document.getElementById('pick-cli-q');
  if (q) q.value = '';
  if (sessionStorage.getItem('cayena_offline') !== '1') {
    const sb = await ensureSupabase();
    if (sb) await loadClientsFromSupabase({ silent: true });
  }
  renderPickCliList('');
  document.getElementById('ov-pick-cli').classList.add('on');
}

async function fabNovoLembrete() {
  closeOv('ov-fab');
  lemPickId = null;
  const lq = document.getElementById('lem-q');
  if (lq) lq.value = '';
  const ld = document.getElementById('lem-date');
  const lt = document.getElementById('lem-time');
  const lo = document.getElementById('lem-obs');
  if (ld) ld.value = '';
  if (lt) lt.value = '';
  if (lo) lo.value = '';
  if (sessionStorage.getItem('cayena_offline') !== '1') {
    const sb = await ensureSupabase();
    if (sb) await loadClientsFromSupabase({ silent: true });
  }
  renderLemList('');
  document.getElementById('ov-lem').classList.add('on');
}

function filterPickCli() {
  renderPickCliList(document.getElementById('pick-cli-q').value);
}

function renderPickCliList(raw) {
  const list = DB.filter(function (c) {
    return cliMatchesSearchQuery(c, raw);
  });
  const el = document.getElementById('pick-cli-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML =
      '<div class="cli-empty" style="padding:24px 0">Nenhum cliente encontrado.</div>';
    return;
  }
  el.innerHTML = list
    .map(function (c) {
      const cid = String(c.id).replace(/"/g, '&quot;');
      return (
        '<button type="button" class="pick-cli-row" data-cid="' +
        cid +
        '"><span class="pick-cli-name">' +
        escapeHtml(c.nome) +
        '</span><span class="pick-cli-meta">' +
        escapeHtml(c.bairro) +
        ' · ' +
        escapeHtml(c.cnpj) +
        '</span></button>'
      );
    })
    .join('');
}

function pickCliForVis(id) {
  const c = getCliById(id != null ? String(id) : id);
  if (!c) return;
  currCli = c;
  closeOv('ov-pick-cli');
  openVis();
}

function filterLemCli() {
  renderLemList(document.getElementById('lem-q').value);
}

function renderLemList(raw) {
  const list = DB.filter(function (c) {
    return cliMatchesSearchQuery(c, raw);
  });
  const el = document.getElementById('lem-cli-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML =
      '<div class="cli-empty" style="padding:24px 0">Nenhum cliente encontrado.</div>';
    return;
  }
  el.innerHTML = list
    .map(function (c) {
      const cid = String(c.id).replace(/"/g, '&quot;');
      return (
        '<button type="button" class="pick-cli-row' +
        (String(lemPickId) === String(c.id) ? ' on' : '') +
        '" data-cid="' +
        cid +
        '"><span class="pick-cli-name">' +
        escapeHtml(c.nome) +
        '</span><span class="pick-cli-meta">' +
        escapeHtml(c.bairro) +
        ' · ' +
        escapeHtml(c.cnpj) +
        '</span></button>'
      );
    })
    .join('');
}

function pickLemCli(id) {
  lemPickId = id != null ? String(id) : null;
  renderLemList(document.getElementById('lem-q').value);
}

async function subLembrete() {
  if (submitBusy.lem) return;
  if (lemPickId === null) {
    toast('⚠️ Selecione um cliente');
    return;
  }
  const d = document.getElementById('lem-date').value;
  const t = document.getElementById('lem-time').value;
  if (!d || !t) {
    toast('⚠️ Informe data e hora do lembrete');
    return;
  }
  const c = getCliById(lemPickId);
  if (!c) return;
  const obs = (document.getElementById('lem-obs').value || '').trim();

  submitBusy.lem = true;
  const lemBtn = document.getElementById('lem-submit');
  const lemLabel = lemBtn ? lemBtn.textContent : '';
  if (lemBtn) {
    lemBtn.disabled = true;
    lemBtn.setAttribute('aria-busy', 'true');
    lemBtn.textContent = 'Salvando…';
  }
  try {
    const sb = await ensureSupabase();
    let user = null;
    if (sb) {
      const { data: u } = await sb.auth.getUser();
      user = u.user;
    }
    if (sb && user && !sessionStorage.getItem('cayena_offline')) {
      const remindAt = new Date(d + 'T' + t + ':00');
      const { error } = await sb.from('reminders').insert({
        user_id: user.id,
        establishment_id: c.id,
        remind_at: remindAt.toISOString(),
        notes: obs || null,
        status: 'pending',
      });
      if (error) {
        toast('Erro ao salvar lembrete: ' + error.message);
        return;
      }
      await loadClientsFromSupabase({ silent: true });
      const onCli =
        document.getElementById('scr-cli') &&
        document.getElementById('scr-cli').classList.contains('on');
      if (onCli && currCli && String(currCli.id) === String(lemPickId)) {
        const fresh = getCliById(lemPickId);
        if (fresh) {
          currCli = fresh;
          buildHist(currCli);
        }
      }
      const onHist =
        document.getElementById('scr-hist') &&
        document.getElementById('scr-hist').classList.contains('on');
      if (onHist) renderGlobalHist();
    } else {
      if (!c.lembretes) c.lembretes = [];
      const remindAt = new Date(d + 'T' + t + ':00');
      c.lembretes.unshift(
        mapReminderRow({
          id: 'local-' + Date.now(),
          remind_at: remindAt.toISOString(),
          notes: obs || null,
          status: 'pending',
        })
      );
      c.lembretes = sortLembretesDesc(c.lembretes);
      const onCli =
        document.getElementById('scr-cli') &&
        document.getElementById('scr-cli').classList.contains('on');
      if (onCli && currCli && String(currCli.id) === String(lemPickId)) {
        buildHist(currCli);
      }
      const onHist =
        document.getElementById('scr-hist') &&
        document.getElementById('scr-hist').classList.contains('on');
      if (onHist) renderGlobalHist();
      onClientsLoaded();
    }

    toast('✓ Lembrete: ' + c.nome + ' — ' + d + ' às ' + t + (obs ? ' · ' + obs : ''), true);
    closeOv('ov-lem');
  } finally {
    submitBusy.lem = false;
    if (lemBtn) {
      lemBtn.disabled = false;
      lemBtn.removeAttribute('aria-busy');
      lemBtn.textContent = lemLabel || 'Salvar lembrete';
    }
  }
}

function resetCad() {
  cadStep = 1;
  updCad();
  [1, 2, 3].forEach((i) => {
    const e = document.getElementById('cs' + i);
    e.className = 'fs' + (i === 1 ? ' on' : '');
  });
  document.getElementById('cadsuc').classList.remove('on');
  document.getElementById('cadfb').style.display = '';
  document.getElementById('cadfoo').style.display = '';
  document.getElementById('cadtit').textContent = 'Novo Cliente';
  document.getElementById('cadsteps').style.display = '';
  document.getElementById('cadslbl').style.display = '';
  document.getElementById('cval').textContent = 'Aguardando captura...';
  const cap = document.getElementById('capbtn');
  cap.textContent = 'Capturar';
  cap.className = 'capbtn';
  document.getElementById('cbox').className = 'cbox';
  document.getElementById('cacc').className = 'cacc';
  document.getElementById('mprev').className = 'mprev';
  document.getElementById('c-lat').value = '';
  document.getElementById('c-lng').value = '';
  ['c-nome', 'c-cnpj', 'c-tel', 'c-cep', 'c-rua', 'c-num', 'c-comp', 'c-bairro', 'c-obs'].forEach((id) => {
    const e = document.getElementById(id);
    if (e) e.value = '';
  });
  document.getElementById('c-cidade').value = 'São Paulo';
  document.getElementById('c-estado').value = 'SP';
  document.getElementById('c-tipo').value = '';
  document.getElementById('sh-cad').scrollTo(0, 0);
}

function updCad() {
  const lbls = ['Dados do estabelecimento', 'Endereço', 'Localização GPS'];
  document.getElementById('cadslbl').textContent =
    'Passo ' + cadStep + ' de 3 — ' + lbls[cadStep - 1];
  [1, 2, 3].forEach((i) => {
    const d = document.getElementById('sd' + i);
    d.className = 'sd' + (i === cadStep ? ' on' : i < cadStep ? ' done' : '');
  });
  document.getElementById('cadback').style.display = cadStep > 1 ? '' : 'none';
  document.getElementById('cadnext').textContent = cadStep === 3 ? 'Cadastrar cliente' : 'Próximo';
}

function cadNext() {
  if (!valCad(cadStep)) return;
  if (cadStep === 3) {
    void subCad();
    return;
  }
  document.getElementById('cs' + cadStep).className = 'fs';
  cadStep++;
  document.getElementById('cs' + cadStep).className = 'fs on';
  updCad();
  document.getElementById('sh-cad').scrollTo(0, 0);
}

function cadBack() {
  if (cadStep <= 1) return;
  document.getElementById('cs' + cadStep).className = 'fs';
  cadStep--;
  document.getElementById('cs' + cadStep).className = 'fs on';
  updCad();
  document.getElementById('sh-cad').scrollTo(0, 0);
}

function valCad(s) {
  if (s === 1) {
    if (!document.getElementById('c-nome').value.trim()) {
      toast('⚠️ Informe o nome');
      return false;
    }
    if (document.getElementById('c-cnpj').value.replace(/\D/g, '').length < 14) {
      toast('⚠️ CNPJ inválido');
      return false;
    }
    if (document.getElementById('c-tel').value.replace(/\D/g, '').length < 10) {
      toast('⚠️ Telefone inválido');
      return false;
    }
  }
  if (s === 2) {
    if (!document.getElementById('c-rua').value.trim()) {
      toast('⚠️ Informe a rua');
      return false;
    }
    if (!document.getElementById('c-num').value.trim()) {
      toast('⚠️ Informe o número');
      return false;
    }
    if (!document.getElementById('c-bairro').value.trim()) {
      toast('⚠️ Informe o bairro');
      return false;
    }
  }
  if (s === 3 && !document.getElementById('c-lat').value) {
    toast('⚠️ Capture as coordenadas GPS');
    return false;
  }
  return true;
}

async function subCad() {
  if (submitBusy.cad) return;
  submitBusy.cad = true;
  const cadBtn = document.getElementById('cadnext');
  const prevCadLabel = cadBtn ? cadBtn.textContent : '';
  if (cadBtn) {
    cadBtn.disabled = true;
    cadBtn.setAttribute('aria-busy', 'true');
    cadBtn.textContent = 'Salvando…';
  }
  try {
  const nome = document.getElementById('c-nome').value.trim();
  const cnpj = document.getElementById('c-cnpj').value;
  const tel = document.getElementById('c-tel').value;
  const tipo = document.getElementById('c-tipo').value || 'Outro';
  const rua = document.getElementById('c-rua').value.trim();
  const num = document.getElementById('c-num').value.trim();
  const comp = document.getElementById('c-comp').value.trim();
  const bairro = document.getElementById('c-bairro').value.trim();
  const cidade = document.getElementById('c-cidade').value.trim();
  const estado = document.getElementById('c-estado').value.trim();
  const cep = document.getElementById('c-cep').value;
  const lat = document.getElementById('c-lat').value;
  const lng = document.getElementById('c-lng').value;
  const obs = document.getElementById('c-obs').value.trim();

  const sb = await ensureSupabase();
  let user = null;
  if (sb) {
    const { data: u } = await sb.auth.getUser();
    user = u.user;
  }

  let newId;
  if (sb && user && !sessionStorage.getItem('cayena_offline')) {
    const cnpjNorm = normalizeCnpjDigits(cnpj);
    const { data: estId, error } = await sb.rpc('register_establishment', {
      p_cnpj_normalized: cnpjNorm,
      p_cnpj_display: cnpj.trim(),
      p_nome: nome,
      p_tipo: tipo,
      p_status: 'novo',
      p_tel: tel,
      p_email_cliente: '',
      p_rua: rua,
      p_num: num,
      p_comp: comp,
      p_bairro: bairro,
      p_cidade: cidade,
      p_estado: estado || 'SP',
      p_cep: cep,
      p_lat: parseFloat(lat),
      p_lng: parseFloat(lng),
      p_obs: obs,
    });
    if (error) {
      toast('Erro ao salvar: ' + error.message);
      return;
    }
    newId = estId != null ? String(estId) : estId;
    await loadClientsFromSupabase({ silent: true });
    await mergeEstablishmentIntoDb(sb, newId);
    if (!getCliById(newId)) {
      DB.unshift({
        id: newId,
        nome,
        tipo,
        status: 'novo',
        cnpj,
        tel,
        email: '',
        rua,
        num,
        comp,
        bairro,
        cidade,
        estado: estado || 'SP',
        cep,
        lat,
        lng,
        obs,
        visitas: [],
        lembretes: [],
        created_at: new Date().toISOString(),
      });
      refreshOpenClientPickers();
    }
  } else {
    newId = Math.max(...DB.map((c) => (typeof c.id === 'number' ? c.id : 0)), -1) + 1;
    DB.push({
      id: newId,
      nome,
      tipo,
      status: 'novo',
      cnpj,
      tel,
      email: '',
      rua,
      num,
      comp,
      bairro,
      cidade,
      estado: estado || 'SP',
      cep,
      lat,
      lng,
      obs,
      visitas: [],
      lembretes: [],
      created_at: new Date().toISOString(),
    });
  }

  refreshMapMarkers({ focusClientId: newId });
  renderDashboard();

  document.getElementById('succnpj').textContent = cnpj;
  document.getElementById('cadfb').style.display = 'none';
  document.getElementById('cadfoo').style.display = 'none';
  document.getElementById('cadsteps').style.display = 'none';
  document.getElementById('cadslbl').style.display = 'none';
  document.getElementById('cadtit').textContent = 'Sucesso! 🎉';
  document.getElementById('cadsuc').classList.add('on');
  toast('✓ Cliente cadastrado!', true);
  setTimeout(closeCad, 3000);
  } finally {
    submitBusy.cad = false;
    if (cadBtn) {
      cadBtn.disabled = false;
      cadBtn.removeAttribute('aria-busy');
      cadBtn.textContent = cadStep === 3 ? 'Cadastrar cliente' : prevCadLabel;
    }
  }
}

function captureGPS() {
  const btn = document.getElementById('capbtn');
  btn.textContent = '...';
  btn.disabled = true;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (p) => setGPS(p.coords.latitude, p.coords.longitude, p.coords.accuracy),
      () => fakeGPS(),
      { enableHighAccuracy: true, timeout: 7000 }
    );
  } else fakeGPS();
}

function fakeGPS() {
  const la = (-23.55 + (Math.random() * 0.06 - 0.03)).toFixed(6);
  const lo = (-46.63 + (Math.random() * 0.06 - 0.03)).toFixed(6);
  setTimeout(() => setGPS(la, lo, Math.floor(Math.random() * 8 + 3)), 1400);
}

function setGPS(lat, lng, acc) {
  const la = parseFloat(lat).toFixed(6);
  const lo = parseFloat(lng).toFixed(6);
  document.getElementById('c-lat').value = la;
  document.getElementById('c-lng').value = lo;
  document.getElementById('cval').textContent = la + ', ' + lo;
  const btn = document.getElementById('capbtn');
  btn.textContent = '✓ OK';
  btn.className = 'capbtn cap';
  btn.disabled = false;
  document.getElementById('cbox').className = 'cbox cap';
  const ac = document.getElementById('cacc');
  ac.textContent = '✓ Precisão: ±' + Math.round(acc) + 'm';
  ac.className = 'cacc on';
  const mp = document.getElementById('mprev');
  mp.className = 'mprev on';
  document.getElementById('mplbl').textContent =
    parseFloat(la).toFixed(4) + ', ' + parseFloat(lo).toFixed(4);
}

function clearVisErrs() {
  ['fw-cel', 'fw-nome'].forEach((id) => {
    const w = document.getElementById(id);
    if (w) {
      w.classList.remove('fi-err');
      const fg = w.closest('.fg');
      if (fg) fg.classList.remove('fi-err');
    }
  });
}

function openVis() {
  if (!currCli) return;
  document.getElementById('vclinome').textContent = currCli.nome;
  document.getElementById('vissuc').classList.remove('on');
  document.getElementById('vformbody').style.display = '';
  document.getElementById('visfoo').style.display = '';
  document.getElementById('ov-vis').classList.add('on');
  const adminWrap = document.getElementById('admin-vis-bu-wrap');
  if (adminWrap) {
    if (currentProfile && currentProfile.role === 'admin') {
      ensureAdminVisitBuSession();
      syncAdminVisitBuSeg();
      adminWrap.style.display = '';
    } else {
      adminWrap.style.display = 'none';
    }
  }
  applyVisitFormMode();
  bindSaxPhotoInputsOnce();
  resetSaxVisitForm();

  setTimeout(() => {
    const vc = document.getElementById('v-cel');
    if (vc) vc.value = '';
    const vn = document.getElementById('v-nome');
    if (vn) vn.value = '';
    document.getElementById('v-obs').value = '';
    selSeg('peq');
    document.querySelectorAll('.chip-opt').forEach((c) => c.classList.remove('on'));
    currChip = null;
    document.querySelectorAll('.status-card').forEach((c) => c.classList.remove('on'));
    clearVisErrs();
  }, 50);
}

function selSeg(s) {
  currSeg = s;
  document.getElementById('seg-peq').className = 'seg-opt' + (s === 'peq' ? ' on' : '');
  document.getElementById('seg-gra').className = 'seg-opt' + (s === 'gra' ? ' on' : '');
}

function selChip(el) {
  const grid = el.closest('.chip-grid');
  if (grid) {
    grid.querySelectorAll('.chip-opt').forEach((c) => c.classList.remove('on'));
  } else {
    document.querySelectorAll('.chip-opt').forEach((c) => c.classList.remove('on'));
  }
  el.classList.add('on');
  currChip = el.textContent;
}

function togSC(id) {
  document.getElementById(id).classList.toggle('on');
}

function visitResultFromCards() {
  if (getVisitFormBusinessUnit() === 'SAX') {
    return null;
  }
  const aus = document.getElementById('sc-ausente').classList.contains('on');
  const promo = document.getElementById('sc-promo').classList.contains('on');
  if (aus && promo) return 'aus';
  if (aus) return 'aus';
  if (promo) return 'conv';
  return null;
}

async function subVis() {
  if (submitBusy.vis) return;
  if (!currCli) return;

  const bu = getVisitFormBusinessUnit();
  let currRes = null;
  let nome = '';
  let celStr = '';
  let obs = '';

  if (bu === 'PAP') {
    const celRaw = document.getElementById('v-cel')?.value.replace(/\D/g, '') || '';
    nome = document.getElementById('v-nome')?.value.trim() || '';
    let ok = true;
    const wrapCel = document.getElementById('fw-cel');
    const wrapNome = document.getElementById('fw-nome');
    if (!celRaw || celRaw.length < 10) {
      wrapCel?.classList.add('fi-err');
      wrapCel?.closest('.fg')?.classList.add('fi-err');
      ok = false;
    } else {
      wrapCel?.classList.remove('fi-err');
      wrapCel?.closest('.fg')?.classList.remove('fi-err');
    }
    if (!nome) {
      wrapNome?.classList.add('fi-err');
      wrapNome?.closest('.fg')?.classList.add('fi-err');
      ok = false;
    } else {
      wrapNome?.classList.remove('fi-err');
      wrapNome?.closest('.fg')?.classList.remove('fi-err');
    }
    if (!ok) return;

    currRes = visitResultFromCards();
    if (!currRes) {
      toast('⚠️ Selecione o status da visita');
      return;
    }
    obs = document.getElementById('v-obs').value.trim();
    celStr = document.getElementById('v-cel').value.trim();
  } else {
    bindSaxPhotoInputsOnce();
    const sold = getSaxSold();
    if (!sold) {
      toast('⚠️ Selecione se conseguiu vender');
      return;
    }
    if (sold === 'sim') {
      if (getSaxSaleReasonsFromDom().length === 0) {
        toast('⚠️ Marque pelo menos um motivo da venda');
        return;
      }
    } else if (getSaxNoSaleReasonsFromDom().length === 0) {
      toast('⚠️ Marque pelo menos um motivo de não venda');
      return;
    }
    const fIn = document.getElementById('sax-photo-fachada');
    const fFile = fIn && fIn.files && fIn.files[0];
    const fgF = document.getElementById('sax-fg-fachada');
    if (!fFile) {
      if (fgF) fgF.classList.add('fi-err');
      toast('⚠️ Tire ou envie a foto da fachada');
      return;
    }
    if (fgF) fgF.classList.remove('fi-err');

    const sbPre = await ensureSupabase();
    const { data: uPre } = sbPre ? await sbPre.auth.getUser() : { data: {} };
    if (!sbPre || !uPre.user || sessionStorage.getItem('cayena_offline')) {
      toast('Visita SAX com fotos precisa de conexão e login');
      return;
    }

    currRes = sold === 'sim' ? 'conv' : 'nao';
    nome = document.getElementById('sax-nome-decisor').value.trim();
    celStr = document.getElementById('sax-cel-decisor').value.trim();
    obs = document.getElementById('v-obs').value.trim();
  }

  submitBusy.vis = true;
  const visBtn = document.getElementById('vis-submit');
  const visLabel = visBtn ? visBtn.textContent : '';
  if (visBtn) {
    visBtn.disabled = true;
    visBtn.setAttribute('aria-busy', 'true');
    visBtn.textContent = 'Salvando…';
  }
  try {
    const d = new Date();
    const dataStr = pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();

    const sb = await ensureSupabase();
    let user = null;
    if (sb) {
      const { data: u } = await sb.auth.getUser();
      user = u.user;
    }
    const repName = sellerRepDisplayName(user);

    let visitPayload = {
      data: dataStr,
      res: currRes,
      rep: repName,
      obs,
      celComprador: celStr,
      nomeComprador: nome,
      tamEstab: getTamEstabFromForm(),
      tipoEstabChip: getActiveChipText(),
      businessUnit: bu,
      created_at_ts: Date.now(),
    };

    if (bu === 'SAX') {
      const sold = getSaxSold();
      const horario = (document.getElementById('sax-horario') && document.getElementById('sax-horario').value) || '';
      let fachadaUrl = '';
      let cardapioUrl = null;
      try {
        const fFile = document.getElementById('sax-photo-fachada').files[0];
        fachadaUrl = await uploadVisitPhotoToStorage(fFile, 'fachada');
        const cFile = document.getElementById('sax-photo-cardapio').files[0];
        if (cFile) cardapioUrl = await uploadVisitPhotoToStorage(cFile, 'cardapio');
      } catch (e) {
        console.warn(e);
        toast('Erro ao enviar foto: ' + (e && e.message ? e.message : String(e)));
        return;
      }
      visitPayload.saxSold = sold;
      visitPayload.saxSaleReasons = sold === 'sim' ? getSaxSaleReasonsFromDom() : [];
      visitPayload.saxNoSaleReasons = sold === 'nao' ? getSaxNoSaleReasonsFromDom() : [];
      visitPayload.saxDecisorName = nome;
      visitPayload.saxDecisorContact = celStr;
      visitPayload.saxBestContactTime = horario;
      visitPayload.saxPhotoFachadaUrl = fachadaUrl;
      visitPayload.saxPhotoCardapioUrl = cardapioUrl || '';
      visitPayload.saxObsExtra = obs;
    }

    if (sb && user && !sessionStorage.getItem('cayena_offline')) {
      const isoDate =
        d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      const row = {
        establishment_id: currCli.id,
        user_id: user.id,
        visit_date: isoDate,
        result: currRes,
        rep_name: visitPayload.rep,
        obs: bu === 'SAX' ? obs || null : obs,
        cel_comprador: celStr || null,
        nome_comprador: nome || null,
        tam_estab: visitPayload.tamEstab || null,
        tipo_estab_chip: visitPayload.tipoEstabChip || null,
        business_unit: bu,
      };
      if (bu === 'SAX') {
        row.sax_sold = visitPayload.saxSold;
        row.sax_sale_reasons = visitPayload.saxSaleReasons;
        row.sax_no_sale_reasons = visitPayload.saxNoSaleReasons;
        row.sax_decisor_name = visitPayload.saxDecisorName || null;
        row.sax_decisor_contact = visitPayload.saxDecisorContact || null;
        row.sax_best_contact_time = visitPayload.saxBestContactTime || null;
        row.sax_photo_fachada_url = visitPayload.saxPhotoFachadaUrl;
        row.sax_photo_cardapio_url = visitPayload.saxPhotoCardapioUrl || null;
        row.sax_obs_extra = visitPayload.saxObsExtra || null;
      }
      const { error } = await sb.from('visits').insert(row);
      if (error) {
        toast('Erro ao salvar visita: ' + error.message);
        return;
      }
      const reloadOk = await loadClientsFromSupabase({ silent: true });
      if (reloadOk) {
        currCli = getCliById(currCli.id) || currCli;
      } else {
        if (!currCli.visitas) currCli.visitas = [];
        currCli.visitas.unshift(visitPayload);
      }
    } else {
      if (bu === 'SAX') {
        toast('Visita SAX não foi salva offline (exige fotos na nuvem)');
        return;
      }
      currCli.visitas.unshift(visitPayload);
    }

    buildHist(currCli);
    maybeRefreshGlobalHistIfVisible();
    swTab('hist');
    document.getElementById('vissuc').classList.add('on');
    document.getElementById('vformbody').style.display = 'none';
    document.getElementById('visfoo').style.display = 'none';
    toast('✓ Visita registrada!', true);
    setTimeout(() => closeOv('ov-vis'), 2500);
  } finally {
    submitBusy.vis = false;
    if (visBtn) {
      visBtn.disabled = false;
      visBtn.removeAttribute('aria-busy');
      visBtn.textContent = visLabel || 'Registrar Visita';
    }
  }
}

function toast(msg, ok = false) {
  const el = document.getElementById('toastel');
  el.textContent = msg;
  el.className = 'toast on' + (ok ? ' ok' : '');
  clearTimeout(window._tt);
  window._tt = setTimeout(() => {
    el.className = 'toast';
  }, 2400);
}

const EMOJIS = {
  Restaurante: '🍽️',
  'Bar / Boteco': '🍺',
  'Padaria / Confeitaria': '🥐',
  Lanchonete: '🥪',
  Açougue: '🥩',
  'Mercado / Mercearia': '🛒',
  'Hotel / Pousada': '🏨',
  Outro: '🏪',
};

function renderCliList(list) {
  const el = document.getElementById('cli-list');
  const cnt = document.getElementById('cli-count');
  cnt.innerHTML = '<b>' + list.length + '</b> cliente' + (list.length !== 1 ? 's' : '');
  if (!list.length) {
    el.innerHTML =
      '<div class="cli-empty"><div class="cli-empty-ico">🔍</div>Nenhum cliente encontrado.</div>';
    return;
  }
  el.innerHTML = list
    .map((c) => {
      const ico = EMOJIS[c.tipo] || '🏪';
      const hasVis = c.visitas.length > 0;
      const lastVis = hasVis ? c.visitas[0] : null;
      const statusCls = c.status === 'reat' ? 'b-reat' : 'b-novo';
      const statusLbl = c.status === 'reat' ? 'REATIVADO' : 'NOVO';
      const visTag = hasVis
        ? '<span class="ccard-vis-tag has">📅 ' + lastVis.data + '</span>'
        : '<span class="ccard-vis-tag none">Sem visitas</span>';
      return (
        '<div class="ccard" data-cid="' +
        String(c.id).replace(/"/g, '&quot;') +
        '">' +
        '<div class="ccard-main">' +
        '<div class="ccard-ico">' +
        ico +
        '</div>' +
        '<div class="ccard-body">' +
        '<div class="ccard-row1"><div class="ccard-name">' +
        c.nome +
        '</div><span class="badge ' +
        statusCls +
        '" style="font-size:9px;padding:2px 8px">' +
        statusLbl +
        '</span></div>' +
        '<div class="ccard-tipo">' +
        c.tipo +
        '</div>' +
        '<div class="ccard-cnpj">' +
        c.cnpj +
        '</div>' +
        '</div>' +
        '<div class="ccard-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 18 15 12 9 6"/></svg></div>' +
        '</div>' +
        '<div class="ccard-footer">' +
        '<div class="ccard-addr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg><span>' +
        c.bairro +
        ' · ' +
        c.cidade +
        '</span></div>' +
        visTag +
        '</div>' +
        '</div>'
      );
    })
    .join('');
}

function filterClis() {
  const q = document.getElementById('cli-search').value.toLowerCase().trim();
  renderCliList(
    q
      ? DB.filter(
          (c) =>
            c.nome.toLowerCase().includes(q) ||
            (c.cnpj && c.cnpj.includes(q)) ||
            c.bairro.toLowerCase().includes(q)
        )
      : [...DB]
  );
}

function openClisTab() {
  goScr('clis');
  renderCliList([...DB]);
}

function openHistTab() {
  goScr('hist');
  renderGlobalHist();
  refreshHistoriaFromServer({ silentToast: true });
}

function renderGlobalHist() {
  const el = document.getElementById('hist-global');
  if (!el) return;
  const entries = buildGlobalTimelineEntries();
  window.__histDetailItems = entries;
  if (!entries.length) {
    el.innerHTML =
      '<div class="empty"><div class="emico">📋</div>Nenhuma visita ou lembrete registrado ainda. Cadastros novos aparecem em Clientes; aqui só entram visitas e lembretes.</div>';
    return;
  }
  el.innerHTML = entries
    .map(function (e, i) {
      return renderHistSummaryRow(e, i);
    })
    .join('');
}

/** Atualiza a tela História global se ela estiver visível (ex.: após salvar visita). */
function maybeRefreshGlobalHistIfVisible() {
  const h = document.getElementById('scr-hist');
  if (h && h.classList.contains('on')) renderGlobalHist();
}

function toggleMore() {
  document.getElementById('ov-more').classList.add('on');
  updateNotificationBadge();
}

document.getElementById('c-cnpj').addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 14);
  v = v
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
  e.target.value = v;
});

document.getElementById('c-tel').addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 11);
  e.target.value =
    v.length <= 10
      ? v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
      : v.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
});

document.getElementById('c-cep').addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 8);
  e.target.value = v.replace(/^(\d{5})(\d)/, '$1-$2');
});

document.getElementById('v-cel')?.addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 11);
  e.target.value =
    v.length <= 10
      ? v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
      : v.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
});

document.addEventListener('DOMContentLoaded', function () {
  initCliListDelegation();
  initPickListsDelegation();
  ensureHistClickDelegation('hcont');
  ensureHistClickDelegation('hist-global');
  initPullToRefresh(document.getElementById('scr-hist'), refreshHistoriaFromServer);
  initPullToRefresh(document.getElementById('p-hist'), refreshHistoriaFromServer);
  initHistScrollEndRefresh(document.getElementById('scr-hist'));
  initHistScrollEndRefresh(document.getElementById('p-hist'));
  var myRoutesListView = document.getElementById('my-routes-list-view');
  var myRoutesDetailView = document.getElementById('my-routes-detail-view');
  var myRoutesListScroll = document.getElementById('my-routes-scroll-list');
  var myRoutesDetailScroll = document.getElementById('my-routes-scroll-detail');
  function getMyRoutesActiveScrollEl() {
    var detail = document.getElementById('my-routes-detail-view');
    if (detail && detail.style.display !== 'none') {
      return document.getElementById('my-routes-scroll-detail');
    }
    return document.getElementById('my-routes-scroll-list');
  }
  initPullToRefresh(myRoutesListView, refreshMyRoutesFromServer, {
    scrollTargets: [myRoutesListView, myRoutesDetailView].filter(Boolean),
    getScrollEl: getMyRoutesActiveScrollEl,
  });
  initHistScrollEndRefresh(myRoutesListScroll, function () {
    refreshMyRoutesFromServer({ silentToast: true });
  });
  initHistScrollEndRefresh(myRoutesDetailScroll, function () {
    refreshMyRoutesFromServer({ silentToast: true });
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      checkReminderNotifications();
      updateNotificationBadge();
    }
  });
  bootstrapAuth();
});
