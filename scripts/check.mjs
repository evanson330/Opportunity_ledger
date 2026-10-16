import { readdir,readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { CATEGORIES,DIRECTORY,STREAMS } from '../public/catalog.js';
const files=[];
async function walk(dir){for(const d of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${d.name}`;if(d.isDirectory())await walk(p);else if(/\.(m?js)$/.test(p))files.push(p);}}
for(const dir of ['api','lib','public','scripts','test'])await walk(dir);
for(const file of files){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status){console.error(r.stderr);process.exit(1);}}
const html=await readFile('public/index.html','utf8');
for(const asset of ['/styles.css','/app.js','/assets/honeycomb.png','/assets/favicon.svg'])await readFile('public'+asset);
if(!html.includes('id="feed"'))throw new Error('Dashboard mount missing');
for(const d of DIRECTORY){if(!CATEGORIES.some(c=>c.id===d.category))throw new Error('Invalid directory category');new URL(d.url);}
for(const s of STREAMS)new URL(s.url);
const vercel=JSON.parse(await readFile('vercel.json','utf8'));if(vercel.crons[0].schedule!=='0 6 * * *')throw new Error('Unexpected schedule');
console.log(`Checked ${files.length} JavaScript files, ${DIRECTORY.length} source links, ${STREAMS.length} streams, dashboard assets, and Vercel configuration.`);
