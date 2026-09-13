import { Server as SocketIOServer } from 'socket.io';
let io = null;
export function initSocketServer(httpServer) {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
        }
    });
    io.on('connection', (socket) => {
        console.log(`[Socket.io] Nuevo cliente conectado: ${socket.id}`);
        // Unirse al canal de su local
        socket.on('join:branch', (branchId) => {
            socket.join(`branch_${branchId}`);
            console.log(`[Socket.io] Socket ${socket.id} se unió a branch_${branchId}`);
        });
        // Unirse al canal global de administradores
        socket.on('join:admin', () => {
            socket.join('admin_room');
            console.log(`[Socket.io] Socket ${socket.id} se unió a admin_room`);
        });
        socket.on('disconnect', () => {
            console.log(`[Socket.io] Cliente desconectado: ${socket.id}`);
        });
    });
    return io;
}
export function getSocketServer() {
    return io;
}
