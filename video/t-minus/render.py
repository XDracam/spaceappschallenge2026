from pathlib import Path
import sys
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from render_support import prepare, recording
import subprocess,json,concurrent.futures
B=Path(__file__).resolve().parent;A=B/'assets';G=B.parent.parent/'game/public/audio'
CAPTURE, OUTPUT, R = prepare(B, 'T-Minus-preview.mp4')
M=json.loads(CAPTURE.read_text());src=str(recording(CAPTURE, M['video'], B));marks={x['name']:x['at'] for x in M['marks']}
def duration(p):return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(p)],text=True))
offset=duration(src)-marks['result']-4.2
# Individual crops make the player's decision readable. All content is captured from the current game.
scenes=[('problem',3.7,(960,540,960,0)),('procurement',1.7,(960,540,960,0)),('title',2.6,None),('problem',2.5,(1440,810,480,0)),('science',2.5,(1440,810,480,90)),('procurement',2.5,(1440,810,480,0)),('comms',2.5,(1440,810,300,100)),('ready',2.7,None),('flight',3.6,None),('result',2.0,(960,540,480,230)),('title',3.2,None)]
def render_scene(pair):
 i,(name,sec,crop)=pair
 cmd=['ffmpeg','-v','error','-y']
 if name=='title':cmd+=['-loop','1','-i',str(CAPTURE.parent/'title.png')]
 else:cmd+=['-ss',str(max(0,marks[name]+offset+.2)),'-i',src]
 vf=[]
 if crop:vf+=['crop='+':'.join(map(str,crop))]
 vf+=['scale=1920:1080','setsar=1','fps=30']
 # Subtle constant push-in replaces static full-dashboard shots.
 vf+=['scale=2016:1134','crop=1920:1080:x=48+12*t:y=27']
 if name=='title':vf+=['drawbox=x=0:y=0:w=800:h=1080:color=black@1:t=fill','drawbox=x=0:y=900:w=iw:h=180:color=black@1:t=fill']
 cmd+=['-t',str(sec),'-an','-vf',','.join(vf),'-c:v','libx264','-preset','ultrafast','-crf','18','-threads','2',str(R/f'scene-{i}.mp4')]
 subprocess.run(cmd,check=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(render_scene,enumerate(scenes)))
(R/'concat.txt').write_text(''.join(f"file '{R/f'scene-{i}.mp4'}'\n" for i in range(len(scenes))))
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(R/'concat.txt'),'-c','copy',str(R/'assembled.mp4')],check=True)
header='''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Text,Noto Sans,48,&H00FFFFFF,&H00FFFFFF,&H00100704,&H80000000,-1,0,0,0,100,100,0,0,1,2,1,7,60,60,50,1
Style: Small,Noto Sans,23,&H00D9E7ED,&H00FFFFFF,&H00100704,&H80000000,0,0,0,0,100,100,0,0,1,1,0,9,30,30,25,1
Style: Sub,Noto Sans,35,&H00FFFFFF,&H00FFFFFF,&H00100704,&H80000000,0,0,0,0,100,100,0,0,3,1,0,2,60,60,35,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
e=[]
def tm(t):return f'0:{int(t//60):02}:{t%60:05.2f}'
def tx(a,b,s,sty='Text'):e.append(f'Dialogue: 0,{tm(a)},{tm(b)},{sty},,0,0,0,,{s}')
# High-contrast story beats; countdown is an editorial trailer motif.
tx(0,1.1,r'{\fs145\pos(65,270)\fad(0,120)}T−30')
tx(1.1,2.2,r'{\fs145\pos(65,270)\fad(0,120)}T−29')
tx(2.2,3.7,r'{\fs145\pos(65,270)\fad(0,150)}T−28')
tx(0,3.7,r'{\fs32\pos(65,225)\c&H9CDBFF&}LAUNCH IS APPROACHING')
tx(1.4,3.7,r'{\fs55\pos(65,465)\c&H8CB4FF&}CAMERA: NOT READY')
tx(3.7,5.4,r'{\fs85\move(80,690,80,650)\fad(80,80)}EVERY FIX COSTS.')
for a,b in [(5.4,8),(26.3,29.5)]:
 tx(a,b,r'{\fs118\spacing8\pos(80,295)\c&HDCF5FF&\fad(120,120)}T-MINUS')
 tx(a,b,r'{\fs35\pos(85,240)\c&H9EC9D8&}SPACE MISSION DESIGN GAME')
 tx(a,b,r'{\fs46\pos(85,465)}FOUR PLAYERS.\NONE MISSION.')
 tx(a,b,r'{\fs30\pos(85,945)}NASA SPACE APPS 2026')
tx(26.3,29.5,r'{\fs32\pos(85,625)\c&HDCF5FF&}PLAN TOGETHER.\NLAUNCH TOGETHER.')
tx(26.3,29.5,r'{\fs30\pos(85,745)}missioncontrol.dractec.com')
for a,b,title,desc in [(8,10.5,'DESIGN','Balance capability and fuel.'),(10.5,13,'RESEARCH','Close the technology gap.'),(13,15.5,'PROCURE','Price. Delivery. Reliability.'),(15.5,18,'NEGOTIATE','Win support for the mission.')]:
 tx(a,b,r'{\fs90\move(75,730,75,685)\fad(70,70)}'+title)
 tx(a,b,r'{\fs34\pos(80,800)}'+desc)
tx(18,20.7,r'{\fs72\pos(65,165)\fad(80,80)}COMMIT TO YOUR PLAN.')
tx(20.7,24.3,r'{\fs66\pos(65,135)\fad(80,100)}WILL THE IMAGES GET HOME?')
tx(24.3,26.3,r'{\fs28\pos(65,65)\c&HCEFFD0&}ACTUAL GAME RESULT')
tx(0,29.5,'AI-generated artwork · AI narration','Small')
# Short spoken captions retain space for the game UI.
for a,b,s in [(0.3,3.5,"Launch is approaching. Your camera isn't ready."),(3.85,5.3,'Every fix costs.'),(5.55,7.95,'T-Minus. Four players. One mission.'),(18.3,20.65,'Then put your plan to the test.'),(21.0,23.5,'Will you bring the images home?')]:tx(a,b,s,'Sub')
(R/'trailer.ass').write_text(header+'\n'.join(e)+'\n')
inputs=['-i',str(R/'assembled.mp4'),'-ss','38','-i',str(G/'music.mp3')]
voices=[('voice-0.wav',.3),('voice-1.wav',3.85),('voice-2.wav',5.55),('role-0.wav',8.25),('role-1.wav',10.75),('role-2.wav',13.25),('role-3.wav',15.75),('voice-4.wav',18.35),('voice-5.wav',21.1),('voice-6.wav',26.5)]
for name,t in voices:inputs+=['-i',str(A/name)]
sfx=[('attention.mp3',0,.3),('attention.mp3',1.1,.2),('attention.mp3',2.2,.2),('confirmation.mp3',8,.5),('confirmation.mp3',10.5,.5),('confirmation.mp3',13,.5),('confirmation.mp3',15.5,.5),('launch.mp3',20.7,3.6),('achievement.mp3',24.3,3.2)]
for name,t,d in sfx:inputs+=['-i',str(G/name)]
f=[]
# Music lifts between narration beats; full ending gives the game fanfare room.
f.append("[1:a]atrim=0:29.5,asetpts=PTS-STARTPTS,aresample=48000,volume='if(between(t,23.5,26.2),0.32,0.16)':eval=frame,afade=t=in:d=0.25,afade=t=out:st=28.6:d=0.9[music]")
labels=['[music]']
for i,(name,t) in enumerate(voices):
 lab=f'v{i}';f.append(f'[{i+2}:a]aresample=48000,volume=1.25,adelay={int(t*1000)}:all=1[{lab}]');labels.append(f'[{lab}]')
for i,(name,t,d) in enumerate(sfx):
 lab=f's{i}';gain=.16 if name=='launch.mp3' else .3
 f.append(f'[{i+2+len(voices)}:a]atrim=0:{d},asetpts=PTS-STARTPTS,aresample=48000,volume={gain},afade=t=out:st={max(0,d-.2)}:d=0.2,adelay={int(t*1000)}:all=1[{lab}]');labels.append(f'[{lab}]')
f.append(''.join(labels)+f'amix=inputs={len(labels)}:duration=longest:normalize=0,alimiter=limit=0.95[a]')
f.append(f"[0:v]ass='{R/'trailer.ass'}',fade=t=in:d=0.12,fade=t=out:st=29.2:d=0.3[v]")
import re
af=[x for x in f if '[0:v]' not in x]
af=[re.sub(r'\[(\d+):a\]',lambda m:'['+str(int(m.group(1))-1)+':a]',x) for x in af]
acmd=['ffmpeg','-hide_banner','-loglevel','warning','-y','-filter_complex_threads','1']+inputs[2:]+['-filter_complex',';'.join(af),'-map','[a]','-t','29.5','-c:a','pcm_s16le','-ar','48000',str(R/'mix.wav')]
subprocess.run(acmd,check=True)
cmd=['ffmpeg','-hide_banner','-loglevel','warning','-y','-filter_threads','2','-i',str(R/'assembled.mp4'),'-i',str(R/'mix.wav'),'-vf',f"ass='{R/'trailer.ass'}',fade=t=in:d=0.12,fade=t=out:st=29.2:d=0.3",'-t','29.5','-c:v','libx264','-preset','ultrafast','-crf','19','-threads','4','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-metadata','title=T-Minus — NASA Space Apps 2026','-metadata','comment=Human concept and gameplay; code by Codex and Claude; images by ChatGPT Images; AI narration by Voicebox Supertonic 3. Prepared gameplay capture using normal game actions and accelerated calendar. Editorial countdown. Actual flight result.',str(OUTPUT)]
subprocess.run(cmd,check=True)
print('FINAL',duration(OUTPUT))
