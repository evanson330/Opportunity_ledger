import { readdir,readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import {SEARCH_PLAN} from '../public/search-plan.js';
import { CATEGORIES,DIRECTORY,STREAMS } from '../public/catalog.js';
import {AI_COMPANIES,AID_WINDOWS,STATES,isoDay} from '../public/opportunity-data.js';
const files=[];
async function walk(dir){for(const d of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${d.name}`;if(d.isDirectory())await walk(p);else if(/\.(m?js)$/.test(p))files.push(p);}}
for(const dir of ['api','lib','public','scripts','test'])await walk(dir);
for(const file of files){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status){console.error(r.stderr);process.exit(1);}}
const html=await readFile('public/index.html','utf8');
for(const asset of ['/styles.css','/app.js','/opportunity-data.js','/briefs.js','/assets/education.svg','/assets/favicon.svg'])await readFile('public'+asset);
if((await readFile('public/styles.css','utf8')).includes('honeycomb'))throw new Error('Removed background still referenced');
if(!html.includes('id="feed"'))throw new Error('Dashboard mount missing');
if(!html.includes('id="discovery-dialog"'))throw new Error('Discovery coverage dialog missing');
if(SEARCH_PLAN.length!==163||new Set(SEARCH_PLAN.map(q=>q.id)).size!==163)throw new Error('Invalid search coverage');
if(!html.includes('id="opportunity-dialog"'))throw new Error('Opportunity detail dialog missing');
for(const d of DIRECTORY){if(!CATEGORIES.some(c=>c.id===d.category))throw new Error('Invalid directory category');new URL(d.url);}
for(const s of STREAMS)new URL(s.url);
if(STATES.length!==51||AID_WINDOWS.length!==51)throw new Error('Expected all 50 states and D.C.');
for(const item of AID_WINDOWS){if(item.startsAt&&!isoDay(item.startsAt)||item.endsAt&&!isoDay(item.endsAt))throw new Error('Invalid application date');}
const images=JSON.parse(await readFile('public/assets/company-images.json','utf8'));
for(const c of AI_COMPANIES){await readFile('public'+c.image);if(images.companies[c.slug])await readFile('public'+images.companies[c.slug].path);}
const vercel=JSON.parse(await readFile('vercel.json','utf8'));if(vercel.crons[0].schedule!=='0 6 * * *')throw new Error('Unexpected schedule');
console.log(`Checked ${files.length} JavaScript files, ${AI_COMPANIES.length} company image cards, ${AID_WINDOWS.length} state/DC calendars, ${DIRECTORY.length} directory links, ${STREAMS.length} streams, ${SEARCH_PLAN.length} rotating web queries, and Vercel configuration.`);
