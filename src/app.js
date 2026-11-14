const express = require('express');
const { createTaskStore, HttpError } = require('./services/taskStore');
const { createTasksRouter } = require('./routes/tasks');

function createApp(store = createTaskStore()) {
  const app = express();

  app.use(express.json({ limit: '10kb' }));
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  app.use('/tasks', createTasksRouter(store));
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'Request body must contain valid JSON' });
    }

    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body is too large' });
    }

    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }

    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
