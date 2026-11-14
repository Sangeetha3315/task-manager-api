const { createApp } = require('./app');

const port = Number(process.env.PORT || 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const app = createApp();

app.listen(port, '0.0.0.0', () => {
  console.log(`Task API listening on port ${port}`);
});
