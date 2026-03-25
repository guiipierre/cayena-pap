const now = new Date();
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const pad = (n) => String(n).padStart(2, '0');

document.getElementById('gdate').textContent =
  DIAS[now.getDay()] + ', ' + now.getDate() + ' de ' + MESES[now.getMonth()];

const DB = [
  {
    id: 0,
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

let currCli = null;
let prevScr = 'ana';
let pinIdx = null;
let lemPickId = null;
let cadStep = 1;
let currSeg = 'peq';
let currChip = null;

function getCliById(id) {
  return DB.find((c) => c.id === id);
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

function pinClick(idx, nome, addr, tipo) {
  pinIdx = idx;
  document.getElementById('ppn').textContent = nome;
  document.getElementById('ppa').textContent = addr;
  document.getElementById('ppbw').innerHTML =
    tipo === 'reat'
      ? '<span class="badge b-reat">REATIVADO</span>'
      : '<span class="badge b-novo">NOVO</span>';
  document.getElementById('popup').classList.add('on');
}

function closePopup() {
  document.getElementById('popup').classList.remove('on');
}

function pinAct() {
  closePopup();
  if (pinIdx >= 0) openCli(pinIdx);
  else toast('Cliente sem ficha (mock)');
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
        c.id +
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
        (lemPickId === c.id ? ' on' : '') +
        '" onclick="pickLemCli(' +
        c.id +
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

function subLembrete() {
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
    subCad();
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

function subCad() {
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

  const newId = Math.max(...DB.map((c) => c.id), -1) + 1;
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
  });

  document.getElementById('succnpj').textContent = cnpj;
  document.getElementById('cadfb').style.display = 'none';
  document.getElementById('cadfoo').style.display = 'none';
  document.getElementById('cadsteps').style.display = 'none';
  document.getElementById('cadslbl').style.display = 'none';
  document.getElementById('cadtit').textContent = 'Sucesso! 🎉';
  document.getElementById('cadsuc').classList.add('on');
  const e = document.getElementById('cnt');
  e.textContent = parseInt(e.textContent, 10) + 1;
  const k = document.getElementById('khoje');
  k.textContent = parseInt(k.textContent, 10) + 1;
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

function subVis() {
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

  currCli.visitas.unshift({
    data: dataStr,
    res: currRes,
    rep: 'Rafael Vasconcelos',
    obs,
    celComprador: document.getElementById('v-cel').value.trim(),
    nomeComprador: nome,
    tamEstab: currSeg === 'peq' ? 'Pequeno' : 'Grande',
    tipoEstabChip: currChip || '',
  });

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
        '<div class="ccard" onclick="openCli(' +
        c.id +
        ')">' +
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
    q ? DB.filter((c) => c.nome.toLowerCase().includes(q) || c.cnpj.includes(q) || c.bairro.toLowerCase().includes(q)) : [...DB]
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
