export function hasStorage(env=process.env) {return Boolean(env.UPSTASH_REDIS_REST_URL&&env.UPSTASH_REDIS_REST_TOKEN);}
export async function redis(command, {env=process.env,fetcher=fetch}={}) {
  if(!hasStorage(env))return null;
  const u=new URL(env.UPSTASH_REDIS_REST_URL);
  if(u.protocol!=='https:')throw new Error('Redis requires HTTPS');
  const r=await fetcher(u.href,{method:'POST',headers:{Authorization:`Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,'Content-Type':'application/json'},
    body:JSON.stringify(command),signal:AbortSignal.timeout(5000)});
  if(!r.ok)throw new Error(`Cache unavailable (${r.status})`);
  const data=await r.json();if(data.error)throw new Error('Cache command failed');return data.result;
}
export async function readJson(key,opts) {
 const r=await redis(['GET',key],opts);if(!r)return null;const data=JSON.parse(r);
 return data?._ledgerEncoding==='gzip'?JSON.parse(gunzipSync(Buffer.from(data.data,'base64'),{maxOutputLength:32_000_000}).toString('utf8')):data;
}
export async function writeJson(key,value,ttl=172800,opts) {
 const json=JSON.stringify(value);const payload=Buffer.byteLength(json)>200_000?JSON.stringify({_ledgerEncoding:'gzip',data:gzipSync(json).toString('base64')}):json;
 return redis(['SET',key,payload,'EX',ttl],opts);
}
import {gzipSync,gunzipSync} from 'node:zlib';
