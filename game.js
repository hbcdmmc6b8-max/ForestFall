import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const $ = (id) => document.getElementById(id);
const mobile = matchMedia('(pointer: coarse)').matches;
const SAVE_KEY = 'forestfall-alpha-v1';
const WEAPONS = [
  {id:'sword',name:'IRON SWORD', icon:'⚔', cost:0, damage:23, reach:3.25, delay:.42, special:'WHIRLWIND',desc:'Balanced blade • 3-hit combo', info:'Balanced damage and a circular slash.'},
  {id:'daggers',name:'TWIN DAGGERS',icon:'🗡',cost:180,damage:14,reach:2.65,delay:.23,special:'BLADE RUSH',desc:'Lightning-fast close-range strikes',info:'Faster strikes and a rapid forward rush.'},
  {id:'hammer',name:'WAR HAMMER',icon:'⚒',cost:350,damage:43,reach:3.4,delay:.78,special:'EARTH SHOCK',desc:'Slow, devastating heavy hits',info:'Crushing damage and a wide shockwave.'}
];
let saved={coins:0,unlocked:['sword'],weapon:'sword'};
try {const data=JSON.parse(localStorage.getItem(SAVE_KEY)); if(data&&typeof data==='object'){saved.coins=Math.max(0,Math.floor(Number(data.coins)||0));saved.unlocked=Array.isArray(data.unlocked)?data.unlocked.filter(x=>WEAPONS.some(w=>w.id===x)):['sword'];saved.unlocked.push('sword');saved.weapon=saved.unlocked.includes(data.weapon)?data.weapon:'sword';}}catch(e){}
const save=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(saved));}catch(e){}};
let weapon=WEAPONS.find(w=>w.id===saved.weapon)||WEAPONS[0], kills=0, mode='menu';
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bb8a9);scene.fog=new THREE.FogExp2(0x9bb8a9,.0135);
const camera=new THREE.PerspectiveCamera(67,innerWidth/innerHeight,.1,170);
camera.position.set(0,6,-10);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.34;
renderer.shadowMap.enabled=!mobile;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
$('game').appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xdff4d9,0x29482f,2.35));
const sun=new THREE.DirectionalLight(0xfff0c7,2.65);sun.position.set(34,75,-24);sun.castShadow=!mobile;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-37;sun.shadow.camera.right=37;sun.shadow.camera.top=37;sun.shadow.camera.bottom=-37;sun.shadow.camera.near=.1;sun.shadow.camera.far=180;scene.add(sun);
const sunBall=new THREE.Mesh(new THREE.SphereGeometry(8,24,16),new THREE.MeshBasicMaterial({color:0xffe1a5,fog:false}));sunBall.position.set(90,64,-120);scene.add(sunBall);
const mat=(color,roughness=1,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const grass=mat(0x426e49),darkWood=mat(0x503a30),steel=mat(0xd9e8e2,.25,.65),leather=mat(0x29362e),gold=mat(0xcce895,.3,.25);
const groundHeight=(x,z)=>.28*Math.sin(x*.115)*Math.cos(z*.13)+.15*Math.sin(z*.22+x*.08);
const groundGeometry=new THREE.PlaneGeometry(205,205,85,85);groundGeometry.rotateX(-Math.PI/2);
const verts=groundGeometry.attributes.position;const colors=[];const base1=new THREE.Color(0x396947),base2=new THREE.Color(0x638659);
for(let i=0;i<verts.count;i++){const x=verts.getX(i),z=verts.getZ(i);verts.setY(i,groundHeight(x,z));const shade=.5+.5*Math.sin(x*.29)*Math.cos(z*.2);const c=base1.clone().lerp(base2,shade*.6);colors.push(c.r,c.g,c.b);}
groundGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));groundGeometry.computeVertexNormals();
const floor=new THREE.Mesh(groundGeometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));floor.receiveShadow=true;scene.add(floor);
let seed=15321;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const obstacles=[];
const trunkG=new THREE.CylinderGeometry(.36,.49,3,6),leafG=new THREE.ConeGeometry(2,5.1,7),rockG=new THREE.DodecahedronGeometry(1,0),shrubG=new THREE.IcosahedronGeometry(.6,0);
const trunkM=mat(0x564333),leafM=mat(0x245741),leafM2=mat(0x35714b),rockM=mat(0x65776c),shrubM=mat(0x3b8855);
const N=175;
const trunks=new THREE.InstancedMesh(trunkG,trunkM,N),leaves=new THREE.InstancedMesh(leafG,leafM,N),leaves2=new THREE.InstancedMesh(leafG,leafM2,N);
const dummy=new THREE.Object3D();
for(let i=0;i<N;i++){
  const a=rand()*Math.PI*2,r=15+Math.sqrt(rand())*83,x=Math.sin(a)*r,z=Math.cos(a)*r,h=2.5+rand()*5.3;
  dummy.position.set(x,groundHeight(x,z)+h*.5,z);dummy.rotation.set(0,rand()*6.28,0);dummy.scale.set(.8+rand()*.55,h/3,.8+rand()*.55);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
  dummy.position.y=groundHeight(x,z)+h+1.65;dummy.scale.set(.75+h*.085,.65+h*.072,.75+h*.085);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
  dummy.position.y+=1.8;dummy.scale.multiplyScalar(.7);dummy.updateMatrix();leaves2.setMatrixAt(i,dummy.matrix);
  if(r<54)obstacles.push({x,z,r:.7});
}
scene.add(trunks,leaves,leaves2);
const rockCount=84,rocks=new THREE.InstancedMesh(rockG,rockM,rockCount);
for(let i=0;i<rockCount;i++){const a=rand()*6.283,r=11+rand()*78,x=Math.sin(a)*r,z=Math.cos(a)*r,s=.3+rand()*1.2;dummy.position.set(x,groundHeight(x,z)+s*.2,z);dummy.rotation.set(rand()*3,rand()*6,rand());dummy.scale.set(s*1.3,s*.6,s);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);if(r<48&&s>.9)obstacles.push({x,z,r:s*.76});}scene.add(rocks);
const shrubCount=250,shrubs=new THREE.InstancedMesh(shrubG,shrubM,shrubCount);
for(let i=0;i<shrubCount;i++){const a=rand()*6.283,r=7+rand()*85,x=Math.sin(a)*r,z=Math.cos(a)*r,s=.3+rand()*.75;dummy.position.set(x,groundHeight(x,z)+s*.14,z);dummy.rotation.set(0,rand()*6.283,0);dummy.scale.set(s,s*.48,s);dummy.updateMatrix();shrubs.setMatrixAt(i,dummy.matrix);}scene.add(shrubs);
const altar=new THREE.Group();const platform=new THREE.Mesh(new THREE.CylinderGeometry(5.8,6.25,.5,9),mat(0x617569));platform.position.y=-.16;platform.receiveShadow=true;altar.add(platform);
for(let i=0;i<9;i++){const a=i/9*Math.PI*2;const slab=new THREE.Mesh(new THREE.BoxGeometry(.28,.07,2.1),mat(0x83988a));slab.position.set(Math.sin(a)*3.75,.15,Math.cos(a)*3.75);slab.rotation.y=a;altar.add(slab);}altar.position.set(0,groundHeight(0,0),0);scene.add(altar);
const landmarks=[[9,8],[-10,7],[8,-12],[-12,-12]];
for(const [x,z] of landmarks){const base=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.65,.5,6),mat(0x788a7a));base.position.set(x,groundHeight(x,z)+.15,z);scene.add(base);const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.49,.64,2.4,6),mat(0x77877b));pillar.position.set(x,groundHeight(x,z)+1.3,z);pillar.rotation.z=.06;scene.add(pillar);}
const particleCount=110,particlePositions=new Float32Array(particleCount*3);
for(let i=0;i<particleCount;i++){particlePositions[i*3]=(rand()-.5)*95;particlePositions[i*3+1]=1+rand()*12;particlePositions[i*3+2]=(rand()-.5)*95;}
const particleGeo=new THREE.BufferGeometry();particleGeo.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));
const particles=new THREE.Points(particleGeo,new THREE.PointsMaterial({color:0xdaff8d,size:.14,transparent:true,opacity:.65,depthWrite:false}));scene.add(particles);

function part(group,geometry,material,x,y,z){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=!mobile;group.add(m);return m;}
function character(color,headColor,enemy=false){
 const root=new THREE.Group(),figure=new THREE.Group();root.add(figure);
 const cloth=mat(color),skin=mat(headColor),shade=mat(enemy?0x354239:0x1b3327),eyes=mat(enemy?0xff7b62:0xb9f8a0,.15);
 part(figure,new THREE.CapsuleGeometry(.46,.85,4,8),cloth,0,1.38,0);
 part(figure,new THREE.SphereGeometry(.35,10,8),skin,0,2.48,0);
 part(figure,new THREE.CylinderGeometry(.39,.47,.22,8),shade,0,2.13,0);
 for(const ex of [-.13,.13])part(figure,new THREE.SphereGeometry(.048,6,5),eyes,ex,2.5,.32);
 const leftArm=new THREE.Group(),rightArm=new THREE.Group(),leftLeg=new THREE.Group(),rightLeg=new THREE.Group();
 leftArm.position.set(-.59,1.91,0);rightArm.position.set(.59,1.91,0);leftLeg.position.set(-.25,.9,0);rightLeg.position.set(.25,.9,0);
 figure.add(leftArm,rightArm,leftLeg,rightLeg);
 part(leftArm,new THREE.CapsuleGeometry(.17,.61,3,6),cloth,0,-.43,0);
 part(rightArm,new THREE.CapsuleGeometry(.17,.61,3,6),cloth,0,-.43,0);
 part(leftLeg,new THREE.CapsuleGeometry(.18,.65,3,6),shade,0,-.44,0);
 part(rightLeg,new THREE.CapsuleGeometry(.18,.65,3,6),shade,0,-.44,0);
 const mount=new THREE.Group();mount.position.set(0,-.84,.16);rightArm.add(mount);
 if(enemy){const m=part(mount,new THREE.BoxGeometry(.14,1.25,.14),mat(0xa8b3ae,.35,.55),0,-.5,.28);m.rotation.x=.2;}
 return {root,figure,rightArm,leftArm,leftLeg,rightLeg,mount};
}
const hero=character(0x8cae73,0xe9c7a5);scene.add(hero.root);
hero.root.position.set(0,groundHeight(0,0),0);
let currentWeaponArt=null;
function buildWeapon(){
 if(currentWeaponArt){hero.mount.remove(currentWeaponArt);currentWeaponArt.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});}
 currentWeaponArt=new THREE.Group();hero.mount.add(currentWeaponArt);
 const grip=mat(0x3c3026),edge=mat(0xdcece3,.24,.7),accent=mat(0xc6df8a,.4,.4);
 if(weapon.id==='sword'){
   part(currentWeaponArt,new THREE.CylinderGeometry(.085,.11,.55,7),grip,0,-.18,0);
   part(currentWeaponArt,new THREE.BoxGeometry(.62,.09,.17),accent,0,-.44,0);
   part(currentWeaponArt,new THREE.BoxGeometry(.18,1.45,.105),edge,0,-1.19,0);
   const tip=part(currentWeaponArt,new THREE.ConeGeometry(.12,.37,4),edge,0,-2.05,0);tip.rotation.y=Math.PI/4;tip.rotation.z=Math.PI;
 } else if(weapon.id==='daggers'){
   for(const x of [-.14,.19]){part(currentWeaponArt,new THREE.BoxGeometry(.09,.35,.10),grip,x,-.1,0);part(currentWeaponArt,new THREE.BoxGeometry(.13,.95,.07),edge,x,-.77,0);part(currentWeaponArt,new THREE.BoxGeometry(.24,.08,.10),accent,x,-.29,0);}
 } else {
   part(currentWeaponArt,new THREE.CylinderGeometry(.10,.13,1.88,8),grip,0,-.9,0);
   part(currentWeaponArt,new THREE.BoxGeometry(.95,.56,.65),edge,0,-1.8,0);
   part(currentWeaponArt,new THREE.BoxGeometry(.99,.1,.7),accent,0,-2.12,0);
 }
}
const enemies=[];
const enemyColors=[0xa45d4a,0x8b7187,0x537f78];
function createEnemy(index){
 const actor=character(enemyColors[index%3],0xc0c8a5,true);scene.add(actor.root);
 const back=new THREE.Mesh(new THREE.PlaneGeometry(1.18,.12),new THREE.MeshBasicMaterial({color:0x1c2a22,side:THREE.DoubleSide}));
 const fill=new THREE.Mesh(new THREE.PlaneGeometry(1.16,.09),new THREE.MeshBasicMaterial({color:0xf48d68,side:THREE.DoubleSide}));back.add(fill);fill.position.z=.003;
 actor.root.add(back);back.position.y=3.02;
 const enemy={...actor,index,health:85,maxHealth:85,alive:true,attackTimer:1.2+index*.3,telegraph:0,respawnTimer:0,stun:0,back,fill,swing:0};
 placeEnemy(enemy);enemies.push(enemy);
}
function placeEnemy(e){const a=rand()*Math.PI*2,r=12+rand()*14;e.root.position.set(Math.sin(a)*r,0,Math.cos(a)*r);e.root.position.y=groundHeight(e.root.position.x,e.root.position.z);e.health=e.maxHealth;e.alive=true;e.root.visible=true;e.stun=0;e.telegraph=0;e.attackTimer=1.2;e.fill.scale.x=1;}
for(let i=0;i<4;i++)createEnemy(i);
const player={hp:100,maxHp:100,velY:0,jumpY:0,onGround:true,attackCD:0,combo:0,comboWindow:0,swing:0,dashCD:0,dashTime:0,specialCD:0,block:false,invuln:0,run:0};
const inputs={forward:0,right:0,block:false},keys=new Set();
let yaw=0,pitch=.16,zoom=8.8,elapsed=0,toastTimer=0,feedbackTimer=0,actionTime=0,shake=0;
const effects=[];
const vector=new THREE.Vector3(),v2=new THREE.Vector3();
function flashMessage(msg){$('toast').textContent=msg;$('toast').classList.add('show');toastTimer=2.2;}
function feedback(msg){$('combat-feedback').textContent=msg;$('combat-feedback').style.opacity='1';feedbackTimer=.43;}
function fxRing(x,z,color,radius=1.0,duration=.5){
 const geometry=new THREE.RingGeometry(radius*.82,radius,40),material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.88,side:THREE.DoubleSide,depthWrite:false});
 const mesh=new THREE.Mesh(geometry,material);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,groundHeight(x,z)+.15,z);scene.add(mesh);effects.push({mesh,time:duration,duration,kind:'ring'});
}
function fxBurst(x,y,z,color,count=8){
 for(let i=0;i<count;i++){
   const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.07+rand()*.07,0),new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}));
   mesh.position.set(x,y,z);scene.add(mesh);
   const vel=new THREE.Vector3((rand()-.5)*6,rand()*5,(rand()-.5)*6);effects.push({mesh,time:.5,duration:.5,vel,kind:'spark'});
 }
}
function damageEnemy(e,damage,push=1.1){
 if(!e.alive)return;
 e.health=Math.max(0,e.health-damage);e.fill.scale.x=e.health/e.maxHealth;
 const dx=e.root.position.x-hero.root.position.x,dz=e.root.position.z-hero.root.position.z,dist=Math.hypot(dx,dz)||1;
 e.root.position.x+=dx/dist*push;e.root.position.z+=dz/dist*push;e.root.position.y=groundHeight(e.root.position.x,e.root.position.z);
 e.stun=.22;fxBurst(e.root.position.x,e.root.position.y+1.5,e.root.position.z,0xf7de9c,7);
 if(e.health<=0){e.alive=false;e.root.visible=false;e.respawnTimer=4.7;kills++;saved.coins+=35;save();updateHud();feedback('+35 COINS • SENTINEL DOWN');}
}
function targetAttack(damage,range,arc=Math.PI*.57,push=1.0){
 let hits=0;for(const e of enemies){
 if(!e.alive)continue;
 const dx=e.root.position.x-hero.root.position.x,dz=e.root.position.z-hero.root.position.z,d=Math.hypot(dx,dz);
 if(d>range)continue;
 const angle=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(angle-yaw),Math.cos(angle-yaw));
 if(Math.abs(delta)<=arc){damageEnemy(e,damage,push);hits++;}
 }return hits;
}
function attack(){
 if(mode!=='playing'||player.attackCD>0||player.dashTime>0||player.hp<=0)return;
 player.block=false;inputs.block=false;player.attackCD=weapon.delay;player.swing=.3;
 player.combo=player.comboWindow>0?(player.combo%3)+1:1;player.comboWindow=.9;
 const damage=Math.round(weapon.damage*(player.combo===3?1.35:1));
 const hits=targetAttack(damage,weapon.reach,weapon.id==='hammer'?.85:.7,weapon.id==='hammer'?2.0:.75);
 if(hits){feedback(player.combo===3?'FINISHER!':'HIT!');}else{feedback('SWING');}
 const p=hero.root.position;fxRing(p.x+Math.sin(yaw)*1.3,p.z+Math.cos(yaw)*1.3,weapon.id==='hammer'?0xf6d98c:0xbbeeba,.65,.24);
}
function dash(){
 if(mode!=='playing'||player.dashCD>0||player.hp<=0)return;
 player.dashCD=3;player.dashTime=.24;player.invuln=.26;player.block=false;inputs.block=false;
 const p=hero.root.position;fxRing(p.x,p.z,0x9ef9c7,1.0,.4);
}
function special(){
 if(mode!=='playing'||player.specialCD>0||player.hp<=0)return;
 player.specialCD=weapon.id==='hammer'?9:weapon.id==='daggers'?7:8;player.swing=.55;player.invuln=.3;
 const p=hero.root.position;
 if(weapon.id==='sword'){
   for(const e of enemies)if(e.alive&&e.root.position.distanceTo(p)<5)damageEnemy(e,49,2.2);
   fxRing(p.x,p.z,0xe6f7a1,2.6,.7);fxRing(p.x,p.z,0xc2fbc8,4.2,.7);
   feedback('WHIRLWIND!');
 }else if(weapon.id==='daggers'){
   player.dashTime=.32;player.invuln=.38;
   for(const e of enemies){
     if(!e.alive)continue;const dx=e.root.position.x-p.x,dz=e.root.position.z-p.z,d=Math.hypot(dx,dz);
     const delta=Math.atan2(Math.sin(Math.atan2(dx,dz)-yaw),Math.cos(Math.atan2(dx,dz)-yaw));
     if(d<7&&Math.abs(delta)<.65)damageEnemy(e,65,2.2);
   }
   fxRing(p.x,p.z,0x92f5d7,2.4,.45);feedback('BLADE RUSH!');
 }else{
   for(const e of enemies)if(e.alive&&e.root.position.distanceTo(p)<7)damageEnemy(e,75,3.7);
   fxRing(p.x,p.z,0xffd48a,5,.9);fxRing(p.x,p.z,0xfaf6b0,6.5,.9);shake=.55;feedback('EARTH SHOCK!');
 }
}
function hurt(amount){
 if(player.invuln>0||mode!=='playing')return;
 if(player.block){amount=Math.ceil(amount*.2);feedback('BLOCKED');}else{shake=.22;feedback('-'+amount+' HP');}
 player.hp=Math.max(0,player.hp-amount);updateHud();
 $('hitflash').classList.add('active');setTimeout(()=>$('hitflash').classList.remove('active'),75);
 if(player.hp<=0)die();
}
function updateHud(){
 $('health-text').textContent=player.hp+' / '+player.maxHp;
 $('health-fill').style.width=player.hp/player.maxHp*100+'%';
 $('coins').textContent=saved.coins;$('shop-coins').textContent=saved.coins;
 $('kills').textContent=kills;$('weapon-name').textContent=weapon.name;$('weapon-description').textContent=weapon.desc;$('special-name').textContent=weapon.special;
}
function shopRender(){
 $('shop-coins').textContent=saved.coins;
 $('weapon-grid').replaceChildren();
 for(const w of WEAPONS){
   const unlocked=saved.unlocked.includes(w.id),equipped=weapon.id===w.id;
   const card=document.createElement('div');card.className='weapon-card'+(equipped?' equipped':'');
   const symbol=document.createElement('div');symbol.className='weapon-icon';symbol.textContent=w.icon;
   const title=document.createElement('h3');title.textContent=w.name;
   const info=document.createElement('p');info.textContent=w.info;
   const stats=document.createElement('div');stats.className='stats';stats.textContent='DMG '+w.damage+'  /  SPEED '+(1/w.delay).toFixed(1)+'/s';
   const button=document.createElement('button');button.textContent=equipped?'EQUIPPED':unlocked?'EQUIP':'✦ '+w.cost+' UNLOCK';
   button.disabled=equipped;button.addEventListener('click',()=>{
     if(mode!=='shop')return;
     if(!unlocked){if(saved.coins<w.cost){flashMessage('Not enough coins!');return;}saved.coins-=w.cost;saved.unlocked.push(w.id);}
     weapon=w;saved.weapon=w.id;save();buildWeapon();updateHud();shopRender();flashMessage(w.name+' equipped');
   });
   card.append(symbol,title,info,stats,button);$('weapon-grid').append(card);
 }
}
function enterMode(next){
 mode=next;
 $('overlay').classList.toggle('hidden',next==='playing');
 for(const id of ['menu','pause-menu','shop-menu','death-menu'])$(id).classList.add('hidden');
 const map={menu:'menu',pause:'pause-menu',shop:'shop-menu',dead:'death-menu'};
 if(map[next])$(map[next]).classList.remove('hidden');
 $('hud').classList.toggle('hidden',next==='menu');
 if(next==='shop')shopRender();
 if(next==='playing'){if(!mobile&&!document.pointerLockElement)renderer.domElement.requestPointerLock?.().catch(()=>{});}
 else{if(document.pointerLockElement)document.exitPointerLock?.();inputs.block=false;keys.clear();}
}
function resetMatch(){
 player.hp=100;player.velY=0;player.jumpY=0;player.attackCD=0;player.dashCD=0;player.specialCD=0;player.invuln=0;player.combo=0;player.block=false;kills=0;
 hero.root.position.set(0,groundHeight(0,0),0);for(const e of enemies)placeEnemy(e);updateHud();
}
function die(){$('death-stats').textContent='You defeated '+kills+' sentinels. Your coins and unlocked weapons are saved.';enterMode('dead');}
$('play-button').onclick=()=>{resetMatch();enterMode('playing');flashMessage('Defeat the forest sentinels!');};
$('resume-button').onclick=()=>enterMode('playing');
$('pause-button').onclick=()=>{if(mode==='playing')enterMode('pause');};
$('restart-button').onclick=()=>{resetMatch();enterMode('playing');};
$('respawn-button').onclick=()=>{resetMatch();enterMode('playing');};
$('shop-button').onclick=()=>{if(mode==='playing')enterMode('shop');};
$('pause-arsenal').onclick=()=>enterMode('shop');
$('death-arsenal').onclick=()=>enterMode('shop');
$('close-shop').onclick=()=>enterMode(player.hp<=0?'dead':'playing');
document.addEventListener('pointerlockchange',()=>{if(!mobile&&!document.pointerLockElement&&mode==='playing')enterMode('pause');});
document.addEventListener('keydown',ev=>{
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(ev.code))ev.preventDefault();
 if(ev.repeat&&['KeyQ','KeyE','KeyB','Escape'].includes(ev.code))return;
 keys.add(ev.code);
 if(ev.code==='Escape'){if(mode==='playing')enterMode('pause');else if(mode==='shop')enterMode(player.hp<=0?'dead':'playing');else if(mode==='pause')enterMode('playing');return;}
 if(ev.code==='KeyB'){if(mode==='playing')enterMode('shop');else if(mode==='shop')enterMode(player.hp<=0?'dead':'playing');return;}
 if(mode!=='playing')return;
 if(ev.code==='KeyQ')dash();if(ev.code==='KeyE')special();
 if(ev.code==='Space'&&player.onGround){player.velY=7.1;player.onGround=false;}
});
document.addEventListener('keyup',ev=>keys.delete(ev.code));
window.addEventListener('blur',()=>{keys.clear();inputs.block=false;if(mode==='playing')enterMode('pause');});
document.addEventListener('contextmenu',ev=>ev.preventDefault());
renderer.domElement.addEventListener('mousedown',ev=>{
 if(mode!=='playing')return;
 if(ev.button===0)attack();if(ev.button===2)inputs.block=true;
});
window.addEventListener('mouseup',ev=>{if(ev.button===2)inputs.block=false;});
window.addEventListener('mousemove',ev=>{
 if(mode==='playing'&&document.pointerLockElement===renderer.domElement){yaw+=ev.movementX*.0027;pitch=THREE.MathUtils.clamp(pitch-ev.movementY*.0022,-.31,.68);}
});
window.addEventListener('wheel',ev=>{zoom=THREE.MathUtils.clamp(zoom+Math.sign(ev.deltaY)*.6,5.7,12.5);},{passive:true});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:2));});
const pad=$('move-pad'),knob=$('move-knob');let padTouch=null;
function padAt(clientX,clientY){
 const rect=pad.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2,dx=clientX-cx,dy=clientY-cy,lim=43,d=Math.max(1,Math.hypot(dx,dy)),scale=Math.min(1,lim/d);
 const x=dx*scale,y=dy*scale;knob.style.transform='translate('+x+'px,'+y+'px)';
 inputs.right=x/lim;inputs.forward=-y/lim;
}
pad.addEventListener('pointerdown',ev=>{padTouch=ev.pointerId;pad.setPointerCapture(ev.pointerId);padAt(ev.clientX,ev.clientY);});
pad.addEventListener('pointermove',ev=>{if(ev.pointerId===padTouch)padAt(ev.clientX,ev.clientY);});
function releasePad(){padTouch=null;inputs.forward=0;inputs.right=0;knob.style.transform='';}
pad.addEventListener('pointerup',releasePad);pad.addEventListener('pointercancel',releasePad);
for(const btn of document.querySelectorAll('[data-action]')){
 const action=btn.dataset.action;
 btn.addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation();btn.setPointerCapture(ev.pointerId);btn.classList.add('active');if(action==='attack')attack();if(action==='dash')dash();if(action==='special')special();if(action==='block')inputs.block=true;});
 const release=()=>{btn.classList.remove('active');if(action==='block')inputs.block=false;};btn.addEventListener('pointerup',release);btn.addEventListener('pointercancel',release);
}
let lookTouch=null,lookX=0,lookY=0;
renderer.domElement.addEventListener('pointerdown',ev=>{if(!mobile||mode!=='playing'||ev.clientX<innerWidth*.34)return;lookTouch=ev.pointerId;lookX=ev.clientX;lookY=ev.clientY;renderer.domElement.setPointerCapture(ev.pointerId);});
renderer.domElement.addEventListener('pointermove',ev=>{if(!mobile||mode!=='playing'||ev.pointerId!==lookTouch)return;yaw+=(ev.clientX-lookX)*.006;pitch=THREE.MathUtils.clamp(pitch-(ev.clientY-lookY)*.005,-.31,.68);lookX=ev.clientX;lookY=ev.clientY;});
renderer.domElement.addEventListener('pointerup',()=>lookTouch=null);renderer.domElement.addEventListener('pointercancel',()=>lookTouch=null);
function updatePlayer(dt){
 player.attackCD=Math.max(0,player.attackCD-dt);player.comboWindow=Math.max(0,player.comboWindow-dt);player.dashCD=Math.max(0,player.dashCD-dt);player.specialCD=Math.max(0,player.specialCD-dt);player.invuln=Math.max(0,player.invuln-dt);player.swing=Math.max(0,player.swing-dt);
 player.block=inputs.block||keys.has('KeyF');
 let forward=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0)+inputs.forward;
 let right=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+inputs.right;
 const length=Math.hypot(forward,right);if(length>1){forward/=length;right/=length;}
 let speed=keys.has('ShiftLeft')?8.3:6.2;if(player.block)speed*=.48;
 const dashing=player.dashTime>0;
 if(dashing){player.dashTime=Math.max(0,player.dashTime-dt);speed=23;forward=1;right=0;}
 const dx=(Math.sin(yaw)*forward+Math.cos(yaw)*right)*speed*dt;
 const dz=(Math.cos(yaw)*forward-Math.sin(yaw)*right)*speed*dt;
 const old=hero.root.position.clone();hero.root.position.x+=dx;hero.root.position.z+=dz;
 const rr=Math.hypot(hero.root.position.x,hero.root.position.z);
 if(rr>89){hero.root.position.x=hero.root.position.x/rr*89;hero.root.position.z=hero.root.position.z/rr*89;}
 for(const ob of obstacles){const ox=hero.root.position.x-ob.x,oz=hero.root.position.z-ob.z,d=Math.hypot(ox,oz),limit=ob.r+.42;if(d<limit){if(d>.0001){hero.root.position.x=ob.x+ox/d*limit;hero.root.position.z=ob.z+oz/d*limit;}else{hero.root.position.copy(old);}}}
 player.velY-=19*dt;player.jumpY+=player.velY*dt;if(player.jumpY<=0){player.jumpY=0;player.velY=0;player.onGround=true;}
 hero.root.position.y=groundHeight(hero.root.position.x,hero.root.position.z)+player.jumpY;
 hero.root.rotation.y=yaw;
 const moving=Math.abs(dx)+Math.abs(dz)>.008;player.run+=dt*(moving?13:3.2);
 const stride=moving?Math.sin(player.run)*.52:0;
 hero.leftLeg.rotation.x=stride;hero.rightLeg.rotation.x=-stride;
 hero.leftArm.rotation.x=-stride*.65;hero.rightArm.rotation.x=stride*.46-(player.swing>0?1.4*Math.sin((1-player.swing/.55)*Math.PI):0);
 hero.rightArm.rotation.z=player.swing>0?-.65:player.block?-.55:.07;
 hero.figure.position.y=moving?Math.abs(Math.sin(player.run))*.05:Math.sin(elapsed*2)*.022;
 if(player.block){hero.rightArm.rotation.x=-1.1;hero.leftArm.rotation.x=-.75;}
 const target=new THREE.Vector3(hero.root.position.x-Math.sin(yaw)*zoom,hero.root.position.y+3.45+pitch*5.5,hero.root.position.z-Math.cos(yaw)*zoom);
 camera.position.lerp(target,1-Math.exp(-dt*9));
 if(shake>0){camera.position.x+=(rand()-.5)*shake;camera.position.y+=(rand()-.5)*shake;shake=Math.max(0,shake-dt*2);}
 camera.lookAt(hero.root.position.x+Math.sin(yaw)*2,hero.root.position.y+1.55+pitch*1.9,hero.root.position.z+Math.cos(yaw)*2);
 $('dash-cooldown').style.transform='scaleY('+(player.dashCD/3)+')';
 $('special-cooldown').style.transform='scaleY('+(player.specialCD/(weapon.id==='hammer'?9:weapon.id==='daggers'?7:8))+')';
}
function updateEnemies(dt){
 for(const e of enemies){
 if(!e.alive){e.respawnTimer-=dt;if(e.respawnTimer<=0)placeEnemy(e);continue;}
 e.stun=Math.max(0,e.stun-dt);e.attackTimer-=dt;
 const dx=hero.root.position.x-e.root.position.x,dz=hero.root.position.z-e.root.position.z,d=Math.hypot(dx,dz),targetAngle=Math.atan2(dx,dz);
 e.root.rotation.y=targetAngle;
 if(d<25&&d>2.2&&e.stun<=0&&e.telegraph<=0){const move=Math.min(d-2.1,(2.3+e.index*.2)*dt);e.root.position.x+=dx/d*move;e.root.position.z+=dz/d*move;}
 if(d<2.8&&e.attackTimer<=0&&e.stun<=0&&e.telegraph<=0){e.telegraph=.44;e.attackTimer=1.75+rand()*.5;fxRing(e.root.position.x,e.root.position.z,0xff9279,.95,.35);}
 if(e.telegraph>0){e.telegraph-=dt;e.rightArm.rotation.x=-1.7;if(e.telegraph<=0){e.swing=.3;if(d<3.15&&!player.invuln)hurt(14+e.index*2);}}
 e.swing=Math.max(0,e.swing-dt);
 e.rightArm.rotation.x=e.swing>0?.85:e.telegraph>0?-1.6:Math.sin(elapsed*4+e.index)*.15;
 e.leftLeg.rotation.x=Math.sin(elapsed*4.5+e.index)*.15;e.rightLeg.rotation.x=-e.leftLeg.rotation.x;
 e.root.position.y=groundHeight(e.root.position.x,e.root.position.z);
 e.back.lookAt(camera.position);
 }
}
function updateEffects(dt){
 for(let i=effects.length-1;i>=0;i--){
 const f=effects[i];f.time-=dt;const ratio=Math.max(0,f.time/f.duration);f.mesh.material.opacity=ratio;
 if(f.kind==='ring')f.mesh.scale.setScalar(1+(1-ratio)*.9);
 else {f.mesh.position.addScaledVector(f.vel,dt);f.vel.y-=15*dt;}
 if(f.time<=0){scene.remove(f.mesh);f.mesh.geometry.dispose();f.mesh.material.dispose();effects.splice(i,1);}
 }
}
const clock=new THREE.Clock();
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.045);elapsed+=dt;
 particles.rotation.y=elapsed*.0007;
 if(mode==='playing'){updatePlayer(dt);updateEnemies(dt);updateEffects(dt);}
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('show');}
 if(feedbackTimer>0){feedbackTimer-=dt;if(feedbackTimer<=0)$('combat-feedback').style.opacity='0';}
 renderer.render(scene,camera);
}
buildWeapon();updateHud();animate();
$('loading').classList.add('hidden');
