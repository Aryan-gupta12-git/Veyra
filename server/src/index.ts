import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import highlightRoutes from './routes/highlightRoutes.js';
import knowledgeRoutes from './routes/knowledgeRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigin = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? (process.env.FRONTEND_URL || true) : allowedOrigin,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/highlights', highlightRoutes);
app.use('/api', knowledgeRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Veyra Editorial API',
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Veyra Server] Running on http://localhost:${PORT}`);
  });
}

export default app;
