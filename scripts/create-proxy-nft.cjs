const fs=require('fs');
const path=require('path');
const serverDir=path.join('.next','server');
const payload=JSON.stringify({version:1,files:['proxy/index.js']});
['middleware.js.nft.json','proxy.js.nft.json'].forEach(f=>{
  const p=path.join(serverDir,f);
  fs.mkdirSync(path.dirname(p),{recursive:true});
  fs.writeFileSync(p,payload);
  console.log('[nft] Created '+f);
});