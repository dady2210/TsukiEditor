const express=require('express');
const fs=require('fs'), path=require('path');
const app=express();
const root=path.join(__dirname,'..');
app.use(express.json({limit:'10mb'}));
app.use(express.static(root));
const allowed={'maps': path.join(root,'data/maps_unified.json'), 'items': path.join(root,'data/items_unified.json')};
app.post('/api/save/:type', (req,res)=>{
  const p=allowed[req.params.type];
  if(!p) return res.status(400).send('type');
  fs.writeFileSync(p, JSON.stringify(req.body,null,2),'utf8');
  // also update js wrapper
  const jsPath=p.replace('.json','.js');
  const varName= req.params.type==='maps' ? 'MAPS_UNIFIED' : 'ITEMS_UNIFIED';
  const extra = req.params.type==='maps' ? '\nwindow.mapsAtlas = window.MAPS_UNIFIED.atlas;\nwindow.MAP_META = window.MAPS_UNIFIED.meta;\n' : '\nwindow.ITEMS_DB = window.ITEMS_UNIFIED;\n';
  fs.writeFileSync(jsPath, `window.${varName} = ${JSON.stringify(req.body,null,2)};${extra}`,'utf8');
  res.json({ok:true});
});
app.listen(8000, ()=> console.log('http://localhost:8000'));
