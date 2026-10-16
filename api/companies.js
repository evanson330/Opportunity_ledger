import {getCompanies} from '../lib/companies.js';
import {json} from '../lib/http.js';
export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return json(res,405,{error:'Method not allowed'});}
  try{
    const data=await getCompanies();const value=new URL(req.url||'/api/companies','https://ledger.local').searchParams.get('offset');
    const offset=Math.max(0,Math.min(10000,Number.parseInt(value,10)||0)),size=128;
    return json(res,200,{...data,companies:data.companies.slice(offset,offset+size),offset,nextOffset:offset+size<data.companies.length?offset+size:null},'public, s-maxage=30, stale-while-revalidate=30');
  }
  catch{return json(res,503,{error:'Company source checks are unavailable. The reviewed directory remains available.'});}
}
