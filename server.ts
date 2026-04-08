import app from './backend/app.js';

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`\n==========================================`);
  console.log(`🚀 EthioBankers Server listening on port ${port}`);
  console.log(`📱 API Health: http://localhost:${port}/api/health`);
  console.log(`==========================================\n`);
});
