from pathlib import Path
import sys
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from render_support import prepare, recording
import json,subprocess,concurrent.futures
base=Path(__file__).resolve().parent
assets=base/'assets'
CAPTURE, OUTPUT, raw = prepare(base, 'Mission-Control-preview.mp4')
def probe(p):return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(p)],text=True).strip())
m=json.loads(CAPTURE.read_text()); source=str(recording(CAPTURE, m['video'], base)); marks=m['marks']
offset=probe(source)-(marks[-1]['at']-marks[0]['at'])/1000-4.2
lengths=[4,2,4,3,3,3,6,4]
def segment(i):
 start=max(0,offset+(marks[i]['at']-marks[0]['at'])/1000+.15)
 dest=raw/f'cut-{i}.mp4'
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(start),'-i',source,'-t',str(lengths[i]),'-an','-vf','fps=30,scale=1920:1080,setsar=1','-c:v','libx264','-preset','ultrafast','-crf','19','-threads','2',str(dest)],check=True)
 return dest
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(segment,range(8)))
(raw/'concat.txt').write_text(''.join(f"file '{raw/f'cut-{i}.mp4'}'\n" for i in range(8)))
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(raw/'concat.txt'),'-c','copy',str(raw/'assembled.mp4')],check=True)
header='''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Noto Sans,34,&H00FFFFFF,&H00FFFFFF,&H00070E16,&H00070E16,0,0,0,0,100,100,0,0,1,2,0,2,80,80,25,1
Style: Title,Noto Sans,36,&H00FFFFFF,&H00FFFFFF,&H00070E16,&H00070E16,-1,0,0,0,100,100,0,0,1,0,0,7,45,45,18,1
Style: Small,Noto Sans,20,&H00C8D6DF,&H00FFFFFF,&H00070E16,&H00070E16,0,0,0,0,100,100,0,0,1,1,0,9,30,30,20,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
def ts(t):return f'{int(t//3600)}:{int(t//60)%60:02}:{t%60:05.2f}'
events=[]
def text(a,b,s,style='Caption'):events.append(f'Dialogue: 0,{ts(a)},{ts(b)},{style},,0,0,0,,{s}')
text(0,4,'MISSION CONTROL  /  Space Mission Design Game','Title')
text(4,10,'01  DESIGN  /  Capability has a cost','Title')
text(10,13,'02  SCIENCE  /  Research the missing capability','Title')
text(13,16,'03  PROCUREMENT  /  Compare cost, delivery and risk','Title')
text(16,19,'04  COMMUNICATIONS  /  Build partnerships','Title')
text(19,25,'05  SIMULATION  /  Live plan evaluation','Title')
text(25,29,'MISSION CONTROL  /  missioncontrol.dractec.com','Title')
text(0,29,'AI-generated artwork · AI narration','Small')
text(.4,3.8,'Your mission: send weather images home from orbit.')
text(4.3,9.6,'Meet the camera requirement. More capability adds weight and cost.')
text(10.2,14.3,'Four players coordinate design, research, procurement,')
text(14.3,18.8,'and partnerships within one budget and schedule.')
text(19.3,24.5,'Simulate your plan and inspect which objectives it can achieve.')
text(25.2,29,'Discover how engineering choices shape the whole mission.')
text(4,6,r'{\an7\pos(75,300)\fs44\b1}CAMERA PERFORMANCE  3.0')
text(4,6,r'{\an7\pos(75,375)\fs34}90 kg  /  estimated $15M')
text(6,10,r'{\an7\pos(75,300)\fs44\b1}CAMERA PERFORMANCE  4.5')
text(6,10,r'{\an7\pos(75,375)\fs34}120 kg  /  estimated $19.5M')
text(4,10,r'{\an7\pos(75,445)\fs23}Prepared design comparison · before procurement')
text(19,29,r'{\an7\pos(45,110)\fs24}Planning prediction · research and delivery still required')
(raw/'captions.ass').write_text(header+'\n'.join(events)+'\n')
inputs=['-i',str(raw/'assembled.mp4'),'-i',str(base.parent.parent/'game/public/audio/music.mp3')]
for i in range(5):inputs+=['-i',str(assets/f'voice-{i}.wav')]
starts=[.5,4.4,10.25,19.5,25.4]
f=[]
for i,t in enumerate(starts):f.append(f'[{i+2}:a]aresample=48000,adelay={round(t*1000)}:all=1[v{i}]')
f.append('[1:a]atrim=0:29,asetpts=PTS-STARTPTS,volume=0.10,afade=t=in:d=0.6,afade=t=out:st=27.4:d=1.6[music]')
f.append('[music]'+''.join(f'[v{i}]' for i in range(5))+'amix=inputs=6:duration=longest:normalize=0,alimiter=limit=0.95[a]')
f.append(f"[0:v]drawbox=x=0:y=0:w=iw:h=85:color=0x070e16@0.97:t=fill,drawbox=x=0:y=990:w=iw:h=90:color=0x070e16@0.97:t=fill,ass='{raw/'captions.ass'}'[v]")
cmd=['ffmpeg','-hide_banner','-loglevel','warning','-y']+inputs+['-filter_complex',';'.join(f),'-map','[v]','-map','[a]','-t','29','-c:v','libx264','-preset','fast','-crf','20','-threads','4','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-metadata','title=Mission Control — NASA Space Apps 2026','-metadata','comment=Human concept and gameplay. Code: Codex and Claude. Images: ChatGPT Images. AI narration: Voicebox Supertonic 3. Music: The Magnificent Cosmos by Adiutorium (CC0). Live plan evaluation; prepared demonstration.',str(OUTPUT)]
subprocess.run(cmd,check=True)
print('Export duration:',probe(OUTPUT))
