import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { cardsRouter } from './routes/cards.js';
import { pointsRouter } from './routes/points.js';
import { customersRouter } from './routes/customers.js';
import { syncRouter } from './routes/sync.js';
import { appRouter } from './routes/app.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startExpiryJob } from './jobs/pointExpiry.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRouter);
app.use('/cards', cardsRouter);
app.use('/points', pointsRouter);
app.use('/customers', customersRouter);
app.use('/sync', syncRouter);
app.use('/app', appRouter);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);

  // Start scheduled jobs
  if (process.env.NODE_ENV === 'production') {
    startExpiryJob();
  }
});

export default app;
