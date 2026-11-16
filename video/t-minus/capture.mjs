import { chromium, prepareCapture } from '../production.mjs';
import path from 'node:path';
const production = prepareCapture();
import fs from 'node:fs';
const root=production.output;
const browser=await chromium.launch({headless:true,...production.browserOptions});
const ctx=await browser.newContext({viewport:{width:1920,height:1080},recordVideo:{dir:root+'raw',size:{width:1920,height:1080}}});
const page=await ctx.newPage();const t0=Date.now();
await page.goto(production.url);await page.waitForTimeout(1200);
const marks=[];async function shot(name,sec){marks.push({name,at:(Date.now()-t0)/1000});await page.screenshot({path:root+'assets/'+name+'.png'});await page.waitForTimeout(sec*1000);}
await shot('title',3);
await page.evaluate(async()=>{
 const store=await import('/src/core/store.ts');const {createGame}=await import('/src/core/state.ts');const {coreActions:c}=await import('/src/core/coreActions.ts');const {plannerActions:p}=await import('/src/stations/planner/logic.ts');const {uiStore:u}=await import('/src/stations/planner/state/store.ts');
 window.v={store,c,p,u};store.startSolo(createGame(20261115,'weather-geo'));c.startGame();c.setRunning(false);store.setLocalStation('planner');p.addManeuver('branch-root',{id:'tr-launch',type:'launch',body:'earth',altitudeKm:200});p.addManeuver('branch-root',{id:'tr-geo',type:'changeOrbit',altitudeKm:35786});u.update(x=>{x.viewCenter='earth';x.mapDay=181;});
});
await page.getByRole('button',{name:'Start planning',exact:true}).click();await page.waitForTimeout(300);await shot('problem',3);
await page.evaluate(async()=>{v.store.setLocalStation('science');});await page.waitForTimeout(300);await page.getByText('Larger sensor arrays',{exact:true}).first().click();await shot('science-before',2);
await page.evaluate(async()=>{const {scienceActions:s}=await import('/src/stations/science/logic.ts');s.startTech('tr-sensor','large-sensor');s.startTech('tr-band','ka-band');});await shot('science',3);
await page.evaluate(async()=>{v.p.setPartStat(v.store.getState().planner.rocket.stages[1].tanks[0].id,'fuelT',3);v.p.orderAllParts();v.store.setLocalStation('procurement');});await page.waitForTimeout(300);await page.getByText('Taiga KL-2000',{exact:true}).first().click();await shot('procurement',3);
await page.evaluate(async()=>{const {procurementActions:p}=await import('/src/stations/procurement/logic.ts');const {offersForCriterion,quoteOrder}=await import('/src/stations/procurement/rules.ts');let s=v.store.getState();let t=s.market.tasks.find(t=>t.criteria[0].partKind==='engine');let best=offersForCriterion(s,t,t.criteria[0]).find(a=>a.fits&&!a.unavailable&&a.affordable);if(best)p.signOffer(best.offer.id,t.id,t.criteria[0].id);});await shot('contract',2);
await page.evaluate(async()=>{v.store.setLocalStation('comms');});await page.waitForTimeout(300);await page.getByRole('button',{name:'Start',exact:true}).click();await page.getByRole('button',{name:'Start a project',exact:false}).first().click();await shot('comms',3);
await page.evaluate(async()=>{const {commsActions:c}=await import('/src/stations/comms/logic.ts');c.startProject('wx-northgate-test-crew');});
await page.evaluate(async()=>{
 const {procurementActions:p}=await import('/src/stations/procurement/logic.ts');const r=await import('/src/stations/procurement/rules.ts');
 // Advance real reducers, retaining costs, research outcomes and contract lead times.
 v.p.setLaunchDay(350);v.c.tick(65);
 for(let attempt=0;attempt<2;attempt++){
  const s=v.store.getState();const {scienceActions:sc}=await import('/src/stations/science/logic.ts');
  for(const id of ['large-sensor','ka-band'])if(!s.science.researched.includes(id))sc.startTech('retry-'+id+'-'+attempt,id);
  v.c.tick(130+attempt*65);
 }
 for(const t0 of v.store.getState().market.tasks){const s=v.store.getState(),t=s.market.tasks.find(x=>x.id===t0.id),c=t.criteria[0];if(r.criterionCoverage(s,t,c).missing<1)continue;const best=r.offersForCriterion(s,t,c).find(a=>a.fits&&!a.unavailable&&a.affordable);if(best)p.signOffer(best.offer.id,t.id,c.id);}
 const s=v.store.getState();console.log('contracts',s.market.contracts.length);const last=Math.max(...s.market.contracts.map(k=>k.expectedAt));console.log('latest',last);
 const launch=Math.min(390,Math.ceil(last)+1);v.p.setLaunchDay(launch);v.c.tick(launch-1);v.store.setLocalStation('planner');v.u.update(x=>{x.viewCenter='earth';x.mapDay=launch;});
});
await page.waitForTimeout(400);await shot('ready',3);
await page.evaluate(async()=>{v.p.launchNow();const {computeMissionResult}=await import('/src/stations/planner/result.ts');window.result=computeMissionResult(v.store.getState());const {actions}=await import('/src/stations/planner/state/store.ts');actions.startPlaythrough(window.result);v.u.update(x=>{if(x.playthrough)x.playthrough.daysPerSecond=7;});});
await shot('flight',5);
await page.evaluate(async()=>{const {actions}=await import('/src/stations/planner/state/store.ts');actions.finishPlaythrough();});await shot('result',4);
console.log(JSON.stringify(await page.evaluate(()=>({result:window.result,state:v.store.getState()}))).slice(0,7000));
await ctx.close();fs.writeFileSync(root+'assets/capture.json',JSON.stringify({video:'../raw/'+path.basename(await page.video().path()),marks,t0},null,2));await browser.close();
