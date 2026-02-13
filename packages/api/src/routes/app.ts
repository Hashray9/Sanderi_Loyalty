import { Router } from 'express';

export const appRouter = Router();

// Minimum app version required
const MIN_APP_VERSION = {
  ios: '1.0.0',
  android: '1.0.0',
};

appRouter.get('/version', (_req, res) => {
  res.json({
    minVersion: MIN_APP_VERSION,
    latestVersion: {
      ios: '1.0.0',
      android: '1.0.0',
    },
    updateRequired: false,
  });
});

appRouter.get('/config', (_req, res) => {
  res.json({
    maxOfflineQueue: parseInt(process.env.MAX_OFFLINE_QUEUE || '50', 10),
    maxOfflineDays: 2,
    voidWindowDays: parseInt(process.env.VOID_WINDOW_DAYS || '7', 10),
    pointExpiryMonths: parseInt(process.env.POINT_EXPIRY_MONTHS || '12', 10),
  });
});
