/* V1.4.202.48 – Picnic-bontekst: gestructureerde regels, geen OCR. */
(function(root){
'use strict';
function parsePicnicPastedText(raw){
 const lines=String(raw||'').replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean);
 const financial=/^(?:statiegeld|flessen en blikjes|tasjes|verrekening picnic-tegoed|subtotaal|ingeleverd statiegeld|eindtotaal|voordeel|totaal(?:\s+al)?\s+betaald(?:\s+via\s+ideal)?|picnic-tegoed)$/i;
 const stop=lines.findIndex(s=>financial.test(s));
 const body=stop<0?lines:lines.slice(0,stop);
 const starts=[];
 for(let i=0;i<body.length-1;i++){
   if(body[i]!==body[i+1]||!/[a-zÀ-ÿ]{3}/i.test(body[i]))continue;
   if(/^(?:family|besteld|toegevoegd|order|\d+% korting)$/i.test(body[i]))continue;
   starts.push({name:body[i],first:i,second:i+1});i++;
 }
 const warnings=[],products=[];
 for(let j=0;j<starts.length;j++){
   const s=starts[j],next=starts[j+1],segment=body.slice(s.second+1,next?next.first:body.length);
   // Picnic zet het aantal direct vóór de tweemaal gekopieerde productnaam.
   // Het laatste cijfer van dit segment is vaak juist het aantal van het VOLGENDE product.
   // Daarom nooit de laatste regel van het huidige product als zijn aantal gebruiken.
   // Losse cijfers zijn in de gekopieerde Picnic-layout niet eenduidig als aantal te herkennen.
   // Kies veilig 1; de gebruiker kan aantallen in de boncontrole aanpassen.
   const qty=1;
   const prices=[];
   for(let k=0;k<segment.length;k++){
     if(/^\d{1,4}$/.test(segment[k])&&/^\d{2}$/.test(segment[k+1]||'')&&segment[k+2]==='.'){
       prices.push(Math.round((Number(segment[k])*100+Number(segment[k+1])))/100);k+=2;
     }else if(/^\d+[,.]\d{2}$/.test(segment[k]))prices.push(Number(segment[k].replace(',','.')));
   }
   const price=prices.length?prices[prices.length-1]:null;
   const promo=segment.some(x=>/^(?:family|\d+% (?:vervang)?korting|\d+ voor €)/i.test(x));
   if(price===null)warnings.push('Prijs ontbreekt: '+s.name);
   if(/\d+ voor €/.test(segment.join(' ')))warnings.push('Combinatieaanbieding controleren: '+s.name);
   products.push({name:s.name,qty,price:price??0,originalPrice:prices.length>1?prices[0]:undefined,category:'',memo:price===null?'Prijs ontbreekt: handmatig controleren':(/\d+ voor €/.test(segment.join(' '))?'Combinatieaanbieding: prijsverdeling controleren':''),isActionProduct:promo||prices.length>1});
 }
 if(products.length<2)throw new Error('Geen herkenbare Picnic-productlijst gevonden. Kopieer de volledige bontekst.');
 const dateMatch=String(raw).match(/(?:bezorging van|bezorgd op)\s+(?:maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)?\s*(\d{1,2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+(20\d{2})/i);
 const months=['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
 const date=dateMatch?`${dateMatch[3]}-${String(months.indexOf(dateMatch[2].toLowerCase())+1).padStart(2,'0')}-${dateMatch[1].padStart(2,'0')}`:'';
 function financialAmount(label){const i=lines.findIndex(x=>x.toLowerCase()===label);if(i<0)return null;const a=lines.slice(i+1,i+5);const m=a.join(' ').match(/^([+-]?\d+)\s+(\d{2})\s*\./);return m?Math.round((Number(m[1])*100+(Number(m[1])<0?-1:1)*Number(m[2])))/100:null;}
 const subtotal=financialAmount('subtotaal');
 const paid=financialAmount('eindtotaal')??financialAmount('totaal betaald')??financialAmount('totaal al betaald via ideal');
 const deposit=financialAmount('statiegeld');
 const returned=financialAmount('ingeleverd statiegeld');
 const credit=financialAmount('verrekening picnic-tegoed');
 const earnedCredit=financialAmount('picnic-tegoed');
 if(paid===null)warnings.push('Betaald eindtotaal ontbreekt: handmatig invullen');
 if(credit!==null&&credit!==0)warnings.push('Verrekend Picnic-tegoed ('+credit.toFixed(2)+') apart controleren; niet als product geboekt');
 if(earnedCredit!==null&&earnedCredit!==0)warnings.push('Nieuw Picnic-tegoed ('+earnedCredit.toFixed(2)+') is voor een volgende bestelling; niet bij deze bon optellen');
 if(subtotal!==null)warnings.push('Subtotaal volgens Picnic: € '+subtotal.toFixed(2));
 return {__parsedReceipt:true,store:'Picnic',date,total:paid,originalTotal:paid,baseTotal:paid,lines:products,statiegeldBetaald:deposit??0,statiegeldRetour:returned??0,needsReview:true,recognitionWarnings:warnings,raw:String(raw),pasteMode:true,financial:{subtotal,deposit,returned,credit,earnedCredit}};
}
root.parsePicnicPastedText=parsePicnicPastedText;
if(typeof module!=='undefined'&&module.exports)module.exports=parsePicnicPastedText;
})(typeof window!=='undefined'?window:globalThis);
