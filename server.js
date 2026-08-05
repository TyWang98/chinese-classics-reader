const path = require('node:path');
const express = require('express');
const { createApiRouter } = require('./src/routes/api');
function createApp({ dataRoot = path.join(__dirname, 'data') } = {}) {
  const app = express();
  app.use(express.json({ limit: '200kb' }));
  app.use('/api', createApiRouter({ dataRoot }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) return response.status(400).json({ success: false, error: 'Invalid JSON request body' });
    console.error(error); return response.status(500).json({ success: false, error: 'Internal server error' });
  });
  return app;
}
if (require.main === module) createApp().listen(3000, () => console.log('Classical Text Reader is running at http://localhost:3000'));
module.exports = { createApp };
