#!/bin/bash
# Serve o projeto na rede local. Celular e Mac devem estar no MESMO Wi-Fi.
cd "$(dirname "$0")"
PORT="${1:-8765}"

IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
if [ -z "$IP" ]; then
  IP="(veja em Ajustes do Mac → Rede, ou rode: ipconfig getifaddr en0)"
fi

echo ""
echo "  ═══════════════════════════════════════════════════════"
echo "   No iPhone ou Android (mesmo Wi-Fi que este Mac):"
echo ""
echo "   →  http://${IP}:${PORT}"
echo "  ═══════════════════════════════════════════════════════"
echo ""
echo "   Deixe este terminal aberto. Para parar: Ctrl+C"
echo ""

if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  exec python -m SimpleHTTPServer "$PORT" 2>/dev/null || exec python -m http.server "$PORT"
else
  echo "Python não encontrado. Instale Python ou use no terminal:"
  echo "  npx --yes serve -l $PORT"
  exit 1
fi
