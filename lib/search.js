import {SEARCH_PLAN,SEARCH_LANES} from '../public/search-plan.js';
import {normalizeSearchResult,dedupe} from './normalize.js';
import {platformFromResult,followupLeads,mergePlatforms} from './platforms.js';
export const SEARCH_KEY='ledger:search:registry:v3';
export const bounded=(value,fallback,min,max)=>Math.max(min,Math.min(max,Number.parseInt(value,10)||fallback));
export function emptySearchState(){return {cursor:0,cycle:1,requestsTotal:0,history:{},followups:[],platforms:[],daily:{},monthly:{},lastRun:null};}
export function searchSummary(state=null,env=process.env){
 const s=state||emptySearchState(),day=new Date().toISOString().slice(0,10),month=day.slice(0,7);
 const history=Object.values(s.history||{});
 return {configured:Boolean(env.TAVILY_API_KEY),planSize:SEARCH_PLAN.length,lanes:SEARCH_LANES,cycle:s.cycle||1,cursor:s.cursor||0,
  completed:SEARCH_PLAN.filter(q=>s.history?.[q.id]?.successful).length,failed:history.filter(q=>!q.successful).length,
  followupsPending:s.followups?.length||0,platformsDiscovered:s.platforms?.length||0,
  perBatch:bounded(env.DEEP_SEARCH_LIMIT,24,1,48),dailyLimit:bounded(env.SEARCH_DAILY_LIMIT,96,1,480),
  todayRequests:s.daily?.date===day?s.daily.requests||0:0,
  monthlyCreditLimit:bounded(env.SEARCH_MONTHLY_CREDIT_LIMIT,1600,2,100000),
  reservedCredits:s.monthly?.month===month?s.monthly.credits||0:0,
  lastRun:s.lastRun||null,registryLimit:5000,registryFull:(s.platforms?.length||0)>=5000,
  recentQueries:history.sort((a,b)=>b.at.localeCompare(a.at)).slice(0,30)};
}
// Called only by protected owner/cron routes. Each request is reserved before
// spending credits; retrying a crashed invocation cannot silently reset budgets.
export async function runDeepSearch({env=process.env,fetcher=fetch,state=null,onCheckpoint=async()=>{}}={}){
 const s=structuredClone(state||emptySearchState()),day=new Date().toISOString().slice(0,10),month=day.slice(0,7);
 if(s.daily?.date!==day)s.daily={date:day,requests:0};if(s.monthly?.month!==month)s.monthly={month,credits:0};
 if(!env.TAVILY_API_KEY)return {items:[],attempted:0,successful:0,errors:[],state:s,coverage:searchSummary(s,env),paused:'Search key is not configured'};
 // Revisit older platform leads rather than retaining a permanent fresh badge.
 for(const platform of s.platforms){
  if(Date.now()-Date.parse(platform.observedAt||platform.discoveredAt)<7*86400000)continue;
  const id=`recheck-${platform.id}`;
  if(s.followups.length<500&&!s.followups.some(q=>q.id===id)&&(!s.history[id]||Date.now()-Date.parse(s.history[id].at)>7*86400000))s.followups.push({id,name:`Recheck ${platform.source}`,query:`site:${platform.platformKey} AI careers contributors applications open roles`,category:'ai-work',region:'varies',kind:'followup'});
 }
 const depth=env.SEARCH_DEPTH==='basic'?'basic':'advanced',credits=depth==='advanced'?2:1,settings=searchSummary(s,env);
 const count=Math.max(0,Math.min(settings.perBatch,settings.dailyLimit-s.daily.requests,Math.floor((settings.monthlyCreditLimit-s.monthly.credits)/credits)));
 if(!count)return {items:[],attempted:0,successful:0,errors:[],state:s,coverage:searchSummary(s,env),paused:'Daily request or monthly credit budget reached'};
 const tasks=[];
 for(let i=0;i<count;i++){
  // At most a quarter of a batch follows links; base coverage always advances.
  if(((s.requestsTotal||0)+i)%4===3&&s.followups.length)tasks.push(s.followups.shift());
  else {if(s.cursor>=SEARCH_PLAN.length){s.cursor=0;s.cycle++;}tasks.push(SEARCH_PLAN[s.cursor++]);}
 }
 s.daily.requests+=tasks.length;s.monthly.credits+=tasks.length*credits;s.requestsTotal=(s.requestsTotal||0)+tasks.length;
 await onCheckpoint(s);
 const items=[],errors=[],platforms=[];let successful=0,resultsSeen=0;
 // Three waves with the default budget; six with the maximum batch of 48.
 for(let start=0;start<tasks.length;start+=8){
  await Promise.all(tasks.slice(start,start+8).map(async query=>{
   const at=new Date().toISOString();
   try{
    const response=await fetcher('https://api.tavily.com/search',{method:'POST',headers:{Authorization:`Bearer ${env.TAVILY_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({query:query.query,topic:'general',search_depth:depth,max_results:20,include_published_date:true,include_answer:false,include_raw_content:'text',safe_search:true,include_usage:true,...(query.kind==='opportunity'?{time_range:'month'}:{})}),signal:AbortSignal.timeout(18000)});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const result=await response.json();if(!Array.isArray(result.results))throw new Error('Invalid response');
    successful++;resultsSeen+=result.results.length;
    for(const raw of result.results.slice(0,20)){
     const item=normalizeSearchResult(raw,query);if(item)items.push(item);
     const platform=platformFromResult(raw,query);if(platform)platforms.push(platform);
     for(const lead of followupLeads(raw,query))if(s.followups.length<500&&!s.history[lead.id]&&!s.followups.some(q=>q.id===lead.id)&&!s.platforms.some(p=>p.platformKey===lead.platformKey))s.followups.push(lead);
    }
    s.history[query.id]={id:query.id,query:query.query,category:query.category,kind:query.kind,at,successful:true,results:result.results.length};
   }catch(error){errors.push(query.id);s.history[query.id]={id:query.id,query:query.query,category:query.category,kind:query.kind,at,successful:false,error:/HTTP \d{3}/.exec(error.message)?.[0]||'Source unavailable'};}
  }));
  s.platforms=mergePlatforms(s.platforms,platforms);await onCheckpoint(s);
 }
 s.lastRun={at:new Date().toISOString(),attempted:tasks.length,successful,resultsSeen,newPlatforms:s.platforms.length-(state?.platforms?.length||0),errors,depth};
 await onCheckpoint(s);
 return {items:dedupe(items),attempted:tasks.length,successful,errors,state:s,coverage:searchSummary(s,env)};
}
