const express = require('express');
const cors = require('cors');

const itemsRoutes = require('./routes/items.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/items', itemsRoutes);

module.exports = app;
