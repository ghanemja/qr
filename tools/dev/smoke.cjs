const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for(const u of ['index.html','c/3m.html','map.html','companies.html','about.html']){const p=await b.newPage();const bad=[];
p.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});p.on('pageerror',e=>bad.push('ERR '+e.message));
await p.goto('http://localhost:8123/qr/'+u);await p.waitForTimeout(3000);console.log(u,bad.length?bad:'ok');}
await b.close()})();
