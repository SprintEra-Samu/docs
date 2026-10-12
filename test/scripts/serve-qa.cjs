// Test ortamını backend modüllerinden önce yükler; backend kaynaklarını değiştirmez.
require('../setup/env');
const app = require('../../server');
const { sequelize } = require('../../models');

async function main() {
  await sequelize.sync();
  const server = app.listen(Number(process.env.PORT || 3001), '127.0.0.1', () => {
    console.log(`QA API hazır: http://127.0.0.1:${process.env.PORT || 3001}`);
  });
  server.on('error', async error => {
    console.error(error.message);
    await sequelize.close();
    process.exitCode = 1;
  });
  const shutdown = () => server.close(async () => { await sequelize.close(); });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
