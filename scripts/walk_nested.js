const fs=require('fs'), path=require('path');
const OdinReader=require('../Odin/odin_reader.js').OdinReader;
const saves=[
 'C:\\Users\\Andres\\Downloads\\MOD_save (5).csave',
 'C:\\Users\\Andres\\Downloads\\saveAndroid1.csave',
 'C:\\Users\\Andres\\Desktop\\Tsuki_Odyssey\\TsukiSaves\\save2.csave',
 'C:\\Users\\Andres\\Desktop\\Tsuki_Odyssey\\TsukiSaves\\save (14).csave',
];
function findChild(n,name){ if(!n||!n.children) return null; return n.children.find(c=>c.name===name); }
function findAll(n,name,acc=[]){ if(!n) return acc; (n.children||[]).forEach(c=>{ if(c.name===name) acc.push(c); findAll(c,name,acc); }); (n.elements||[]).forEach(e=>findAll(e.value||e,name,acc)); return acc; }
let out='# Walker anidado — sublocations/furniture\n\n';
for(const f of saves){
 if(!fs.existsSync(f)){ out+=`\n## ${f} MISSING\n`; continue; }
 const buf=fs.readFileSync(f);
 const root=require('../Odin/odin_reader.js').OdinReader ? new OdinReader(buf).parse()[0] : null;
 out+=`\n## ${path.basename(f)} size=${buf.length}\n`;
 const subNode=findChild(root,'sublocations');
 if(!subNode){ out+='sublocations NOT FOUND\n'; continue; }
 const dict=subNode.children.find(c=>c.elements);
 const slocs=dict? dict.elements : [];
 out+=`slocs=${slocs.length}\n`;
 out+=`| sloc | type | count furn | extraFurnitureSaves | sceneObjectSaves | wallFurniture |\n|---|---|---|---|---|---|\n`;
 slocs.forEach(ent=>{
   const id=ent.key? ent.key.value : '?';
   const val=ent.value;
   const furn=findChild(val,'furniture');
   const extra=findChild(val,'extraFurnitureSaves');
   const scene=findChild(val,'sceneObjectSaves');
   const wallF=findChild(val,'wallFurniture');
   const flist=furn? (furn.children.find(c=>c.elements)? furn.children.find(c=>c.elements).elements.length : 0):0;
   out+=`| ${id} | ${val.typeName||'?'} | ${flist} | ${extra? 'SI '+ (extra.children?.find(c=>c.elements)?.elements?.length||'?') : 'NO'} | ${scene? 'SI':'NO'} | ${wallF? 'SI':'NO'} |\n`;
 });
 // furniture detail per sloc
 slocs.forEach(ent=>{
   const id=ent.key? ent.key.value : '?';
   const val=ent.value;
   const furn=findChild(val,'furniture');
   if(!furn) return;
   const list=furn.children.find(c=>c.elements);
   if(!list) return;
   let cnt1301=0, cntLamp=0, cntParent=0, cntCrop=0;
   list.elements.forEach(e=>{
     const node=e.value;
     const ref=findChild(node, 'reference');
     const idNode=ref? findChild(ref,'id'):null;
     const iid=idNode? idNode.value : null;
     if(iid===1301) cnt1301++;
     const lamp=findChild(node,'lampToggle')||findChild(node,'LampToggle');
     if(lamp) cntLamp++;
     const par=findChild(node,'parentPlacementID')||findChild(node,'ParentPlacementID');
     if(par && par.value!==0 && par.value!==-1) cntParent++;
     if(node.typeName && node.typeName.includes('Crop')) cntCrop++;
   });
   out+=`\nsloc ${id} furn detail: 1301=${cnt1301} lampToggle=${cntLamp} parent!=0=${cntParent} CropType=${cntCrop}\n`;
   // drill 1301
   list.elements.forEach(e=>{
     const node=e.value;
     const ref=findChild(node,'reference');
     const iid=ref? findChild(ref,'id')?.value : null;
     if(iid===1301){
       const furnSave=findChild(node,'furnSave')||node;
       out+=`  1301 furnSave typeName=${node.typeName||furnSave?.typeName} children=${(furnSave?.children||[]).map(c=>c.name+':'+(c.typeName||c.marker?.toString(16))).join(', ')}\n`;
       const slots=findChild(furnSave,'slots')||findChild(node,'slots');
       if(slots) out+=`    slots elements=${slots.children?.find(c=>c.elements)?.elements?.length || slots.elements?.length}\n`;
       const carrots=findChild(furnSave,'carrots')||findChild(node,'carrots');
       if(carrots) out+=`    carrots=${carrots.value} marker=0x${carrots.marker?.toString(16)}\n`;
       const last=findChild(furnSave,'LastHarvest')||findChild(node,'LastHarvest');
       if(last) out+=`    LastHarvest marker=0x${last.marker?.toString(16)} value=${last.value} type=${last.constructor.name}\n`;
       else out+=`    LastHarvest missing (maybe OdinNull 0x2D)\n`;
     }
   });
 });
 // phoneSave, punchcard, train etc quick
 ['phoneSave','punchcard','spEventSaves','trainSave','apartmentSaves'].forEach(k=>{
   const n=findChild(root,k);
   if(n) out+=`\n${k}: type=${n.typeName} children=${(n.children||[]).map(c=>c.name).join(', ')}\n`;
   else out+=`\n${k}: NOT FOUND\n`;
 });
}
fs.writeFileSync('docs/CSAVE_MAPEO_ANIDADO.md', out, 'utf8');
console.log(out.slice(0,4000));
