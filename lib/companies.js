import { AI_COMPANIES,isoDay } from '../public/opportunity-data.js';
import { hasStorage,readJson,writeJson } from './storage.js';
import { mapLimit } from './discovery.js';
import { plainText,safeUrl } from './normalize.js';
import {SEARCH_KEY} from './search.js';
let memory=null,pending=null,registryMemory=null,registryReadAt=0;
const KEY='ledger:companies:v2',TTL=6*3600000;
export function inspectCompanyHtml(company,html,now=Date.now()){
  const jobs=[];
  for(const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    try{const raw=JSON.parse(match[1]);const walk=node=>{
      if(!node||typeof node!=='object')return;
      if(node['@type']==='JobPosting'&&node.title){const end=isoDay(node.validThrough);if(!end||end>=new Date(now).toISOString().slice(0,10))jobs.push({title:plainText(node.title),url:safeUrl(node.url)||company.url,postedAt:isoDay(node.datePosted),endsAt:end});}
      for(const val of Object.values(node))if(val&&typeof val==='object')Array.isArray(val)?val.forEach(walk):walk(val);
    };walk(raw);}catch{/* One invalid structured block should not hide the page. */}
  }
  const text=plainText(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' '));
  const noRoles=/no (?:current |open |available )?(?:roles|positions|vacancies|opportunities)|not (?:currently )?(?:hiring|accepting applications)/i.test(text);
  const roleSignal=/open roles|open positions|job openings|search jobs|view.{0,15}openings|current vacancies|explore jobs|see open positions|available jobs/i.test(text);
  const applicationSignal=/start earning|start working|become (?:a |an )?(?:contributor|clickworker|expert)|join.{0,35}(?:community|contributor)|sign up|apply now|register|get started|start contributing|create an account|open freelance projects|browse tasks|pick a task/i.test(text);
  const intake=jobs.length?'roles':!noRoles&&roleSignal?'roles':!noRoles&&applicationSignal&&company.workType==='AI training & tasks'?'applications':'review';
  return {...company,intake,monitorStatus:intake==='review'?'needs-review':'verified',
    checkedAt:intake==='review'?company.checkedAt:new Date(now).toISOString().slice(0,10),observedAt:new Date(now).toISOString(),
    vacancies:jobs.slice(0,12),evidence:intake==='roles'?'The official source presents vacancy links or active structured job listings.':intake==='applications'?'The official contributor page presents an application or registration route.':'No unambiguous hiring signal was found in the accessible page.'};
}
export async function scanCompanies({fetcher=fetch,companies=AI_COMPANIES}={}){
  const results=await mapLimit(companies,6,async company=>{
    const r=await fetcher(company.url,{signal:AbortSignal.timeout(6500),headers:{'User-Agent':'OpportunityLedger/2.0 (public career source monitor)',Accept:'text/html'}});
    if(!r.ok)throw new Error('Source unavailable');
    const html=await r.text();if(html.length>4_000_000)throw new Error('Source too large');
    return inspectCompanyHtml(company,html);
  });
  return {companies:results.map((r,i)=>r.status==='fulfilled'?r.value:{...companies[i],monitorStatus:'unavailable',observedAt:new Date().toISOString()}),
    checkedAt:new Date().toISOString(),verified:results.filter(r=>r.status==='fulfilled'&&r.value.monitorStatus==='verified').length,
    reached:results.filter(r=>r.status==='fulfilled').length,total:companies.length};
}
export async function getCompanies({force=false,env=process.env,fetcher=fetch}={}){
  // Newly discovered URLs are never fetched by public requests. Their source
  // text is retrieved by the search provider during an authenticated batch.
  let registry=registryMemory;try{if(hasStorage(env)&&(force||Date.now()-registryReadAt>30000)){registry=await readJson(SEARCH_KEY,{env,fetcher});registryMemory=registry;registryReadAt=Date.now();}}catch{}
  const merge=result=>{const discovered=(registry?.platforms||[]).map(i=>!i.checkedAt||Date.now()-Date.parse(i.checkedAt)>14*86400000?{...i,intake:'review'}:i);return {...result,companies:[...result.companies,...discovered],total:result.companies.length+discovered.length,discovered:discovered.length};};
  if(!force&&memory&&Date.now()-Date.parse(memory.checkedAt)<TTL)return merge(memory);
  if(!force&&hasStorage(env)){try{const cached=await readJson(KEY,{env,fetcher});if(cached&&Date.now()-Date.parse(cached.checkedAt)<TTL){memory=cached;return merge(cached);}}catch{}}
  if(!pending)pending=scanCompanies({fetcher}).then(async result=>{memory=result;if(hasStorage(env)){try{await writeJson(KEY,result,172800,{env,fetcher});}catch{}}return result;}).finally(()=>{pending=null;});
  return merge(await pending);
}
export function resetCompaniesMemory(){memory=null;pending=null;registryMemory=null;registryReadAt=0;}
