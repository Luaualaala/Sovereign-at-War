(function(root){
  'use strict';
  const GS=root.GS=root.GS||{}, D=GS.DATA;
  const STAGES=GS.RESEARCH_STAGES=['Theory','Prototype','Production engineering','Field adoption'];
  const FRACTIONS=[.22,.23,.3,.25];
  const lookup=id=>D.techById[id];
  const bounded=(x,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(x)?x:lo));
  const modifier=(c,key)=>GS.mod?GS.mod(c,key):(c.techMods?.[key]||0);
  const note=(s,c,text)=>GS.log?.(s,'research',text,c.id);
  const alive=c=>c&&c.alive!==false;
  function aggregate(c){
    c.techMods={}; c.capabilities=[];
    for(const id of c.research.adopted){
      const t=lookup(id); if(!t)continue;
      for(const [key,value] of Object.entries(t.effects)) c.techMods[key]=(c.techMods[key]||0)+value;
      for(const cap of [t.unlock].flat().filter(Boolean))if(!c.capabilities.includes(cap))c.capabilities.push(cap);
    }
  }
  function adoptInitial(c,id,seen=new Set()){
    const t=lookup(id);if(!t||seen.has(id))return;seen.add(id);
    for(const p of t.prereqs)adoptInitial(c,p,seen);
    if(!c.research.completed.includes(id))c.research.completed.push(id);
    if(!c.research.adopted.includes(id))c.research.adopted.push(id);
  }
  GS.initResearch=function(c){
    const r=c.research=c.research||{};
    r.queue=r.queue||[];r.active=r.active||[];r.completed=r.completed||[];r.adopted=r.adopted||[];r.progress=r.progress||{};
    r.funding=bounded(r.funding??1,.5,2);r.focus=r.focus||D.countries.find(x=>x.id===c.id)?.focus||'logistics';
    r.institutions=r.institutions||[];r.licenses=r.licenses||[];r.fragments=r.fragments||{};r.lastFunding=r.lastFunding??r.funding;r.inertia=r.inertia??1;
    if(!r.institutions.length){
      const ed=bounded(c.education??55,0,100), prefix=c.short||'National';
      const templates=[
        ['university',`${prefix} University`,['medicine','agriculture','computing','strategic','administration'],1.05,'Mira Senn'],
        ['engineering',`${prefix} Engineering Bureau`,['industry','energy','engineering','motor','logistics'],1.15,'Tarin Ostel'],
        ['academy',`${prefix} Military Academy`,['infantry','artillery','armor','doctrine'],1.0,'Edda Vey'],
        ['signals',`${prefix} Signals Laboratory`,['communications','intelligence','aviation','naval'],.95,'Leon Arven']
      ];
      const count=ed<48?3:4;
      r.institutions=templates.slice(0,count).map(([id,name,fields,capacity,scientist],i)=>({id,name,fields,capacity,efficiency:.82+ed/300,loyalty:65,security:55,prestige:25,funding:1,expertise:35+ed*.35,scientist:{name:scientist,skill:45+ed*.4,loyalty:65},lastBranch:null,retooling:0}));
    }
    if(!r.initialized){
      const template=D.countries.find(x=>x.id===c.id);
      for(const id of c.startingTech||template?.startingTech||['rifle','depot_accounts'])adoptInitial(c,id);
      r.initialized=true;
    }
    aggregate(c);return r;
  };
  function ensure(c){return c.research?.initialized?c.research:GS.initResearch(c);}
  GS.rebuildResearchModifiers=c=>{ensure(c);aggregate(c);};
  GS.researchTrace=function(c,techId){
    const r=ensure(c),result=[],visited=new Set(),visiting=new Set();
    function walk(id){
      if(visited.has(id)||r.adopted.includes(id))return;
      if(visiting.has(id))throw new Error(`Technology prerequisite cycle at ${id}`);
      const t=lookup(id);if(!t)throw new Error(`Unknown technology: ${id}`);
      visiting.add(id);t.prereqs.forEach(walk);visiting.delete(id);visited.add(id);result.push(t);
    }
    walk(techId);return result;
  };
  GS.availableTech=function(c){const r=ensure(c);return D.techs.filter(t=>!r.adopted.includes(t.id)&&t.prereqs.every(id=>r.adopted.includes(id)));};
  GS.queueResearch=function(s,cid,techId,institutionId){
    const c=GS.country(s,cid);if(!alive(c))return{ok:false,message:'This state cannot start a research program.'};
    const r=ensure(c),t=lookup(techId);if(!t)return{ok:false,message:'Unknown technology.'};
    if(institutionId&&!r.institutions.some(i=>i.id===institutionId))return{ok:false,message:'Choose an existing research institution.'};
    if(r.adopted.includes(techId))return{ok:false,message:'This technology is already fully adopted.'};
    const active=r.active.find(a=>a.tech===techId),queued=r.queue.find(q=>(typeof q==='string'?q:q.tech)===techId);
    if(active||queued){
      if(institutionId&&queued&&typeof queued!=='string'){queued.institution=institutionId;return{ok:true,message:'Queued institution assignment updated.'};}
      return{ok:false,message:'This program is already active or queued.'};
    }
    let path;try{path=GS.researchTrace(c,techId);}catch(e){return{ok:false,message:e.message};}
    const existing=new Set([...r.active.map(a=>a.tech),...r.queue.map(q=>typeof q==='string'?q:q.tech)]);
    const additions=path.filter(x=>!existing.has(x.id));
    if(r.queue.length+additions.length>100)return{ok:false,message:'The research queue can hold 100 programs; finish or cancel existing paths first.'};
    additions.forEach(x=>r.queue.push({tech:x.id,institution:x.id===techId?institutionId||null:null}));
    note(s,c,`${t.name} queued${additions.length>1?` with ${additions.length-1} missing foundations`:''}.`);
    return{ok:true,message:`${t.name} added to the research plan. ${additions.length} program${additions.length===1?'':'s'} queued.`,queued:additions.map(x=>x.id)};
  };
  GS.cancelResearch=function(s,cid,techId){
    const c=GS.country(s,cid);if(!alive(c))return{ok:false,message:'Unknown country.'};const r=ensure(c);
    const a=r.active.find(x=>x.tech===techId);
    if(a){r.progress[techId]={...a};r.active=r.active.filter(x=>x!==a);note(s,c,`${lookup(techId).name} paused; engineering knowledge retained.`);return{ok:true,message:'Program paused. Existing knowledge is retained.'};}
    const before=r.queue.length;r.queue=r.queue.filter(q=>(typeof q==='string'?q:q.tech)!==techId);
    return before!==r.queue.length?{ok:true,message:'Program removed from queue; dependent programs will wait for its foundation.'}:{ok:false,message:'This program is not queued.'};
  };
  GS.setResearchInstitution=function(s,cid,techId,institutionId){
    const c=GS.country(s,cid);if(!alive(c))return{ok:false,message:'Unknown country.'};const r=ensure(c),inst=r.institutions.find(i=>i.id===institutionId);
    if(!inst)return{ok:false,message:'Unknown institution.'};
    const a=r.active.find(x=>x.tech===techId);
    if(!a)return GS.queueResearch(s,cid,techId,institutionId);
    if(r.active.some(x=>x!==a&&x.institution===institutionId))return{ok:false,message:'That institution is already running another program.'};
    if(a.institution===institutionId)return{ok:false,message:'That institution already runs this program.'};
    a.institution=institutionId;inst.retooling=10;a.reason='Laboratory reassignment';r.inertia=Math.min(r.inertia,.82);
    return{ok:true,message:'Program reassigned; laboratory retooling temporarily reduces output.'};
  };
  function aheadPenalty(t,day){const ahead=Math.max(0,t.era-(1936+(day||0)/365));return 1+Math.pow(ahead,1.45)*.7;}
  function capacity(c){
    const r=c.research,ed=bounded(c.education??55,5,100),stable=bounded(c.stability??60,0,100),labor=bounded(c.labor?.research??.15,.015,.7);
    const spending=bounded(c.spending?.research??1,.25,2);
    return 2.65*Math.pow(ed/60,.7)*(.55+stable/180)*Math.pow(labor/.15,.45)*r.funding*Math.sqrt(spending)*bounded(1+modifier(c,'research'),.2,3)*r.inertia;
  }
  function weight(inst,t){return inst.capacity*inst.funding*inst.efficiency*(inst.fields.includes(t.branch)?1.35:.7)*(.7+(inst.expertise||50)/160)*(.75+(inst.scientist?.skill||50)/200)*(inst.retooling>0?.55:1);}
  function requirements(t,stage){
    const industrial=['infantry','artillery','armor','motor','aviation','naval','industry','energy','engineering','strategic'].includes(t.branch);
    if(stage===0)return{treasury:.38};
    if(stage===1)return{treasury:.7,materials:industrial?.08:.025,parts:industrial?.018:.005};
    if(stage===2)return{treasury:.9,materials:industrial?.08:.035,equipment:industrial?.025:.008};
    return{treasury:.65,equipment:industrial?.07:.012,parts:industrial?.025:.004};
  }
  function assign(s,c){
    const r=c.research;
    r.queue=r.queue.map(q=>typeof q==='string'?{tech:q,institution:null}:q).filter(q=>lookup(q.tech)&&!r.adopted.includes(q.tech));
    for(const q of [...r.queue]){
      const t=lookup(q.tech);
      if(r.active.some(a=>a.tech===q.tech)){r.queue=r.queue.filter(x=>x!==q);continue;}
      if(!t.prereqs.every(id=>r.adopted.includes(id)))continue;
      const free=r.institutions.filter(i=>!r.active.some(a=>a.institution===i.id)&&(!q.institution||q.institution===i.id));
      if(!free.length)continue;free.sort((a,b)=>weight(b,t)-weight(a,t));const inst=free[0];
      const previous=r.progress[t.id]||{},stage=bounded(previous.stage??(r.completed.includes(t.id)?3:0),0,3);
      const a={tech:t.id,institution:inst.id,stage,points:previous.points||0,target:t.cost*FRACTIONS[stage],rollout:previous.rollout||0,reason:'',started:s.day,failures:previous.failures||0,knowledge:previous.knowledge||0,licensedFrom:previous.licensedFrom??null,prototypeResolved:previous.prototypeResolved||false};
      if(inst.lastBranch&&inst.lastBranch!==t.branch)inst.retooling=7;
      inst.lastBranch=t.branch;r.active.push(a);r.queue=r.queue.filter(x=>x!==q);
    }
  }
  GS.researchTick=function(s){
    for(const c of s.countries){
      if(!alive(c))continue;const r=ensure(c);r.day=s.day;
      r.funding=bounded(r.funding,.5,2);
      if(Math.abs(r.funding-r.lastFunding)>.01){r.inertia=Math.min(r.inertia,.72);r.lastFunding=r.funding;}
      r.inertia=Math.min(1,r.inertia+.012);
      for(const i of r.institutions){i.funding=bounded(i.funding??1,.25,2);if(i.retooling>0)i.retooling--;}
      assign(s,c);
      const total=capacity(c),weights=r.active.map(a=>{const i=r.institutions.find(x=>x.id===a.institution);return i?weight(i,lookup(a.tech)):0;}),weightSum=weights.reduce((a,b)=>a+b,0);
      r.metrics={capacity:total,spent:0,materials:0,programs:r.active.length,blocked:0};
      const finished=[];
      for(let index=0;index<r.active.length;index++){
        const a=r.active[index],t=lookup(a.tech),inst=r.institutions.find(i=>i.id===a.institution);
        if(!t||!inst)continue;
        if(!t.prereqs.every(id=>r.adopted.includes(id))){a.reason='Awaiting adopted foundations';r.metrics.blocked++;continue;}
        const penalty=aheadPenalty(t,s.day),maxRate=2.3*inst.capacity,base=Math.min(maxRate,total*(weights[index]/Math.max(.01,weightSum)))/penalty;
        const fractionKnowledge=bounded((a.knowledge||0)/250,0,.25);
        let gain=Math.min(a.target-a.points,base*(1+fractionKnowledge));
        const req=requirements(t,a.stage);let limiting='';
        for(const [key,amount] of Object.entries(req)){
          const available=key==='treasury'?Math.max(0,c.treasury):Math.max(0,c.stock?.[key]||0);
          if(available/amount<gain){gain=available/amount;limiting=key;}
        }
        if(gain<.0001){a.reason=`Waiting for ${limiting||'funding'}`;r.metrics.blocked++;continue;}
        for(const [key,amount] of Object.entries(req)){
          const cost=gain*amount;
          if(key==='treasury'){c.treasury=Math.max(0,c.treasury-cost);r.metrics.spent+=cost;}else{c.stock[key]=Math.max(0,c.stock[key]-cost);if(key==='materials')r.metrics.materials+=cost;}
        }
        a.points+=gain;a.reason=limiting?`Limited by ${limiting}`:penalty>1.2?`${penalty.toFixed(1)}x ahead-of-era workload`:inst.retooling?'Retooling laboratory':'';
        if(a.stage===3)a.rollout=bounded(a.points/a.target*100,0,100);
        r.progress[t.id]={...a};
        if(a.points<a.target-.00001)continue;
        if(a.stage===1&&!a.prototypeResolved){
          const risk=bounded(.21-(inst.expertise||50)/650-(inst.scientist?.skill||50)/1100+(penalty-1)*.013,.035,.32);
          a.prototypeResolved=true;
          if(a.failures<2&&GS.rand(s)<risk){
            a.failures++;a.knowledge+=18;a.points=a.target*.65;a.reason='Prototype flaw: redesign retains engineering knowledge';inst.expertise=Math.min(100,inst.expertise+2);
            note(s,c,`${t.name} prototype exposed a design flaw. Redesign retains ${Math.round(a.points/a.target*100)}% of prototype work.`);r.progress[t.id]={...a};continue;
          }
        }
        inst.expertise=Math.min(100,inst.expertise+.7);inst.prestige=Math.min(100,inst.prestige+.45);
        if(a.stage===3){
          if(!r.adopted.includes(t.id))r.adopted.push(t.id);if(!r.completed.includes(t.id))r.completed.push(t.id);
          r.progress[t.id]={stage:4,points:t.cost,rollout:100,finished:s.day,failures:a.failures,licensedFrom:a.licensedFrom};finished.push(a);aggregate(c);
          note(s,c,`${t.name} fully adopted${t.unlock?`; capability available: ${String(t.unlock).replaceAll('_',' ')}`:''}.`);
        }else{
          a.stage++;a.points=0;a.target=t.cost*FRACTIONS[a.stage];a.reason='';
          if(a.stage===3&&!r.completed.includes(t.id)){r.completed.push(t.id);note(s,c,`${t.name} production design completed; field rollout begins.`);}
          r.progress[t.id]={...a};
        }
      }
      r.active=r.active.filter(a=>!finished.includes(a));
      if(s.day>0&&s.day%90===0){
        for(const inst of r.institutions){
          const unsafe=(c.legitimacy??60)<30||(c.stability??60)<25;
          if(unsafe&&GS.rand(s)<.12){inst.scientist.skill=Math.max(20,inst.scientist.skill-5);inst.efficiency=Math.max(.5,inst.efficiency-.04);note(s,c,`${inst.name} lost specialists during political instability.`);}
          else if((c.education??50)>60)inst.scientist.skill=Math.min(95,inst.scientist.skill+.4);
        }
      }
    }
  };
  GS.researchStatus=function(c,id){
    const r=ensure(c);if(!lookup(id))return'Unknown';if(r.adopted.includes(id))return'Adopted';
    const a=r.active.find(x=>x.tech===id);if(a)return`${STAGES[a.stage]} · ${Math.round(a.points/a.target*100)}%${a.reason?` · ${a.reason}`:''}`;
    if(r.queue.some(x=>(typeof x==='string'?x:x.tech)===id))return'Queued';
    if(r.completed.includes(id))return'Production ready; awaiting adoption';if(r.progress[id])return'Paused; knowledge retained';
    return lookup(id).prereqs.every(p=>r.adopted.includes(p))?'Available':'Foundations required';
  };
  GS.researchEstimate=function(c,id,day){
    const r=ensure(c),t=lookup(id);if(!t)return{days:null,aheadPenalty:1,stage:'Unknown',progress:0,reason:'Unknown technology'};
    if(r.adopted.includes(id))return{days:0,aheadPenalty:1,stage:'Adopted',progress:100,reason:''};
    const a=r.active.find(x=>x.tech===id),p=a||r.progress[id]||{stage:0,points:0};
    const penalty=aheadPenalty(t,day??r.day??0),stage=Math.min(3,p.stage||0),remaining=t.cost*FRACTIONS.slice(stage).reduce((x,y)=>x+y,0)-(p.points||0);
    let share=capacity(c)/Math.max(1,r.active.length||r.institutions.length);
    if(a){const inst=r.institutions.find(i=>i.id===a.institution);if(inst)share=Math.min(share,2.3*inst.capacity);}
    const complete=t.cost-remaining;
    return{days:Math.ceil(remaining/(Math.max(.01,share)/penalty)),aheadPenalty:penalty,stage:STAGES[stage],progress:bounded(complete/t.cost*100,0,100),reason:a?.reason||(!t.prereqs.every(x=>r.adopted.includes(x))?'Estimate excludes missing foundations':'Estimate assumes uninterrupted funding and stocks')};
  };
  GS.licenseTechnology=function(s,from,to,techId){
    const seller=GS.country(s,from),buyer=GS.country(s,to),t=lookup(techId);
    if(!alive(seller)||!alive(buyer)||from===to||!t)return{ok:false,message:'Choose two different active countries and a valid technology.'};
    const sr=ensure(seller),br=ensure(buyer);
    if(!sr.adopted.includes(techId))return{ok:false,message:'The supplier has not field-adopted this technology.'};
    if(br.adopted.includes(techId)||br.licenses.some(l=>l.tech===techId))return{ok:false,message:'This design is already adopted or licensed.'};
    const relation=GS.rel(s,from,to);
    if(GS.atWar(s,from,to)||relation?.sanctions?.length||(relation?.trust??50)<35||(relation?.opinion??0)<-30)return{ok:false,message:'War, export restrictions or diplomatic distrust prevent this license.'};
    if(t.branch==='strategic'&&!relation?.alliance)return{ok:false,message:'Strategic designs require an alliance before export.'};
    const price=Math.round(75+t.cost*1.1),fee=Math.round(t.cost*.18);
    if(buyer.treasury<price)return{ok:false,message:`The license needs ${price} treasury; funds are insufficient.`};
    const queued=GS.queueResearch(s,to,techId);
    if(!queued.ok&&!br.active.some(a=>a.tech===techId)&&!br.queue.some(q=>q.tech===techId))return queued;
    buyer.treasury-=price;seller.treasury+=price;br.licenses.push({tech:techId,from,day:s.day,price,royalty:fee,paid:false});
    const progress={stage:2,points:t.cost*FRACTIONS[2]*.35,target:t.cost*FRACTIONS[2],rollout:0,failures:0,knowledge:25,licensedFrom:from,prototypeResolved:true};
    const active=br.active.find(a=>a.tech===techId);
    if(active){if(active.stage<2||(active.stage===2&&active.points<progress.points))Object.assign(active,progress);else active.licensedFrom=from;}
    br.progress[techId]={...progress};
    if(relation)relation.aid=(relation.aid||0)+price*.05;
    note(s,buyer,`${seller.short||seller.name} licensed ${t.name}. Foundations, local engineering and adoption still require investment.`);
    return{ok:true,message:`License purchased for ${price}. Theory and prototype knowledge transferred; local foundations and rollout remain.`,price};
  };
  GS.gainResearchFragment=function(s,cid,techId,amount=15){
    const c=GS.country(s,cid),t=lookup(techId);if(!alive(c)||!t)return{ok:false,message:'No usable technical evidence.'};const r=ensure(c);
    if(r.adopted.includes(techId))return{ok:false,message:'This evidence concerns an already adopted design.'};
    const insight=bounded(amount,1,40),p=r.progress[techId]||{stage:0,points:0,rollout:0,knowledge:0,failures:0};
    p.knowledge=Math.min(60,(p.knowledge||0)+insight);r.progress[techId]=p;r.fragments[techId]=(r.fragments[techId]||0)+insight;
    const a=r.active.find(x=>x.tech===techId);if(a)a.knowledge=p.knowledge;
    note(s,c,`Technical fragments improve knowledge of ${t.name}; no field equipment is unlocked.`);
    return{ok:true,message:'Technical fragments improve future engineering rate; development and adoption are still required.'};
  };
  GS.researchAI=function(s,cid){
    const c=GS.country(s,cid);if(!alive(c))return;const r=ensure(c);
    if(r.queue.length>=Math.max(3,r.institutions.length*2))return;
    const existing=new Set([...r.active.map(a=>a.tech),...r.queue.map(q=>typeof q==='string'?q:q.tech),...r.adopted]);
    const needs={logistics:2,industry:1.3,medicine:.9,administration:.8,agriculture:.8,energy:.8,doctrine:1};
    needs[r.focus]=(needs[r.focus]||.4)+2.4;
    if((c.stock?.food||0)<200)needs.agriculture+=2;
    if((c.stock?.fuel||0)<140){needs.energy+=2;needs.motor=1.2;}
    if((c.exhaustion||0)>25)needs.medicine+=2;
    if((c.admin||50)<50)needs.administration+=1.4;
    if((c.corruption||0)>35)needs.administration+=1;
    if(Object.values(c.intel?.reports||{}).some(report=>report.units?.some(u=>['armor','heavy_tank','light_tank','mechanized'].includes(u.type)))){needs.artillery=2.5;needs.infantry=1.8;}
    if(s.wars?.some(w=>w.active&&(w.a===cid||w.b===cid))){needs.doctrine+=1.5;needs.logistics+=1;}
    const candidates=D.techs.filter(t=>!existing.has(t.id)).map(t=>{
      const missing=t.prereqs.filter(p=>!r.adopted.includes(p)).length;
      const score=(needs[t.branch]||.4)*(t.unlock?1.4:1)*(1+t.prereqs.filter(p=>r.adopted.includes(p)).length*.08)/(1+missing*.4)/Math.pow(aheadPenalty(t,s.day),.7)/Math.pow(t.cost/60,.45);
      return{t,score};
    }).sort((a,b)=>b.score-a.score||a.t.id.localeCompare(b.t.id));
    for(const {t} of candidates.slice(0,4)){if(r.queue.length>=r.institutions.length+2)break;GS.queueResearch(s,cid,t.id);}
    if((c.treasury||0)<100)r.funding=.5;else if((c.treasury||0)>1400&&(c.education||0)>65)r.funding=1.25;else r.funding=1;
  };
})(globalThis);
