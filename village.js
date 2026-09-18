'use strict';
// Shared world collision, village interactions and the local crop economy.
const buildings=[
 {id:'home',kind:'home',name:'Your cottage',c:17,r:9,w:4,h:4,frame:0},
 {id:'market',kind:'market',name:'Clover Market',c:26,r:23,w:4,h:4,frame:1}
];
const villagers=[
 {id:'mira',kind:'npc',name:'Mira',role:'Market keeper',x:28.5*64,y:27.5*64,dir:3,hue:290,route:[],wait:99,merchant:true},
 {id:'rowan',kind:'npc',name:'Rowan',role:'Farmer',x:18.5*64,y:21.5*64,dir:0,hue:80,route:[],wait:3,stops:[[18,21],[14,21],[14,18],[20,20]]},
 {id:'pip',kind:'npc',name:'Pip',role:'Courier',x:25.5*64,y:21.5*64,dir:1,hue:185,route:[],wait:5,stops:[[25,21],[30,21],[36,21],[28,28]]}
];
villagers.push(
 {id:'ada',kind:'npc',name:'Ada',role:'Meadow gardener',field:3,crop:6,x:10.5*64,y:16.5*64,dir:3,hue:35,route:[],wait:1},
 {id:'bram',kind:'npc',name:'Bram',role:'River grower',field:4,crop:2,x:38.5*64,y:19.5*64,dir:3,hue:140,route:[],wait:2},
 {id:'nell',kind:'npc',name:'Nell',role:'North gardener',field:5,crop:1,x:25.5*64,y:10.5*64,dir:3,hue:240,route:[],wait:3}
);
buildings.push(...[
 ['ada',4,9],['bram',40,10],['nell',24,2],['rowan',4,19],['pip',18,30],['mira',26,30]
].map(([owner,c,r])=>({id:owner+'-home',owner,kind:'residence',name:owner[0].toUpperCase()+owner.slice(1)+'’s cottage',c,r,w:3,h:3,frame:0})));
const seeds=Array(8).fill(4),seedPrices=[2,3,5,3,4,4,1,5],marketStock=Array(8).fill(16);
const WHISTLE_COOLDOWN=9;
const waySigns=[];
const sign={kind:'sign',name:'Village noticeboard',x:15.5*64,y:22.5*64};
const inventory=Array(8).fill(0),storage=Array(8).fill(0),prices=[4,7,11,6,8,9,3,10];
let coins=0,gates=[],activePanel=null,panelResume=false,villageVisits=0;
function initVillage(){gates=fields.map((f,i)=>({kind:'gate',id:i,name:f.name+' gate',c:f.x+Math.floor(f.w/2),r:f.y+f.h,x:(f.x+Math.floor(f.w/2))*64+32,y:(f.y+f.h)*64+32,open:true}));initFarmers();}
function villageBlocked(c,r){
 for(const o of [sign,...waySigns])if(c===Math.floor(o.x/64)&&r===Math.floor(o.y/64))return true;
 for(const b of buildings)if(c>=b.c&&c<b.c+b.w&&r>=b.r&&r<b.r+b.h)return true;
 for(let i=0;i<fields.length;i++){const f=fields[i],g=gates[i];if(!g)continue;
  if(c===g.c&&r===g.r){if(!g.open)return true;continue;}
  if(((r===f.y-1||r===f.y+f.h)&&c>=f.x-1&&c<=f.x+f.w)||((c===f.x-1||c===f.x+f.w)&&r>=f.y&&r<f.y+f.h))return true;
 }return false;
}
function canStand(x,y){const radius=11;return [[-radius,-radius],[-radius,radius],[radius,-radius],[radius,radius]].every(([dx,dy])=>walkable(Math.floor((x+dx)/64),Math.floor((y+dy)/64)));}
function renderFences(){for(let i=0;i<fields.length;i++){const f=fields[i],g=gates[i];for(let c=f.x-1;c<=f.x+f.w;c++){tile('fence',c*64,(f.y-1)*64);if(c!==g.c||!g.open)tile('fence',c*64,(f.y+f.h)*64);else{tile('path',c*64,g.r*64);ctx.save();ctx.translate(c*64+9,g.r*64+32);ctx.rotate(Math.PI/2);sprite('terrain',1346,35,400,390,-32,-9,64,18);ctx.restore();}}for(let r=f.y;r<f.y+f.h;r++)for(const c of [f.x-1,f.x+f.w]){ctx.save();ctx.translate(c*64+32,r*64+32);ctx.rotate(Math.PI/2);tile('fence',-32,-32);ctx.restore();}if(Math.hypot(player.x-g.x,player.y-g.y)<115)label(g.open?'E · Close gate':'E · Open gate',g.x,g.y-25);}}
function renderBuilding(b){const im=images.buildings;if(!im)return;const sw=im.width/2,sh=im.height;const x=b.c*64-16,y=b.r*64-48,w=b.w*64+32,h=b.h*64+64;sprite('buildings',b.frame*sw,0,sw,sh,x,y,w,h);}
function actor(n){ctx.save();ctx.filter=n.hue?'hue-rotate('+n.hue+'deg)':'none';const frame=n.moving?Math.floor(elapsed*7)%4:1;const bob=n.workTimer>0?Math.sin(elapsed*12)*3:0;sprite('player',frame*50,n.dir*46,50,46,n.x-35,n.y-57+bob,70,64);ctx.restore();if(n.carry)cropImage(n.crop,3,n.x+22,n.y-20,24);if(Math.hypot(player.x-n.x,player.y-n.y)<120)label(n.name,n.x,n.y-65);}
function renderVillage(){const things=[...buildings.map(b=>({y:(b.r+b.h)*64,draw:()=>renderBuilding(b)})),...villagers.map(n=>({y:n.y,draw:()=>actor(n)})),...waySigns.map(o=>({y:o.y,draw:()=>renderWaySign(o)})),{y:sign.y,draw:()=>renderWaySign(sign)},{y:player.y,draw:farmer}];things.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());}
function villageMap(){for(const b of buildings){mc.fillStyle=b.kind==='home'?'#ffe3a0':'#e9adf3';mc.fillRect(b.c*3,b.r*3,b.w*3,b.h*3)}for(const n of villagers){mc.fillStyle='#c4f4ee';mc.fillRect(n.x/W*150-1,n.y/H*120-1,2,2)}}
function updateVillagers(dt){for(const n of villagers){n.moving=false;n.whistleCool=Math.max(0,(n.whistleCool||0)-dt);npcWhistle(n);if(n.field!==undefined){updateFarmer(n,dt);continue;}if(n.merchant)continue;if(n.route.length){const t=n.route[0];if(!walkable(Math.floor(t.x/64),Math.floor(t.y/64))){n.route=[];n.wait=2;continue;}const dx=t.x-n.x,dy=t.y-n.y,d=Math.hypot(dx,dy),step=80*dt;if(d<=step){if(!canStand(t.x,t.y)){n.route=[];return;}n.x=t.x;n.y=t.y;n.route.shift();if(!n.route.length)n.wait=3+Math.random()*5}else{const nx=n.x+dx/d*step,ny=n.y+dy/d*step;if(canStand(nx,ny)){n.x=nx;n.y=ny;}else{n.route=[];n.task=null;return;}n.dir=Math.abs(dx)>Math.abs(dy)?dx>0?0:1:dy>0?3:2;n.moving=true}}else{n.wait-=dt;if(n.wait<=0){const t=n.stops[Math.floor(Math.random()*n.stops.length)];n.route=findPath(t[0]*64+32,t[1]*64+32,n)??[];n.wait=4}}}}
function targetPosition(o){return o.kind==='home'||o.kind==='market'||o.kind==='residence'?{x:(o.c+o.w/2)*64+32,y:(o.r+o.h)*64+32}:o;}
function allActions(){return [...gates,...buildings,...villagers,sign,...waySigns];}
function nearestAction(){return allActions().map(o=>({o,d:Math.hypot(targetPosition(o).x-player.x,targetPosition(o).y-player.y)})).filter(v=>v.d<112).sort((a,b)=>a.d-b.d)[0]?.o;}
function approach(o){if(!running)return;const at=targetPosition(o);if(Math.hypot(at.x-player.x,at.y-player.y)<108){villageInteract(o);return;}const tc=Math.floor(at.x/64),tr=Math.floor(at.y/64),candidates=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const x=(tc+dc)*64+32,y=(tr+dr)*64+32;if(Math.hypot(x-at.x,y-at.y)>100)continue;const path=findPath(x,y);if(path)candidates.push({path,x,y})}candidates.sort((a,b)=>a.path.length-b.path.length);if(!candidates.length){toast('Open a nearby gate to reach this spot.');return;}route=candidates[0].path;pending=o;if(!route.length)villageInteract(o);}
function villageHit(x,y){const npc=villagers.find(n=>Math.abs(x-n.x)<25&&y<n.y+12&&y>n.y-60);if(npc)return npc;const gate=gates.find(g=>Math.abs(x-g.x)<30&&Math.abs(y-g.y)<30);if(gate)return gate;for(const b of buildings)if(x>b.c*64&&x<(b.c+b.w)*64&&y>b.r*64-40&&y<(b.r+b.h)*64+25)return b;for(const o of [sign,...waySigns])if(Math.abs(x-o.x)<(o===sign?46:27)&&y>o.y-(o===sign?100:78)&&y<o.y+8)return o;return null;}
function villageInteract(o){pending=null;route=[];if(!running)return;const at=targetPosition(o);if(Math.hypot(at.x-player.x,at.y-player.y)>115){toast('Come a little closer to interact.');return;}if(o.kind==='gate'){if(o.open&&[player,...villagers].some(n=>Math.abs(n.x-o.x)<44&&Math.abs(n.y-o.y)<44)){toast('Step clear of the gate before closing it.');return;}o.open=!o.open;toast(o.open?'Gate opened.':'Gate closed.');beep(300);return;}if(o.kind==='waypoint'){openPanel(o);return;}openPanel(o);}
function openPanel(o){panelResume=running;running=false;keys.clear();route=[];pending=null;activePanel=o;$('village-dialog').showModal();renderPanel();}
function closePanel(){if(!$('village-dialog').open)return;$('village-dialog').close();activePanel=null;running=panelResume&&!ended;keys.clear();}
function total(items){return items.reduce((a,b)=>a+b,0);}function cropValue(){return inventory.reduce((sum,n,i)=>sum+n*prices[i],0);}
function inventoryRows(canSell){return types.map((t,i)=>'<div class="inventory-row"><span class="cropicon" style="background-image:url(assets/crops-'+t.sheet+'.png);background-position:100% '+t.row*100/3+'%"></span><span><b>'+t.name+'</b><small>'+prices[i]+' coins each</small></span><strong>×'+inventory[i]+'</strong>'+(canSell?'<button data-sell="'+i+'" '+(!inventory[i]?'disabled':'')+'>Sell 1</button>':'')+'</div>').join('');}
function panelAction(label,handler,disabled=false){const b=document.createElement('button');b.className='start';b.textContent=label;b.disabled=disabled;b.onclick=handler;$('village-actions').appendChild(b);}
function renderPanel(){const o=activePanel;if(!o)return;$('village-actions').replaceChildren();$('village-content').replaceChildren();$('village-title').textContent=o.name??'Your basket';$('village-tag').textContent=o.kind==='npc'?o.role+' · Villager':o.kind==='market'?'MIRA’S PRODUCE STALL':o.kind==='home'?'HOME SWEET HOME':'CLOVER COVE';let copy='';
 if(o.kind==='market'){
 copy='Sell your harvest and buy seeds. Neighbour deliveries replenish seed stock. You have '+coins+' coins.';$('village-content').innerHTML=inventoryRows(true)+'<h3>Seed shop</h3>'+types.map((t,i)=>'<div class="inventory-row"><span>'+t.name+'</span><small>'+seedPrices[i]+' coins · '+marketStock[i]+' left</small><b>'+seeds[i]+' owned</b><button data-buy="'+i+'" '+(coins<seedPrices[i]||!marketStock[i]?'disabled':'')+'>Buy 1</button></div>').join('');$('village-content').querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buySeed(Number(b.dataset.buy)));$('village-content').querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>sell(Number(b.dataset.sell),1));panelAction('Sell basket · '+cropValue()+' coins',()=>sellAll(),!total(inventory));
 }else if(o.kind==='residence'){
 const resident=villagers.find(n=>n.id===o.owner);copy='This is '+resident.name+'’s home. '+(resident.field!==undefined?'They work their garden and take harvests to the market.':'You’ll find them around the village.');panelAction('Find '+resident.name,()=>{closePanel();approach(resident);});
 }else if(o.kind==='home'){
 copy='Welcome home. Keep crops in your pantry, or collect them for your next trip to the market.';$('village-content').innerHTML='<div class="home-summary"><span>In your basket<b>'+total(inventory)+'</b></span><span>In the pantry<b>'+total(storage)+'</b></span><span>Your coins<b>'+coins+'</b></span></div><p class="panel-note">The farm pauses while you are here. Your pantry lasts for this play session.</p>';panelAction('Store basket in pantry',()=>transfer(true),!total(inventory));panelAction('Collect pantry crops',()=>transfer(false),!total(storage));
 }else if(o.kind==='basket'){
 copy=total(inventory)+' crops in your basket · worth '+cropValue()+' coins at the market.';$('village-content').innerHTML=inventoryRows(false);panelAction('Walk to the market',()=>{closePanel();approach(buildings[1]);});
 }else if(o.kind==='sign'){
 copy='Village notices · Summer, day 01';$('village-content').innerHTML='<ul class="notice-list"><li>Cottage: northwest of the home fields. Store crops in the pantry.</li><li>Market: southeast of the home fields. Mira buys harvested crops.</li><li>River crossing: follow the main road east.</li><li>Ada grows radishes in the meadow, Bram tends pumpkins by the river, and Nell grows corn up north. Their marked rows belong to them; the remaining rows are yours to use.</li><li>Today: Mira is buying all eight crop varieties. Talk to neighbours for news.</li></ul>';panelAction('Walk to your cottage',()=>{closePanel();approach(buildings[0]);});panelAction('Walk to the market',()=>{closePanel();approach(buildings[1]);});
 }else if(o.kind==='waypoint'){
 copy=o.description;panelAction('Walk there',()=>{closePanel();if(o.target)approach(o.target);else {const dest=o.dest;if(walkable(Math.floor(dest.x/64),Math.floor(dest.y/64)))go(dest.x,dest.y);else approach(o);}});
 }else if(o.kind==='npc'){
 copy=npcDialogue(o,'hello');const portrait=document.createElement('div');portrait.className='npc-portrait';portrait.style.filter='hue-rotate('+o.hue+'deg)';$('village-content').appendChild(portrait);
 panelAction('How is your day?',()=>{$('village-copy').textContent=npcDialogue(o,'day');});
 panelAction('Any farming advice?',()=>{$('village-copy').textContent=npcDialogue(o,'advice');});
 panelAction('Tell me about the village',()=>{$('village-copy').textContent=npcDialogue(o,'village');});
 if(o.merchant)panelAction('Let’s trade',()=>{activePanel=buildings[1];renderPanel();});
 if(o.field!==undefined)panelAction('What are you growing?',()=>{$('village-copy').textContent=npcDialogue(o,'work');});
 }

 $('village-copy').textContent=copy;updateEconomy();
}
function marketAllowed(){return activePanel?.kind==='market'&&$('village-dialog').open&&Math.hypot(targetPosition(buildings[1]).x-player.x,targetPosition(buildings[1]).y-player.y)<150;}
function sell(i,n){if(!marketAllowed()||!Number.isInteger(i)||i<0||i>=8||!Number.isInteger(n)||n<1||inventory[i]<n)return false;inventory[i]-=n;coins+=prices[i]*n;beep(650);renderPanel();return true;}
function sellAll(){if(!marketAllowed())return false;const count=total(inventory),value=cropValue();if(!count)return false;inventory.fill(0);coins+=value;renderPanel();$('village-copy').textContent='Sold '+count+' crops for '+value+' coins. Thank you for the fresh produce!';beep(800);return true;}
function transfer(deposit){if(activePanel?.kind!=='home'||!$('village-dialog').open)return false;const from=deposit?inventory:storage,to=deposit?storage:inventory;if(!total(from))return false;for(let i=0;i<8;i++){to[i]+=from[i];from[i]=0;}renderPanel();return true;}
function updateEconomy(){ $('coins').textContent=coins;$('basket-count').textContent=total(inventory);document.querySelectorAll('.seed-count').forEach((b,i)=>b.textContent=seeds[i]);const n=running?nearestAction():null;$('interact').textContent=n?'E · '+(n.kind==='gate'?(n.open?'Close gate':'Open gate'):n.kind==='npc'?'Talk to '+n.name:n.name):'E · Interact';}
function resetVillage(){inventory.fill(0);storage.fill(0);seeds.fill(4);marketStock.fill(16);coins=12;gates.forEach(g=>g.open=true);villagers[0].x=28.5*64;villagers[0].y=27.5*64;villagers[1].x=18.5*64;villagers[1].y=21.5*64;villagers[2].x=25.5*64;villagers[2].y=21.5*64;villagers.forEach(n=>{n.route=[];n.wait=3;n.moving=false;n.chats={};n.whistleCool=0;n.chasing=null;n.trip=null;n.nextMarket=25+Math.random()*45;n.sold=0;if(n.field!==undefined){const f=fields[n.field];n.x=(f.x+Math.floor(f.w/2))*64+32;n.y=(f.y+f.h-1)*64+32;n.harvested=0;n.carry=0;n.task=null;n.workTimer=0;n.activity='Checking the rows';}});updateEconomy();}
function bindVillage(){ $('village-close').onclick=closePanel;$('village-dialog').addEventListener('cancel',e=>{e.preventDefault();closePanel();});$('basket').onclick=()=>{if(running)openPanel({kind:'basket',name:'Your harvest basket'});};$('interact').onclick=()=>{if(!running)return;const n=nearestAction();if(n)villageInteract(n);else{const p=plots.filter(p=>Math.hypot(p.x-player.x,p.y-player.y)<82&&sameField(p)).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];if(p)interact(p);else toast('Move beside a gate, villager, building entrance or crop.');}};}
function sameField(p){const f=fields[p.field];return player.x>f.x*64&&player.x<(f.x+f.w)*64&&player.y>f.y*64&&player.y<(f.y+f.h)*64;}

// Farmers own only the first two rows of three gardens. Player harvests are separate.
function initFarmers(){
 for(const n of villagers.filter(n=>n.field!==undefined)){
  n.harvested=0;n.carry=0;n.task=null;n.workTimer=0;n.chats={};n.activity='Checking the rows';
  const f=fields[n.field];plots.filter(p=>p.field===n.field&&p.y<(f.y+2)*64).forEach(p=>p.owner=n.id);
 }
 const add=(frame,name,x,y,description,dest,target)=>waySigns.push({kind:'waypoint',frame,name,x:x*64,y:y*64,description,dest,target});
 for(let i=0;i<fields.length;i++){const f=fields[i],farmer=villagers.find(n=>n.field===i);add(0,f.name,(f.x+f.w+.5),f.y+f.h+1.5,farmer?farmer.name+' tends the first two rows here. The lower rows are open for you to plant.':'Your field. Choose seeds and enter through the south gate to plant.',{x:gates[i].x,y:gates[i].y+64});}
 add(1,'Your cottage',16,13.5,'An orange roof, a quiet room, and a pantry for your harvest.',null,buildings[0]);
 add(2,'Clover Market',25,28.5,'Mira buys fresh produce under the striped awning. Bring your basket.',null,buildings[1]);
 add(3,'River crossing',29.5,22.5,'The bridge connects the home gardens and Bram’s river patch.',{x:36.5*64,y:21.5*64});
 add(4,'South pond',12.5,32.5,'A quiet place by the water. No fishing yet — just a view and a moment to rest.',{x:12.5*64,y:32.5*64});
 sign.frame=5;
}
function renderWaySign(o){if(!images.signs)return;const bounds=[[128,38,448,462],[610,38,930,462],[1094,38,1411,462],[128,532,448,956],[610,532,930,956],[1004,524,1493,956]],frame=o.frame??5,[x,y,r,b]=bounds[frame],h=frame===5?92:76,w=Math.round((r-x)/(b-y)*h);sprite('signs',x,y,r-x,b-y,o.x-w/2,o.y-h,w,h);}

function farmWalk(n,x,y){const path=findPath(x,y,n);if(path===null){n.wait=2;n.activity='Waiting for a clear path';return false;}n.route=path;return true;}
function updateFarmer(n,dt){
 if(marketTrip(n,dt))return;
 if(n.chasing&&!crows.includes(n.chasing)){n.chasing=null;n.route=[];n.task=null;}
 if(!n.chasing&&!n.whistleCool){const bird=crows.find(b=>b.target?.owner===n.id&&Math.hypot(b.x-n.x,b.y-n.y)>=560);if(bird){const path=findPath(bird.target.x,bird.target.y,n);if(path){n.chasing=bird;n.route=path;n.task=null;n.activity='Chasing crows';}}}
 if(n.workTimer>0){n.workTimer-=dt;return;}
 const g=gates[n.field];if(!g.open&&Math.hypot(n.x-g.x,n.y-g.y)<110){g.open=true;burst(g.x,g.y-35,'Gate opened');}
 if(n.route.length){const t=n.route[0];if(!walkable(Math.floor(t.x/64),Math.floor(t.y/64))){n.route=[];n.task=null;n.wait=1;return;}const dx=t.x-n.x,dy=t.y-n.y,d=Math.hypot(dx,dy),step=88*dt;if(d<=step){if(!canStand(t.x,t.y)){n.route=[];return;}n.x=t.x;n.y=t.y;n.route.shift();}else{const nx=n.x+dx/d*step,ny=n.y+dy/d*step;if(canStand(nx,ny)){n.x=nx;n.y=ny;}else{n.route=[];n.task=null;return;}n.dir=Math.abs(dx)>Math.abs(dy)?dx>0?0:1:dy>0?3:2;n.moving=true;}return;}
 if(n.task){const p=n.task;n.task=null;if(Math.hypot(n.x-p.x,n.y-p.y)>45)return;
  if(p.type<0){p.type=n.crop;p.age=0;p.tended=false;n.activity='Planting '+types[n.crop].name.toLowerCase();burst(p.x,p.y-35,'Planting');}
  else if(p.age>=types[p.type].time){p.type=-1;p.age=0;p.tended=false;n.harvested++;n.carry++;n.activity='Harvesting';burst(p.x,p.y-35,'Harvest');}
  else if(!p.tended){p.age+=types[p.type].time*.15;p.tended=true;n.activity='Tending the leaves';burst(p.x,p.y-35,'Tending');}
  n.workTimer=1.5;n.wait=1;return;
 }
 n.wait-=dt;if(n.wait>0)return;
 const own=plots.filter(p=>p.owner===n.id);
 const candidates=own.filter(p=>p.type>=0&&p.age>=types[p.type].time);if(!candidates.length)candidates.push(...own.filter(p=>p.type>=0&&!p.tended));if(!candidates.length)candidates.push(...own.filter(p=>p.type<0));
 candidates.sort((a,b)=>Math.hypot(n.x-a.x,n.y-a.y)-Math.hypot(n.x-b.x,n.y-b.y));
 if(candidates.length){const p=candidates[0];if(farmWalk(n,p.x,p.y)){n.task=p;n.activity='Walking the rows';}}
 else{n.activity='Watching the crops grow';n.wait=3;}
 if(!g.open&&!n.route.length){const approaches=[{x:g.x,y:g.y-64},{x:g.x,y:g.y+64}];for(const p of approaches)if(farmWalk(n,p.x,p.y))break;}
}
const dialogueBank={
 mira:{hello:['Morning! Put your basket down; I’ll make room between the pumpkins.','Fresh produce travels better than gossip. Though I buy only one of those.','Welcome back. My scales are ready when you are.'],day:['Pip arrived with muddy boots and three different versions of the same story.','Bram insists his pumpkins deserve a bigger shelf. I think he’s right.','I’m sorting the turnips from the radishes. It’s easier before everyone starts chatting.'],advice:['Radishes grow quickly. Pumpkins need more patience, but I pay more for them.','Your basket shows what each crop is worth. I pay the same price all day.','Keep a little produce in your cottage pantry if you don’t want to sell everything.'],village:['Nell works the north garden. You’ll usually find her inspecting the corn.','The picture signs will guide you: a roof for home, an awning for my stall.','Rowan knows every gate. Pip knows everyone who forgot to close one.']},
 rowan:{hello:['Mind the fence posts. They’ve outlasted three pairs of my boots.','You’re getting the hang of this place. Your fields look busier already.','Hello there. I was just checking the south gates.'],day:['A crow landed right beside me today. Very confident for someone without a seed packet.','I’m walking the paths before the afternoon deliveries.','The soil near the river stays dark longer after rain. Bram never lets me forget it.'],advice:['Enter each field from its south gate. Click a plot and your feet will find the route.','When you hear wings, look up. A quick whistle can save a whole patch.','Harvest from inside your field. Reaching through fences is how sleeves get torn.'],village:['Ada tends the first two rows in the meadow. The lower rows are free for you.','The noticeboard has directions and today’s market news.','Your cottage is northwest of the home fields. Store spare crops in the pantry.']},
 pip:{hello:['One parcel delivered. Two directions forgotten. An ordinary morning.','If you’re heading east, take the bridge. My wet boots can explain why.','Hello! I’m on my rounds. Have you met the gardeners yet?'],day:['Nell sent a message to Bram. Bram sent back a pumpkin. I need a larger bag.','I have walked this road four times and still notice new flowers.','Mira asked for news. I brought her corn prices and a story about a crow.'],advice:['Red marks on the map mean crows. Don’t let a quiet field fool you.','Open a gate before planning a route through it. Even I can’t deliver through a fence.','You can click the map to travel, then click a neighbour to speak.'],village:['Ada is in the meadow, Bram across the river, Nell up north.','A fish on a sign means the pond. It’s a fine place for a break.','Mira runs the market. She has heard every bargaining speech I know.']},
 ada:{hello:['Watch the little leaves. They tell you more than the calendar.','Welcome to my meadow rows. There’s room for your seeds just below mine.','I was hoping for company. Radishes are wonderful listeners, but poor conversationalists.'],day:['I’m checking the leaves, planting the gaps, and picking whatever is ready.','A straight row makes me happy. A crooked row still grows good vegetables.','The meadow is noisy with birds today. I’m keeping one eye on the sky.'],advice:['Quick crops give you more chances to learn when to plant and pick.','My first two rows are spoken for. Try your seeds in the lower rows.','Tend a growing plant patiently; pulling it early won’t make a harvest.'],village:['Nell and I trade growing tips. Bram mostly talks about pumpkins.','The cottage pantry is useful when you want to keep a little back from market.','That carrot sign marks a garden. Follow the opening in the fence.']},
 bram:{hello:['Now that is a good day for growing pumpkins. I say that most days.','You crossed the bridge! Welcome to the river garden.','Careful where you step. The best pumpkin always hides behind a leaf.'],day:['Plant, tend, pick, repeat. There are worse ways to spend a morning.','The river keeps me company while the pumpkins take their time.','I’m saving a large one for Mira’s front display.'],advice:['Pumpkins are slow. Plant a few quick crops elsewhere while you wait.','The first two rows here are mine. You’re welcome to use the rest.','Your whistle works nearby. If a crow is far away, walk closer or click it.'],village:['The bridge is west of here. Keep to the road and you’ll reach home.','Pip crosses the river so often I ought to put a bench out for him.','Mira’s awning is green and cream. Hard to miss once you reach the market.']},
 nell:{hello:['Give the corn a little room. It likes to think it owns the sky.','Welcome north. The path is longer, but the view makes up for it.','A visitor! Let me finish checking this row.'],day:['I’ve been replacing empty patches and watching for ripe ears.','Pip brought news from the market. The corn had no comment.','I count the rows when I’m thinking. Then I forget what I was thinking about.'],advice:['The little growth bar tells you how close a crop is to picking.','Look for the golden sparkle. That’s your harvest cue.','My first two rows stay busy. The remaining rows are yours to experiment with.'],village:['Ada’s meadow lies southwest. Bram’s garden is across the river.','Everyone meets at the market eventually. Even Rowan takes a break.','The noticeboard is by the main path. It saves Pip repeating himself.']}
};
function npcDialogue(n,topic){n.chats??={};if(topic==='work')return 'I grow '+types[n.crop].name.toLowerCase()+' in the first two rows of '+fields[n.field].name.toLowerCase()+'. I’ve picked '+n.harvested+' crops today. Right now: '+n.activity.toLowerCase()+'.';const lines=dialogueBank[n.id]?.[topic]??['Good to see you around the village.'];const i=n.chats[topic]??0;n.chats[topic]=i+1;if(topic==='hello'&&total(inventory)>12&&i%3===2)return 'That’s quite a basket! Mira will be glad to see you at the market.';return lines[i%lines.length];}

function buySeed(i){if(!marketAllowed()||!Number.isInteger(i)||i<0||i>=8||marketStock[i]<1||coins<seedPrices[i])return false;coins-=seedPrices[i];marketStock[i]--;seeds[i]++;renderPanel();beep(500);return true;}
function npcWhistle(n){if(n.whistleCool>0)return false;const targets=crows.filter(b=>Math.hypot(b.x-n.x,b.y-n.y)<560);if(!targets.length)return false;crows=crows.filter(b=>!targets.includes(b));n.whistleCool=WHISTLE_COOLDOWN;if(n.chasing){n.chasing=null;n.route=[];n.task=null;}burst(n.x,n.y-55,'Shoo!');return true;}
function marketTrip(n,dt){
 n.nextMarket=(n.nextMarket??45)-dt;
 if(!n.trip&&n.carry>=2&&n.nextMarket<=0){const at=targetPosition(buildings[1]);const path=findPath(at.x,at.y,n);if(path){n.trip='sell';n.task=null;n.route=path;n.activity='Taking harvest to market';}else n.nextMarket=5;}
 if(!n.trip)return false;
 if(n.route.length){const t=n.route[0];if(!walkable(Math.floor(t.x/64),Math.floor(t.y/64))){n.route=[];n.trip=null;n.nextMarket=5;return true;}const dx=t.x-n.x,dy=t.y-n.y,d=Math.hypot(dx,dy),step=Math.min(d,100*dt);const nx=d?n.x+dx/d*step:t.x,ny=d?n.y+dy/d*step:t.y;if(!canStand(nx,ny)){n.route=[];n.trip=null;return true;}n.x=nx;n.y=ny;n.moving=d>0;n.dir=Math.abs(dx)>Math.abs(dy)?dx>0?0:1:dy>0?3:2;if(d<=step)n.route.shift();return true;}
 if(n.trip==='sell'){marketStock[n.crop]+=n.carry;n.sold+=n.carry;burst(n.x,n.y-55,'Sold '+n.carry);n.carry=0;n.trip='break';n.visitWait=3+Math.random()*5;n.activity='Chatting at the market';return true;}
 if(n.trip==='break'){n.visitWait-=dt;if(n.visitWait<=0){const f=fields[n.field],path=findPath((f.x+Math.floor(f.w/2))*64+32,(f.y+f.h-1)*64+32,n);if(path){n.route=path;n.trip='return';n.activity='Returning to the garden';}else {const g=gates[n.field];const p=findPath(g.x,g.y+64,n);if(p){n.route=p;n.trip='gate';}}}return true;}
 if(n.trip==='gate'){const g=gates[n.field];if(Math.hypot(n.x-g.x,n.y-g.y)<110)g.open=true;n.trip='break';n.visitWait=0;return true;}
 n.trip=null;n.nextMarket=35+Math.random()*80;n.wait=1;return true;
}
