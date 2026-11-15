const categories = [
  {id:'music',name:'Atmosphere',title:'Set the atmosphere.',purpose:'A quiet instrumental bed for the title screen. Judge whether it still leaves room for four people talking.',role:'Title screen',action:'Listen on title screen',instruction:'Music repeats until stopped.'},
  {id:'attention',name:'Attention',title:'Something needs your attention.',purpose:'One reusable notice for a new Comms message, Call offers, or a request assigned to your station.',role:'Communications',action:'Receive new message',instruction:'The notice belongs to this station.'},
  {id:'confirmation',name:'Confirmation',title:'Make a decision feel accepted.',purpose:'A subtle sound when an order, research start, response, or player request is accepted. Imagine hearing it often.',role:'Procurement',action:'Accept order',instruction:'Plays on acceptance, not hover.'},
  {id:'completion',name:'Completion',title:'The research paid off.',purpose:'A brief, useful cue when research or a test finishes successfully. Also a possible neutral result sound.',role:'Science',action:'Complete research',instruction:'One cue for one completed project.'},
  {id:'launch',name:'Launch',title:'Give commitment some weight.',purpose:'Compare a launch recording, a musical excerpt, and stylized transitions. This scene represents a launch that actually proceeds.',role:'Mission planning',action:'Launch mission',instruction:'No countdown or repeated flight beeps.'},
  {id:'achievement',name:'Achievement',title:'A mission worth celebrating.',purpose:'Compare a fretless melody, a single bell, an ethereal synth rise, a success sting, and two fuller fanfares. Six independent creators; no Kenney power-ups.',role:'Mission result',action:'Reveal successful result',instruction:'Sounds once when the result appears.'},
  {id:'setback',name:'Setback',title:'Acknowledge the setback.',purpose:'A restrained cue for a scrubbed launch or zero-goal result. Keep it clear without punishing the player.',role:'Mission result',action:'Reveal scrubbed launch',instruction:'No ignition sound on a scrub.'},
];
const $ = s => document.querySelector(s);
const el = (tag,cls,text) => {const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const storageKey='mission-control-audio-audit-v1';
let saved={picks:{},notes:{},fx:40,music:15};
let storageFailed=false;
try{const v=JSON.parse(localStorage.getItem(storageKey)||'null');if(v&&typeof v==='object')saved={...saved,...v,picks:v.picks||{},notes:v.notes||{}};}catch{storageFailed=true;}
saved.fx=Number.isFinite(saved.fx)?Math.max(0,Math.min(100,saved.fx)):40;
saved.music=Number.isFinite(saved.music)?Math.max(0,Math.min(100,saved.music)):15;
let data,active,preview={},effect=null,music=null,musicId=null,sequenceToken=0,playToken=0,musicToken=0;
let sequenceTimer=null;
let seqRunning=false;
const candidate = id => data.candidates.find(c=>c.id===id);
const current=()=>candidate(preview[active.id])||candidate(saved.picks[active.id])||data.candidates.find(c=>c.category===active.id);
const seconds=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function save(){try{localStorage.setItem(storageKey,JSON.stringify(saved));storageFailed=false;}catch{storageFailed=true;}$('#save-state').textContent=storageFailed?'Browser storage unavailable. Export your picks before leaving.':'Saved in this browser. Export to share your picks.';}
function updateCount(){const total=categories.filter(c=>Object.hasOwn(saved.picks,c.id)).length;$('#pick-count').textContent=`${total} of ${categories.length} chosen`;document.querySelectorAll('.category').forEach(n=>{const id=n.dataset.category;const pick=saved.picks[id];n.querySelector('.mark').textContent=pick===null?'Silent':pick?'Picked':'';});}
function status(text){$('#now-playing').textContent=text;}
function cancelSequence(){sequenceToken++;seqRunning=false;clearTimeout(sequenceTimer);$('#sequence').textContent='Play chosen set';}
function stopEffect(){playToken++;if(effect){effect.pause();effect.currentTime=0;effect.remove();if(seekAudio===effect)seekAudio=null;effect=null;}}
function stopMusic(){musicToken++;if(music){music.pause();music.currentTime=0;music.remove();music=null;musicId=null;}}
function stopAll(){sequenceToken++;seqRunning=false;clearTimeout(sequenceTimer);$('#sequence').textContent='Play chosen set';stopEffect();stopMusic();$('#seek').disabled=true;$('#seek').value=0;$('#time').textContent='0:00 / 0:00';seekAudio=null;status('Stopped. Pick a candidate or replay the scene.');}
async function startMusic(c){
  if(!c)return;
  if(music&&musicId===c.id&&!music.paused)return;
  stopMusic();const token=musicToken;const audio=new Audio(c.file);audio.hidden=true;document.body.append(audio);music=audio;musicId=c.id;audio.loop=true;audio.volume=saved.music/100;audio.preload='auto';
  audio.onerror=()=>{if(token===musicToken)status(`Could not load ${c.title}. Try another candidate or reload the page.`);};
  try{await audio.play();if(token!==musicToken)audio.pause();}catch(err){if(token===musicToken)status(`Music could not start. Click “Try in scene” again. ${err.name}: ${err.message}`);}
}
async function ensureMix(){if($('#mix-music').checked){const c=candidate(saved.picks.music);if(c)await startMusic(c);else status('Choose favorite music first, then enable the background mix.');}else stopMusic();}
function sceneMarkup(mode){
  if(mode==='music')return '<img class="earth" src="earth.webp" width="1536" height="1024" alt=""><div class="title-content"><h3>MISSION<br>CONTROL</h3><p>Four stations. One mission. Build something that can reach beyond Earth.</p><div class="mock-menu"><span>New mission</span><span>Join crew</span></div></div>';
  if(mode==='attention')return '<div class="station"><div class="station-head"><span>Communications · Inbox</span><span>Illustrative scene</span></div><h4>Keep the mission connected.</h4><p>Your inbox is quiet. A new stakeholder message arrives.</p><div class="preview-row"><div><b>Industry liaison</b><small>New proposal for the mission</small></div><span class="state">Incoming</span></div><div class="scene-event"><strong>New message</strong><br>A proposal is ready for your response.</div></div>';
  if(mode==='confirmation')return '<div class="station"><div class="station-head"><span>Procurement · Order review</span><span>Illustrative scene</span></div><h4>Camera module</h4><p>The order is ready to accept. Hear the sound when acceptance succeeds.</p><div class="preview-row"><div><b>Mission equipment order</b><small>Destination: mission need</small></div><span class="state">Ready</span></div><div class="scene-event"><strong>Order accepted</strong><br>Your contract is now active.</div></div>';
  if(mode==='completion')return '<div class="station"><div class="station-head"><span>Science · Research</span><span>Illustrative scene</span></div><h4>Detector arrays</h4><p>A research project reaches its successful conclusion.</p><div class="preview-row"><div><b>Camera performance upgrade</b><small>New capability for mission planning</small></div><span class="state">Finishing</span></div><div class="scene-event"><strong>Research complete</strong><br>Camera performance limit increased.</div></div>';
  if(mode==='launch')return '<div class="station"><div class="station-head"><span>Mission planning · Launch</span><span>Illustrative scene</span></div><h4>From planning to flight.</h4><p>The mission launches. One short sound marks the transition.</p><svg class="route" viewBox="0 0 420 130" aria-hidden="true"><path d="M20 108 Q180 105 390 20" stroke="currentColor" fill="none" opacity=".45" stroke-width="2"/><circle cx="35" cy="106" r="14" fill="#286b94"/><g class="craft"><path d="M75 86l14 10-14 10 4-10z" fill="#d7f4ff"/></g><circle cx="390" cy="20" r="4" fill="#73e1b2"/></svg><div class="scene-event">Launch committed. The mission is underway.</div></div>';
  const ok=mode==='achievement';return `<div class="station"><div class="station-head"><span>Mission result</span><span>Illustrative scene</span></div><h4>${ok?'Mission complete':'Launch scrubbed'}</h4><p>${ok?'All authored mission goals were achieved.':'A required part was not delivered at launch.'}</p><div class="preview-row"><div><b>${ok?'Mission objectives':'Flight status'}</b><small>${ok?'A shared outcome for the whole crew':'No flight took place'}</small></div><span class="state">${ok?'All achieved':'Scrubbed'}</span></div><div class="scene-event"><strong>${ok?'Every station made this possible.':'Review the plan and try again.'}</strong><br>${ok?'Take a moment for the achievement.':'A setback, with a clear way forward.'}</div></div>`;
}
function showScene(id){const cat=categories.find(c=>c.id===id);$('#scene').dataset.mode=id;$('#scene').classList.remove('done');$('#scene').innerHTML=sceneMarkup(id);$('#scene-role').textContent=cat.role;$('#trigger').textContent=cat.action;$('#scene-instruction').textContent=cat.instruction;}
async function play(c,options={}){
  if(!c)return;
  if(!options.sequence&&seqRunning){sequenceToken++;seqRunning=false;clearTimeout(sequenceTimer);$('#sequence').textContent='Play chosen set';}
  preview[c.category]=c.id;if(active.id!==c.category)selectCategory(c.category);
  renderCandidates();showScene(c.category);$('#scene').classList.add('done');
  if(c.category==='music'){stopEffect();await startMusic(c);if(music&&!music.paused){status(`Playing ${c.title} · ${c.edit}`);attachSeek(music);}return;}
  stopEffect();const token=playToken;await ensureMix();if(token!==playToken)return;
  const audio=new Audio(c.file);audio.hidden=true;document.body.append(audio);effect=audio;audio.volume=saved.fx/100;audio.preload='auto';status(`Loading ${c.title}…`);
  audio.onerror=()=>{if(token===playToken)status(`Could not load ${c.title}. Try another candidate or reload the page.`);};
  audio.onended=()=>{if(token===playToken)status(`Played ${c.title}. Try another, or choose this sound.`);};
  try{await audio.play();if(token!==playToken){audio.pause();return;}status(`Playing ${c.title} · ${c.edit}`);attachSeek(audio);}catch(err){if(token===playToken)status(`Playback could not start. Click “Try in scene” again. ${err.name}: ${err.message}`);}
}
let seekAudio=null;
function attachSeek(audio){seekAudio=audio;$('#seek').disabled=false;const update=()=>{if(seekAudio!==audio)return;const d=Number.isFinite(audio.duration)?audio.duration:0;$('#seek').value=d?Math.round(audio.currentTime/d*1000):0;$('#time').textContent=`${seconds(audio.currentTime)} / ${seconds(d)}`;};audio.ontimeupdate=update;audio.onloadedmetadata=update;update();}
function renderCandidates(){
  const list=$('#candidate-list');list.replaceChildren();const items=data.candidates.filter(c=>c.category===active.id);$('#silent').setAttribute('aria-pressed',String(saved.picks[active.id]===null));
  items.forEach((c,i)=>{
    const row=el('article','candidate'+(current()?.id===c.id?' active':''));const top=el('div','candidate-top'),identity=el('div');identity.append(el('div','candidate-name',c.title),el('div','candidate-meta',`${i+1} · ${c.duration.toFixed(2)}s · ${c.author} · ${c.license}`));
    const buttons=el('div','candidate-actions'),tryBtn=el('button','', 'Try in scene'),pickBtn=el('button','',saved.picks[active.id]===c.id?'Chosen':'Choose');tryBtn.setAttribute('aria-label',`Try ${c.title} in scene`);tryBtn.onclick=()=>play(c);pickBtn.setAttribute('aria-label',`Choose ${c.title}`);pickBtn.setAttribute('aria-pressed',String(saved.picks[active.id]===c.id));pickBtn.onclick=()=>{if(saved.picks[active.id]===c.id)delete saved.picks[active.id];else saved.picks[active.id]=c.id;preview[active.id]=c.id;save();renderCandidates();updateCount();if(c.category==='music'){if(!saved.picks.music){stopMusic();$('#mix-music').checked=false;}else if($('#mix-music').checked)startMusic(c);}};buttons.append(tryBtn,pickBtn);top.append(identity,buttons);row.append(top,el('small','',c.description));
    const details=el('details'),summary=el('summary','', 'Source, license & preview edits');const info=el('p','',`${c.attribution} ${c.edit}`),links=el('p');[['Original source',c.source],['License',c.licenseUrl],['Download preview',c.file]].forEach(([text,url])=>{const a=el('a','',text);a.href=url;a.target='_blank';a.rel='noopener';if(text==='Download preview')a.setAttribute('download','');links.append(a);});details.append(summary,info,links);row.append(details);list.append(row);
  });
}
function selectCategory(id,updateUrl=true){
  active=categories.find(c=>c.id===id)||categories[0];if(updateUrl)history.replaceState(null,'',`#${active.id}`);
  $('#category-title').textContent=active.title;$('#category-purpose').textContent=active.purpose;$('#notes-category').textContent=active.name.toLowerCase();$('#notes').value=saved.notes[active.id]||'';
  document.querySelectorAll('.category').forEach(n=>n.setAttribute('aria-current',String(n.dataset.category===active.id)));showScene(active.id);renderCandidates();updateCount();$('#seek').disabled=true;$('#seek').value=0;$('#time').textContent='0:00 / 0:00';status('Choose “Try in scene” to hear a candidate.');
}
function exportPicks(){const output={schema:'mission-control-audio-picks/v1',exportedAt:new Date().toISOString(),levels:{effects:saved.fx/100,music:saved.music/100},categories:categories.map(cat=>({category:cat.id,decision:!Object.hasOwn(saved.picks,cat.id)?'undecided':saved.picks[cat.id]===null?'silent':'chosen',candidate:saved.picks[cat.id]?candidate(saved.picks[cat.id]):null,notes:saved.notes[cat.id]||''}))};const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download='mission-control-audio-picks.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#save-state').textContent='Export downloaded with candidate sources, licenses, levels and notes.';}
async function sequence(){
  stopAll();const token=sequenceToken;seqRunning=true;$('#sequence').textContent='Playing chosen set…';const musicChoice=candidate(saved.picks.music);if(musicChoice){$('#mix-music').checked=true;await startMusic(musicChoice);}
  const chosen=['confirmation','attention','completion','launch','achievement','setback'].map(id=>candidate(saved.picks[id])).filter(Boolean);
  if(!chosen.length){seqRunning=false;$('#sequence').textContent='Play chosen set';if(musicChoice)status('Playing your music pick. Choose effects to hear the full sequence.');else status('Choose some favorites first, then play the chosen set.');return;}
  for(const c of chosen){if(token!==sequenceToken)return;await play(c,{sequence:true});if(token!==sequenceToken)return;await new Promise(resolve=>{sequenceTimer=setTimeout(resolve,Math.max(1400,c.duration*1000+650));});}
  if(token===sequenceToken){seqRunning=false;$('#sequence').textContent='Play chosen set';status('Chosen set finished. Adjust your picks or play it again.');}
}
async function init(){
  const response=await fetch('candidates.json');if(!response.ok)throw new Error(`Candidate catalog: HTTP ${response.status}`);data=await response.json();
  for(const cat of categories){const a=el('a','category');a.href=`#${cat.id}`;a.dataset.category=cat.id;a.append(el('span','',cat.name),el('span','mark',''));a.onclick=e=>{e.preventDefault();cancelSequence();stopEffect();if(!$('#mix-music').checked)stopMusic();selectCategory(cat.id);};$('#categories').append(a);}
  for(const [id,key,out] of [['fx-volume','fx','fx-value'],['music-volume','music','music-value']]){const input=$('#'+id);input.value=saved[key];$('#'+out).value=`${saved[key]}%`;input.oninput=()=>{saved[key]=Number(input.value);$('#'+out).value=`${saved[key]}%`;if(effect)effect.volume=saved.fx/100;if(music)music.volume=saved.music/100;save();};}
  $('#mix-music').onchange=()=>{if($('#mix-music').checked&&!candidate(saved.picks.music)){$('#mix-music').checked=false;status('Choose a favorite in Atmosphere first, then enable the music mix.');return;}ensureMix();};
  $('#stop').onclick=stopAll;$('#export').onclick=exportPicks;$('#trigger').onclick=()=>play(current());$('#sequence').onclick=sequence;
  $('#notes').oninput=()=>{saved.notes[active.id]=$('#notes').value;save();};
  $('#silent').onclick=()=>{cancelSequence();saved.picks[active.id]=null;stopEffect();if(active.id==='music'){stopMusic();$('#mix-music').checked=false;}save();renderCandidates();updateCount();status(`${active.name} will stay silent in your chosen set. You can still audition alternatives.`);};
  $('#seek').oninput=()=>{if(seekAudio&&Number.isFinite(seekAudio.duration))seekAudio.currentTime=Number($('#seek').value)/1000*seekAudio.duration;};
  document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY|A/.test(e.target.tagName)&&e.key!=='Escape')return;if(e.key==='Escape'){e.preventDefault();stopAll();}else if(/^[1-6]$/.test(e.key)){const c=data.candidates.filter(c=>c.category===active.id)[Number(e.key)-1];if(c){e.preventDefault();play(c);}}else if(e.code==='Space'){e.preventDefault();play(current());}});
  window.addEventListener('hashchange',()=>{cancelSequence();stopEffect();if(!$('#mix-music').checked)stopMusic();selectCategory(location.hash.slice(1),false);});window.addEventListener('pagehide',stopAll);
  selectCategory(location.hash.slice(1)||'music',false);if(storageFailed)$('#save-state').textContent='Browser storage unavailable. Export your picks before leaving.';
}
init().catch(err=>{status(`Could not load the candidate catalog. Reload this page through the local preview server. ${err.message}`);$('#category-title').textContent='The audio catalog could not load.';});
