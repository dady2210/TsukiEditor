const fs=require('fs'), vm=require('vm'), path=require('path');
const root='C:\\Users\\Andres\\Desktop\\Tsuki_Odyssey\\Tsuky_WebEditor';
function loadJS(file, globals){
  const code=fs.readFileSync(path.join(root,file),'utf8');
  const sandbox={window:{}, console}; vm.createContext(sandbox); vm.runInContext(code,sandbox);
  return sandbox.window;
}
const itemsWin=loadJS('data/items_db.js');
const items=itemsWin.ITEMS_DB;
const pivWin=loadJS('data/content_pivots.js');
const pivots=pivWin.contentPivots || pivWin.CONTENT_PIVOTS || {};
const behWin=loadJS('data/item_behaviors.js');
const beh=behWin.BEHAVIORS || {};
let unified={};
for(const id in items){
  const it=items[id];
  const p=pivots[id] || pivots[id+'_BACK'] || null;
  const pb=pivots[id+'_BACK'] || null;
  unified[id]={
    id: parseInt(id),
    furn_name: it.furn_name||it.furn_name_es||it.furn_name_en||null,
    item_name: it.item_name||it.item_name_es||it.item_name_en||null,
    name_en: it.name_en||null,
    name_es: it.name_es||null,
    desc_en: it.desc_en||null,
    desc_es: it.desc_es||null,
    width: it.width||it.w||1,
    length: it.length||it.l||1,
    pivot: p? {x:p.x,y:p.y}: null,
    pivot_back: pb? {x:pb.x,y:pb.y}: null,
    behaviour: beh[id]||null,
    dialogs: it.dialogs||it.dialog||it.dialogue||null
  };
}
let missing=Object.values(unified).filter(v=>!v.furn_name && !v.item_name).length;
console.log('unified', Object.keys(unified).length, 'missing names', missing);
fs.writeFileSync(path.join(root,'data/items_unified.json'), JSON.stringify(unified,null,2),'utf8');
fs.writeFileSync(path.join(root,'data/items_unified.js'), 'window.ITEMS_UNIFIED = '+JSON.stringify(unified,null,2)+';\n','utf8');
fs.writeFileSync(path.join(root,'docs/DB_AUDITORIA.md'), `# DB Auditoría\n\n- Entradas: ${Object.keys(unified).length}\n- Sin nombre: ${missing}\n- Con pivot: ${Object.values(unified).filter(v=>v.pivot).length}\n- Con behaviour: ${Object.values(unified).filter(v=>v.behaviour).length}\n- Con dialogs: ${Object.values(unified).filter(v=>v.dialogs).length}\n`,'utf8');
console.log('wrote unified');
