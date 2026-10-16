import { matchesAlert,escapeHtml,safeUrl } from './normalize.js';
import { categoryName,regionName } from '../public/catalog.js';
const split=value=>(value||'').split(',').map(x=>x.trim()).filter(Boolean);
export function selectDigestItems(items,seen=[],env=process.env) {
  const ids=new Set(seen);const rules={categories:split(env.ALERT_CATEGORIES),keywords:split(env.ALERT_KEYWORDS),region:env.ALERT_REGION||''};
  return items.filter(i=>!ids.has(i.id)&&matchesAlert(i,rules)).slice(0,20);
}
export async function sendDigest(items,{env=process.env,fetcher=fetch,idempotencyKey}={}) {
  if(!items.length)return {sent:false,reason:'No new matches'};
  if(!env.RESEND_API_KEY||!env.ALERT_EMAIL||!env.ALERT_FROM)return {sent:false,reason:'Email is not configured'};
  const base=safeUrl(env.SITE_URL);
  const html=`<div style="font-family:Georgia,serif;color:#242424;max-width:620px;margin:auto"><p style="letter-spacing:3px;color:#8a6f31">THE OPPORTUNITY LEDGER</p><h1>Your daily opportunity briefing</h1><p>${items.length} newly discovered links. Review each source for location, availability, and eligibility.</p>${items.map(i=>`<div style="border-top:1px solid #ddd;padding:18px 0"><small>${escapeHtml(categoryName(i.category))} · ${escapeHtml(regionName(i.region))}</small><h2 style="font-size:21px"><a href="${escapeHtml(i.url)}">${escapeHtml(i.title)}</a></h2><p>${escapeHtml(i.summary)}</p><small>${escapeHtml(i.source)} · ${i.publishedAt?escapeHtml(new Date(i.publishedAt).toLocaleDateString('en-US')):'Publication date unavailable'}</small></div>`).join('')}${base?`<p><a href="${escapeHtml(base)}">Open your ledger →</a></p>`:''}<p style="color:#777;font-size:12px">You configured this private digest in your Vercel project. Remove ALERT_EMAIL or RESEND_API_KEY to stop delivery. A newly discovered link may refer to an older or closed opportunity.</p></div>`;
  const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json',...(idempotencyKey?{'Idempotency-Key':idempotencyKey}:{})},
    body:JSON.stringify({from:env.ALERT_FROM,to:[env.ALERT_EMAIL],subject:`Your opportunity briefing · ${items.length} new links`,html}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error(`Email delivery failed (${response.status})`);
  return {sent:true,count:items.length};
}
