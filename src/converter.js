const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const IN_DIR = process.env.IN_DIR || '/in';
const OUT_DIR = process.env.OUT_DIR || '/out';

// basename (no extension) -> 'pending' | 'converting' | 'done' | 'failed'
const state = new Map();

const queue = [];
let activeConversions = 0;
const MAX_CONCURRENT = 1;

function getState() {
  return state;
}

function ensureDirs() {
  [IN_DIR, OUT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function copyEpub(srcPath, basename) {
  const destPath = path.join(OUT_DIR, basename + '.epub');
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${basename}.epub`);
  }
}

function runNext() {
  if (activeConversions >= MAX_CONCURRENT || queue.length === 0) return;

  const { srcPath, basename } = queue.shift();
  const outPath = path.join(OUT_DIR, basename + '.azw3');

  state.set(basename, 'converting');
  activeConversions++;

  console.log(`Converting: ${basename}`);

  execFile('ebook-convert', [srcPath, outPath], (err) => {
    activeConversions--;
    if (err) {
      console.error(`Failed: ${basename} — ${err.message}`);
      state.set(basename, 'failed');
    } else {
      console.log(`Done: ${basename}.azw3`);
      state.set(basename, 'done');
    }
    runNext();
  });
}

function enqueue(srcPath, basename) {
  // Skip if already queued, converting, or done
  const current = state.get(basename);
  if (current === 'converting' || current === 'pending') return;

  const outPath = path.join(OUT_DIR, basename + '.azw3');
  if (fs.existsSync(outPath)) {
    state.set(basename, 'done');
    return;
  }

  state.set(basename, 'pending');
  queue.push({ srcPath, basename });
  runNext();
}

function processFile(filePath) {
  if (path.extname(filePath).toLowerCase() !== '.epub') return;

  const basename = path.basename(filePath, '.epub');
  copyEpub(filePath, basename);
  enqueue(filePath, basename);
}

function start() {
  ensureDirs();

  // Scan IN on startup
  const files = fs.readdirSync(IN_DIR);
  for (const file of files) {
    processFile(path.join(IN_DIR, file));
  }

  // Watch for new files dropped into IN
  chokidar
    .watch(IN_DIR, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 500 },
    })
    .on('add', processFile)
    .on('error', err => console.error('Watcher error:', err));

  console.log(`Watching ${IN_DIR} for new epub files`);
}

module.exports = { start, getState };
