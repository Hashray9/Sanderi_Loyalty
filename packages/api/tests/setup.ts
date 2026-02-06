import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.VOID_WINDOW_DAYS = '7';
process.env.POINT_EXPIRY_MONTHS = '12';
process.env.MAX_OFFLINE_QUEUE = '50';
process.env.MOBILE_LOOKUPS_PER_MONTH = '2';
