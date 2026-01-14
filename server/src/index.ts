import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config } from './config/index.js';
import { connectDB } from './config/database.js';
import passport from './config/passport.js';
import { authRoutes, conversationRoutes, messageRoutes, friendRoutes, categoryRoutes, aiRoutes } from './routes/index.js';
import { errorHandler, notFound } from './middleware/index.js';
import { initializeSocket } from './socket/index.js';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = initializeSocket(httpServer);

// Middleware
app.use(cors({
    origin: config.clientUrl,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/ai', aiRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        await connectDB();

        const host = process.env.HOST || '0.0.0.0';
        httpServer.listen(Number(config.port), host, () => {
            console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║     █████╗ ██╗   ██╗██████╗  █████╗            ║
║    ██╔══██╗██║   ██║██╔══██╗██╔══██╗           ║
║    ███████║██║   ██║██████╔╝███████║           ║
║    ██╔══██║██║   ██║██╔══██╗██╔══██║           ║
║    ██║  ██║╚██████╔╝██║  ██║██║  ██║           ║
║    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝           ║
║                                                ║
║    Realtime Message Platform                   ║
║                                                ║
╠════════════════════════════════════════════════╣
║  ✓ Server running on port ${config.port.toString().padEnd(21)}║
║  ✓ Environment: ${config.nodeEnv.padEnd(27)}║
║  ✓ Socket.io ready                             ║
╚════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export { app, httpServer, io };
