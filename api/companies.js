import {getCompanies} from '../lib/companies.js';
import {json} from '../lib/http.js';
export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return json(res,405,{error:'Method not allowed'});}
  try{return json(res,200,await getCompanies(),'public, s-maxage=3600, stale-while-revalidate=3600');}
  catch{return json(res,503,{error:'Company source checks are unavailable. The reviewed directory remains available.'});}
}
