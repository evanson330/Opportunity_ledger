import { createHash } from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';
import { DIRECTORY } from '../public/catalog.js';
import { opportunityDetails,categoryImage } from '../public/opportunity-data.js';

const parser = new XMLParser({ignoreAttributes:false, attributeNamePrefix:'@_',
  processEntities:false, trimValues:true, parseTagValue:false});
const array = x => x == null ? [] : Array.isArray(x) ? x : [x];
const str = x => typeof x === 'string' ? x : typeof x === 'number' ? String(x) : x?.['#text'] || '';

export function plainText(input) {
  return str(input).replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,
    x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '})[x])
    .replace(/&#(\d+);/g,(_,n)=>{const p=Number(n);return p>0&&p<0x110000?String.fromCodePoint(p):'';})
    .replace(/<[^>]*>/g,' ').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
}
export function safeUrl(input) {
  try {
    if(String(input).length>2048)return null;
    const u = new URL(String(input));
    if(!['https:','http:'].includes(u.protocol) || u.username || u.password) return null;
    const h = u.hostname.toLowerCase();
    if(h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||h.endsWith('.internal')||h.startsWith('[')||/^0\.|^127\.|^10\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[01])\.|^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|^(?:22[4-9]|23\d|24\d|25[0-5])\./.test(h)) return null;
    return u.href;
  } catch { return null; }
}
export function canonicalUrl(input) {
  const valid = safeUrl(input); if(!valid) return null;
  const u=new URL(valid);u.hash='';
  for(const key of [...u.searchParams.keys()]) if(/^(utm_|fbclid$|gclid$)/i.test(key)) u.searchParams.delete(key);
  return u.href.replace(/\/$/,'');
}
export const stableId = value => createHash('sha256').update(value).digest('hex').slice(0,20);
export function relevantOpportunity(title,summary='') {
  return !/\b(casino|sports?\s*betting|betting\s*(?:offer|bonus|site)|slot\s*bonus|forex\s*signals|crypto\s*signals|guaranteed\s*(?:profit|returns))\b/i.test(title+' '+summary);
}
export function validDate(value, now=Date.now()) {
  const time=Date.parse(value);
  return Number.isFinite(time)&&time>0&&time<=now+86400000 ? new Date(time).toISOString() : null;
}
export function isOfficialUrl(input) {
  const url=safeUrl(input);if(!url)return false;
  const domain=new URL(url).hostname.replace(/^www\./,'');
  return domain.endsWith('.gov') || domain.endsWith('.go.ke') || DIRECTORY.some(d=>{
    const knownUrl=new URL(d.url),known=knownUrl.hostname.replace(/^www\./,'');
    if(/(?:lever\.co|greenhouse\.io|ashbyhq\.com|workable\.com|smartrecruiters\.com)$/.test(known)){
      const path=knownUrl.pathname.replace(/\/$/,'');return domain===known&&(new URL(url).pathname===path||new URL(url).pathname.startsWith(path+'/'));
    }
    return domain===known||domain.endsWith('.'+known);
  });
}
export function parseFeed(xml, stream, now=Date.now()) {
  if(/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Unsupported XML declarations');
  const doc=parser.parse(xml);
  const channel=doc?.rss?.channel;
  const entries=array(channel?.item ?? doc?.feed?.entry);
  if(!channel&&!doc?.feed) throw new Error('Not an RSS or Atom feed');
  return entries.slice(0,70).flatMap(raw=>{
    const atomLink=array(raw.link).find(l=>l?.['@_rel']==='alternate') || array(raw.link)[0];
    const url=safeUrl(str(raw.link)||atomLink?.['@_href']);
    const title=plainText(raw.title).slice(0,240);
    const publishedAt=validDate(str(raw.pubDate||raw.published||raw.updated),now);
    // No invented publication dates. Ignore dated articles outside the 30-day window.
    if(!url||!title||(publishedAt&&now-Date.parse(publishedAt)>31*86400000))return [];
    const sourceUrl=safeUrl(raw.source?.['@_url']);
    const source=plainText(raw.source||channel?.title||doc.feed?.title||stream.name).slice(0,100);
    const cleanTitle=source&&title.endsWith(' - '+source)?title.slice(0,-source.length-3):title;
    const snippet=plainText(raw.description||raw.summary||raw['content:encoded']);
    if(!relevantOpportunity(cleanTitle,snippet))return [];
    const details=opportunityDetails(cleanTitle+' '+snippet,stream.category);
    return [{id:stableId(canonicalUrl(url)),title:cleanTitle,...details,image:categoryImage(stream.category),
      summary:snippet.replace(cleanTitle,'').replace(/^[\s–—-]+/,'').slice(0,300),
      url,source,sourceUrl,category:stream.category,region:stream.region,
      publishedAt,discoveredAt:new Date(now).toISOString(),type:'news',
      official:isOfficialUrl(sourceUrl||url),streamId:stream.id,
      eligibility:'Read source for availability and eligibility'}];
  });
}
export function normalizeSearchResult(raw, stream, now=Date.now()) {
  const url=safeUrl(raw.url);const title=plainText(raw.title).slice(0,240);
  if(!url||!title||!relevantOpportunity(title,plainText(raw.content)))return null;
  const details=opportunityDetails(title+' '+plainText(raw.raw_content||raw.content).slice(0,20000),stream.category);
  if(raw.raw_content)details.dateNote=details.startsAt||details.endsAt?'Dates extracted from the source page. Confirm eligibility, timezone and any amended terms.':'The source page did not publish an explicit opening or closing date.';
  return {id:stableId(canonicalUrl(url)),title,...details,image:categoryImage(stream.category),summary:plainText(raw.content).slice(0,300),url,
    source:new URL(url).hostname.replace(/^www\./,''),sourceUrl:new URL(url).origin,
    category:stream.category,region:stream.region,publishedAt:validDate(raw.published_date,now),
    discoveredAt:new Date(now).toISOString(),type:'discovery',official:isOfficialUrl(url),
    streamId:stream.id,eligibility:'Read source for availability and eligibility'};
}
export function dedupe(items) {
  const urls=new Set(),titles=new Set();
  return items.filter(item=>{
    const url=canonicalUrl(item.url),title=item.title.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
    if(!url||urls.has(url)||titles.has(title))return false;
    urls.add(url);titles.add(title);return true;
  }).sort((a,b)=>Date.parse(b.publishedAt||b.discoveredAt||0)-Date.parse(a.publishedAt||a.discoveredAt||0));
}
export function matchesAlert(item,{categories=[],keywords=[],region=''}={}) {
  return (!categories.length||categories.includes(item.category)) &&
    (!region||item.region===region) &&
    (!keywords.length||keywords.some(k=>(item.title+' '+item.summary+' '+item.source).toLowerCase().includes(k.toLowerCase())));
}
export const escapeHtml = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
