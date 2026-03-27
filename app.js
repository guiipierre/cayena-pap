/**
 * Compatibilidade: versões antigas do index apontavam para app.js.
 * O bundle principal foi movido para pap-app.js para evitar cache do JS antigo.
 */
(function () {
  var v = '35';
  if (document.querySelector('script[data-cayena-app="1"]')) return;
  var s = document.createElement('script');
  s.src = 'pap-app.js?v=' + v;
  s.defer = true;
  s.setAttribute('data-cayena-app', '1');
  (document.body || document.documentElement).appendChild(s);
})();
