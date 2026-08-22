import dotenv from 'dotenv';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { cleanupExpiredDiscordChannels } from './services/discordService.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`q2play API running on http://localhost:${PORT}`);
  });
  void cleanupExpiredDiscordChannels({ force: true }).catch((error) => {
    console.error('Discord startup cleanup error:', error.message);
  });
  const cleanupTimer = setInterval(() => {
    void cleanupExpiredDiscordChannels({ force: true }).catch((error) => {
      console.error('Discord interval cleanup error:', error.message);
    });
  }, 10 * 60 * 1000);
  cleanupTimer.unref();
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
