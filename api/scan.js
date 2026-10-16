import {authorized,json} from '../lib/http.js';
import {hasStorage,redis,readJson,writeJson} from '../lib/storage.js';
import {SEARCH_KEY,runDeepSearch} from '../lib/search.js';
import {CACHE_KEY,setMemoryFeed} from '../lib/discovery.js';
import {dedupe} from '../lib/normalize.js';
// Owner-only extra batch. Separate from the daily job; it never sends email.
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return json(res,405,{error:'Method not allowed'});}
 if(!authorized(req))return json(res,401,{error:'Unauthorized'});
 if(!hasStorage()||!process.env.TAVILY_API_KEY)return json(res,503,{error:'Configure the search key and shared cache first.'});
 let locked=false;
 try{
  if(await redis(['SET','ledger:cron:lock','1','NX','EX',240])!=='OK')return json(res,409,{error:'A scan is already running'});locked=true;
  const state=await readJson(SEARCH_KEY);
  const search=await runDeepSearch({state,onCheckpoint:s=>writeJson(SEARCH_KEY,s,365*86400)});
  const previous=await readJson(CACHE_KEY);
  if(search.successful){const data={...(previous||{streams:{total:0,successful:0,errors:[]}}),items:dedupe([...search.items,...(previous?.items||[])]).slice(0,2000),generatedAt:new Date().toISOString(),mode:'rss+web',deepSearch:{at:search.state.lastRun.at,attempted:search.attempted,successful:search.successful,errors:search.errors,coverage:search.coverage}};await writeJson(CACHE_KEY,data);setMemoryFeed(data);}
  return json(res,200,{attempted:search.attempted,successful:search.successful,errors:search.errors,paused:search.paused||null,coverage:search.coverage});
 }catch{return json(res,502,{error:'The batch could not finish. Reserved requests and earlier discoveries are retained. Check provider configuration.'});}
 finally{if(locked)try{await redis(['DEL','ledger:cron:lock']);}catch{}}
}
