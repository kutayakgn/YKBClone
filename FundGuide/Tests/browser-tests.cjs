const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const {html,data,build}=require('./build-preview.cjs');
const root=path.resolve(__dirname,'..');
(async()=>{
 build();const all=data(); let checks=0;
 const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/Preview/case.html'){
   res.setHeader('Content-Type','text/html; charset=utf-8');
   return res.end(html(Number(url.searchParams.get('size')||0),Number(url.searchParams.get('feeds')||1),url.searchParams.has('empty')?[]:url.searchParams.has('gap')?all.filter(r=>r.year!==2021):undefined));
  }
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.pdf':'application/pdf'})[path.extname(file)]||'application/octet-stream');
  res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const page=await browser.newPage({viewport:{width:885,height:760}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  async function load(query=''){await page.goto(base+'/Preview/case.html'+query,{waitUntil:'networkidle'});}
  async function choose(year,scope=page){await scope.locator('[data-fg-trigger]').click();await scope.locator('[data-fg-option][data-value="'+year+'"]').click();}
  const visibleRows=()=>page.locator('[data-ct-row]:visible').count();
  async function check(name,fn){await fn();checks++;console.log('PASS '+name);}
  await check('Latest year, one-column monthly table, PageSize=0',async()=>{await load();assert.equal(await visibleRows(),9);assert.equal(await page.locator('[data-fg-group]:visible th').count(),1);assert.equal(await page.locator('[data-ct-pagination]').isVisible(),false);});
  await check('All seven year options come from rows and descend',async()=>{assert.deepEqual(await page.locator('[data-fg-option]').allTextContents(),['2026','2025','2024','2023','2022','2021','2020']);});
  await check('Search, pending selection, Show applies legacy table without navigation',async()=>{
   const before=page.url();let navigations=0;page.on('framenavigated',()=>navigations++);
   await page.locator('[data-fg-trigger]').click();await page.getByRole('searchbox').fill('2025');assert.equal(await page.locator('[data-fg-option]:visible').count(),1);
   await page.getByRole('option',{name:'2025',exact:true}).click();assert.equal(await visibleRows(),9);assert.equal(await page.locator('[data-fg-panel]').isVisible(),false);
   await page.getByRole('button',{name:'Göster',exact:true}).click();assert.equal(await visibleRows(),424);assert.equal(await page.locator('[data-fg-group]:visible th').count(),2);assert.equal(page.url(),before);assert.equal(navigations,0);
  });
  await check('Every year returns exactly the live row count',async()=>{for(const year of [2024,2023,2022,2021,2020,2026]){await choose(year);await page.getByRole('button',{name:'Göster',exact:true}).click();assert.equal(await visibleRows(),all.filter(r=>r.year===year).length);}});
  await check('No-match year search and Escape close',async()=>{await page.locator('[data-fg-trigger]').click();await page.getByRole('searchbox').fill('1999');assert.equal(await page.locator('[data-fg-no-year]').isVisible(),true);await page.getByRole('searchbox').press('Escape');assert.equal(await page.locator('[data-fg-panel]').isVisible(),false);});
  await check('PageSize=10, both-end arrows, last page and filter reset',async()=>{await load('?size=10');await choose(2025);await page.getByRole('button',{name:'Göster',exact:true}).click();assert.equal(await visibleRows(),10);assert.equal(await page.getByRole('button',{name:'İlk sayfa',exact:true}).isDisabled(),true);await page.getByRole('button',{name:'Son sayfa',exact:true}).click();assert.equal(await visibleRows(),4);assert.equal(await page.getByRole('button',{name:'Sonraki sayfa',exact:true}).isDisabled(),true);await choose(2026);await page.getByRole('button',{name:'Göster',exact:true}).click();assert.equal(await visibleRows(),9);assert.equal(await page.locator('[data-ct-pagination]').isVisible(),false);});
  await check('A missing year never appears in dropdown',async()=>{await load('?gap=1');assert.equal(await page.locator('[data-fg-option][data-value="2021"]').count(),0);});
  await check('Two independent instances and repeat init',async()=>{await load('?feeds=2');const first=page.locator('#feed-0'),second=page.locator('#feed-1');await choose(2020,first);await first.getByRole('button',{name:'Göster',exact:true}).click();assert.equal(await first.locator('[data-ct-row]:visible').count(),239);assert.equal(await second.locator('[data-ct-row]:visible').count(),9);await page.evaluate(()=>{window.YKB.FundGuide.init();window.YKB.CustomTableFeeds.init();});assert.equal(await first.locator('[data-ct-row]:visible').count(),239);});
  await check('Empty tables render without crash',async()=>{await load('?empty=1');assert.equal(await page.locator('[data-fg-trigger]').isDisabled(),true);assert.equal(await page.locator('[data-ct-empty]').isVisible(),true);});
  await check('Desktop, tablet, 390px and 320px have no overflow in either table',async()=>{await load();for(const width of [1200,885,768,390,320]){await page.setViewportSize({width,height:760});for(const year of [2026,2025]){await choose(year);await page.getByRole('button',{name:'Göster',exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}}});
  await check('Every link has new-tab attributes, relative media address and correct file',async()=>{const links=await page.locator('[data-ct-row] a').evaluateAll(nodes=>nodes.map(n=>({href:n.getAttribute('href'),target:n.target,rel:n.rel})));for(const link of links){assert.equal(link.target,'_blank');assert.ok(link.rel.includes('noopener'));assert.ok(link.href.startsWith('../Export/'));await fs.access(path.resolve(root,'Preview',link.href));}});
  await page.setViewportSize({width:885,height:760});await load();await page.screenshot({path:path.join(root,'Preview/desktop-monthly.png')});await choose(2025);await page.getByRole('button',{name:'Göster',exact:true}).click();await page.screenshot({path:path.join(root,'Preview/desktop-legacy.png')});await page.locator('[data-fg-trigger]').click();await page.screenshot({path:path.join(root,'Preview/dropdown.png')});await page.getByRole('searchbox').press('Escape');await page.setViewportSize({width:390,height:760});await page.screenshot({path:path.join(root,'Preview/mobile.png')});
  assert.deepEqual(errors,[]);console.log('RESULT '+checks+' checks passed');
  await fs.writeFile(path.join(root,'Tests/verification-summary.json'),JSON.stringify({browserChecksPassed:checks,rows:all.length,years:[2026,2025,2024,2023,2022,2021,2020],kenticoCompilationVerified:false,kenticoImportExecuted:false},null,2)+'\n');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
