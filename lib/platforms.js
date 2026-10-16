import {AI_COMPANIES,categoryImage,opportunityDetails} from '../public/opportunity-data.js';
import {plainText,safeUrl,stableId,relevantOpportunity} from './normalize.js';

const blocked=/(^|\.)(?:google\.com|bing\.com|youtube\.com|facebook\.com|instagram\.com|tiktok\.com|linkedin\.com|reddit\.com|medium\.com|substack\.com|indeed\.com|glassdoor\.com|ziprecruiter\.com|remoteok\.com|wellfound\.com|wikipedia\.org|github\.com|trustpilot\.com|quora\.com|news\.yahoo\.com|schema\.org|w3\.org|webflow\.com|wordpress\.org|googleapis\.com|cloudflare\.com|typekit\.net|gstatic\.com|stripe\.com|paypal\.com|intercom\.io)$/i;
const ats=/(^|\.)(?:lever\.co|greenhouse\.io|ashbyhq\.com|workable\.com|smartrecruiters\.com)$/i;
const aiSignal=/\b(?:artificial intelligence|AI|RLHF|LLM|annotation|annotators?|data label(?:ing|ling)|model evaluat|search evaluat|ads rat(?:er|ing))\b/i;
const intakeSignal=/\b(?:apply|applications?|join our|become (?:a|an)|contributors?|freelancers?|start earning|paid tasks|open roles|open positions|job openings|we.re hiring|careers|vacancies)\b/i;
const articlePath=/\/(?:blog|news|article|posts?|reviews?|best-|alternatives|guides?)(?:\/|-|$)/i;
export function platformKey(url){
 const safe=safeUrl(url);if(!safe)return null;const u=new URL(safe),host=u.hostname.replace(/^www\./,'');
 if(!host.includes('.')||blocked.test(host)||u.port||articlePath.test(u.pathname))return null;
 if(ats.test(host)){const tenant=u.pathname.split('/').filter(Boolean)[0];return tenant?`${host}/${tenant.toLowerCase()}`:null;}
 return host.replace(/^(?:careers|jobs|join|apply|work)\./,'');
}
const known=new Set(AI_COMPANIES.map(i=>platformKey(i.url)));
export function platformFromResult(raw,query,now=Date.now()){
 if(query.category!=='ai-work')return null;
 const url=safeUrl(raw.url),key=platformKey(url);if(!url||!key||known.has(key))return null;
 const title=plainText(raw.title).slice(0,180),snippet=plainText(raw.content),page=plainText(raw.raw_content).slice(0,24000);
 const text=`${title} ${snippet} ${page}`;
 if(!aiSignal.test(text)||!intakeSignal.test(text)||!relevantOpportunity(title,text))return null;
 // Roundups remain news leads. A recruitment page or a root landing page is required.
 const u=new URL(url),careerPath=/\b(?:careers?|jobs?|join|contribut\w*|freelanc\w*|workers?|annotat\w*|earn|apply|signup|sign-up|participants?)\b/i.test(u.pathname);
 if(!careerPath&&u.pathname.replace(/\/$/,'')!=='')return null;
 if(/\b(?:best \d+|top \d+|list of|alternatives to|platforms compared)\b/i.test(title))return null;
 const sourceChecked=page.length>=150;
 const negative=/\b(?:not (?:currently )?hiring|no (?:current |open |available )?(?:roles|positions|vacancies)|applications (?:are )?closed)\b/i.test(page);
 const roles=sourceChecked&&!negative&&/open (?:roles|positions)|job openings|current vacancies|we.re hiring/i.test(page);
 const applications=sourceChecked&&!negative&&/apply now|sign up|start earning|become (?:a|an) |join our (?:community|team)|register as/i.test(page);
 const details=opportunityDetails(text,'ai-work');
 const time=new Date(now).toISOString();
 return {id:`platform-${stableId(key)}`,slug:`discovered-${stableId(key)}`,platformKey:key,title:title||key,url,source:u.hostname,sourceUrl:url,
   type:'company',category:'ai-work',workType:/training|annotation|contributor|RLHF|LLM evaluat|paid tasks/i.test(text)?'AI training & tasks':'AI company careers',
   region:'varies',official:false,discovered:true,discoveredAt:time,lastSeenAt:time,
   summary:(snippet||'A newly discovered recruitment source. Review the linked page and its ownership before applying.').slice(0,350),
   eligibility:'Country, identity, contract and payout requirements need confirmation on the provider’s own website.',
   roles:'See the source page for role and project requirements.',intake:roles?'roles':applications?'applications':'review',
   monitorStatus:sourceChecked?'source-checked':'needs-review',checkedAt:sourceChecked?time.slice(0,10):null,observedAt:time,
   evidence:sourceChecked?`Search provider retrieved source text. ${roles?'A vacancy signal was found.':applications?'An application signal was found.':'No current intake was confirmed.'} Platform ownership and Kenya eligibility need review.`:'Search result only; a current recruitment page has not been confirmed.',
   evidenceExcerpt:page.slice(0,1200),discoveryQuery:query.query,discoveryQueryId:query.id,
   ...details,startsAt:null,endsAt:null,endKind:'unknown',dateNote:'No single platform-wide opening or closing date has been verified. Check the individual role or project.',image:categoryImage('ai-work')};
}
export function followupLeads(raw,query){
 if(query.category!=='ai-work'||query.kind==='followup')return [];
 const text=String(raw.raw_content||'').slice(0,30000),found=[];
 for(const match of text.matchAll(/https?:\/\/[^\s<>\]"')]+/g)){
   const url=safeUrl(match[0]),key=platformKey(url);if(!url||!key||known.has(key)||ats.test(new URL(url).hostname))continue;
   if(!found.some(x=>x.platformKey===key))found.push({id:`follow-${stableId(key)}`,name:`Official recruitment source: ${key}`,platformKey:key,query:`site:${key} AI contributor careers apply paid tasks open roles`,category:'ai-work',region:'varies',kind:'followup'});
   if(found.length>=15)break;
 }return found;
}
export function mergePlatforms(previous=[],incoming=[],limit=5000){
 const map=new Map(previous.map(i=>[i.platformKey||platformKey(i.url),i]));
 for(const item of incoming){const key=item.platformKey||platformKey(item.url);if(!key||known.has(key))continue;const old=map.get(key);
  if(!old&&map.size>=limit)continue;
  const weaker=old?.monitorStatus==='source-checked'&&item.monitorStatus!=='source-checked';
  map.set(key,{...old,...(weaker?{lastSeenAt:item.lastSeenAt}:item),discoveredAt:old?.discoveredAt||item.discoveredAt});
 }return [...map.values()];
}
