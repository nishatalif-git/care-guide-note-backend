import { createApp } from './app';
import { env } from './config/env';
import { connectDb, syncAllIndexes, disconnectDb } from './config/db';


async function main() {
  await connectDb();
  await syncAllIndexes();

  const server = createApp().listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      console.log(`\n[api] ${signal} received, shutting down`);
      server.close(() => {
        void disconnectDb().then(() => process.exit(0));
      });
    });
  }
}

main().catch((error) => {
  console.error('[api] failed to start:', error);
  process.exit(1);
});
