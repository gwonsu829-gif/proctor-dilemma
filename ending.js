import * as THREE from './three.module.js';
import {endingPose} from './ending-motion.js';

export function createProctorEnding({scene,camera,hands,eye,bubble,marker,getYaw,getSound,getBranch,renderOnly=false,audioContext=null,audioDestination=null}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const rig=new THREE.Group();camera.add(rig);rig.visible=false;
 const kneeMat=new THREE.MeshStandardMaterial({color:0x35483e,roughness:1});
 for(const side of [-1,1]){
  const knee=new THREE.Mesh(new THREE.BoxGeometry(.25,.19,.35),kneeMat);knee.position.set(side*.23,-.52,-.48);knee.rotation.x=-.25;rig.add(knee);
 }
 const saved=hands.children.map(o=>({position:o.position.clone(),rotation:o.rotation.clone(),visible:o.visible}));
 const count=144,splashCount=90,dummy=new THREE.Object3D();
 const tearMat=new THREE.MeshStandardMaterial({color:0x6bd7ee,emissive:0x216f87,emissiveIntensity:.7,roughness:.15,transparent:true,opacity:.88});
 const tears=new THREE.InstancedMesh(new THREE.SphereGeometry(.009,10,7),tearMat,count);tears.instanceMatrix.setUsage(THREE.DynamicDrawUsage);tears.frustumCulled=false;scene.add(tears);
 const splashMat=new THREE.MeshBasicMaterial({color:0x87deed,transparent:true,opacity:.48,side:THREE.DoubleSide,depthWrite:false});
 const splashes=new THREE.InstancedMesh(new THREE.RingGeometry(.018,.042,14),splashMat,splashCount);splashes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);splashes.frustumCulled=false;scene.add(splashes);
 const drops=Array.from({length:count},()=>({active:false,x:0,y:0,z:0,vx:0,vy:0,vz:0})),ripples=Array.from({length:splashCount},()=>({life:0,x:0,z:0}));
 let dropIndex=0,splashIndex=0,spawnBudget=0,startTime=0,mode='idle',shown=false,lastStage='',shouted=false,ctx,master,ownsAudio=false;
 const origin=new THREE.Vector3(),v=new THREE.Vector3();
 const ui=document.createElement('section');ui.id='ending-overlay';ui.className='ending-overlay';ui.hidden=true;ui.setAttribute('role','dialog');ui.setAttribute('aria-modal','true');ui.setAttribute('aria-label','고소당한 감독관의 엔딩');
 ui.innerHTML=`<div class="ending-shock"></div><div class="ending-vignette"></div><div class="ending-letter"><small>수신: 제03시험실 감독관</small><b>고소장 접수</b><span>피고소인: 나</span></div><div class="ending-lens" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i style="--x:${i%2?70+i:5+i*2}%;--delay:${i*.17}s;--speed:${.8+i%3*.25}s"></i>`).join('')}</div><div id="ending-caption" aria-live="polite"></div><p class="ending-subtitle">오늘은 무사히 퇴근할 줄 알았는데.</p><button id="ending-skip">고소장 보기 →</button>`;
 document.body.append(ui);const caption=ui.querySelector('#ending-caption');
 ui.querySelector('#ending-skip').onclick=showResult;
 function hideInstances(){dummy.position.set(0,-100,0);dummy.scale.setScalar(0);dummy.updateMatrix();for(let i=0;i<count;i++)tears.setMatrixAt(i,dummy.matrix);for(let i=0;i<splashCount;i++)splashes.setMatrixAt(i,dummy.matrix);tears.instanceMatrix.needsUpdate=true;splashes.instanceMatrix.needsUpdate=true;}
 hideInstances();
 function start(at=performance.now()){
  stopAudio();mode='playing';shown=false;lastStage='';shouted=false;startTime=at;spawnBudget=0;origin.copy(eye);drops.forEach(d=>d.active=false);ripples.forEach(r=>r.life=0);hideInstances();
  if(!renderOnly)document.body.classList.add('ending-playing');ui.hidden=renderOnly;ui.dataset.stage='notice';caption.textContent='나… 고소당한 거야?';bubble.visible=false;marker.visible=false;rig.visible=true;hands.visible=true;
  const title=document.querySelector('.document h1')?.textContent||'고소장이 접수됐다.';ui.querySelector('.ending-letter span').textContent=title;
  if(!renderOnly)ui.querySelector('#ending-skip').focus({preventScroll:true});
  if(getSound())try{ctx=audioContext||new(window.AudioContext||window.webkitAudioContext)();ownsAudio=!audioContext;ctx.resume();master=ctx.createGain();master.gain.value=.15;master.connect(audioDestination||ctx.destination);if(audioDestination)master.connect(ctx.destination)}catch{}
 }
 function stopAudio(){if(master)try{master.disconnect()}catch{}if(ctx&&ownsAudio)ctx.close().catch(()=>{});ctx=null;master=null;ownsAudio=false;}
 function shout(){
  if(!ctx||!master||!getSound())return;
  const now=ctx.currentTime,osc=ctx.createOscillator(),voice=ctx.createGain(),filter=ctx.createBiquadFilter();
  osc.type='sawtooth';osc.frequency.setValueAtTime(105,now);osc.frequency.exponentialRampToValueAtTime(205,now+.3);osc.frequency.exponentialRampToValueAtTime(120,now+1.25);
  filter.type='bandpass';filter.frequency.setValueAtTime(650,now);filter.frequency.linearRampToValueAtTime(1050,now+.35);filter.Q.value=1.6;
  voice.gain.setValueAtTime(.001,now);voice.gain.exponentialRampToValueAtTime(.9,now+.13);voice.gain.setValueAtTime(.75,now+.8);voice.gain.exponentialRampToValueAtTime(.001,now+1.4);
  osc.connect(filter);filter.connect(voice);voice.connect(master);osc.start(now);osc.stop(now+1.45);
  const tremolo=ctx.createOscillator(),depth=ctx.createGain();tremolo.frequency.value=9;depth.gain.value=8;tremolo.connect(depth);depth.connect(osc.frequency);tremolo.start(now);tremolo.stop(now+1.45);
 }
 function showResult(){if(shown||mode==='idle')return;shown=true;mode='held';if(!renderOnly)document.body.classList.remove('ending-playing');ui.hidden=true;stopAudio();if(!renderOnly){window.dispatchEvent(new Event('ending-complete'));document.querySelector('.result h1')?.focus({preventScroll:true});}}
 function stop(){mode='idle';ui.hidden=true;document.body.classList.remove('ending-playing');rig.visible=false;bubble.visible=true;marker.visible=true;stopAudio();hands.visible=true;hands.position.set(0,0,0);hands.rotation.set(0,0,0);hands.children.forEach((o,i)=>{o.position.copy(saved[i].position);o.rotation.copy(saved[i].rotation);o.visible=saved[i].visible});drops.forEach(d=>d.active=false);ripples.forEach(r=>r.life=0);hideInstances();}
 function spawn(){const d=drops[dropIndex++%count];v.set((Math.random()<.5?-1:1)*(.06+Math.random()*.06),-.07,-.17-Math.random()*.08);camera.localToWorld(v);d.active=true;d.x=v.x;d.y=v.y;d.z=v.z;d.vx=(Math.random()-.5)*.3;d.vy=-.2-Math.random()*.35;d.vz=(Math.random()-.5)*.3;}
 function update(t,dt){
  if(mode==='idle')return false;
  const elapsed=(t-startTime)/1000,p=endingPose(mode==='held'?Math.max(elapsed,8):elapsed,reduced),shake=p.shake;
  camera.position.copy(origin);camera.position.y=p.height+Math.sin(t*.069)*shake;if(origin.z< -4.2&&Math.abs(origin.x+.8)<1.9)camera.position.z-=.65*p.kneel;const yaw=getYaw()+Math.sin(t*.057)*shake;
  const forward=new THREE.Vector3(Math.sin(yaw)*Math.cos(p.pitch),Math.sin(p.pitch),Math.cos(yaw)*Math.cos(p.pitch));camera.lookAt(camera.position.clone().add(forward));camera.rotateZ(Math.sin(t*.043)*shake*.7);camera.updateMatrixWorld(true);
  rig.visible=p.kneel>.35;hands.visible=true;hands.position.set(0,0,0);hands.rotation.z=Math.sin(t*.047)*shake;
  hands.children.forEach((o,i)=>{o.position.copy(saved[i].position);o.rotation.copy(saved[i].rotation);o.visible=i<4;});
  const clutch=p.clutch;
  const targets=[[-.34,-.13,-.35],[-.18,.13,-.23],[.34,-.13,-.35],[.18,.13,-.23]];
  for(let i=0;i<4;i++){hands.children[i].position.lerp(v.fromArray(targets[i]),clutch);hands.children[i].rotation.z=THREE.MathUtils.lerp(saved[i].rotation.z,(i<2?-1:1)*(i%2?.2:.75),clutch);hands.children[i].rotation.x=clutch*.4;}
  if(master)master.gain.value=getSound()?.15:0;
  if(!shouted&&elapsed>=4.4){shouted=true;shout()}
  if(lastStage!==p.stage){lastStage=p.stage;ui.dataset.stage=p.stage;caption.textContent=p.stage==='cry'?(getBranch()===3?'난 가만히 있었을 뿐인데…':getBranch()===2?'본부에서 알아서 하라더니…':p.caption):p.caption}
  spawnBudget+=p.tearRate*dt;while(spawnBudget>=1){spawn();spawnBudget--}
  for(let i=0;i<count;i++){
   const d=drops[i];dummy.scale.setScalar(0);
   if(d.active){d.vy-=4.8*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;if(d.y<=.025){d.active=false;const r=ripples[splashIndex++%splashCount];r.life=.8;r.x=d.x;r.z=d.z}else{dummy.position.set(d.x,d.y,d.z);dummy.rotation.set(0,0,0);dummy.scale.set(.75,1.8+Math.min(-d.vy,3),.75)}}dummy.updateMatrix();tears.setMatrixAt(i,dummy.matrix);
  }
  for(let i=0;i<splashCount;i++){const r=ripples[i];dummy.scale.setScalar(0);if(r.life>0){r.life-=dt;dummy.position.set(r.x,.018,r.z);dummy.rotation.set(-Math.PI/2,0,0);const scale=1+(1-r.life/.8)*4;dummy.scale.set(scale,scale,scale)}dummy.updateMatrix();splashes.setMatrixAt(i,dummy.matrix)}
  tears.instanceMatrix.needsUpdate=true;splashes.instanceMatrix.needsUpdate=true;
  if(mode==='playing'&&p.complete)showResult();return true;
 }
 window.addEventListener('replay-ending',()=>{if(document.body.dataset.phase==='result')start()});
 return {start,stop,update};
}
