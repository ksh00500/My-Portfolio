/** GET-only smoke tests: never writes/changes the running DB. */
const origin=process.env.PORTFOLIO_BASE_URL||'http://127.0.0.1:3001';
const paths=['/api/health','/api/portfolio','/api/projects','/api/technologies','/api/experience','/api/recognition',
 '/ko','/en','/ko/projects','/en/projects','/ko/projects/senro','/ko/experience','/ko/recognition','/admin'];
let failures=0;
for(const path of paths){
 try{const r=await fetch(new URL(path,origin),{redirect:'manual',signal:AbortSignal.timeout(10000)});
   const ok=r.status===200 || (path==='/admin'&&r.status===307);
   if(path==='/api/projects'||path==='/api/technologies'){
    const data=await r.json();if(!Array.isArray(data.items))throw new Error('items is not an array');
    console.log(path,`HTTP ${r.status}`,`items=${data.items.length}`);
   }else console.log(path,`HTTP ${r.status}`,ok?'OK':'ERROR');
   if(!ok)failures++;
 }catch(e){failures++;console.error(path,'NOT VERIFIED:',e.name||'error');}
}
if(failures)process.exitCode=1;
