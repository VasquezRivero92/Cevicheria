# 🐟 Cevichería Restaurant La Barra - Sabrosísimo
> Sistema Multilocal de Atención, Comandas en Vivo, Cocina KDS y Facturación/Caja.

Este proyecto cuenta con una arquitectura desacoplada basada en el **Repository Pattern**, permitiendo operar tanto con persistencia en memoria local como con bases de datos en la nube (Firestore / PostgreSQL). Además, integra **WebSockets en tiempo real** para sincronizar mesas, cocina, mozos y caja al instante.

---

## 📋 Requerimientos del Sistema para Servidor de Producción

### Requisitos Mínimos de Hardware
- **CPU**: 1 vCPU (mínimo) / 2 vCPUs (recomendado).
- **Memoria RAM**: 1 GB RAM (mínimo) / 2 GB RAM (recomendado para soportar build y WebSockets de varias sedes).
- **Disco**: 10 GB de espacio libre en disco (SSD recomendado).
- **Sistema Operativo**: Linux Ubuntu 22.04 LTS / Debian 12 / AlmaLinux / CentOS (o cualquier distribución compatible con Docker o Node.js).
- **Puertos de Red abiertos**:
  - `80` (HTTP)
  - `443` (HTTPS - SSL)
  - `4000` (Puerto interno del backend de la aplicación, si no usas proxy inverso).

### Requisitos de Software

#### Opción A: Instalación con Docker (Recomendada)
- **Docker**: versión 24.0 o superior.
- **Docker Compose**: versión 2.20 o superior.

#### Opción B: Instalación Tradicional (Node.js + PM2)
- **Node.js**: versión `v20.x LTS` o superior (`v22.x` recomendada).
- **npm**: versión `10.x` o superior.
- **PM2**: Administrador de procesos en segundo plano (`npm install -g pm2`).
- **Nginx**: Servidor web y Proxy inverso para SSL y WebSockets.
- **Certbot**: Para certificados SSL gratuitos Let's Encrypt (`certbot --nginx`).

---

## 🚀 Guía de Instalación en Servidor

### 🐳 Método 1: Despliegue Rápido con Docker Compose (Recomendado)

1. **Clonar el repositorio en el servidor:**
   ```bash
   git clone https://github.com/VasquezRivero92/Cevicheria.git
   cd Cevicheria
   ```

2. **Levantar el contenedor con Docker Compose:**
   ```bash
   docker compose up -d --build
   ```

3. **Verificar que el servicio esté activo:**
   ```bash
   docker compose ps
   docker compose logs -f
   ```
   *La aplicación estará lista y accesible en `http://IP_DE_TU_SERVIDOR:4000`.*

---

### ⚙️ Método 2: Instalación Manual con Node.js, PM2 y Nginx

#### 1. Instalar dependencias en el servidor Linux (Ubuntu/Debian)
```bash
# Actualizar repositorios
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git

# Instalar PM2 globalmente
sudo npm install -g pm2
```

#### 2. Clonar el repositorio y compilar
```bash
git clone https://github.com/VasquezRivero92/Cevicheria.git
cd Cevicheria

# Instalar todas las dependencias (cliente y servidor)
npm run install:all

# Compilar backend y frontend
npm run build
```

#### 3. Iniciar el servicio con PM2 (Inicio persistente ante reinicios)
```bash
pm2 start server/dist/index.js --name "cevichapp"
pm2 save
pm2 startup
```

#### 4. Configurar Nginx como Proxy Inverso (con soporte de WebSockets)
1. Copia la plantilla de configuración de Nginx:
   ```bash
   sudo cp nginx.conf.example /etc/nginx/sites-available/cevichapp
   sudo nano /etc/nginx/sites-available/cevichapp
   ```
   *(Reemplaza `tu-dominio.com` por tu dominio real o la IP de tu VPS).*

2. Habilita el sitio y reinicia Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/cevichapp /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

3. *(Opcional)* Instalar certificado SSL gratis con Certbot:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d tu-dominio.com
   ```

---

## 🔑 Cuentas y Roles Preconfigurados (PINes)

| Rol | Usuario | PIN | Acceso / Capacidad |
|---|---|---|---|
| **👑 Administrador General** | Admin General | `1234` | Control de todas las sedes, carta, usuarios y reportes |
| **🏢 Admin Sede Principal** | Admin Principal | `1001` | Gestión de carta y ventas de Sede Principal |
| **🏢 Admin Sede Sur** | Admin Sur | `2002` | Gestión de carta y ventas de Sede Sur |
| **📱 Mesero Sede Principal** | Renzo | `1111` | Comandero móvil táctil, pedidos, cobro y pre-cuenta |
| **📱 Mesera Sede Sur** | Lucía | `2222` | Comandero táctil Sede Sur |
| **👨‍🍳 Cocina / Barra** | Jefe Cocina | `3333` | KDS en vivo con timbres sonoros y alertas |
| **💵 Caja & Cobros** | Cajero Central | `5555` | Liquidación de cuentas, cobro y liberación de mesas |

---

## 🛠️ Comandos de Desarrollo Local

```bash
# Instalar todo
npm run install:all

# Iniciar servidor backend en desarrollo (puerto 4000)
npm run dev:server

# Iniciar cliente frontend en desarrollo (puerto 5173 con proxy configurado)
npm run dev:client
```
