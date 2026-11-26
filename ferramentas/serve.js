// Servidor local do editor: arquivos estáticos + gravação de .bpmn em processos/ ("Salvar no projeto").
// Uso: node ferramentas/serve.js [porta]   (padrão 8080)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const port = Number(process.argv[2] || 8080);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.json': 'application/json', '.bpmn': 'application/xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'PUT' && url.pathname === '/save') {
    // aceita só caminhos dentro de processos/ (subpastas permitidas), terminando em .bpmn
    const name = (url.searchParams.get('file') || '').replace(/^\/+/, '');
    if (!/^processos(\/[\w-]+)+\.bpmn$/.test(name)) { res.writeHead(400).end('caminho inválido (use processos/.../*.bpmn)'); return; }
    let body = '';
    req.on('data', c => { body += c; if (body.length > 20e6) req.destroy(); });
    req.on('end', () => {
      if (!body.includes('bpmn:definitions')) { res.writeHead(400).end('não é BPMN'); return; }
      fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
      fs.writeFileSync(path.join(root, name), body);
      res.writeHead(200).end(`salvo em ${name}`);
    });
    return;
  }
  const file = path.join(root, decodeURIComponent(url.pathname));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`editor: http://localhost:${port}/ferramentas/editor.html`));
