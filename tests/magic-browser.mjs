import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({viewport:{width:1440,height:1080}});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
try {
 await page.goto('http://localhost:3000/templates/enchanted');
 await page.locator('.magic-world[data-ready="true"] canvas').waitFor({timeout:30000});
 await page.waitForTimeout(1500);
 await page.screenshot({path:'/private/tmp/protea-magic-desktop.png',fullPage:true});
 if(process.argv.includes('--visual')) { if(errors.length)throw Error(errors.join('\n')); console.log('PASS: visual render without shader errors'); await browser.close(); process.exit(0); }
 const canvas=page.locator('.magic-world canvas');
 if(await canvas.getAttribute('data-camera-mode')!=='third-person') throw Error('Default camera is not third person');
 if(Number(await canvas.getAttribute('data-camera-height'))>5) throw Error('Camera is still overhead');
 const worldBox=await canvas.boundingBox();
 const originalYaw=Number(await canvas.getAttribute('data-camera-yaw'));
 const originalX=await page.getByTestId('couple').getAttribute('data-x');
 await page.mouse.move(worldBox.x+worldBox.width*.5,worldBox.y+worldBox.height*.46);
 await page.mouse.down();
 await page.mouse.move(worldBox.x+worldBox.width*.75,worldBox.y+worldBox.height*.46,{steps:8});
 await page.mouse.up();
 await page.waitForTimeout(300);
 if(Math.abs(Number(await canvas.getAttribute('data-camera-yaw'))-originalYaw)<.2) throw Error('Drag did not orbit camera');
 if(await page.getByTestId('couple').getAttribute('data-x')!==originalX) throw Error('Camera drag also moved player');
 await page.reload();
 await page.locator('.magic-world[data-ready="true"] canvas').waitFor({timeout:30000});
 for(const viewport of [{width:1440,height:1080},{width:390,height:844},{width:768,height:1024},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(200);
  const frame=await page.locator('.magic-page').boundingBox();
  const game=await page.locator('.magic-game').boundingBox();
  if(!frame||frame.width>480||frame.width>=frame.height||frame.y+frame.height>viewport.height+1) throw Error(`Not a portrait frame: ${JSON.stringify(frame)}`);
  if(!game||game.width>=game.height) throw Error(`Game is not portrait: ${JSON.stringify(game)}`);
  if(Math.abs(game.width-frame.width)>1||Math.abs(game.height-frame.height)>1||Math.abs(game.y-frame.y)>1) throw Error('Game does not fill portrait viewport');
  if(await page.locator('.magic-page header,.magic-page footer,.magic-page h1,.magic-world-title,.magic-below').count()) throw Error('Page chrome remains');
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight+1)) throw Error('Portrait page overflows');
  for(const control of await page.locator('.magic-page button:not(.modal button)').all()){
   const box=await control.boundingBox();if(box&&(box.x<frame.x-1||box.x+box.width>frame.x+frame.width+1||box.y<0||box.y+box.height>viewport.height+1))throw Error('Control outside portrait frame');
  }
  await page.screenshot({path:`/private/tmp/protea-portrait-3d-${viewport.width}.png`});
 }
 await page.setViewportSize({width:1440,height:1080});

 await page.getByRole('button',{name:'Lihat dunia',exact:true}).click();
 if(await page.getByRole('button',{name:'Ikuti karakter',exact:true}).getAttribute('aria-pressed')!=='true') throw Error('Overview camera toggle failed');
 await page.getByRole('button',{name:'Ikuti karakter',exact:true}).click();
 await page.keyboard.down('w'); await page.waitForTimeout(350); await page.keyboard.up('w');
 if(Number(await page.getByTestId('couple').getAttribute('data-x'))<=210) throw Error('Keyboard movement failed');
 const labels=[['Surat dari burung hantu','Etalase mantra cinta'],['Jam desa ajaib','Toko ramuan cinta'],['Jembatan harapan','Gerbang perayaan']];
 for(let s=0;s<3;s++){
  for(const label of labels[s]){
   await page.locator('.magic-quest').getByRole('button',{name:label}).click();
   await page.getByRole('dialog').waitFor({timeout:15000});
   const stopped=await page.getByTestId('couple').getAttribute('data-x');
   await page.keyboard.press('d');
   if(await page.getByTestId('couple').getAttribute('data-x')!==stopped) throw Error('Movement continued behind dialog');
   await page.getByRole('button',{name:'Lanjutkan petualangan'}).click();
   await page.waitForTimeout(200);
   if(await page.getByRole('dialog').count()) throw Error('Dialog reopened without leaving beacon');
  }
  await page.screenshot({path:`/private/tmp/protea-magic-3d-scene-${s}.png`});
  if(s<2) await page.getByRole('button',{name:`Menuju ${s===0?'Pedesaan':'Kastil'}`}).click();
 }
 await page.getByRole('button',{name:'Kirim RSVP'}).click();
 await page.getByRole('dialog').waitFor();
 await page.getByRole('button',{name:'Close dialog'}).click();
 await page.getByRole('button',{name:'Buka buku undangan'}).click();
 if(await page.locator('.magic-book-row:disabled').count()) throw Error('Missing collected letters');
 await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'/private/tmp/protea-magic-mobile.png',fullPage:true});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('Mobile overflow');
 await page.reload();
 await page.locator('.magic-world[data-ready="true"] canvas').waitFor({timeout:30000});
 const before=Number(await page.getByTestId('couple').getAttribute('data-x'));
 const right=page.getByRole('button',{name:'Jalan ke atas'}); const box=await right.boundingBox();
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2); await page.mouse.down();await page.waitForTimeout(450);await page.mouse.up();
 if(Number(await page.getByTestId('couple').getAttribute('data-x'))<=before+30) throw Error('Touch pad movement failed');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForTimeout(300);
 if(errors.length) throw Error(errors.join('\n'));
 console.log('PASS: Three.js canvas, keyboard, mobile controls, all six proximity triggers, three scenes, journal, RSVP dialog, no overflow or browser errors.');
} finally {await browser.close();}
