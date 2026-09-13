# 🐟 Cevichería Restaurant La Barra - Sabrosísimo
> Sistema Multilocal de Atención, Comandas en Vivo, Cocina KDS y Facturación/Caja.

Este proyecto está construido para instalarse y ejecutarse **directamente en cualquier servidor Linux/Windows (VPS o Cloud)** usando **Node.js, PM2 y Nginx**, sin necesidad de contenedores ni Docker.

---

## 📋 1. Requerimientos del Servidor

### Requisitos Mínimos de Hardware
- **CPU**: 1 vCPU (mínimo) / 2 vCPUs (recomendado para varias sedes simultáneas).
- **Memoria RAM**: 1 GB RAM (con 1 GB Swap configurado) o 2 GB RAM recomendado.
- **Disco**: 5 GB a 10 GB de espacio libre (SSD).
- **Sistema Operativo**: Ubuntu 22.04 / 24.04 LTS, Debian 11 / 12 o similar.

### Requisitos de Software
- **Node.js**: `v20.x LTS` o superior (`v22.x LTS` recomendada).
- **npm**: `v10.x` o superior.
- **Git**: Para clonar y actualizar el repositorio.
- **PM2**: Administrador de procesos en segundo plano para mantener la app activa 24/7.
- **Nginx**: Servidor web / Proxy inverso (gestiona dominio, SSL y WebSockets).

---

## 🚀 2. Instalación Paso a Paso en el Servidor (Ubuntu / Debian)

### Paso 1: Preparar el Servidor e Instalar Node.js 20 LTS
Conéctate a tu servidor por SSH y ejecuta:

```bash
# 1. Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 20 LTS, Git y Nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# 3. Instalar PM2 globalmente
sudo npm install -g pm2
```

Verifica las versiones instaladas:
```bash
node -v   # Debe mostrar v20.x o superior
npm -v    # Debe mostrar v10.x o superior
pm2 -v    # Debe mostrar la versión de PM2
```

---

### Paso 2: Clonar el Proyecto y Desplegar
```bash
# 1. Clonar el repositorio
git clone https://github.com/VasquezRivero92/Cevicheria.git
cd Cevicheria

# 2. Despliegue automático (instala dependencias, compila y arranca con PM2):
bash deploy.sh
```

*(Alternativamente, si prefieres ejecutar los comandos manualmente uno por uno):*
```bash
# Instalar dependencias del cliente y del servidor
npm run install:all

# Compilar TypeScript del backend y la app de React
npm run build

# Iniciar la aplicación en segundo plano con PM2
pm2 start ecosystem.config.cjs

# Guardar la configuración para que inicie automáticamente tras reiniciar el servidor
pm2 save
pm2 startup
```

---

### Paso 3: Configurar Nginx y Dominio (Proxy Inverso con WebSockets)

Para que tu restaurante acceda con tu dominio (o IP pública) en el puerto `80` o `443` con HTTPS y WebSockets en tiempo real:

1. **Copiar la configuración de Nginx:**
   ```bash
   sudo cp nginx.conf.example /etc/nginx/sites-available/cevichapp
   sudo nano /etc/nginx/sites-available/cevichapp
   ```
   *(Reemplaza `tu-dominio.com` por el dominio o subdominio de tu restaurante).*

2. **Habilitar el sitio y reiniciar Nginx:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/cevichapp /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

3. **(Recomendado) Habilitar Certificado SSL Gratuito (HTTPS):**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d tu-dominio.com
   ```

---

## 🔄 3. ¿Cómo Actualizar el Servidor en el Futuro?

Cada vez que hagas cambios y los subas a GitHub, en tu servidor simplemente corres:

```bash
cd Cevicheria
git pull origin main
bash deploy.sh
```
El script compilará la nueva versión y reiniciará el servicio con cero interrupciones.

---

## 🛠️ Comandos Útiles de Mantenimiento con PM2

| Comando | Acción |
|---|---|
| `pm2 status` | Ver el estado del sistema, consumo de CPU y memoria |
| `pm2 logs cevichapp` | Ver los logs en vivo (conexiones, comandas, cobros) |
| `pm2 restart cevichapp` | Reiniciar el servidor manualmente |
| `pm2 stop cevichapp` | Detener el servidor |

---

## 🔑 Cuentas y PINes de Acceso Preconfigurados

| Rol | Usuario | PIN | Capacidad |
|---|---|---|---|
| **👑 Administrador General** | Admin General | `1234` | Control global de todas las sedes, carta, usuarios y reportes |
| **🏢 Admin Sede Principal** | Admin Principal | `1001` | Gestión de carta y ventas de Sede Principal |
| **🏢 Admin Sede Sur** | Admin Sur | `2002` | Gestión de carta y ventas de Sede Sur |
| **📱 Mesero Sede Principal** | Renzo | `1111` | Comandero móvil táctil, pedidos, cobro y pre-cuenta |
| **📱 Mesera Sede Sur** | Lucía | `2222` | Comandero táctil Sede Sur |
| **👨‍🍳 Cocina / Barra** | Jefe Cocina | `3333` | KDS en vivo con timbres sonoros y alertas |
| **💵 Caja & Cobros** | Cajero Central | `5555` | Liquidación de cuentas, cobro y liberación de mesas |
