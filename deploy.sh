#!/bin/bash
# ===================================================
# Script de Despliegue / Actualización para el Servidor
# Ejecutar en el servidor con: bash deploy.sh
# ===================================================

set -e

echo "🐟 Iniciando instalación/actualización de Cevichería La Barra..."

# 1. Instalar dependencias de servidor y cliente
echo "📦 Instalando dependencias de Node.js..."
npm run install:all

# 2. Compilar backend TypeScript y frontend Vite
echo "⚙️ Compilando código para producción..."
npm run build

# 3. Iniciar o reiniciar con PM2
echo "🚀 Levantando servicio en segundo plano con PM2..."
if command -v pm2 &> /dev/null; then
    pm2 restart ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
    pm2 save
    echo "✅ Servicio iniciado exitosamente con PM2 en el puerto 4000."
else
    echo "⚠️ PM2 no está instalado globalmente. Ejecuta: sudo npm install -g pm2"
    echo "ℹ️ Para iniciar manualmente ahora: npm start"
fi
