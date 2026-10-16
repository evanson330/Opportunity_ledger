import { STREAMS } from '../public/catalog.js';
import { parseFeed,normalizeSearchResult,dedupe } from './normalize.js';
import { hasStorage,readJson,writeJson } from './storage.js';

export const CACHE_KEY='ledger:feed:v1';
export const TTL_MS=30*60*1000;
let memory=null,pending=null;
export async function mapLimit(items,limit,fn) {
  const results=new Array(items.length);let next=0;
  await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{
    for(;;){const i=next++;if(i>=items.length)return;try{results[i]={status:'fulfilled',value:await fn(items[i],i)};}catch(error){results[i]={status:'rejected',reason:error};}}
  }));return results;
}
export async function fetchFeed(stream,fetcher=fetch) {
  const response=await fetcher(stream.url,{headers:{Accept:'application/rss+xml, application/atom+xml, text/xml','User-Agent':'OpportunityLedger/1.0 (RSS reader)'},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const max=2_000_000;
  if(Number(response.headers.get('content-length'))>max)throw new Error('Feed too large');
  const reader=response.body?.getReader();let xml='';
  if(reader){let total=0;const decoder=new TextDecoder();for(;;){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>max){await reader.cancel();throw new Error('Feed too large');}xml+=decoder.decode(value,{stream:true});}xml+=decoder.decode();}
  else xml=await response.text();
  if(xml.length>max)throw new Error('Feed too large');
  return parseFeed(xml,stream).filter(i=>!stream.keywords||stream.keywords.some(k=>(i.title+' '+i.summary).toLowerCase().includes(k)));
}
export async function scanFeeds({fetcher=fetch,streams=STREAMS}={}) {
  const results=await mapLimit(streams,8,s=>fetchFeed(s,fetcher));
  const errors=[];const items=[];let successful=0;
  results.forEach((r,i)=>{if(r.status==='fulfilled'){successful++;items.push(...r.value);}else errors.push({id:streams[i].id,name:streams[i].name,reason:'Feed unavailable'});});
  return {items:dedupe(items).slice(0,600),generatedAt:new Date().toISOString(),
    streams:{total:streams.length,successful,errors},mode:'rss',deepSearch:null};
}
export async function deepSearch({env=process.env,fetcher=fetch}={}) {
  if(!env.TAVILY_API_KEY)return {items:[],attempted:0,successful:0,errors:[]};
  const limit=Math.max(1,Math.min(16,Number.parseInt(env.DEEP_SEARCH_LIMIT||'16',10)||16));
  const queries=STREAMS.filter(s=>s.query).slice(0,limit);
  const results=await mapLimit(queries,5,async stream=>{
    const r=await fetcher('https://api.tavily.com/search',{method:'POST',
      headers:{Authorization:`Bearer ${env.TAVILY_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({query:stream.query,topic:'general',search_depth:'basic',time_range:'month',max_results:10,include_published_date:true,include_answer:false,include_raw_content:false,safe_search:true}),
      signal:AbortSignal.timeout(10000)});
    if(!r.ok)throw new Error(`Search unavailable (${r.status})`);
    const data=await r.json();if(!Array.isArray(data.results))throw new Error('Invalid search response');
    return data.results.map(raw=>normalizeSearchResult(raw,stream)).filter(Boolean);
  });
  return {items:dedupe(results.flatMap(r=>r.status==='fulfilled'?r.value:[])),attempted:queries.length,
    successful:results.filter(r=>r.status==='fulfilled').length,
    errors:results.flatMap((r,i)=>r.status==='rejected'?[queries[i].id]:[])};
}
const recent = item => !item.publishedAt || Date.now()-Date.parse(item.publishedAt)<31*86400000;
export async function getFeed({env=process.env,fetcher=fetch}={}) {
  if(memory&&Date.now()-Date.parse(memory.generatedAt)<TTL_MS)return {...memory,cache:'memory'};
  let cached=null,cacheWarning=null;
  if(hasStorage(env)){
    try{cached=await readJson(CACHE_KEY,{env,fetcher});}catch{cacheWarning='Shared cache unavailable';}
    if(cached&&Date.now()-Date.parse(cached.generatedAt)<TTL_MS){memory=cached;return {...cached,cache:'shared'};}
  }
  // Public reads never spend search API credits or send email.
  if(!pending)pending=(async()=>{
    const fresh=await scanFeeds({fetcher});
    const previous=cached||memory;
    if(previous?.deepSearch){fresh.deepSearch=previous.deepSearch;fresh.mode='rss+web';
      fresh.items=dedupe([...fresh.items,...previous.items.filter(i=>i.type==='discovery'&&recent(i))]);}
    if(!fresh.streams.successful&&previous){return {...previous,stale:true,latestAttemptAt:fresh.generatedAt,streams:fresh.streams,cacheWarning};}
    fresh.cacheWarning=cacheWarning;memory=fresh;
    if(hasStorage(env)&&fresh.streams.successful){try{await writeJson(CACHE_KEY,fresh,172800,{env,fetcher});}catch{fresh.cacheWarning='Shared cache write failed';}}
    return {...fresh,cache:'fresh'};
  })().finally(()=>{pending=null;});
  return pending;
}
export function setMemoryFeed(data){memory=data;}
export function resetMemory(){memory=null;pending=null;}
