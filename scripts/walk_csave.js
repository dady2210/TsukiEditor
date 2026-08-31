const fs = require('fs');
const path = require('path');

const saves = [
  'C:\\Users\\Andres\\Downloads\\MOD_save (5).csave',
  'C:\\Users\\Andres\\Desktop\\Tsuki_Odyssey\\TsukiSaves\\save2.csave',
  'C:\\Users\\Andres\\Desktop\\Tsuki_Odyssey\\TsukiSaves\\save (14).csave',
  'C:\\Users\\Andres\\Downloads\\saveAndroid1.csave',
];

const odinPath = path.join(__dirname, '..', 'Odin', 'odin_reader.js');
const altPaths = ['../odin_browser.js','../odin_node.js','../Odin/odin_reader.js'];
let OdinReader;
for (const p of [odinPath, ...altPaths.map(x=>path.join(__dirname,x))]) {
  if (fs.existsSync(p)) { try { OdinReader = require(p).OdinReader || require(p); break; } catch(e){} }
}
if (!OdinReader) {
  // fallback inline: read docs
  console.error('OdinReader not found, listing raw hex');
  for (const f of saves) {
    if (!fs.existsSync(f)) { console.log(f+' MISSING'); continue; }
    const buf = fs.readFileSync(f);
    console.log(`${f} size=${buf.length} first32=${buf.slice(0,32).toString('hex')}`);
  }
  process.exit(0);
}

for (const f of saves) {
  if (!fs.existsSync(f)) { console.log(`\n=== ${f} MISSING ===`); continue; }
  const buf = fs.readFileSync(f);
  console.log(`\n=== ${path.basename(f)} size=${buf.length} path=${f} ===`);
  try {
    const reader = new OdinReader(buf);
    const ast = reader.parse();
    const root = Array.isArray(ast) ? ast[0] : ast;
    const kids = root.children || root.elements || [];
    console.log(`root typeName=${root.typeName||'?'} children=${kids.length}`);
    const rows = (root.children||[]).map(c=> `${c.name||'(no name)'} | typeName=${c.typeName||'?'} | marker=0x${(c.marker||0).toString(16)} | children=${(c.children||[]).length} elements=${(c.elements||[]).length}` );
    rows.sort();
    rows.forEach(r=>console.log('  '+r));
    // check 1301
    const find1301 = (node, depth=0) => {
      if (!node) return;
      if (node.typeName && node.typeName.includes('CropBox')) console.log(`  [CropBox] ${'  '.repeat(depth)} ${node.name} ${node.typeName}`);
      const children = node.children || [];
      const els = node.elements || [];
      [...children, ...els].forEach(ch=>{
        const n = ch.value || ch;
        if (n && n.typeName && n.typeName.includes('CropBox')) console.log(`  [CropBox el] ${n.typeName} ${n.name||''}`);
        if (n && String(n.name).includes('1301') || (n.children && n.children.some(c=>c.value==1301))) {}
        if (n && n.children) find1301(n, depth+1);
      });
    };
    // brute: search all nodes for reference id 1301
    let count1301=0;
    function walk(n){
      if (!n) return;
      if (n.children) n.children.forEach(c=>{
        if (c.name==='id' && c.value==1301) { count1301++; console.log(`  [1301] at ${n.typeName||'?'} / ${n.name||'?'} offset?`); }
        walk(c);
        if (c.value && typeof c.value==='object') walk(c.value);
      });
      if (n.elements) n.elements.forEach(e=>{ walk(e.value||e); walk(e.key||e); });
    }
    walk(root);
    if (count1301===0) console.log('  [1301] not found');
  } catch(e) {
    console.error('parse fail', f, e.message);
  }
}
