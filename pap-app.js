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
        rep: 'Rafael Vasconcelos',
        obs: 'Cliente viajando, retornar semana que vem.',
      },
      {
        data: '10/02/2026',
        res: 'reag',
        rep: 'Rafael Vasconcelos',
        obs: 'Reunião com fornecedor. Agendou para 18/03.',
      },
    ],
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
        rep: 'Rafael Vasconcelos',
        obs: 'Pedido R$890 — frango e linguiça calabresa.',
      },
    ],
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
  return {
    data: dataStr,
    res: v.result,
    rep: v.rep_name || '',
    obs: v.obs || '',
    celComprador: v.cel_comprador || '',
    nomeComprador: v.nome_comprador || '',
    tamEstab: v.tam_estab || '',
    tipoEstabChip: v.tipo_estab_chip || '',
  };
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

/** Mesma lista de colunas usada em loadClientsFromSupabase (visitas aninhadas). */
const ESTABLISHMENT_SELECT_WITH_VISITS =
  'id,cnpj_normalized,cnpj_display,nome,tipo,status,tel,email_cliente,rua,num,comp,bairro,cidade,estado,cep,lat,lng,obs,created_at,updated_at,created_by,updated_by,visits(id,visit_date,result,rep_name,obs,cel_comprador,nome_comprador,tam_estab,tipo_estab_chip,created_at)';

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
    .order('created_at', { ascending: false, foreignTable: 'visits' });
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
}

async function loadClientsFromSupabase(opts) {
  const silent = opts && opts.silent;
  const sb = await ensureSupabase();
  if (!sb) return;
  const { data: authData } = await sb.auth.getUser();
  const user = authData && authData.user;
  if (!user) return;

  const { data: assigns, error: errAssign } = await sb
    .from('establishment_assignments')
    .select('establishment_id')
    .eq('user_id', user.id);
  if (errAssign) {
    notifySupabaseListLoadError(errAssign.message, silent);
    await loadMyProfile();
    return;
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
    return;
  }

  let q = sb
    .from('establishments')
    .select(ESTABLISHMENT_SELECT_WITH_VISITS)
    .in('id', ids)
    .order('created_at', { ascending: false });
  q = q.order('created_at', { ascending: false, foreignTable: 'visits' });
  const { data, error } = await q;
  if (error) {
    notifySupabaseListLoadError(error.message, silent);
    await loadMyProfile();
    return;
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
  if (typeof refreshMapMarkers === 'function') {
    refreshMapMarkers({ doInitialFit: true });
  }
}

/** Perfil do usuário logado (role = admin | seller) */
let currentProfile = { role: 'seller' };

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
  const { data, error } = await sb.from('profiles').select('role, full_name, phone').eq('id', user.id).single();
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
  if (!btn) return;
  const show = currentProfile && currentProfile.role === 'admin';
  btn.style.display = show ? '' : 'none';
}

function openAdminTab() {
  prevScr = document.querySelector('.scr.on')?.id?.replace('scr-', '') || 'ana';
  goScr('admin');
}

function goScrFromAdmin() {
  goScr(prevScr || 'ana');
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
      body: JSON.stringify({ email, password, full_name, phone }),
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
    ['adm-nome', 'adm-tel', 'adm-email', 'adm-pass'].forEach(function (id) {
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
    return;
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

let currCli = null;
let prevScr = 'ana';
let pinIdx = null;
let lemPickId = null;
let cadStep = 1;
let currSeg = 'peq';
let currChip = null;

function getCliById(id) {
  return DB.find((c) => String(c.id) === String(id));
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
  closePopup();
  if (s === 'map') {
    setTimeout(function () {
      initLeafletMap();
    }, 150);
  }
  if (s === 'ana') {
    renderDashboard();
  }
}

function goBack() {
  goScr(prevScr);
}

function openCli(idx) {
  const c = getCliById(idx);
  if (!c) {
    toast('Cliente não encontrado');
    return;
  }
  currCli = c;
  prevScr = document.querySelector('.scr.on')?.id?.replace('scr-', '') || 'ana';
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
  swTab('info');
  goScr('cli');
}

function buildHist(c) {
  const lbl = { conv: 'Convertido', nao: 'Não convertido', reag: 'Reagendado', aus: 'Ausente' };
  const cls = { conv: 'vconv', nao: 'vnao', reag: 'vreag', aus: 'vreag' };
  const hc = document.getElementById('hcont');
  if (!c.visitas.length) {
    hc.innerHTML =
      '<div class="empty"><div class="emico">📋</div>Nenhuma visita registrada ainda.</div>';
    return;
  }
  hc.innerHTML = c.visitas
    .map(
      (v) =>
        '<div class="vc"><div class="vtop"><div class="vdate">' +
        v.data +
        '</div><div class="vres ' +
        (cls[v.res] || 'vreag') +
        '">' +
        (lbl[v.res] || v.res) +
        '</div></div><div class="vrep">👤 ' +
        v.rep +
        '</div>' +
        (v.obs ? '<div class="vobs">' + v.obs + '</div>' : '') +
        (v.celComprador
          ? '<div class="vobs" style="margin-top:6px">📱 ' + v.celComprador + ' · ' + (v.nomeComprador || '') + '</div>'
          : '') +
        '</div>'
    )
    .join('');
}

function swTab(t) {
  ['info', 'hist', 'campos'].forEach((id) => {
    document.getElementById('t-' + id).classList.toggle('on', id === t);
    document.getElementById('p-' + id).classList.toggle('on', id === t);
  });
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
    mapInstance = L.map(el, { zoomControl: true }).setView([-23.55, -46.63], 12);
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

function refreshMapMarkers(opts) {
  if (typeof L === 'undefined' || !mapInstance || !mapMarkersLayer) return;
  opts = opts || {};
  mapMarkersLayer.clearLayers();

  const pts = [];
  DB.forEach(function (c) {
    const lat = parseFloat(c.lat);
    const lng = parseFloat(c.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    const isNovo = c.status !== 'reat';
    const m = L.marker([lat, lng], { icon: makeMapIcon(isNovo) });
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
  document.getElementById(id).classList.remove('on');
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
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

function fabNovoFormulario() {
  closeOv('ov-fab');
  const q = document.getElementById('pick-cli-q');
  if (q) q.value = '';
  renderPickCliList('');
  document.getElementById('ov-pick-cli').classList.add('on');
}

function fabNovoLembrete() {
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
  renderLemList('');
  document.getElementById('ov-lem').classList.add('on');
}

function filterPickCli() {
  renderPickCliList(document.getElementById('pick-cli-q').value);
}

function renderPickCliList(raw) {
  const q = (raw || '').toLowerCase().trim();
  const list = !q
    ? [...DB]
    : DB.filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          (c.cnpj && c.cnpj.includes(q)) ||
          c.bairro.toLowerCase().includes(q)
      );
  const el = document.getElementById('pick-cli-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML =
      '<div class="cli-empty" style="padding:24px 0">Nenhum cliente encontrado.</div>';
    return;
  }
  el.innerHTML = list
    .map(
      (c) =>
        '<button type="button" class="pick-cli-row" onclick="pickCliForVis(' +
        JSON.stringify(c.id) +
        ')"><span class="pick-cli-name">' +
        escapeHtml(c.nome) +
        '</span><span class="pick-cli-meta">' +
        escapeHtml(c.bairro) +
        ' · ' +
        escapeHtml(c.cnpj) +
        '</span></button>'
    )
    .join('');
}

function pickCliForVis(id) {
  const c = getCliById(id);
  if (!c) return;
  currCli = c;
  closeOv('ov-pick-cli');
  openVis();
}

function filterLemCli() {
  renderLemList(document.getElementById('lem-q').value);
}

function renderLemList(raw) {
  const q = (raw || '').toLowerCase().trim();
  const list = !q
    ? [...DB]
    : DB.filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          (c.cnpj && c.cnpj.includes(q)) ||
          c.bairro.toLowerCase().includes(q)
      );
  const el = document.getElementById('lem-cli-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML =
      '<div class="cli-empty" style="padding:24px 0">Nenhum cliente encontrado.</div>';
    return;
  }
  el.innerHTML = list
    .map(
      (c) =>
        '<button type="button" class="pick-cli-row' +
        (String(lemPickId) === String(c.id) ? ' on' : '') +
        '" onclick="pickLemCli(' +
        JSON.stringify(c.id) +
        ')"><span class="pick-cli-name">' +
        escapeHtml(c.nome) +
        '</span><span class="pick-cli-meta">' +
        escapeHtml(c.bairro) +
        ' · ' +
        escapeHtml(c.cnpj) +
        '</span></button>'
    )
    .join('');
}

function pickLemCli(id) {
  lemPickId = id;
  renderLemList(document.getElementById('lem-q').value);
}

async function subLembrete() {
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
  }

  toast('✓ Lembrete: ' + c.nome + ' — ' + d + ' às ' + t + (obs ? ' · ' + obs : ''), true);
  closeOv('ov-lem');
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
    newId = estId;
    await loadClientsFromSupabase();
    await mergeEstablishmentIntoDb(sb, estId);
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
  document.querySelectorAll('.chip-opt').forEach((c) => c.classList.remove('on'));
  el.classList.add('on');
  currChip = el.textContent;
}

function togSC(id) {
  document.getElementById(id).classList.toggle('on');
}

function visitResultFromCards() {
  const aus = document.getElementById('sc-ausente').classList.contains('on');
  const promo = document.getElementById('sc-promo').classList.contains('on');
  if (aus && promo) return 'aus';
  if (aus) return 'aus';
  if (promo) return 'conv';
  return null;
}

async function subVis() {
  if (!currCli) return;

  const celRaw = document.getElementById('v-cel')?.value.replace(/\D/g, '') || '';
  const nome = document.getElementById('v-nome')?.value.trim() || '';
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

  const currRes = visitResultFromCards();
  if (!currRes) {
    toast('⚠️ Selecione o status da visita');
    return;
  }

  const obs = document.getElementById('v-obs').value.trim();
  const d = new Date();
  const dataStr = pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();

  const visitPayload = {
    data: dataStr,
    res: currRes,
    rep: 'Rafael Vasconcelos',
    obs,
    celComprador: document.getElementById('v-cel').value.trim(),
    nomeComprador: nome,
    tamEstab: currSeg === 'peq' ? 'Pequeno' : 'Grande',
    tipoEstabChip: currChip || '',
  };

  const sb = await ensureSupabase();
  let user = null;
  if (sb) {
    const { data: u } = await sb.auth.getUser();
    user = u.user;
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
      obs,
      cel_comprador: visitPayload.celComprador,
      nome_comprador: nome,
      tam_estab: visitPayload.tamEstab,
      tipo_estab_chip: visitPayload.tipoEstabChip,
    };
    const { error } = await sb.from('visits').insert(row);
    if (error) {
      toast('Erro ao salvar visita: ' + error.message);
      return;
    }
    await loadClientsFromSupabase();
    currCli = getCliById(currCli.id) || currCli;
  } else {
    currCli.visitas.unshift(visitPayload);
  }

  buildHist(currCli);
  swTab('hist');
  document.getElementById('vissuc').classList.add('on');
  document.getElementById('vformbody').style.display = 'none';
  document.getElementById('visfoo').style.display = 'none';
  toast('✓ Visita registrada!', true);
  setTimeout(() => closeOv('ov-vis'), 2500);
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
  renderGlobalHist();
  goScr('hist');
}

function renderGlobalHist() {
  const el = document.getElementById('hist-global');
  if (!el) return;
  const rows = [];
  DB.forEach((c) => {
    (c.visitas || []).forEach((v) => {
      rows.push({ cliente: c.nome, v });
    });
  });
  rows.sort((a, b) => {
    const pa = a.v.data.split('/').map(Number);
    const pb = b.v.data.split('/').map(Number);
    const da = new Date(pa[2], pa[1] - 1, pa[0]);
    const db = new Date(pb[2], pb[1] - 1, pb[0]);
    return db - da;
  });
  if (!rows.length) {
    el.innerHTML =
      '<div class="empty"><div class="emico">📋</div>Nenhuma visita registrada ainda.</div>';
    return;
  }
  const lbl = { conv: 'Convertido', nao: 'Não convertido', reag: 'Reagendado', aus: 'Ausente' };
  const cls = { conv: 'vconv', nao: 'vnao', reag: 'vreag', aus: 'vreag' };
  el.innerHTML = rows
    .map(
      (r) =>
        '<div class="vc"><div class="vtop"><div class="vdate">' +
        r.v.data +
        '</div><div class="vres ' +
        (cls[r.v.res] || 'vreag') +
        '">' +
        (lbl[r.v.res] || r.v.res) +
        '</div></div><div class="vrep">🏪 ' +
        r.cliente +
        '</div>' +
        (r.v.obs ? '<div class="vobs">' + r.v.obs + '</div>' : '') +
        '</div>'
    )
    .join('');
}

function toggleMore() {
  document.getElementById('ov-more').classList.add('on');
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
  bootstrapAuth();
});
