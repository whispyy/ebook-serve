const express = require('express');
const fs = require('fs');
const path = require('path');
const { start: startConverter, getState } = require('./converter');
const { renderPage } = require('./template');

const app = express();
const OUT_DIR = process.env.OUT_DIR || '/out';
const PORT = process.env.PORT || 3000;

// Serve converted files for download
app.use('/files', express.static(OUT_DIR));

app.get('/', (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();

  const state = getState();

  const books = fs.readdirSync(OUT_DIR)
    .filter(f => f.toLowerCase().endsWith('.epub'))
    .map(f => path.basename(f, '.epub'))
    .filter(name => !query || name.toLowerCase().includes(query))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map(name => ({
      name,
      hasEpub: fs.existsSync(path.join(OUT_DIR, name + '.epub')),
      hasAzw3: fs.existsSync(path.join(OUT_DIR, name + '.azw3')),
      status: state.get(name) || 'done',
    }));

  res.send(renderPage(books, query));
});

startConverter();

app.listen(PORT, () => {
  console.log(`ebook-serve running on http://localhost:${PORT}`);
});
