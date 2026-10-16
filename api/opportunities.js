import { getFeed } from '../lib/discovery.js';
import { hasStorage } from '../lib/storage.js';
import { json } from '../lib/http.js';
export default async function handler(req,res) {
  if(req.method!=='GET'){res.setHeader('Allow','GET');return json(res,405,{error:'Method not allowed'});}
  try {
    const data=await getFeed();
    return json(res,200,{...data,configuration:{persistentCache:hasStorage(),
      deepSearch:Boolean(process.env.TAVILY_API_KEY&&hasStorage()&&process.env.CRON_SECRET),
      emailDigest:Boolean(process.env.RESEND_API_KEY&&process.env.ALERT_EMAIL&&process.env.ALERT_FROM&&hasStorage()&&process.env.CRON_SECRET),
      cronProtected:Boolean(process.env.CRON_SECRET)},coverage:'Sources are monitored, not the entire internet. Check each source for current terms and eligibility.'},'public, s-maxage=300, stale-while-revalidate=600');
  } catch {return json(res,503,{error:'The live scan could not complete. Try again shortly.',items:[]});}
}
