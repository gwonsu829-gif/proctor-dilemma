import * as THREE from './three.module.js';
const canvas=document.getElementById('world-canvas');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true})}catch(e){document.getElementById('world-loading').innerHTML='<b>3D 화면을 열 수 없어요.</b><small>최신 Safari 또는 Chrome에서 다시 열어 주세요.</small>';throw e}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor(0xe7e5ce);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xe7e5ce,35,75);
const camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,.1,100);let angle=.67,camDistance=27,targetAngle=.67;
const ambient=new THREE.HemisphereLight(0xffffed,0x9baf91,2.8);scene.add(ambient);const sun=new THREE.DirectionalLight(0xfff1d4,4.1);sun.position.set(-6,16,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-15;sun.shadow.camera.right=15;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;scene.add(sun);
const materials=new Map();function mat(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.88}));return materials.get(color)}
function box(w,h,d,color,x,y,z,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof color==='object'?color:mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function cyl(r,h,color,x,y,z,parent=scene,segments=8){let m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function label(text,w=512,h=128,bg='#304b43',fg='#fff7d9',size=36){let c=document.createElement('canvas');c.width=w;c.height=h;let ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.font=`900 ${size}px GameSans, Malgun Gothic, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=fg;let lines=text.split('\n');lines.forEach((s,i)=>ctx.fillText(s,w/2,h/2+(i-(lines.length-1)/2)*size*1.5));let t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide})}
function plane(w,h,material,x,y,z,parent=scene){let m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);m.position.set(x,y,z);parent.add(m);return m}
// A warm miniature school, open at the front so every student stays visible.
box(18,.75,15,0xb3ba9d,0,-.65,0);box(17,.18,14,0xe4cda1,0,-.18,0);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(16.6,13.6),mat(0xe4cfa6));floor.rotation.x=-Math.PI/2;floor.position.y=-.075;floor.receiveShadow=true;scene.add(floor);
for(let x=-8;x<=8;x+=1.1)box(.018,.012,13.6,0xd8c298,x,-.06,0);for(let z=-6.6;z<=6.7;z+=1.1)box(16.6,.012,.018,0xd8c298,0,-.055,z);
box(17,4.8,.22,0xf6f0d8,0,2.3,-7);box(17,.8,.28,0x9ab09b,0,.36,-6.97);box(.22,4.8,14,0xf6f0d8,-8.5,2.3,0);box(.28,.8,14,0x9ab09b,-8.47,.36,0);
box(9,2.4,.16,0xa27d4e,-.6,3,-6.8);box(8.7,2.12,.17,0x2e5749,-.6,3,-6.69);plane(8.35,1.85,label('2027학년도 대학수학능력시험\n부정행위 없는 공정한 시험',1024,256,'#2e5749','#eef2d3',38),-.6,3.12,-6.59);box(9.2,.13,.3,0xb48d58,-.6,1.78,-6.6);box(.4,.08,.08,0xf3eee0,-1.8,1.9,-6.45);box(.4,.08,.08,0xebd56e,-1,1.9,-6.45);
// Clock, wall notice, windows and light fixtures.
let clock=cyl(.55,.12,0x384d43,5.5,3.65,-6.78,scene,32);clock.rotation.x=Math.PI/2;let face=cyl(.48,.14,0xfff8e6,5.5,3.65,-6.69,scene,32);face.rotation.x=Math.PI/2;box(.045,.32,.025,0x384d43,5.5,3.8,-6.59);box(.21,.045,.025,0x384d43,5.59,3.65,-6.58);plane(1.6,1.2,label('감독 지침\n현장 판단',256,192,'#ffefbd','#424d3a',26),6,1.9,-6.64);
for(let z of [-3,1,4.8]){box(.12,2.35,2.9,0x92bfae,-8.32,2.85,z);box(.15,.12,3.05,0xf9f5df,-8.22,4.05,z);box(.15,.12,3.05,0xf9f5df,-8.22,1.65,z);box(.15,2.5,.1,0xf9f5df,-8.22,2.85,z);box(.15,.1,3.05,0xf9f5df,-8.21,2.85,z);box(.48,.15,3.25,0xc6b58d,-8.15,1.56,z)}
for(let x of [])for(let z of [-3,3]){box(2.7,.12,.5,0xfff9df,x,4.8,z);box(.04,.35,.04,0x788a79,x-.9,5,z);box(.04,.35,.04,0x788a79,x+.9,5,z)}
box(2.6,.18,1.05,0xb78d5b,-.8,.85,-5.2);box(2.1,.78,.7,0xd8b57e,-.8,.4,-5.2);box(.7,.08,.42,0xf9f5dd,-1.2,1,-5.25);
const students=[],colliders=[];const shirts=[0x6d9a85,0x8a94b3,0xe7c88d,0x9aac92,0xc1a3a0,0x7ca8a0,0xe4d7ba,0xa1b1c1,0xc79577,0xb6c58c,0x8eaa8a,0xc4ad8b];
function character(shirt,hair=0x3e3931,glasses=false){let g=new THREE.Group();box(.67,.72,.42,shirt,0,1.08,0,g);box(.21,.55,.27,0x35483e,-.2,.46,0,g);box(.21,.55,.27,0x35483e,.2,.46,0,g);box(.25,.16,.42,0x3b4138,-.2,.15,-.05,g);box(.25,.16,.42,0x3b4138,.2,.15,-.05,g);box(.21,.6,.26,shirt,-.45,1.06,0,g);box(.21,.6,.26,shirt,.45,1.06,0,g);box(.18,.19,.21,0xecc399,-.45,.71,-.02,g);box(.18,.19,.21,0xecc399,.45,.71,-.02,g);box(.65,.65,.58,0xf0cda7,0,1.76,0,g);box(.7,.2,.64,hair,0,2.04,0,g);box(.16,.28,.63,hair,-.27,1.88,.015,g);box(.46,.12,.09,hair,-.04,1.92,-.31,g);box(.06,.075,.035,0x344237,-.15,1.78,-.305,g);box(.06,.075,.035,0x344237,.15,1.78,-.305,g);box(.15,.025,.025,0xaa8066,0,1.6,-.304,g);if(glasses){box(.29,.18,.045,0x263e36,-.17,1.78,-.34,g);box(.29,.18,.045,0x263e36,.17,1.78,-.34,g);box(.065,.04,.055,0x263e36,0,1.8,-.35,g);box(.2,.1,.052,0x7fddc1,-.17,1.79,-.37,g);box(.2,.1,.052,0x7fddc1,.17,1.79,-.37,g);box(.065,.065,.055,new THREE.MeshBasicMaterial({color:0xff5136}),.3,1.84,-.37,g)}return g}
let n=0;for(let row=0;row<3;row++)for(let col=0;col<4;col++){let x=-5.5+col*3.15,z=-2.7+row*3.25;box(1.9,.14,1.23,0xc79e63,x,.88,z);box(1.82,.2,1.08,0xa87d46,x,.7,z);for(let dx of [-.75,.75])for(let dz of [-.45,.45])box(.07,.85,.07,0x7e8e78,x+dx,.4,z+dz);box(.88,.13,.8,0x879b7d,x,.49,z+1);box(.88,.75,.12,0x91a688,x,.95,z+1.34);for(let dx of [-.32,.32])box(.07,.52,.07,0x72836b,x+dx,.22,z+1.2);box(.58,.025,.66,0xfff9e5,x-.16,.97,z-.13);for(let j=0;j<4;j++)box(.36,.005,.012,0xb6bfa8,x-.18,.988,z-.31+j*.1);let pencil=box(.025,.025,.48,0xe26541,x+.49,1,z-.13);pencil.rotation.y=.2;let suspect=n===6;let g=character(shirts[n],n%3===0?0x765746:0x353c32,suspect);g.position.set(x,-.08,z+1);g.rotation.y=n%4===0?.1:0;g.scale.setScalar(.85);scene.add(g);g.userData={student:n,suspect};g.traverse(o=>o.userData.student=n);students.push(g);colliders.push({x,z,r:1});n++}
let suspect=students[6];suspect.rotation.y=0;const proctor=character(0xe7b65d,0x433c35,false);proctor.position.set(6,.0,5.5);proctor.scale.setScalar(1.15);scene.add(proctor);box(.42,.58,.08,0xeee6ce,-.62,1.1,-.08,proctor);box(.3,.08,.09,0x6b8170,-.62,1.45,-.08,proctor);
// Small plants and an unmistakable yellow quest marker.
function plant(x,z){cyl(.36,.6,0xd19268,x,.3,z);box(.15,1.4,.15,0x6f9366,x,1.1,z);for(let i=0;i<5;i++){let leaf=box(.8,.22,.45,0x7f9b68,x+Math.cos(i*2)*.25,1+i*.17,z+Math.sin(i*2)*.25);leaf.rotation.z=i*.4}}plant(7,-5.5);plant(-7,-5.7);
const ring=new THREE.Mesh(new THREE.RingGeometry(.48,.58,32),new THREE.MeshBasicMaterial({color:0xe95337,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(proctor.position.x,.025,proctor.position.z);scene.add(ring);
const marker=new THREE.Group();let ball=new THREE.Mesh(new THREE.OctahedronGeometry(.32),new THREE.MeshStandardMaterial({color:0xf5cb50,emissive:0x9e6000,emissiveIntensity:.4,roughness:.4}));marker.add(ball);let stem=cyl(.045,.25,0xf5cb50,0,-.52,0,marker);marker.position.copy(suspect.position).add(new THREE.Vector3(0,3.5,0));scene.add(marker);
let bubble=plane(3.9,.86,label('정답은 ③입니다',512,128,'#f9d561','#2c4236',39),suspect.position.x,3.1,suspect.position.z);let bubbleText='';

// Complete the classroom for the proctor's eye-level view.
box(17,4.8,.22,0xf6f0d8,0,2.3,7);
box(17,.8,.28,0x9ab09b,0,.36,6.97);
box(.22,4.8,14,0xf6f0d8,8.5,2.3,0);
box(.28,.8,14,0x9ab09b,8.47,.36,0);
box(1.9,3.6,.18,0x977b55,6.4,1.75,6.8);
box(1.65,3.3,.19,0xd8c69e,6.4,1.77,6.68);
box(1.22,1.15,.04,0x91b9ac,6.4,2.47,6.55);
box(.11,.1,.14,0x465d4e,5.78,1.3,6.52);
plane(1.2,.43,label('제03시험실',256,96,'#304b43','#fff8e1',30),6.4,4,6.59).rotation.y=Math.PI;
box(6.4,1.8,.18,0xa78050,-2.5,2.9,6.78);
box(6.15,1.55,.2,0xc6c2a0,-2.5,2.9,6.65);
for(let k=0;k<4;k++)box(.93,1.05,.035,k%2?0xffeed0:0xe8efd8,-4.6+k*1.4,2.9,6.51);
for(let z of [-3,1,4.8]){box(.17,2.25,2.75,0xa5c5b4,8.33,2.85,z);box(.19,.1,2.95,0xf9f5df,8.22,4,z);box(.19,.1,2.95,0xf9f5df,8.22,1.7,z);box(.19,2.4,.09,0xf9f5df,8.22,2.85,z)}
box(17,.13,14,0xf4efdb,0,4.9,0);
for(let x of [-4,3])for(let z of [-3,2.7])box(2.8,.08,.55,new THREE.MeshBasicMaterial({color:0xffffec}),x,4.8,z);
box(3,.7,.7,0xb4b28e,-5,.35,6.5);
proctor.visible=false;ring.visible=false;scene.add(camera);
camera.fov=72;camera.near=.08;camera.updateProjectionMatrix();
// The player's hands remain attached to the eye-level camera.
const hands=new THREE.Group();camera.add(hands);
let left=box(.12,.43,.14,0xe4b25e,-.39,-.39,-.63,hands);left.rotation.z=-.28;
box(.13,.16,.13,0xf0cda7,-.34,-.23,-.66,hands);
let right=box(.12,.45,.14,0xe4b25e,.43,-.4,-.66,hands);right.rotation.z=.22;
box(.14,.16,.13,0xf0cda7,.37,-.24,-.7,hands);
let paper=box(.39,.5,.025,0xfff9e8,.34,-.26,-.84,hands);paper.rotation.z=.09;
let writing=plane(.35,.44,label('감독일지\n제03시험실\n이상 없음?',256,320,'#fff9e8','#304b43',26),.34,-.26,-.82,hands);writing.rotation.z=.09;
box(.15,.04,.04,0x4f695c,.33,.005,-.81,hands);
hands.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false}});

const buttonStudent=students[5],shirtStudent=students[10];
for(let yy of [.9,1.12,1.34])box(.055,.055,.035,0x404b3b,0,yy,-.24,buttonStudent);
const buttonLight=box(.055,.055,.05,new THREE.MeshBasicMaterial({color:0xed593e}),0,1.12,-.26,buttonStudent);
box(.24,.2,.04,0xb2b99b,.18,1.2,-.24,shirtStudent);
const pocketLight=box(.11,.07,.05,new THREE.MeshBasicMaterial({color:0x7fedd9}),.18,1.25,-.27,shirtStudent);
// Red "수능냥이" name tags over the cheating students (glasses 6, button 5, shirt pocket 10).
function redTag(text){const c=document.createElement('canvas');c.width=384;c.height=110;const g=c.getContext('2d');g.font='900 64px GameSans, Malgun Gothic, sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=14;g.strokeStyle='#fff9e8';g.strokeText(text,192,58);g.fillStyle='#e02a1c';g.fillText(text,192,58);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false})}
const nyangTags=[6,5,10].map(i=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.4),redTag('수능냥이'));m.position.set(students[i].position.x,i===10?2.5:2.05,students[i].position.z);scene.add(m);return m});
document.fonts.ready.then(()=>nyangTags.forEach(m=>{m.material.map.dispose();m.material.dispose();m.material=redTag('수능냥이')}));
function setSuspect(index){suspect=students[index]||students[6];bubble.position.x=suspect.position.x;bubble.position.z=suspect.position.z;marker.position.x=suspect.position.x;marker.position.z=suspect.position.z;}
function animateClues(t){buttonStudent.children[7].position.set(-.12+Math.sin(t*.006)*.035,1.09+Math.sin(t*.008)*.06,-.34);buttonStudent.children[5].rotation.z=-.65;buttonStudent.children[5].position.set(-.28,1.04,-.16);buttonLight.visible=Math.sin(t*.007)>.1;pocketLight.visible=Math.sin(t*.004)>.15;shirtStudent.rotation.y=Math.sin(t*.0012)*.045;nyangTags.forEach(m=>m.quaternion.copy(camera.quaternion));}
export {renderer,scene,camera,proctor,students,suspect,marker,bubble,label,hands,colliders,setSuspect,animateClues,nyangTags};
