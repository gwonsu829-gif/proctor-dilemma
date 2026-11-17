import * as THREE from './three.module.js';
import {renderer,scene,camera,proctor,students,suspect,marker,bubble,label,hands,setSuspect,animateClues,nyangTags as worldTags} from './world.js';
import {createProctorEnding} from './ending.js';
import {endingPose} from './ending-motion.js';

const canvas=document.getElementById('reel'),ctx=canvas.getContext('2d'),button=document.getElementById('record'),status=document.getElementById('status');
renderer.setPixelRatio(1);renderer.setSize(720,1280,false);camera.aspect=720/1280;camera.fov=78;camera.updateProjectionMatrix();setSuspect(6);hands.scale.set(.65,1,1);proctor.visible=false;
const PAPER='#f5f2e9',INK='#233b33',RED='#e95337',GREEN='#304b43';
const eye=new THREE.Vector3(-.8,1.95,-5.85),baseYaw=Math.atan2(suspect.position.x-eye.x,suspect.position.z-eye.z);
// The suspect's AI-glasses LED (world.js builds it as the only 0xff5136 basic mesh on students[6]).
const glassesLight=[];suspect.traverse(o=>{if(o.isMesh&&o.material.isMeshBasicMaterial&&o.material.color.getHex()===0xff5136)glassesLight.push(o)});
const glassesAt=new THREE.Vector3(suspect.position.x,suspect.position.y+1.78*.85,suspect.position.z-.3);
// "수능냥이" name tags over every cheating student (glasses 6, button 5; pocket student 10 sits right behind 6 in this view).
// Reel shows only the glasses (6) and button (5) tags; pocket student 10 sits right behind 6 from the desk.
const nyangTags=worldTags.slice(0,2);worldTags[2].visible=false;
const cuts=[
 {end:2.4,mode:'intro',head:'저 안경, AI 커닝 안경일까?',sub:'올해 수능부터 AI 안경은 반입 금지다.',count:0},
 {end:4.4,mode:'clue',head:'확인하면 고소. 안 하면?',sub:'나는 이 교실의 수능 감독관이다.',count:0},
 {end:6.8,mode:'approach',head:'보기만 하려고 다가갔더니…',sub:'“왜 제 안경에 손을 대세요?”',count:0},
 {end:9,mode:'first-lawsuit',head:'손도 안 댔는데 고소당했다.',sub:'안경을 보려다 부당한 의심으로 고소.',count:1},
 {end:11.4,mode:'wait',head:'그럼 그냥 넘어가 보자.',sub:'이번에는 아무것도 하지 않았다.',count:1},
 {end:13.8,mode:'witness',head:'옆자리 학생이 나를 불렀다.',sub:'“선생님도 저 안경 보셨죠?”',count:1},
 {end:15,mode:'second-lawsuit',head:'이번엔 AI 커닝 방치로 고소.',sub:'가만히 있었는데도 고소당했다.',count:2},
 {end:18.4,mode:'collapse',head:'난 가만히 있었을 뿐인데…',sub:'',count:2},
 {end:21.5,mode:'scream',head:'으아아아악!',sub:'',count:2},
 {end:23,mode:'aftermath',head:'감독하러 왔을 뿐인데.',sub:'',count:2},
 {end:26.2,mode:'paradox',head:'뭘 해도, 안 해도 고소당한다.',sub:'결국 모든 선택이 고소 엔딩으로.',count:2},
 {end:30,mode:'cta',head:'너라면 어떻게 할래?',sub:'직접 해 보고 네 결말을 보내 줘.',count:2}
];
let cue=-1,recording=false,ac,dest,engine=null,collapseStarted=false,lastT=0,lastDrop=-1;
function round(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke()}}
function text(value,x,y,size,color=INK,align='center',font='GameSans'){ctx.font=`900 ${size}px ${font}, Malgun Gothic, sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(value,x,y)}
function fit(value,x,y,size,width,color=INK,font='GameSans'){ctx.font=`900 ${size}px ${font}, Malgun Gothic, sans-serif`;while(ctx.measureText(value).width>width&&size>24){size--;ctx.font=`900 ${size}px ${font}, Malgun Gothic, sans-serif`}text(value,x,y,size,color,'center',font)}
function audioCue(kind='click'){
 if(!ac||!recording)return;
 const now=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(dest);g.connect(ac.destination);
 o.type=kind==='stamp'?'sawtooth':'sine';const water=kind==='water';o.frequency.setValueAtTime(kind==='stamp'?100:water?1050:680,now);o.frequency.exponentialRampToValueAtTime(water?230:80,now+.12);
 g.gain.setValueAtTime(kind==='stamp'?.13:water?.035:.055,now);g.gain.exponentialRampToValueAtTime(.001,now+.18);o.start();o.stop(now+.2);
}
function choice(y,title,hint,chosen=false){round(95,y,890,137,22,chosen?'#fff0b8':'#fffcef',chosen?RED:'#d5dccb');fit(title,540,y+48,38,800);fit(hint,540,y+98,26,800,'#73806c')}
function stamp(title,detail,y=1160){ctx.save();ctx.translate(540,y);ctx.rotate(-.09);round(-415,-140,830,280,8,'#fff9e8f5',RED);ctx.strokeStyle=RED;ctx.lineWidth=7;ctx.strokeRect(-393,-118,786,236);fit(title,0,-25,78,740,RED);fit(detail,0,70,33,740,RED);ctx.restore()}
function drawLens(t){for(let i=0;i<12;i++){let progress=((t*.7+i*.173)%1);let x=i%2?930-i*4:55+i*12,y=260+progress*1100;ctx.fillStyle=`rgba(175,234,249,${Math.sin(progress*Math.PI)*.46})`;ctx.beginPath();ctx.ellipse(x,y,3+i%3,16+i%4*4,-.04,0,Math.PI*2);ctx.fill()}}
function draw(t){
 t=Math.min(t,29.999);const index=cuts.findIndex(c=>t<c.end),cut=cuts[index],start=index?cuts[index-1].end:0,local=t-start,dt=Math.min(Math.max(t-lastT,1/120),.05),isEnding=t>=15&&t<23;lastT=t;
 if(index!==cue){cue=index;const words=cut.mode==='witness'?'선생님도 저 안경 보셨죠?':cut.mode==='wait'?'못 본 척하자…':cut.mode==='approach'?'왜 제 안경에 손을 대세요?':cut.mode.includes('lawsuit')?'고소장 접수 완료':'안경테를 톡… 또 톡…';bubble.material.dispose();bubble.material=label(words,512,128,cut.mode.includes('lawsuit')?'#e95337':'#f9d561',cut.mode.includes('lawsuit')?'#fff9e8':GREEN,32);audioCue(cut.mode.includes('lawsuit')?'stamp':'click')}
 if(isEnding&&engine){if(!collapseStarted){engine.start(15000);collapseStarted=true}engine.update(t*1000,dt);nyangTags.forEach(m=>m.visible=false)}
 else{
  if(collapseStarted){engine.stop();collapseStarted=false}
  let x=-.8,z=-5.85;if(t>=4.4&&t<9){const u=Math.min(1,(t-4.4)/1.1);x=THREE.MathUtils.lerp(-.8,2.3,u);z=THREE.MathUtils.lerp(-5.85,-2,u)}
  // Hook: start zoomed on the blinking glasses, then pull back to reveal the proctor's desk view.
  const pull=t<2.4?0:Math.min(1,(t-2.4)/1.2),ease=pull*pull*(3-2*pull),zoom=t<2.4?THREE.MathUtils.lerp(17,13,t/2.4):THREE.MathUtils.lerp(13,78,ease);
  if(camera.fov!==zoom){camera.fov=zoom;camera.updateProjectionMatrix()}
  const sway=t<2.4?.004:1;
  camera.position.set(x+Math.sin(t*.6)*.025*sway,1.95+Math.sin(t*1.6)*.012*sway,z);camera.lookAt(glassesAt.x+Math.sin(t*.4)*.12*sway,glassesAt.y+.18*(1-ease)+.23*ease,glassesAt.z);
  // Scale the tag with the field of view so it keeps a steady on-screen size through the zoom-out.
  const near=t<3.6||(t>=4.4&&t<9),approach=t>=4.4&&t<9;nyangTags.forEach((m,i)=>{m.visible=i===0||!near;const sc=i?1.1:THREE.MathUtils.clamp(camera.fov/70,.37,approach?.9:1.1);m.scale.setScalar(sc);m.position.y=1.92+.16*sc+Math.sin(t*4+i)*.02;m.quaternion.copy(camera.quaternion)});
  glassesLight.forEach(m=>m.visible=Math.sin(t*9)>-.3);
  hands.visible=t>=2.4;hands.position.y=Math.sin(t*1.6)*.007;hands.rotation.set(0,0,0);bubble.visible=ease>.9;marker.visible=true;
  const speaker=cut.mode==='witness'?students[6]:suspect;bubble.position.set(speaker.position.x,2.88+Math.sin(t*3)*.025,speaker.position.z);bubble.quaternion.copy(camera.quaternion);marker.position.set(suspect.position.x,3.7+Math.sin(t*3)*.08,suspect.position.z);marker.rotation.y=t;
 }
 animateClues(t*1000);renderer.render(scene,camera);ctx.fillStyle=PAPER;ctx.fillRect(0,0,1080,1920);ctx.drawImage(renderer.domElement,0,0,1080,1920);
 let gradient=ctx.createLinearGradient(0,0,0,500);gradient.addColorStop(0,isEnding?'#182e31bb':'#f5f2e9');gradient.addColorStop(1,isEnding?'#182e3100':'#f5f2e900');ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,500);
 // Title: a big banner on the opening, a pill afterwards. The lawsuit counter pops each time it goes up.
 const prevCount=index?cuts[index-1].count:0,pop=cut.count>prevCount?Math.max(0,1-local/.6):0;
 if(cut.mode==='intro'){const s=1+Math.max(0,.18-t*.3);ctx.save();ctx.translate(540,225);ctx.scale(s,s);round(-470,-115,940,230,30,RED,'#fff9e8');text('27년도 수능',0,-62,44,'#fff9e8');text('감독관의 삶',0,32,104,'#fff9e8');ctx.restore()}
 else{round(62,135,640,64,32,'#fff9e8ed');text('27년도 수능 감독관의 삶',382,167,32)}
 if(cut.mode!=='intro'){ctx.save();ctx.translate(904,167);ctx.scale(1+pop*.6,1+pop*.6);round(-114,-32,228,64,32,pop?RED:'#fff9e8ed');text(`고소장 ${cut.count}건`,0,0,28,pop?'#fff9e8':RED);ctx.restore()}
 if(isEnding){
  const p=endingPose(t-15,false);drawLens(t-15);
  if(p.stage==='notice')stamp('고소장 접수','피고소인: 나',710);
  const words=p.stage==='cry'?'난 가만히 있었을 뿐인데…':p.caption;
  ctx.save();ctx.shadowColor='#14261d';ctx.shadowBlur=14;ctx.shadowOffsetY=5;
  fit(words,540,p.stage==='scream'?1070:1260,p.stage==='scream'?112:57,950,'#fff4d2','Malgun Gothic');ctx.restore();
  if(t<19.4&&t>16.2&&t-lastDrop>.22){audioCue('water');lastDrop=t}
  fit('오늘은 무사히 퇴근할 줄 알았는데.',540,1460,30,920,'#fff9e8');
 }else{
  if(cut.mode==='intro'){ctx.save();ctx.shadowColor='#f5f2e9';ctx.shadowBlur=18;fit(cut.head,540,410,64,950);ctx.restore()}
  else{fit(cut.head,540,285,70,950,cut.mode.includes('lawsuit')?RED:INK);fit(cut.sub,540,370,34,950)}
  if(cut.mode==='intro'||cut.mode==='clue'){const v=glassesAt.clone().project(camera),sx=(v.x+1)/2*1080,sy=(1-v.y)/2*1920,r=Math.max(46,150*13/camera.fov)*(1+Math.sin(t*9)*.05);ctx.strokeStyle=RED;ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(sx,sy,r,r*.55,0,0,Math.PI*2);ctx.stroke()}
  if(cut.mode==='intro'){round(90,1330,900,250,25,'#fff9e8f0',RED);fit('교육부 · 2027 수능 유의사항',540,1380,28,820,'#697a61');fit('AI 스마트안경 반입 금지',540,1450,58,820,RED);fit('일반 안경도 매 교시 점검 · 11월 19일 시험',540,1524,28,820)}
  if(cut.mode==='clue'){round(130,1130,820,180,25,'#fff9e8e8');fit('저 안경… 확인해도 될까?',540,1192,44,750);fit('안경테를 누를 때마다 불빛이 깜빡인다.',540,1263,27,750,'#697a61')}
  if(cut.mode==='approach'){choice(1050,'가까이 가서 안경을 확인한다','AI 안경인지 보기만 하면 되잖아.',true);choice(1207,'그냥 넘어간다','괜히 건드리지 말자.');ctx.fillStyle=RED;ctx.beginPath();ctx.moveTo(865,1140);ctx.lineTo(865,1205);ctx.lineTo(885,1184);ctx.lineTo(907,1215);ctx.lineTo(923,1204);ctx.lineTo(900,1175);ctx.lineTo(928,1174);ctx.closePath();ctx.fill()}
  if(cut.mode==='first-lawsuit')stamp('고소 엔딩','안경을 보려다 부당한 의심으로 고소');
  if(cut.mode==='wait'){round(105,1100,870,230,25,'#fff9e8ee');fit('선택: 아무것도 하지 않는다',540,1172,42,800);fit('이번에는 아무 일 없겠지?',540,1260,35,800,'#6d7c65')}
  if(cut.mode==='witness'){round(105,1090,870,240,25,'#fff9e8ef',GREEN);fit('“보고도 그냥 두시는 거예요?”',540,1175,43,800);fit('이번에는 옆자리 학생이 나를 의심한다.',540,1260,29,800)}
  if(cut.mode==='second-lawsuit')stamp('또 고소 엔딩','이번에는 AI 커닝을 방치했다며 고소');
  if(cut.mode==='paradox'){round(90,990,900,380,28,'#fff9e8f2');fit('뭘 해도 고소당한다.',540,1090,66,820,RED);fit('아무것도 안 해도 고소당한다.',540,1190,54,820,RED);fit('72가지 결말, 전부 고소 엔딩.',540,1294,34,820)}
  if(cut.mode==='cta'){round(85,970,910,470,30,'#fff9e8f2');text('27년도 수능',540,1050,57);text('감독관의 삶',540,1134,80,RED);round(160,1220,760,80,18,RED);fit('뭘 해도, 안 해도 고소 엔딩',540,1260,37,700,'#fff9e8');fit('링크로 바로 플레이 · 가입 없이',540,1347,32,820);fit('gwonsu829-gif.github.io/proctor-dilemma',540,1400,22,850,'#6d7c65')}
  if(cut.mode!=='intro'){round(100,1490,880,86,18,'#263f35eb');fit(cut.mode==='cta'?'직접 해 보고 네 결말을 보내 줘.':'확인해도 고소 · 안 해도 고소',540,1533,34,820,'#fff9e8')}
 }
 fit('게임 속 가상 상황입니다. 실제 사건·법률과는 다릅니다.',540,1630,20,940,isEnding?'#fff9e8':'#596e55');ctx.fillStyle=RED;ctx.fillRect(0,0,1080*t/30,8);
}
await document.fonts.ready;draw(+new URLSearchParams(location.search).get('t')||0);
button.onclick=()=>{button.hidden=true;setTimeout(recordReel,100)};
async function recordReel(){
 status.textContent='1인칭 릴스 렌더링 중… 30초 후 저장됩니다.';ac=new AudioContext();await ac.resume();dest=ac.createMediaStreamDestination();
 engine=createProctorEnding({scene,camera,hands,eye,bubble,marker,getYaw:()=>baseYaw,getSound:()=>true,getBranch:()=>3,renderOnly:true,audioContext:ac,audioDestination:dest});
 let stream=canvas.captureStream(30);dest.stream.getAudioTracks().forEach(track=>stream.addTrack(track));const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')?'video/webm;codecs=vp9,opus':'video/webm';const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:9500000,audioBitsPerSecond:128000}),chunks=[];
 rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 rec.onstop=()=>{const blob=new Blob(chunks,{type:'video/webm'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='27년도-수능-감독관의-삶-릴스.webm';a.textContent='완성된 릴스 다운로드';status.textContent='렌더링 완료 · ';status.append(a);a.click();stream.getTracks().forEach(track=>track.stop());engine.stop();ac.close();recording=false;};
 // Warm up: render the wide classroom once so shader compilation can't freeze the zoom-out mid-recording.
 draw(5);draw(12);draw(0);renderer.compile(scene,camera);
 recording=true;cue=-1;lastT=0;lastDrop=-1;rec.start(1000);const began=performance.now();
 function frame(now){const t=(now-began)/1000;draw(t);if(t<30)requestAnimationFrame(frame);else rec.stop()}requestAnimationFrame(frame);
}
