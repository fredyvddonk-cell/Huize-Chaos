/* V1.4.202.45 – Picnic bontekst, rechtstreeks gekopieerd uit de bestelbon. */
(function(root){
'use strict';
function parsePicnicPastedText(raw){
 const lines=String(raw||'').replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean);
 const isTitle=s=>/[a-zA-ZÀ-ÿ]{3}/.test(s)&&!(/^(?:\d+\s*(?:ml|gram|kilo|stuks)|\d+\s*[-–]\s*\d+\s*stuks|family|\d+% korting|\d+% vervangkorting|\d+ voor €\d+|voordeel|bestelling|korting|subtotaal|eindtotaal|picnic-tegoed|verrekening|ingeleverd statiegeld)$/i.test(s));
 const starts=[];
 for(let i=0;i<lines.length;i++){
   if(!isTitle(lines[i]))continue;
   if(i+1<lines.length&&lines[i]===lines[i+1]){starts.push({index:i+1,name:lines[i]});i++;continue}
   if(i===0)starts.push({index:i,name:lines[i]});
 }
 const products=[];const warnings=[];
 for(let j=0;j<starts.length;j++){
   const start=starts[j],end=j+1<starts.length?starts[j+1].index-1:lines.length;
   const tokens=lines.slice(start.index+1,end);
   // The final isolated integer belongs to the quantity of the next product.
   if(j+1<starts.length&&/^\d{1,2}$/.test(tokens[tokens.length-1]||''))tokens.pop();
   const quantities=[];let prices=[];
   for(let k=0;k<tokens.length;k++){
     if(/^\d{1,4}$/.test(tokens[k])&&/^\d{2}$/.test(tokens[k+1]||'')&&tokens[k+2]==='.'){
       prices.push(Number(tokens[k])+Number(tokens[k+1])/100);k+=2;continue;
     }
     if(/^\d+[,.]\d{2}$/.test(tokens[k]))prices.push(Number(tokens[k].replace(',','.')));
   }
   // A copied Picnic line sometimes has a missing price (e.g. a 3-for-2 group).
   const price=prices.length?prices[prices.length-1]:null;
   let qty=1;
   if(j>0){const prev=lines.slice(starts[j-1].index+1,start.index-1);const last=prev[prev.length-1];if(/^\d{1,2}$/.test(last||''))qty=Number(last)}
   if(price===null)warnings.push('Prijs ontbreekt: '+start.name);
   products.push({name:start.name,qty,price:price??0,originalPrice:prices.length>1?prices[0]:undefined,category:'',memo:price===null?'Prijs controleren: niet herkend':'',isActionProduct:prices.length>1});
 }
 if(products.length<2)throw new Error('Geen herkenbare Picnic-productlijst gevonden. Kopieer de productregels uit de Picnic-bon.');
 const totalMatch=String(raw).match(/(?:eindtotaal|totaal betaald)[^\d]*([\d.,]+)/i);
 const total=totalMatch?Number(totalMatch[1].replace(',','.')):null;
 return {__parsedReceipt:true,store:'Picnic',date:'',total,originalTotal:total,baseTotal:total,lines:products,needsReview:true,recognitionWarnings:warnings,raw:String(raw),pasteMode:true};
}
root.parsePicnicPastedText=parsePicnicPastedText;
if(typeof module!=='undefined'&&module.exports)module.exports=parsePicnicPastedText;
})(typeof window!=='undefined'?window:globalThis);
