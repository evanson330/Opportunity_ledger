import { timingSafeEqual } from 'node:crypto';
export function authorized(req,env=process.env) {
  if(!env.CRON_SECRET)return false;
  const actual=Buffer.from(req.headers?.authorization||'');const expected=Buffer.from(`Bearer ${env.CRON_SECRET}`);
  return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export function json(res,status,data,cache='no-store') {
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control',cache);
  res.statusCode=status;return res.end(JSON.stringify(data));
}
