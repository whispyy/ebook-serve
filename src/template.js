function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildUrl({ query, sort, page }) {
  const p = new URLSearchParams();
  if (query) p.set('q', query);
  if (sort && sort !== 'date') p.set('sort', sort);
  if (page && page > 1) p.set('page', String(page));
  const qs = p.toString();
  return qs ? '/?' + qs : '/';
}

function renderPage(books, { query, sort, currentPage, totalPages, totalBooks }) {
  const hasConverting = books.some(b => b.status === 'converting' || b.status === 'pending');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${hasConverting ? '<meta http-equiv="refresh" content="8">' : ''}
  <title>Books</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, serif;
      font-size: 16px;
      max-width: 860px;
      margin: 0 auto;
      padding: 1.2em 1em;
      background: #fff;
      color: #111;
    }
    h1 { font-size: 1.5em; margin-bottom: 0.8em; }
    form { margin-bottom: 0.8em; }
    input[type="text"] {
      font-size: 1em;
      padding: 0.45em 0.6em;
      border: 1px solid #999;
      width: 65%;
    }
    button, .btn {
      font-size: 1em;
      padding: 0.45em 0.9em;
      background: #111;
      color: #fff;
      border: none;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }
    .btn-clear { background: #666; margin-left: 0.4em; }
    .toolbar {
      display: table;
      width: 100%;
      margin-bottom: 0.8em;
      font-size: 0.9em;
    }
    .toolbar-left, .toolbar-right {
      display: table-cell;
      vertical-align: middle;
    }
    .toolbar-right { text-align: right; }
    .count { color: #555; }
    .sort-toggle { color: #555; }
    .sort-toggle a { color: #111; }
    .sort-toggle .active { font-weight: bold; color: #111; }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      text-align: left;
      padding: 0.5em 0.4em;
      border-bottom: 2px solid #111;
      font-size: 0.95em;
    }
    td {
      padding: 0.6em 0.4em;
      border-bottom: 1px solid #ddd;
      vertical-align: middle;
    }
    td:last-child { white-space: nowrap; }
    .dl {
      display: inline-block;
      padding: 0.35em 0.7em;
      background: #111;
      color: #fff;
      text-decoration: none;
      font-size: 0.85em;
      margin-right: 0.3em;
    }
    .dl-azw3 { background: #333; }
    .status-converting { color: #888; font-style: italic; font-size: 0.9em; }
    .status-failed { color: #c00; font-size: 0.9em; }
    .empty { padding: 1em 0; color: #555; }
    .pagination {
      margin-top: 1.2em;
      display: table;
      width: 100%;
      font-size: 0.95em;
    }
    .pagination-prev, .pagination-info, .pagination-next {
      display: table-cell;
      vertical-align: middle;
      padding: 0.2em;
    }
    .pagination-info { text-align: center; color: #555; }
    .pagination-next { text-align: right; }
    .page-link {
      display: inline-block;
      padding: 0.45em 0.9em;
      background: #111;
      color: #fff;
      text-decoration: none;
    }
    .page-disabled {
      display: inline-block;
      padding: 0.45em 0.9em;
      background: #ccc;
      color: #888;
    }
  </style>
</head>
<body>
  <h1>Books</h1>

  <form method="GET" action="/">
    <input type="text" name="q" value="${escapeHtml(query)}" placeholder="Search by title...">
    ${sort !== 'date' ? `<input type="hidden" name="sort" value="${escapeHtml(sort)}">` : ''}
    <button type="submit">Search</button>
    ${query ? `<a href="${buildUrl({ sort })}" class="btn btn-clear">Clear</a>` : ''}
  </form>

  <div class="toolbar">
    <div class="toolbar-left">
      <span class="count">
        ${totalBooks} book${totalBooks !== 1 ? 's' : ''}${query ? ` matching &ldquo;${escapeHtml(query)}&rdquo;` : ''}${hasConverting ? ' &mdash; conversions in progress, refreshing&hellip;' : ''}
      </span>
    </div>
    <div class="toolbar-right">
      <span class="sort-toggle">
        ${sort === 'date'
          ? '<span class="active">Recent</span>'
          : `<a href="${buildUrl({ query, sort: 'date' })}">Recent</a>`}
        &nbsp;|&nbsp;
        ${sort === 'alpha'
          ? '<span class="active">A&ndash;Z</span>'
          : `<a href="${buildUrl({ query, sort: 'alpha' })}">A&ndash;Z</a>`}
      </span>
    </div>
  </div>

  ${books.length === 0
    ? '<p class="empty">No books found.</p>'
    : `<table>
    <thead>
      <tr>
        <th>Title</th>
        <th>Download</th>
      </tr>
    </thead>
    <tbody>
      ${books.map(book => `
      <tr>
        <td>${escapeHtml(book.name)}</td>
        <td>
          ${book.hasEpub
            ? `<a class="dl" href="/files/${encodeURIComponent(book.name)}.epub">EPUB</a>`
            : ''}
          ${book.hasAzw3
            ? `<a class="dl dl-azw3" href="/files/${encodeURIComponent(book.name)}.azw3">AZW3</a>`
            : ''}
          ${book.status === 'converting' || book.status === 'pending'
            ? '<span class="status-converting">Converting&hellip;</span>'
            : ''}
          ${book.status === 'failed'
            ? '<span class="status-failed">Conversion failed</span>'
            : ''}
        </td>
      </tr>`).join('')}
    </tbody>
  </table>
  ${totalPages > 1 ? `
  <div class="pagination">
    <div class="pagination-prev">
      ${currentPage > 1
        ? `<a class="page-link" href="${buildUrl({ query, sort, page: currentPage - 1 })}">&larr; Previous</a>`
        : '<span class="page-disabled">&larr; Previous</span>'}
    </div>
    <div class="pagination-info">Page ${currentPage} of ${totalPages}</div>
    <div class="pagination-next">
      ${currentPage < totalPages
        ? `<a class="page-link" href="${buildUrl({ query, sort, page: currentPage + 1 })}">Next &rarr;</a>`
        : '<span class="page-disabled">Next &rarr;</span>'}
    </div>
  </div>` : ''}`}
</body>
</html>`;
}

module.exports = { renderPage };
