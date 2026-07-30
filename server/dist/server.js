import { createServer } from 'http';
import { prisma } from './db.js';
import { startHotspotScheduler } from './jobs/scheduler.js';
import { createSocketServer } from './realtime/socket.js';
import { createApp } from './app.js';
import { env } from './config/env.js';
export async function startServer() {
    const httpServer = createServer();
    const io = createSocketServer(httpServer);
    const app = createApp(io);
    const scheduler = startHotspotScheduler(io);
    const shutdown = async (signal) => {
        console.log(`Received ${signal}, shutting down...`);
        scheduler.stop();
        io.close();
        await new Promise((resolve) => httpServer.close(() => resolve()));
        await prisma.$disconnect();
    };
    process.once('SIGINT', () => void shutdown('SIGINT'));
    process.once('SIGTERM', () => void shutdown('SIGTERM'));
    await new Promise((resolve) => {
        httpServer.listen(env.port, () => {
            const address = httpServer.address();
            console.log(`Hot monitor server running on http://localhost:${address.port}`);
            console.log('WebSocket ready');
            console.log('Hotspot check scheduled every 30 minutes');
            resolve();
        });
    });
    return { app, httpServer, io, scheduler };
}
//# sourceMappingURL=server.js.map