#!/usr/bin/env bash
# Dev contra Supabase LOCAL (para probar features sin tocar producción).
# Next 16/Turbopack da prioridad a .env.local sobre variables de entorno,
# así que el swap del archivo es la única forma confiable.
# Siempre restaura el .env.local original al salir (Ctrl+C incluido).
set -euo pipefail
cd "$(dirname "$0")/.."

LOCAL_URL="http://127.0.0.1:54321"
LOCAL_ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CR7P_DMHUpj8QgX9C8n8d3EANcV9DceXK4c0Hd7Xcmw"

if [ -f .env.local.prod-backup ]; then
  echo "⚠️  Hay un backup previo (.env.local.prod-backup): otra corrida no restauró bien. Restaura primero."
  exit 1
fi

mv .env.local .env.local.prod-backup
trap 'mv .env.local.prod-backup .env.local; echo "↩️  .env.local de producción restaurado."' EXIT

printf 'NEXT_PUBLIC_SUPABASE_URL="%s"\nNEXT_PUBLIC_SUPABASE_ANON_KEY="%s"\n' "$LOCAL_URL" "$LOCAL_ANON" > .env.local
echo "🔧 .env.local apuntando a Supabase local ($LOCAL_URL). Ctrl+C para cortar y restaurar."

fuser -k 3000/tcp 2>/dev/null || true
sleep 1
npm run dev
