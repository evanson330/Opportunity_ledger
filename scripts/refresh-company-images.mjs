import { mkdir,writeFile } from 'node:fs/promises';
import { AI_COMPANIES } from '../public/opportunity-data.js';
const out='public/assets/companies';await mkdir(out,{recursive:true});
const colors=['#162f50','#173d3b','#203c73','#4c3e67','#a54c3b','#3d5273'];
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
function panel(company,i){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="480" viewBox="0 0 960 480"><rect width="960" height="480" fill="${colors[i%colors.length]}"/><g fill="none" stroke="#fff" opacity=".12"><circle cx="820" cy="80" r="240"/><circle cx="820" cy="80" r="180"/><circle cx="820" cy="80" r="120"/><path d="M0 400h960M0 420h960M0 440h960M680 0v480M710 0v480M740 0v480"/></g><text x="66" y="205" font-family="Arial,sans-serif" font-size="${company.title.length>18?49:62}" font-weight="700" fill="#fff">${escape(company.title)}</text><text x="69" y="254" font-family="Arial,sans-serif" font-size="20" letter-spacing="3" fill="#d8e6f5">${escape(company.workType.toUpperCase())}</text><rect x="69" y="295" width="54" height="4" rx="2" fill="#a6dbd3"/></svg>`;
}
const manifest={generatedAt:new Date().toISOString(),companies:{}};
let next=0;await Promise.all(Array.from({length:5},async()=>{
  for(;;){const i=next++;if(i>=AI_COMPANIES.length)return;const c=AI_COMPANIES[i];
    await writeFile(`${out}/${c.slug}.svg`,panel(c,i));
    manifest.companies[c.slug]={path:`/assets/companies/${c.slug}.svg`,kind:'Original company-name illustration',source:c.url};
    try{
      const r=await fetch(c.url,{signal:AbortSignal.timeout(8500)});if(!r.ok)continue;const html=await r.text();
      const tags=[...html.matchAll(/<meta\b[^>]*>/gi)].map(x=>x[0]);
      const tag=tags.find(t=>/(?:property|name)=["']og:image["']/i.test(t));
      const raw=tag?.match(/content=["']([^"']+)["']/i)?.[1]?.replace(/&amp;/g,'&');
      if(!raw)continue;const u=new URL(raw,c.url);if(u.protocol!=='https:')continue;
      const asset=await fetch(u,{signal:AbortSignal.timeout(8500)});if(!asset.ok)continue;
      const mime=asset.headers.get('content-type')?.split(';')[0];
      const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/svg+xml':'svg'}[mime];
      if(!ext||Number(asset.headers.get('content-length'))>4_000_000)continue;
      const bytes=new Uint8Array(await asset.arrayBuffer());if(bytes.length>4_000_000)continue;
      if(ext==='svg'&&/<script|foreignObject|\bon\w+\s*=/i.test(new TextDecoder().decode(bytes)))continue;
      await writeFile(`${out}/${c.slug}-official.${ext}`,bytes);
      manifest.companies[c.slug]={path:`/assets/companies/${c.slug}-official.${ext}`,kind:'Official website social preview',source:u.href,page:c.url};
    }catch{/* Original branded panel remains available without external services. */}
  }
}));
await writeFile('public/assets/company-images.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({companies:AI_COMPANIES.length,officialImages:Object.values(manifest.companies).filter(x=>x.kind.startsWith('Official')).length,localFallbacks:true}));
