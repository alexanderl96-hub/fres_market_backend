import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json({ limit: '20kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

export default app;
