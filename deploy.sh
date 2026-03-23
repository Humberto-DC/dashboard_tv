#!/bin/bash

# ==============================================================================
# SCRIPT DE DEPLOY AUTOMATIZADO - DASHBOARD TV
# ==============================================================================
# Finalidade: Automatizar o fluxo de atualização do sistema no servidor Debian.
# Localização: /var/www/dashboard_tv
# Fluxo: Pull Git -> Install NPM -> Build Next.js -> Reload PM2.
# ==============================================================================

set -e # Aborta o script em caso de erro em qualquer comando

echo "--- 🚀 Iniciando Processo de Deploy (Dashboard TV) ---"

# 1. Garantir que estamos na raiz do projeto
cd "$(dirname "$0")"

# 2. Atualizar o repositório local
echo "--- 📥 Sincronizando com o repositório remoto (main) ---"
git pull origin main

# 3. Instalação limpa de dependências
echo "--- 📦 Instalando dependências (npm install) ---"
npm install --no-audit --no-fund

# 4. Compilação do Next.js para produção
echo "--- 🏗️ Gerando build de produção (next build) ---"
npm run build

# 5. Garantir existência da pasta de logs do PM2
mkdir -p logs

# 6. Reinicialização do processo no PM2
echo "--- 🔄 Reiniciando o processo no PM2 ---"
pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production

# 7. Persistência da lista do PM2 entre reboots do SO
pm2 save

echo "--- ✅ Deploy finalizado com sucesso! Acesse em localhost:3000 ou via Nginx. ---"
