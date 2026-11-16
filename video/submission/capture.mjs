import { chromium, prepareCapture } from '../production.mjs';
import path from 'node:path';
const production = prepareCapture();
import fs from 'node:fs';
const out=production.output+'assets/';
const browser=await chromium.launch({headless:true,...production.browserOptions});
const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,recordVideo:{dir:production.output+'raw/',size:{width:1920,height:1080}}});
const page=await context.newPage();
await page.goto(production.url);
await page.waitForTimeout(1500);
await page.evaluate(async()=>{
 const {createGame}=await import('/src/core/state.ts');
 const {startSolo,setLocalStation}=await import('/src/core/store.ts');
 const {coreActions}=await import('/src/core/coreActions.ts');
 const s=createGame(20261115,'weather-geo'); startSolo(s); coreActions.startGame();coreActions.setRunning(false);setLocalStation('planner');
});
await page.waitForTimeout(800);

const marks=[];
async function hold(name,seconds){marks.push({name,at:Date.now()});await page.screenshot({path:out+name+'.png'});await page.waitForTimeout(seconds*1000);}
await hold('opening',4);
await page.getByRole('button',{name:'Start planning',exact:true}).click();
await page.evaluate(async()=>{
 const {plannerActions:a}=await import('/src/stations/planner/logic.ts');
 const {getState}=await import('/src/core/store.ts');
 const {uiStore}=await import('/src/stations/planner/state/store.ts');
 const s=getState();window.cam=s.planner.rocket.spacecraft[0].equipment.find(p=>p.variant==='camera').id;
 a.setPartStat(window.cam,'performance',3);
 uiStore.update(u=>{u.viewCenter='earth';});
});
await page.waitForTimeout(300);
await page.locator('.rt-name').filter({hasText:'Orbital camera'}).hover();
await page.waitForTimeout(700);await hold('camera-before',2);
await page.evaluate(async()=>{const {plannerActions:a}=await import('/src/stations/planner/logic.ts');a.setPartStat(window.cam,'performance',4.5);});
await page.locator('.rt-name').filter({hasText:'Orbital camera'}).hover();await page.waitForTimeout(700);await hold('camera-after',4);await page.mouse.move(900,450);
await page.evaluate(async()=>{const {setLocalStation}=await import('/src/core/store.ts');setLocalStation('science');});
await page.waitForTimeout(400);await page.getByText('Larger sensor arrays',{exact:true}).first().click();await page.waitForTimeout(300);await hold('science',3);
await page.evaluate(async()=>{const {plannerActions:a}=await import('/src/stations/planner/logic.ts');a.orderAllParts();const {setLocalStation}=await import('/src/core/store.ts');setLocalStation('procurement');});
await page.waitForTimeout(400);await page.getByText('Taiga KL-2000',{exact:true}).first().click();await page.waitForTimeout(300);await hold('procurement',3);
await page.evaluate(async()=>{const {setLocalStation}=await import('/src/core/store.ts');setLocalStation('comms');});
await page.waitForTimeout(400);await page.getByRole('button',{name:'Start',exact:true}).click();await page.getByRole('button',{name:'Start a project',exact:false}).first().click();await page.waitForTimeout(300);await hold('comms',3);
await page.evaluate(async()=>{
 const {setLocalStation,getState}=await import('/src/core/store.ts');
 const {plannerActions:a}=await import('/src/stations/planner/logic.ts');
 const {uiStore}=await import('/src/stations/planner/state/store.ts');
 const tank=getState().planner.rocket.stages[1].tanks[0].id;a.setPartStat(tank,'fuelT',3);
 a.addManeuver('branch-root',{id:'video-launch',type:'launch',body:'earth',altitudeKm:200});
 a.addManeuver('branch-root',{id:'video-geo',type:'changeOrbit',altitudeKm:35786});
 setLocalStation('planner');uiStore.update(u=>{u.viewCenter='earth';u.mapDay=181;});
});
await page.waitForTimeout(500);await hold('evaluation',6);
await hold('ending',4);
console.log((await page.locator('body').innerText()).slice(-5000));
await context.close();
const video=await page.video().path();
fs.writeFileSync(out+'capture.json',JSON.stringify({video:'../raw/'+path.basename(video),marks},null,2));
console.log(video);
await browser.close();
