/**
 * Schlanker Static-File-Server ohne Fremdabhängigkeiten.
 * Liefert die HTML-Seiten und Assets der Spina-Vita-Website aus.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

// Dateien, die nie ausgeliefert werden sollen
const BLOCKED = new Set(['package.json', 'package-lock.json', 'server.js']);

function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

/** Übergangsseite, solange keine index.html im Repository liegt. */
function placeholder() {
  const pages = fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith('.html'))
    .sort();
  const links = pages
    .map((f) => `<li><a href="/${f}">${f.replace('.html', '')}</a></li>`)
    .join('');
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Spina Vita – Seite im Aufbau</title>
<style>body{font-family:system-ui,sans-serif;margin:0;min-height:100vh;display:grid;
place-items:center;background:#2c3f43;color:#fff;padding:2rem}
main{max-width:34rem;text-align:center}h1{font-weight:600;letter-spacing:.01em}
ul{list-style:none;padding:0;margin-top:2rem}li{margin:.5rem 0}
a{color:#fff;text-decoration:underline;text-underline-offset:4px}
p{opacity:.75;line-height:1.6}</style></head>
<body><main><h1>Spina&nbsp;Vita</h1>
<p>Diese Website befindet sich im Aufbau. Sobald eine <code>index.html</code>
im Repository liegt, wird sie hier automatisch angezeigt.</p>
<ul>${links}</ul></main></body></html>`;
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    return send(res, 400, 'Ungültige Anfrage', 'text/plain; charset=utf-8');
  }

  if (pathname.endsWith('/')) pathname += 'index.html';

  const filePath = path.join(ROOT, path.normalize(pathname));

  // Schutz vor Ausbrüchen aus dem Wurzelverzeichnis
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    return send(res, 403, 'Zugriff verweigert', 'text/plain; charset=utf-8');
  }
  if (BLOCKED.has(path.basename(filePath))) {
    return send(res, 404, 'Nicht gefunden', 'text/plain; charset=utf-8');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Startseite: Übergangsseite zeigen, solange index.html fehlt
      if (pathname === '/index.html') {
        return send(res, 200, placeholder(), 'text/html; charset=utf-8');
      }
      return send(
        res,
        404,
        '<!DOCTYPE html><meta charset="utf-8"><title>Nicht gefunden</title>' +
          '<p>Diese Seite existiert nicht. <a href="/">Zur Startseite</a>',
        'text/html; charset=utf-8'
      );
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    send(res, 200, data, type);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Spina Vita: Server läuft auf Port ${PORT}`);
});
