import {json} from '../lib/http.js';
import {hasStorage,readJson} from '../lib/storage.js';
import {SEARCH_KEY,searchSummary} from '../lib/search.js';
export default async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return json(res,405,{error:'Method not allowed'});}
 try{const state=hasStorage()?await readJson(SEARCH_KEY):null;
  return json(res,200,{...searchSummary(state),persistentCache:hasStorage(),ready:Boolean(process.env.TAVILY_API_KEY&&process.env.CRON_SECRET&&hasStorage())},'public, s-maxage=30');
 }catch{return json(res,503,{error:'Discovery progress is unavailable. Existing records were retained.'});}
}
