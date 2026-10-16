import test,{afterEach} from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed,plainText,safeUrl,validDate,dedupe,normalizeSearchResult,matchesAlert,isOfficialUrl,relevantOpportunity } from '../lib/normalize.js';
import { scanFeeds,deepSearch,getFeed,resetMemory } from '../lib/discovery.js';
import { authorized } from '../lib/http.js';
import { selectDigestItems,sendDigest } from '../lib/digest.js';
import { redis } from '../lib/storage.js';
import cron from '../api/cron.js';
import opportunities from '../api/opportunities.js';
const now=Date.parse('2026-10-16T06:00:00Z');
const stream={id:'test',name:'AI work',category:'ai-work',region:'varies',url:'https://example.com/feed'};
const xml=`<?xml version="1.0"?><rss version="2.0"><channel><title>Example feed</title><item><title>New AI work - Luel</title><link>https://example.com/jobs/123?utm_source=feed</link><description><![CDATA[<p>Apply &amp; read the requirements.</p>]]></description><pubDate>Thu, 15 Oct 2026 10:00:00 GMT</pubDate><source url="https://www.luel.ai">Luel</source></item></channel></rss>`;
const response=(body,status=200,headers={})=>new Response(body,{status,headers});
function mockRes(){return {headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=JSON.parse(body);return this;}};}
afterEach(()=>resetMemory());
test('RSS parsing preserves source, supplied dates, and usable text',()=>{
  const [i]=parseFeed(xml,stream,now);assert.equal(i.title,'New AI work');assert.equal(i.source,'Luel');assert.equal(i.official,true);assert.equal(i.summary,'Apply & read the requirements.');assert.equal(i.publishedAt,'2026-10-15T10:00:00.000Z');assert.equal(i.region,'varies');
});
test('Atom parsing supports alternate link attributes and missing dates',()=>{
  const [i]=parseFeed('<feed><title>Jobs</title><entry><title>A job</title><link href="https://example.com/atom" rel="alternate"/><summary>Remote</summary></entry></feed>',stream,now);
  assert.equal(i.url,'https://example.com/atom');assert.equal(i.publishedAt,null);
});
test('invalid, old, and future dates are not turned into fresh publications',()=>{
  assert.equal(validDate('nonsense',now),null);assert.equal(validDate('2028-01-01',now),null);
  assert.equal(parseFeed(xml.replace('15 Oct 2026','15 Oct 2024'),stream,now).length,0);
});
test('untrusted links, XML declarations, and non-feeds are rejected',()=>{
  for(const url of ['javascript:alert(1)','data:text/html,test','http://localhost/foo','http://127.0.0.1/foo','https://user:pass@example.com'])assert.equal(safeUrl(url),null);
  assert.throws(()=>parseFeed('<!DOCTYPE x [<!ENTITY a SYSTEM "file:///etc/passwd">]><rss/>',stream,now));
  assert.throws(()=>parseFeed('<html>blocked</html>',stream,now));
  assert.equal(parseFeed(xml.replace('https://example.com/jobs/123?utm_source=feed','javascript:alert(1)'),stream,now).length,0);
});
test('deduplication handles tracking links and syndicated duplicate titles',()=>{
  const first=parseFeed(xml,stream,now)[0];const dup={...first,url:'https://elsewhere.example/news',id:'different'};
  const sameUrl={...first,url:'https://example.com/jobs/123?utm_source=other',title:'Different title'};
  assert.equal(dedupe([first,dup,sameUrl]).length,1);
});
test('official-domain labels reject lookalike domains',()=>{
  assert.equal(isOfficialUrl('https://www.irs.gov/refunds'),true);assert.equal(isOfficialUrl('https://irs.gov.bad.example/pay'),false);assert.equal(isOfficialUrl('https://luel.ai.scam.example'),false);
});
test('search results have no fabricated date or payout',()=>{
  const i=normalizeSearchResult({url:'https://example.com/opportunity',title:'Program',content:'Read more'},stream,now);
  assert.equal(i.publishedAt,null);assert.equal(i.type,'discovery');assert.equal(i.amount,undefined);assert.equal(normalizeSearchResult({url:'javascript:foo',title:'bad'},stream,now),null);
});
test('feed scan reports partial outages and continues with successful sources',async()=>{
  const date=new Date().toUTCString();const body=xml.replace('Thu, 15 Oct 2026 10:00:00 GMT',date);
  const result=await scanFeeds({streams:[stream,{...stream,id:'broken',url:'https://broken.example/feed'}],fetcher:async url=>url.includes('broken')?response('Unavailable',503):response(body)});
  assert.equal(result.streams.successful,1);assert.equal(result.streams.errors.length,1);assert.equal(result.items.length,1);
});
test('public refresh never calls paid search and reuses warm results',async()=>{
  let calls=0;const env={TAVILY_API_KEY:'dummy'};
  const fetcher=async url=>{assert.ok(!String(url).includes('tavily'));calls++;return response(xml.replace('Thu, 15 Oct 2026 10:00:00 GMT',new Date().toUTCString()));};
  const first=await getFeed({env,fetcher});const second=await getFeed({env,fetcher});assert.equal(second.cache,'memory');assert.equal(first.items.length,1);assert.equal(calls,first.streams.total);
});
test('deep searches use server credentials and have a bounded query budget',async()=>{
  let calls=0;const result=await deepSearch({env:{TAVILY_API_KEY:'secret',DEEP_SEARCH_LIMIT:'2'},fetcher:async(url,opts)=>{
    calls++;assert.equal(url,'https://api.tavily.com/search');assert.equal(opts.headers.Authorization,'Bearer secret');assert.equal(JSON.parse(opts.body).search_depth,'basic');
    return response(JSON.stringify({results:[{url:`https://example.com/${calls}`,title:`Opportunity ${calls}`,content:'Requirements apply'}]}));
  }});assert.equal(calls,2);assert.equal(result.successful,2);assert.equal(result.items.length,2);
});
test('alerts apply category, keyword, and country constraints and exclude sent links',()=>{
  const item={...parseFeed(xml,stream,now)[0],region:'US'};
  assert.equal(matchesAlert(item,{categories:['ai-work'],keywords:['luel'],region:'US'}),true);
  assert.equal(matchesAlert(item,{region:'KE'}),false);
  assert.equal(selectDigestItems([item],[item.id],{}).length,0);
  assert.equal(selectDigestItems([item],[],{ALERT_KEYWORDS:'not-a-match'}).length,0);
});
test('email escapes source text and uses provider idempotency',async()=>{
  const item={...parseFeed(xml,stream,now)[0],title:'<img src=x onerror=bad()> & money'};
  const result=await sendDigest([item],{env:{RESEND_API_KEY:'secret',ALERT_EMAIL:'owner@example.com',ALERT_FROM:'Ledger <ledger@example.com>'},idempotencyKey:'same-run',fetcher:async(url,opts)=>{
    assert.equal(opts.headers['Idempotency-Key'],'same-run');const body=JSON.parse(opts.body);assert.ok(!body.html.includes('<img'));assert.ok(body.html.includes('&lt;img'));assert.deepEqual(body.to,['owner@example.com']);return response('{"id":"sent"}');
  }});assert.equal(result.sent,true);
});
test('cron authorization fails closed when missing or invalid',()=>{
  assert.equal(authorized({headers:{}},{}),false);assert.equal(authorized({headers:{authorization:'Bearer nope'}},{CRON_SECRET:'correct'}),false);assert.equal(authorized({headers:{authorization:'Bearer correct'}},{CRON_SECRET:'correct'}),true);
});
test('cron HTTP endpoint rejects unauthorized requests without upstream calls',async()=>{
  const old=process.env.CRON_SECRET;process.env.CRON_SECRET='test-secret';try{const res=mockRes();await cron({method:'GET',headers:{}},res);assert.equal(res.statusCode,401);}finally{if(old===undefined)delete process.env.CRON_SECRET;else process.env.CRON_SECRET=old;}
});
test('API endpoints reject unsupported methods',async()=>{
  for(const handler of [opportunities,cron]){const res=mockRes();await handler({method:'POST'},res);assert.equal(res.statusCode,405);assert.equal(res.headers.Allow,'GET');}
});
test('Redis REST commands check errors and never include a token in the command body',async()=>{
  const value=await redis(['GET','key'],{env:{UPSTASH_REDIS_REST_URL:'https://cache.upstash.io',UPSTASH_REDIS_REST_TOKEN:'private'},fetcher:async(url,opts)=>{
    assert.equal(opts.headers.Authorization,'Bearer private');assert.deepEqual(JSON.parse(opts.body),['GET','key']);return response('{"result":"value"}');}});assert.equal(value,'value');
});
test('plain text removes encoded markup without inserting executable HTML',()=>assert.equal(plainText('&lt;b&gt;Money&lt;/b&gt; &amp; work'),'Money & work'));
test('relevance filter removes gambling and guaranteed-return promotions',()=>{
  assert.equal(relevantOpportunity('Sports betting offer: get cashback'),false);
  assert.equal(relevantOpportunity('Guaranteed returns on crypto signals'),false);
  assert.equal(relevantOpportunity('Tax refund application guidance'),true);
});
test('complete scheduled workflow caches discoveries and sends each link only once',async()=>{
  const names=['CRON_SECRET','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','TAVILY_API_KEY','RESEND_API_KEY','ALERT_EMAIL','ALERT_FROM','ALERT_KEYWORDS','ALERT_CATEGORIES','ALERT_REGION','DEEP_SEARCH_LIMIT'];
  const old=new Map(names.map(k=>[k,process.env[k]]));const realFetch=globalThis.fetch;
  const store=new Map();let searches=0,emails=0;const delivered=[];
  Object.assign(process.env,{CRON_SECRET:'private-cron-secret',UPSTASH_REDIS_REST_URL:'https://cache.upstash.io',UPSTASH_REDIS_REST_TOKEN:'private-redis-token',TAVILY_API_KEY:'private-search-key',RESEND_API_KEY:'private-email-key',ALERT_EMAIL:'owner@example.com',ALERT_FROM:'Ledger <ledger@example.com>',ALERT_KEYWORDS:'',ALERT_CATEGORIES:'',ALERT_REGION:'',DEEP_SEARCH_LIMIT:'2'});
  globalThis.fetch=async(input,opts={})=>{
    const url=String(input);
    if(url.includes('cache.upstash.io')){
      const [op,key,value,...args]=JSON.parse(opts.body);let result;
      if(op==='GET')result=store.get(key)||null;
      else if(op==='SET'){if(args.includes('NX')&&store.has(key))result=null;else{store.set(key,value);result='OK';}}
      else if(op==='DEL'){store.delete(key);result=1;}
      return response(JSON.stringify({result}));
    }
    if(url==='https://api.tavily.com/search'){searches++;return response(JSON.stringify({results:[{url:'https://example.com/extra-opportunity',title:'A broader opportunity',content:'Requirements apply.'}]}));}
    if(url==='https://api.resend.com/emails'){emails++;delivered.push(JSON.parse(opts.body));return response('{"id":"mock-delivery"}');}
    return response(xml.replace('Thu, 15 Oct 2026 10:00:00 GMT',new Date().toUTCString()));
  };
  try{
    const req={method:'GET',headers:{authorization:'Bearer private-cron-secret'}};
    const first=mockRes();await cron(req,first);assert.equal(first.statusCode,200);assert.equal(first.body.digest.sent,true);assert.equal(searches,2);assert.equal(emails,1);assert.deepEqual(delivered[0].to,['owner@example.com']);assert.ok(store.has('ledger:feed:v1'));
    const second=mockRes();await cron(req,second);assert.equal(second.statusCode,200);assert.equal(searches,2);assert.equal(emails,1);assert.equal(second.body.digest.sent,false);assert.equal(store.has('ledger:cron:lock'),false);
    const publicRes=mockRes();await opportunities({method:'GET',headers:{}},publicRes);assert.equal(publicRes.statusCode,200);assert.ok(!JSON.stringify(publicRes.body).includes('private-'));assert.equal(publicRes.body.configuration.deepSearch,true);
  }finally{globalThis.fetch=realFetch;for(const name of names){if(old.get(name)===undefined)delete process.env[name];else process.env[name]=old.get(name);}}
});
