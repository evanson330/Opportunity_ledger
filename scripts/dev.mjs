// Dependency-free local development server, including the same API handlers used on Vercel.
import { createServer } from 'node:http';
import { readFile,stat } from 'node:fs/promises';
import { resolve,extname,sep } from 'node:path';
import { loadEnvFile } from 'node:process';
try{loadEnvFile('.env.local');}catch{/* Environment file is optional. */}
const root=resolve('public');
const routes={'/api/discovery':()=>import('../api/discovery.js'),'/api/scan':()=>import('../api/scan.js'),'/api/opportunities':()=>import('../api/opportunities.js'),'/api/cron':()=>import('../api/cron.js'),'/api/companies':()=>import('../api/companies.js')};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer(async(req,res)=>{
  try{
    const u=new URL(req.url,'http://localhost');
    if(routes[u.pathname]){const {default:handler}=await routes[u.pathname]();return await handler(req,res);}
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end('Method not allowed');}
    const path=resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));
    if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403);return res.end('Forbidden');}
    if(!(await stat(path)).isFile()){res.writeHead(404);return res.end('Not found');}
    const bytes=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404);res.end('Not found');}
});
const port=Number(process.env.PORT||3000);server.listen(port,'0.0.0.0',()=>console.log(`Opportunity Ledger ready at http://localhost:${port}`));
