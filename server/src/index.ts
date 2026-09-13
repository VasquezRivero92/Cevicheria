import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSocketServer } from './sockets/socketServer.js';
import { seedInitialData } from './seeds.js';
import authRoutes from './routes/authRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Inicializar WebSockets
initSocketServer(server);

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Servir cliente estático compilado en producción si existe
const possibleDistPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist')
];
const clientDistPath = possibleDistPaths.find((p) => fs.existsSync(p));
if (clientDistPath) {
  app.use(express.static(clientDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const PORT = Number(process.env.SERVER_PORT || process.env.PORT || 4000);
const HOST = process.env.SERVER_IP || '0.0.0.0';

async function start() {
  try {
    // Sembrado de datos cevicheros
    await seedInitialData();

    server.listen(PORT, HOST, () => {
      console.log(`=================================================`);
      console.log(`🐟 CevichApp Server iniciado en ${HOST}:${PORT}`);
      console.log(`🌐 Base de datos: ${process.env.DATABASE_PROVIDER || 'local'} (Repository Pattern)`);
      console.log(`⚡ WebSocket listo para comandas en tiempo real`);
      console.log(`=================================================`);
    });
  } catch (err) {
    console.error('Error al iniciar el servidor:', err);
    process.exit(1);
  }
}

start();
