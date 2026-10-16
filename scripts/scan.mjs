const input=process.argv[2];
let url;try{url=new URL('/api/scan',input);if(url.protocol!=='https:')throw new Error();}catch{console.error('Usage: npm run scan -- https://your-production-site.vercel.app');process.exit(1);}
if(!process.env.CRON_SECRET){console.error('Set CRON_SECRET in this terminal. Never commit it to GitHub or pass it in a URL.');process.exit(1);}
try{const r=await fetch(url,{method:'POST',redirect:'error',headers:{Authorization:`Bearer ${process.env.CRON_SECRET}`},signal:AbortSignal.timeout(185000)});const data=await r.json();console.log(JSON.stringify(data,null,2));if(!r.ok)process.exitCode=1;}catch{console.error('Could not complete the batch. Check your production URL, service configuration and function logs.');process.exitCode=1;}
