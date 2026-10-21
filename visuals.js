import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

// FORESTFALL art pass: original procedural textured scenery + layered fighter outfits.
// Replaces early cone/cylinder tree placeholders without fetching third-party meshes.
const COLORS = {
  bark: [0x665041, 0x524234, 0x675447],
  broad: [0x346d45,0x438751,0x568b51,0x285e43,0x4d8054],
  fir: [0x2a6058,0x316953,0x39775a]
};
const seeded = (value) => {
  let state = value >>> 0;
  return () => {state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
};
function canvasTexture(size,paint,repeatX=1,repeatY=1) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d');paint(ctx,size);
  const tex=new THREE.CanvasTexture(canvas);
  tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(repeatX,repeatY);tex.anisotropy=4;
  return tex;
}
function barkTexture() {
 return canvasTexture(256,(ctx,n)=>{
   const r=seeded(278);ctx.fillStyle='#675345';ctx.fillRect(0,0,n,n);
   for(let i=0;i<1550;i++){
     const x=r()*n,y=r()*n,len=4+r()*62;
     ctx.strokeStyle=r()>.55?'rgba(21,17,13,.22)':'rgba(208,177,127,.16)';
     ctx.lineWidth=.4+r()*2;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x-3,y+len*.3,x+4,y+len*.75,x+r()*3,y+len);ctx.stroke();
   }
   for(let i=0;i<26;i++){
     const x=r()*n,y=r()*n;ctx.strokeStyle='rgba(25,20,16,.23)';ctx.lineWidth=1+r()*2;
     ctx.beginPath();ctx.ellipse(x,y,2+r()*6,3+r()*11,r()*.2,0,Math.PI*2);ctx.stroke();
   }
 },2,3);
}
function mossTexture(){
 return canvasTexture(512,(ctx,n)=>{
   const r=seeded(4721),img=ctx.createImageData(n,n);
   for(let i=0;i<img.data.length;i+=4){
     const grain=(r()-.5)*28, clump=Math.sin((i/4%n)*.045)*Math.cos(Math.floor(i/4/n)*.047)*12;
     img.data[i]=THREE.MathUtils.clamp(72+grain+clump,0,255);
     img.data[i+1]=THREE.MathUtils.clamp(100+grain+clump,0,255);
     img.data[i+2]=THREE.MathUtils.clamp(63+grain*.6,0,255);img.data[i+3]=255;
   }
   ctx.putImageData(img,0,0);
   for(let i=0;i<1450;i++){
     const x=r()*n,y=r()*n,s=.5+r()*2.1;
     ctx.fillStyle=r()>.3?'rgba(26,68,35,.24)':'rgba(165,147,93,.22)';
     ctx.fillRect(x,y,s,s*2);
   }
   for(let i=0;i<120;i++){
     const x=r()*n,y=r()*n,s=1+r()*3;ctx.fillStyle='rgba(169,137,92,.43)';
     ctx.beginPath();ctx.ellipse(x,y,s,s*.55,r()*3,0,Math.PI*2);ctx.fill();
   }
 },20,20);
}
function leafTexture(){
 return canvasTexture(128,(ctx,n)=>{
   ctx.clearRect(0,0,n,n);
   ctx.fillStyle='#e4f8c8';ctx.beginPath();ctx.moveTo(64,9);ctx.bezierCurveTo(112,33,110,92,64,115);
   ctx.bezierCurveTo(19,92,16,33,64,9);ctx.fill();
   ctx.strokeStyle='rgba(44,105,52,.48)';ctx.lineWidth=3;
   ctx.beginPath();ctx.moveTo(64,112);ctx.lineTo(64,15);ctx.stroke();
   for(let side of [-1,1])for(let i=0;i<4;i++){
     const y=34+i*17;
     ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(64,y+10);
     ctx.lineTo(64+side*(22+Math.sin(i)*7),y-5);ctx.stroke();
   }
 });
}
function bladeTexture(){
 return canvasTexture(128,(ctx,n)=>{
   ctx.clearRect(0,0,n,n);
   const shapes=[[24,112,14,21,37],[60,116,57,8,66],[98,112,112,38,84],[45,120,35,57,51],[79,117,78,45,92]];
   for(let i=0;i<shapes.length;i++){
     const [bottomX,bottomY,topX,topY,width]=shapes[i];
     const g=ctx.createLinearGradient(0,topY,0,bottomY);g.addColorStop(0,'#d0e7aa');g.addColorStop(1,'#467349');
     ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(bottomX-10,bottomY);
     ctx.quadraticCurveTo(topX-12,(bottomY+topY)*.5,topX,topY);
     ctx.quadraticCurveTo(topX+9,(bottomY+topY)*.5,bottomX+10,bottomY);
     ctx.fill();
   }
 });
}
function softGlowTexture(){
 return canvasTexture(128,(ctx,n)=>{
   const g=ctx.createRadialGradient(64,64,1,64,64,63);
   g.addColorStop(0,'rgba(218,244,202,.19)');
   g.addColorStop(.3,'rgba(214,237,209,.09)');
   g.addColorStop(1,'rgba(211,234,211,0)');
   ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
 });
}
const m4=new THREE.Matrix4(),p3=new THREE.Vector3(),q4=new THREE.Quaternion(),s3=new THREE.Vector3();
const obj=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
function instance(mesh,index,position,scale,rotation=null,color=null){
  obj.position.copy(position);obj.rotation.set(0,0,0);
  obj.quaternion.copy(rotation||new THREE.Quaternion());
  obj.scale.copy(scale);obj.updateMatrix();mesh.setMatrixAt(index,obj.matrix);
  if(color)mesh.setColorAt(index,new THREE.Color(color));
}
export function upgradeForest(scene, floor, trunks, oldCanopy, oldCanopy2, getHeight, compact=false) {
 const random=seeded(82614), n=trunks.count;
 // Keep collision locations intact: read the original forest's exact transforms.
 trunks.visible=false;oldCanopy.visible=false;oldCanopy2.visible=false;
 const woodTex=barkTexture(),leafTex=leafTexture(),groundTex=mossTexture(),grassTex=bladeTexture();
 floor.material.map=groundTex;floor.material.needsUpdate=true;
 const trunkGeo=new THREE.CylinderGeometry(.33,.47,1,11,8),woodMat=new THREE.MeshStandardMaterial({map:woodTex,color:0xe3c7a1,roughness:1});
 const trunkMesh=new THREE.InstancedMesh(trunkGeo,woodMat,n);
 trunkMesh.castShadow=!compact;trunkMesh.receiveShadow=true;scene.add(trunkMesh);
 const branchGeo=new THREE.CylinderGeometry(.055,.15,1,7,1);
 const branches=new THREE.InstancedMesh(branchGeo,woodMat,n*3);branches.castShadow=!compact;scene.add(branches);
 const lobeGeo=new THREE.IcosahedronGeometry(1,compact?1:2);
 const foliageMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92,side:THREE.FrontSide,flatShading:false});
 const lobes=new THREE.InstancedMesh(lobeGeo,foliageMat,n*16);
 lobes.castShadow=!compact;lobes.receiveShadow=!compact;scene.add(lobes);
 const leafGeo=new THREE.PlaneGeometry(.95,1.12);
 leafGeo.translate(0,.54,0);
 const leafMat=new THREE.MeshStandardMaterial({map:leafTex,transparent:true,alphaTest:.32,depthWrite:true,side:THREE.DoubleSide,roughness:1,color:0xe6f4c9});
 const leaves=new THREE.InstancedMesh(leafGeo,leafMat,n*(compact?9:20));leaves.castShadow=false;scene.add(leaves);
 let branchId=0,lobeId=0,leafId=0;
 const tint=(palette)=>new THREE.Color(palette[Math.floor(random()*palette.length)]).multiplyScalar(.82+random()*.26);
 for(let i=0;i<n;i++){
   trunks.getMatrixAt(i,m4);m4.decompose(p3,q4,s3);
   const x=p3.x,z=p3.z,height=s3.y*3,base=getHeight(x,z);
   const width=.8+height*.05;
   instance(trunkMesh,i,new THREE.Vector3(x,base+height*.49,z),new THREE.Vector3(width*.96,height,width*.96),null,0xe3ceb6);
   const fir=random()<.29;
   const palette=fir?COLORS.fir:COLORS.broad;
   const clusters=fir?9:12;
   if(!fir){
     for(let b=0;b<3;b++){
       const theta=random()*Math.PI*2;
       const start=new THREE.Vector3(x,base+height*(.72+b*.06),z);
       const end=new THREE.Vector3(x+Math.sin(theta)*(1.35+random()*.9),base+height+.5+random()*.8,z+Math.cos(theta)*(1.35+random()*.9));
       const dir=end.clone().sub(start),distance=dir.length();
       const quaternion=new THREE.Quaternion().setFromUnitVectors(up,dir.normalize());
       instance(branches,branchId++,start.add(end).multiplyScalar(.5),new THREE.Vector3(.85,distance,.85),quaternion,0xd3bba6);
     }
   }
   for(let c=0;c<clusters;c++){
     const a=2*Math.PI*(c/clusters)+random()*.5;
     let cx,cy,cz,rad;
     if(fir){
       const layer=c%9;
       cy=base+height*.56+layer*.55;
       rad=(1-layer/12)*(1.8+random()*.3);
       cx=x+Math.sin(a)*.28;cz=z+Math.cos(a)*.28;
     }else{
       const nearCenter=c<4;
       rad=.89+random()*.65+(nearCenter?.3:0);
       cx=x+Math.sin(a)*(nearCenter?.7:1.3+random()*.9);
       cz=z+Math.cos(a)*(nearCenter?.6:1.1+random()*.9);
       cy=base+height+.3+random()*2.45;
     }
     instance(lobes,lobeId++,new THREE.Vector3(cx,cy,cz),new THREE.Vector3(rad,rad*(fir?.75:.8),rad),null,tint(palette));
   }
   if(!fir){
     const cards=compact?9:20;
     for(let c=0;c<cards;c++){
       const a=random()*Math.PI*2,rr=.9+random()*2.0;
       const pos=new THREE.Vector3(x+Math.cos(a)*rr,base+height+.4+random()*2.6,z+Math.sin(a)*rr);
       const rotate=new THREE.Euler((random()-.5)*1.5,random()*6.28,(random()-.5)*1.9);
       const quaternion=new THREE.Quaternion().setFromEuler(rotate);
       const s=.7+random()*.5;
       instance(leaves,leafId++,pos,new THREE.Vector3(s,s,s),quaternion,tint(palette));
     }
   }
 }
 branches.count=branchId;lobes.count=lobeId;leaves.count=leafId;
 for(const mesh of [trunkMesh,branches,lobes,leaves]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.frustumCulled=false;}
 // Plants around the walking area are actual textured blades, not upright prisms.
 const grassGeo=new THREE.PlaneGeometry(.63,.88);
 grassGeo.translate(0,.44,0);
 const tuftMat=new THREE.MeshStandardMaterial({map:grassTex,color:0xc9e6ad,transparent:true,alphaTest:.35,side:THREE.DoubleSide,roughness:1});
 const tuftN=compact?1000:2600,tufts=new THREE.InstancedMesh(grassGeo,tuftMat,tuftN);scene.add(tufts);
 for(let i=0;i<tuftN;i++){
   const a=random()*6.28,rad=6+Math.sqrt(random())*77,x=Math.sin(a)*rad,z=Math.cos(a)*rad;
   const sc=.3+random()*.77;
   const rot=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,random()*6.28,0));
   instance(tufts,i,new THREE.Vector3(x,getHeight(x,z)+.03,z),new THREE.Vector3(sc,sc,sc),rot,random()>.2?0xd6f2b8:0xa3cb8e);
 }
 tufts.instanceMatrix.needsUpdate=true;tufts.instanceColor.needsUpdate=true;tufts.frustumCulled=false;
 // Soft cloudlets lend depth but are culled altogether on weaker/mobile graphics.
 if(!compact){
   const haze=new THREE.SpriteMaterial({map:softGlowTexture(),transparent:true,depthWrite:false,opacity:.48});
   for(let i=0;i<34;i++){
     const a=random()*6.28,rad=17+random()*66,x=Math.sin(a)*rad,z=Math.cos(a)*rad;
     const cloud=new THREE.Sprite(haze);cloud.position.set(x,getHeight(x,z)+1+random()*3,z);
     cloud.scale.set(11+random()*12,4+random()*3,1);scene.add(cloud);
   }
 }
 // Organic stones around the ritual clearing, plus moss-covered retaining edges.
 const stonesGeo=new THREE.DodecahedronGeometry(.42,1),stonesMat=new THREE.MeshStandardMaterial({color:0x9fada0,roughness:1,flatShading:true});
 const stones=new THREE.InstancedMesh(stonesGeo,stonesMat,120);scene.add(stones);
 for(let i=0;i<stones.count;i++){
   const a=random()*6.283,rad=5.7+random()*12,x=Math.sin(a)*rad,z=Math.cos(a)*rad;
   const rot=new THREE.Quaternion().setFromEuler(new THREE.Euler(random()*.55,random()*6.28,random()*.5)),scale=.2+random()*.5;
   instance(stones,i,new THREE.Vector3(x,getHeight(x,z)+scale*.13,z),new THREE.Vector3(scale,scale*.47,scale),rot,0x7b9786);
 }
 stones.instanceMatrix.needsUpdate=true;stones.instanceColor.needsUpdate=true;
 return { trees:n, leafClusters:lobeId, leafCards:leafId, groundPlants:tuftN };
}
const outfitState=[];
const material=(color,metalness=0,roughness=.8)=>new THREE.MeshStandardMaterial({color,metalness,roughness,side:THREE.DoubleSide});
function add(parent,geo,mat,x,y,z){
 const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
}
function capeShape(){
 const geo=new THREE.PlaneGeometry(1.52,1.65,10,14);
 const positions=geo.attributes.position;
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),y=positions.getY(i),t=.5-y/1.65;
  positions.setXYZ(i,x*(.65+t*.35),y,-.13-.35*t-.13*Math.sin(x*3.4));
 }
 geo.computeVertexNormals();return geo;
}
export function upgradeFighter(actor, enemy=false,index=0){
 const fig=actor.figure,body=material(enemy?0x483b45:0x354d42,0,.9);
 const plate=material(enemy?0x777c78:0x9aae9f,.28,.55);
 const edge=material(enemy?0x915f4f:0xd1c28b,.35,.4);
 const fabric=material(enemy?0x58484a:0x3b6452);
 const trim=material(enemy?0x8f7660:0xdce7b3,.25,.42);
 // Distinct torso armor: fitted chestplate + layered fabric panels, buckles, collar.
 const chest=add(fig,new THREE.SphereGeometry(1,16,12),plate,0,1.66,.19);chest.scale.set(.42,.55,.23);
 add(fig,new THREE.TorusGeometry(.35,.055,8,18,Math.PI),edge,0,1.74,.32);
 const tunic=add(fig,new THREE.CylinderGeometry(.41,.54,.72,13),fabric,0,.89,0);tunic.rotation.y=Math.PI/13;
 add(fig,new THREE.CylinderGeometry(.48,.48,.17,13),body,0,1.23,0);
 const belt=add(fig,new THREE.BoxGeometry(.21,.18,.075),edge,0,1.22,.47);belt.rotation.z=.05;
 const symbol=add(fig,new THREE.OctahedronGeometry(.12,0),trim,0,1.72,.44);symbol.scale.set(.85,1.3,.36);
 for(let side of [-1,1]){
   const arm=side<0?actor.leftArm:actor.rightArm;
   const shoulder=add(arm,new THREE.SphereGeometry(.35,12,8),plate,side*.06,-.06,0);shoulder.scale.set(1.1,.5,.93);
   add(arm,new THREE.CylinderGeometry(.2,.2,.22,10),edge,0,-.57,.015);
   const leg=side<0?actor.leftLeg:actor.rightLeg;
   const boot=add(leg,new THREE.SphereGeometry(.23,12,8),body,0,-.73,.11);boot.scale.set(1.02,.79,1.48);
   add(leg,new THREE.BoxGeometry(.29,.3,.15),plate,0,-.34,.13);
 }
 // Hair/hood + headband and small clasp; reads as a designed avatar rather than a capsule.
 const hair=add(fig,new THREE.SphereGeometry(.37,18,12),enemy?body:material(0x342f2a),0,2.61,-.035);hair.scale.set(1.02,.74,1.03);
 for(let i=0;i<5;i++){
   const x=(i-2)*.14;
   const fringe=add(fig,new THREE.ConeGeometry(.13,.29,8),enemy?fabric:material(0x342f2a),x,2.58,.21);
   fringe.rotation.z=x*.75;fringe.rotation.x=.2;
 }
 add(fig,new THREE.TorusGeometry(.362,.048,7,20,Math.PI*1.05),edge,0,2.48,0).rotation.z=Math.PI*.03;
 // Flowing cloth is vertex animated independently of gameplay and collision.
 const cloak=add(fig,capeShape(),fabric,0,1.15,-.45);
 cloak.rotation.y=Math.PI;cloak.material=material(enemy?0x55434b:0x294c3a);
 cloak.userData.base=Float32Array.from(cloak.geometry.attributes.position.array);
 outfitState.push({cloak,index,enemy});
 return actor;
}
export function tickOutfits(t){
 for(const o of outfitState){
  const attr=o.cloak.geometry.attributes.position,base=o.cloak.userData.base;
  for(let i=0;i<attr.count;i++){
    const a=i*3,x=base[a],y=base[a+1],z=base[a+2],lower=Math.max(0,(.7-y)/1.7);
    attr.setXYZ(i,x+Math.sin(t*2.4+o.index*.7+lower*3.1)*.075*lower,y,z+Math.cos(t*2+o.index)*.09*lower);
  }
  attr.needsUpdate=true;o.cloak.geometry.computeVertexNormals();
 }
}
