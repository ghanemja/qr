// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Janelle Ghanem. QR Compass, https://ghanemja.github.io/qr/
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const [ids,out,cols,ts,px]=[process.argv[2]||"",process.argv[3]||"gal",process.argv[4]||"8",process.argv[5]||"0",process.argv[6]||"200"];
const p=await b.newPage({viewport:{width:(+px+2)*+cols,height:800}});p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
await p.goto(`http://localhost:${process.env.PORT||8123}/gallery/index.html?v=${Date.now()}&ids=${ids}&ts=${ts}&px=${px}${process.argv[7] ? `&pt=${process.argv[7]}` : ""}`);await p.addStyleTag({content:`#g{--cols:${cols}}`});
await p.waitForFunction(()=>document.title.startsWith('done'),null,{timeout:300000});console.log(await p.title());
await p.screenshot({path:`${process.env.DEV_OUT||'/tmp/qr-dev'}/${out}.png`,fullPage:true});await b.close()})();
