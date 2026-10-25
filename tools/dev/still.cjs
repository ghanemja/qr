const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const S=(process.env.DEV_OUT||'/tmp/qr-dev')+'/';const [slug,out,w,h]=process.argv.slice(2);
const p=await b.newPage({viewport:{width:+w||1300,height:+h||1100},deviceScaleFactor:1});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://localhost:8123/qr/c/${slug}.html`);await p.waitForTimeout(800);
await p.evaluate(()=>document.querySelector('#stage canvas').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));
await p.waitForTimeout(+(process.argv[6]||4500));await p.screenshot({path:S+out+'.png'});console.log(errs);await b.close()})();
