import { authorized,json } from '../lib/http.js';
import { scanFeeds,deepSearch,CACHE_KEY,setMemoryFeed } from '../lib/discovery.js';
import { hasStorage,redis,readJson,writeJson } from '../lib/storage.js';
import { dedupe,stableId } from '../lib/normalize.js';
import { selectDigestItems,sendDigest } from '../lib/digest.js';
import {getCompanies} from '../lib/companies.js';
import {SEARCH_KEY} from '../lib/search.js';
export default async function handler(req,res) {
  if(req.method!=='GET'){res.setHeader('Allow','GET');return json(res,405,{error:'Method not allowed'});}
  if(!authorized(req))return json(res,401,{error:'Unauthorized'});
  if(!hasStorage())return json(res,503,{error:'Add Upstash Redis to retain scheduled results and delivery history. Live RSS still works without it.'});
  let locked=false;
  try {
    const lock=await redis(['SET','ledger:cron:lock','1','NX','EX',240]);
    if(lock!=='OK')return json(res,200,{skipped:true,reason:'A scan is already running'});locked=true;
    const [previous,seen,registry]=await Promise.all([readJson(CACHE_KEY),readJson('ledger:digest:seen'),readJson(SEARCH_KEY)]);
    // Reuse a successful sweep within the day so duplicate calls do not spend more credits.
    const doDeep=process.env.TAVILY_API_KEY&&(!registry?.lastRun||Date.now()-Date.parse(registry.lastRun.at)>23*3600000);
    const [fresh,search,companies]=await Promise.all([scanFeeds(),doDeep?deepSearch({state:registry,onCheckpoint:s=>writeJson(SEARCH_KEY,s,365*86400)}):Promise.resolve(null),getCompanies({force:true})]);
    const preserved=(previous?.items||[]).filter(i=>i.type==='discovery'&&Date.now()-Date.parse(i.discoveredAt)<31*86400000);
    if(!fresh.streams.successful&&!search?.successful) return json(res,502,{error:'No upstream sources completed. Previous results were retained.'});
    const data={...fresh,items:dedupe([...fresh.items,...(search?.items||[]),...preserved]).slice(0,2000),mode:search?.successful||previous?.deepSearch?'rss+web':'rss',
      deepSearch:search?.successful?{at:new Date().toISOString(),attempted:search.attempted,successful:search.successful,errors:search.errors,coverage:search.coverage}:previous?.deepSearch||null,
      searchErrors:search?.errors||[]};
    // Retain prior RSS items during a partial outage instead of silently discarding them.
    if(fresh.streams.errors.length&&previous?.items)data.items=dedupe([...data.items,...previous.items.filter(i=>Date.now()-Date.parse(i.publishedAt||i.discoveredAt)<31*86400000)]).slice(0,2000);
    await writeJson(CACHE_KEY,data);setMemoryFeed(data);
    const items=selectDigestItems(data.items,seen||[]);
    const fingerprint=stableId(items.map(i=>i.id).join('-'));
    const digest=await sendDigest(items,{idempotencyKey:`ledger-${fingerprint}`});
    if(digest.sent)await writeJson('ledger:digest:seen',[...new Set([...(seen||[]),...items.map(i=>i.id)])].slice(-3000),90*86400);
    return json(res,200,{scannedAt:data.generatedAt,items:data.items.length,streams:data.streams,companies:{total:companies.total,reached:companies.reached,verified:companies.verified},deepSearch:data.deepSearch,searchErrors:data.searchErrors,digest});
  } catch {return json(res,502,{error:'Scheduled scan or delivery could not complete. Check provider settings and Vercel function logs.'});}
  finally {if(locked){try{await redis(['DEL','ledger:cron:lock']);}catch{ /* lock expires */ }}}
}
