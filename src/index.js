const express = require('express');
const fs = require('fs');
const path = require('path');
const { start: startConverter, getState } = require('./converter');
const { renderPage } = require('./template');

const app = express();
const OUT_DIR = process.env.OUT_DIR || '/out';
const PORT = process.env.PORT || 3000;
const PAGE_SIZE = parseInt(process.env.PAGE_SIZE || '20', 10);
const PASSWORD = process.env.PASSWORD || '';

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Basic ')) {
    const [, pass] = Buffer.from(header.slice(6), 'base64').toString().split(':');
    if (pass === PASSWORD) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Books"');
  res.status(401).send('Authentication required');
}

if (PASSWORD) {
  app.use(requireAuth);
}

// Serve converted files for download
app.use('/files', express.static(OUT_DIR));

app.get('/', (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  const sort = req.query.sort === 'alpha' ? 'alpha' : 'date';
  const page = Math.max(1, parseInt(req.query.page || '1', 10));

  const state = getState();

  let books = fs.readdirSync(OUT_DIR)
    .filter(f => f.toLowerCase().endsWith('.epub'))
    .map(f => {
      const name = path.basename(f, '.epub');
      const { mtimeMs } = fs.statSync(path.join(OUT_DIR, f));
      return { name, mtimeMs };
    })
    .filter(({ name }) => !query || name.toLowerCase().includes(query));

  if (sort === 'alpha') {
    books.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  } else {
    books.sort((a, b) => b.mtimeMs - a.mtimeMs);
  }

  const totalBooks = books.length;
  const totalPages = Math.max(1, Math.ceil(totalBooks / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const pageBooks = books.slice(offset, offset + PAGE_SIZE).map(({ name }) => ({
    name,
    hasEpub: fs.existsSync(path.join(OUT_DIR, name + '.epub')),
    hasAzw3: fs.existsSync(path.join(OUT_DIR, name + '.azw3')),
    status: state.get(name) || 'done',
  }));

  res.send(renderPage(pageBooks, { query, sort, currentPage, totalPages, totalBooks }));
});

startConverter();

app.listen(PORT, () => {
  console.log(`ebook-serve running on http://localhost:${PORT}`);
});
