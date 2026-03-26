/**
 * Gera supabase-config.js a partir das variáveis de ambiente.
 * Na Vercel: use SUPABASE_URL e SUPABASE_ANON_KEY (mesmas do painel, sem a secret).
 * Local: crie .env.local na raiz (não commitar) ou exporte as vars antes de npm run build.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envLocal = path.join(root, '.env.local');
if (fs.existsSync(envLocal)) {
  const lines = fs.readFileSync(envLocal, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';

const out =
  '/* Gerado por npm run build — não editar à mão */\n' +
  'window.SUPABASE_URL = ' +
  JSON.stringify(url) +
  ';\n' +
  'window.SUPABASE_ANON_KEY = ' +
  JSON.stringify(key) +
  ';\n';

fs.writeFileSync(path.join(root, 'supabase-config.js'), out);
process.stdout.write(
  '[inject-env] supabase-config.js escrito. URL: ' +
    (url ? 'sim' : 'NÃO (login não aparece)') +
    ' | chave anon: ' +
    (key ? 'sim' : 'NÃO') +
    '\n'
);
