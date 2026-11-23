import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const mime={'.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
http.createServer((req,res)=>{let p;try{p=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}let f=path.resolve(root,'.'+p);if(f!==root&&!f.startsWith(root+path.sep)){res.writeHead(403).end();return}if(p.endsWith('/'))f=path.join(f,'index.html');fs.readFile(f,(e,b)=>{if(e){res.writeHead(404).end('Not found');return}res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(b)})}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
