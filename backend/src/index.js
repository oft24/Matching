import dotenv from 'dotenv';
import app from './app.js';
import { connectDatabase } from './config/database.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Matching API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
