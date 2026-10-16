import test from 'node:test';
import assert from 'node:assert/strict';
import {SEARCH_PLAN} from '../public/search-plan.js';
import {STATES,AI_COMPANIES} from '../public/opportunity-data.js';
import {runDeepSearch,emptySearchState,searchSummary,SEARCH_KEY} from '../lib/search.js';
import {platformFromResult,platformKey,mergePlatforms,followupLeads} from '../lib/platforms.js';
import {isOfficialUrl,safeUrl} from '../lib/normalize.js';
import {getCompanies,resetCompaniesMemory} from '../lib/companies.js';
import scan from '../api/scan.js';
import discovery from '../api/discovery.js';
import companiesApi from '../api/companies.js';
import {writeJson,readJson} from '../lib/storage.js';

const query={id:'ai-test',query:'AI contributor platforms',category:'ai-work',kind:'platform',region:'KE'};
const result={url:'https://brand-new-ai.example/contributors',title:'Brand New AI — Join our contributors',content:'AI training freelance contributor applications.',raw_content:'Brand New AI contributor program. Apply now to join our community of expert AI trainers. We have open positions in coding and language evaluation. Check the project location and identity requirements. '.repeat(2)};
const ok=results=>new Response(JSON.stringify({results}));
const env={TAVILY_API_KEY:'server-only-key',DEEP_SEARCH_LIMIT:'4'};
const res=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.body=JSON.parse(v);}});

test('search plan covers all opportunity categories, all states and regional AI intents',()=>{
 assert.equal(SEARCH_PLAN.length,163);assert.equal(new Set(SEARCH_PLAN.map(q=>q.id)).size,163);
 for(const s of STATES)assert.ok(SEARCH_PLAN.some(q=>q.state===s.code&&q.query.includes('"'+s.name+'"')));
 for(const category of ['ai-work','remote-work','scholarships','grants','tax-refunds','benefits','settlements','research','competitions','deals','startup'])assert.ok(SEARCH_PLAN.some(q=>q.category===category));
 assert.equal(SEARCH_PLAN.filter(q=>q.kind==='platform').length,72);
});
test('advanced searches return 20 results and do not age-filter established platform pages',async()=>{
 const calls=[];await runDeepSearch({env:{...env,DEEP_SEARCH_LIMIT:'3'},fetcher:async(url,opts)=>{calls.push(JSON.parse(opts.body));return ok([]);}});
 assert.ok(calls.every(c=>c.search_depth==='advanced'&&c.max_results===20&&c.include_raw_content==='text'));
 assert.equal(calls[0].time_range,undefined);assert.equal(calls[1].time_range,'month');assert.equal(calls[2].time_range,'month');
});
test('saved cursor advances across batches and eventually visits the complete base plan',async()=>{
 let state=emptySearchState();const queries=new Set();
 for(let i=0;i<5;i++){const r=await runDeepSearch({env:{...env,DEEP_SEARCH_LIMIT:'48',SEARCH_DAILY_LIMIT:'480'},state,fetcher:async(url,opts)=>{queries.add(JSON.parse(opts.body).query);return ok([]);}});state=r.state;}
 assert.equal(queries.size,163);assert.equal(searchSummary(state).completed,163);assert.ok(state.cycle>=2);
});
test('platform leads become retained company cards, without inventing official identity or Kenya acceptance',()=>{
 const p=platformFromResult(result,query);assert.equal(p.type,'company');assert.equal(p.discovered,true);assert.equal(p.official,false);assert.equal(p.region,'varies');assert.equal(p.intake,'roles');assert.equal(p.monitorStatus,'source-checked');assert.equal(p.startsAt,null);assert.equal(p.endsAt,null);assert.ok(p.image.startsWith('/assets/'));assert.equal(p.discoveryQuery,query.query);
 const merged=mergePlatforms([p],[{...p,title:'Updated recruitment page',discoveredAt:'2099-01-01'}]);assert.equal(merged.length,1);assert.equal(merged[0].discoveredAt,p.discoveredAt);assert.equal(merged[0].title,'Updated recruitment page');
});
test('news, blogs, aggregators, known platforms and non-AI results are not misrepresented as new platforms',()=>{
 for(const raw of [{...result,url:'https://medium.com/ai-jobs'},{...result,url:'https://brand-new-ai.example/blog/best-platforms'},{...result,url:AI_COMPANIES[0].url},{...result,url:'https://foo.example/',title:'Top 20 AI platforms',raw_content:'AI careers apply now'},{...result,title:'Local cafe',content:'Coffee and cake',raw_content:'Join our cafe team'}])assert.equal(platformFromResult(raw,query),null);
 assert.equal(platformFromResult(result,{...query,category:'grants'}),null);
});
test('ATS employers stay distinct and a known ATS domain does not endorse unrelated tenants',()=>{
 assert.notEqual(platformKey('https://jobs.lever.co/employer-one'),platformKey('https://jobs.lever.co/employer-two'));
 assert.equal(isOfficialUrl('https://jobs.lever.co/welocalize/role'),true);assert.equal(isOfficialUrl('https://jobs.lever.co/unknown-employer/role'),false);
 for(const url of ['http://0.0.0.0/','http://[fd00::1]/','http://[::ffff:127.0.0.1]/','http://100.64.0.1/'])assert.equal(safeUrl(url),null);
});
test('search snippets alone and negative hiring notices retain review status',()=>{
 assert.equal(platformFromResult({...result,raw_content:null},query).intake,'review');
 const negative=platformFromResult({...result,raw_content:'We are not currently hiring. No open positions. Register for future AI contributor announcements. '.repeat(3)},query);assert.equal(negative.intake,'review');
});
test('follow-up links expand discovery, are deduplicated, and cannot crowd out base coverage',async()=>{
 const leads=followupLeads({...result,raw_content:'AI platforms: [Next](https://next-ai.example/) [Again](https://next-ai.example/) [Social](https://linkedin.com/) [private](http://127.0.0.1/)'},query);
 assert.equal(leads.length,1);
 const s=emptySearchState();s.followups=leads;
 const calls=[];const r=await runDeepSearch({env,state:s,fetcher:async(url,opts)=>{calls.push(JSON.parse(opts.body).query);return ok([result]);}});
 assert.ok(calls.some(q=>q.includes('site:next-ai.example')));assert.equal(r.state.cursor,3);assert.equal(r.state.platforms.length,1);
});
test('daily and monthly budgets persist across extra runs, including provider failures',async()=>{
 let calls=0;const fetcher=async()=>{calls++;return new Response('{}',{status:429});};
 const config={...env,SEARCH_DAILY_LIMIT:'3',SEARCH_MONTHLY_CREDIT_LIMIT:'4'};
 const first=await runDeepSearch({env:config,fetcher});assert.equal(first.attempted,2);assert.equal(first.successful,0);assert.equal(first.state.monthly.credits,4);
 const second=await runDeepSearch({env:config,state:first.state,fetcher});assert.equal(second.attempted,0);assert.equal(calls,2);assert.ok(second.paused);assert.equal(searchSummary(first.state).failed,2);
 const daily=await runDeepSearch({env:{...config,SEARCH_MONTHLY_CREDIT_LIMIT:'100'},state:first.state,fetcher});assert.equal(daily.attempted,1);
});
test('small one-query batches still advance recruitment follow-ups across runs',async()=>{
 let state=emptySearchState();state.followups=followupLeads({...result,raw_content:'[Next](https://next-ai.example/)'},query);const queries=[];
 for(let i=0;i<4;i++){const r=await runDeepSearch({env:{...env,DEEP_SEARCH_LIMIT:'1'},state,fetcher:async(url,opts)=>{queries.push(JSON.parse(opts.body).query);return ok([]);}});state=r.state;}
 assert.ok(queries[3].startsWith('site:next-ai.example'));assert.equal(state.cursor,3);
});
test('credit reservations are checkpointed before any provider request and failed checkpoints prevent spending',async()=>{
 let reserved=false,calls=0;await runDeepSearch({env,onCheckpoint:async s=>{reserved=s.monthly.credits>0;},fetcher:async()=>{assert.equal(reserved,true);calls++;return ok([]);}});assert.equal(calls,4);
 calls=0;await assert.rejects(runDeepSearch({env,onCheckpoint:async()=>{throw new Error('Cache unavailable');},fetcher:async()=>{calls++;return ok([]);}}));assert.equal(calls,0);
});
test('source failures preserve previous platforms and older source text is not overwritten by weaker snippets',async()=>{
 const p=platformFromResult(result,query),s=emptySearchState();s.platforms=[p];
 const r=await runDeepSearch({env,state:s,fetcher:async()=>{throw new Error('offline');}});assert.equal(r.state.platforms[0].id,p.id);assert.equal(r.errors.length,4);
 const weaker={...p,intake:'review',monitorStatus:'needs-review',checkedAt:null};assert.equal(mergePlatforms([p],[weaker])[0].monitorStatus,'source-checked');
});
test('old platform sources are queued for later rechecking and keep explicit stale status',async()=>{
 const p={...platformFromResult(result,query),observedAt:'2020-01-01T00:00:00Z'},s=emptySearchState();s.platforms=[p];
 const calls=[];await runDeepSearch({env,state:s,fetcher:async(url,opts)=>{calls.push(JSON.parse(opts.body).query);return ok([]);}});assert.ok(calls.some(q=>q.startsWith('site:brand-new-ai.example')));
});
test('public company API merges retained platforms without fetching a discovered URL',async()=>{
 resetCompaniesMemory();const p=platformFromResult(result,query);
 const data=await getCompanies({env:{UPSTASH_REDIS_REST_URL:'https://cache.example',UPSTASH_REDIS_REST_TOKEN:'key'},fetcher:async(url,opts)=>{
  assert.ok(!String(url).includes('brand-new-ai'));
  if(String(url).includes('cache.example')){const [op,key]=JSON.parse(opts.body);return new Response(JSON.stringify({result:op==='GET'&&key===SEARCH_KEY?JSON.stringify({platforms:[p]}):null}));}
  return new Response('<p>No open positions</p>');
 }});assert.equal(data.companies.length,AI_COMPANIES.length+1);assert.equal(data.discovered,1);resetCompaniesMemory();
});
test('extra scans require POST and secret authorization, and progress is read-only',async()=>{
 let out=res();await scan({method:'GET',headers:{}},out);assert.equal(out.statusCode,405);
 out=res();await scan({method:'POST',headers:{}},out);assert.equal(out.statusCode,401);
 out=res();await discovery({method:'POST',headers:{}},out);assert.equal(out.statusCode,405);
});
test('large registry cache values round-trip through compression',async()=>{
 let stored;const value={platforms:Array.from({length:500},(_,i)=>({...platformFromResult(result,query),id:`p-${i}`}))};
 const opts={env:{UPSTASH_REDIS_REST_URL:'https://cache.example',UPSTASH_REDIS_REST_TOKEN:'key'},fetcher:async(url,options)=>{const [op,key,payload]=JSON.parse(options.body);if(op==='SET')stored=payload;return new Response(JSON.stringify({result:op==='SET'?'OK':stored}));}};
 await writeJson('large',value,60,opts);assert.equal(JSON.parse(stored)._ledgerEncoding,'gzip');assert.ok(stored.length<JSON.stringify(value).length/2);assert.deepEqual(await readJson('large',opts),value);
});
test('a large company registry is returned in bounded pages suitable for Vercel',async()=>{
 const keys=['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'],old=keys.map(k=>process.env[k]),real=globalThis.fetch;
 const platforms=Array.from({length:5000},(_,i)=>({...platformFromResult(result,query),id:`platform-${i}`,platformKey:`example-${i}.com`}));
 Object.assign(process.env,{UPSTASH_REDIS_REST_URL:'https://cache.example',UPSTASH_REDIS_REST_TOKEN:'key'});resetCompaniesMemory();
 globalThis.fetch=async(url,options)=>{if(String(url).startsWith('https://cache.example')){const [op,key]=JSON.parse(options.body);return new Response(JSON.stringify({result:op==='GET'&&key===SEARCH_KEY?JSON.stringify({platforms}):null}));}return new Response('<p>No open positions</p>');};
 try{const out=res();await companiesApi({method:'GET',url:'/api/companies?offset=128'},out);assert.equal(out.statusCode,200);assert.equal(out.body.total,5032);assert.equal(out.body.companies.length,128);assert.equal(out.body.nextOffset,256);assert.ok(Buffer.byteLength(JSON.stringify(out.body))<500000);}
 finally{globalThis.fetch=real;keys.forEach((k,i)=>{if(old[i]===undefined)delete process.env[k];else process.env[k]=old[i];});resetCompaniesMemory();}
});
