function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPage(books, query) {
  const hasConverting = books.some(b => b.status === 'converting' || b.status === 'pending');
  const total = books.length;

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
    form { margin-bottom: 1em; }
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
    .btn-clear {
      background: #666;
      margin-left: 0.4em;
    }
    .count {
      font-size: 0.9em;
      color: #555;
      margin-bottom: 0.8em;
    }
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
  </style>
</head>
<body>
  <h1>Books</h1>

  <form method="GET" action="/">
    <input type="text" name="q" value="${escapeHtml(query)}" placeholder="Search by title...">
    <button type="submit">Search</button>
    ${query ? '<a href="/" class="btn btn-clear">Clear</a>' : ''}
  </form>

  <p class="count">
    ${total} book${total !== 1 ? 's' : ''}${query ? ` matching &ldquo;${escapeHtml(query)}&rdquo;` : ''}
    ${hasConverting ? '&mdash; conversions in progress, refreshing&hellip;' : ''}
  </p>

  ${total === 0
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
  </table>`}
</body>
</html>`;
}

module.exports = { renderPage };
