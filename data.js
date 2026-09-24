(function (root) {
  'use strict';
  const GS = root.GS = root.GS || {};
  const DATA = GS.DATA = {};
  DATA.title = 'Sovereigns at War';
  DATA.governments = {
    parliamentary: { name:'Parliamentary republic', executive:.45, accountability:.9, elections:360, delay:8, repression:.25, succession:'election' },
    presidential: { name:'Presidential republic', executive:.65, accountability:.8, elections:420, delay:5, repression:.35, succession:'election' },
    constitutional_monarchy: { name:'Constitutional crown', executive:.55, accountability:.7, elections:420, delay:6, repression:.4, succession:'dynastic' },
    absolute_monarchy: { name:'Sovereign monarchy', executive:.9, accountability:.2, elections:0, delay:2, repression:.75, succession:'dynastic' },
    military: { name:'Military directorate', executive:.85, accountability:.2, elections:0, delay:2, repression:.85, succession:'officers' },
    one_party: { name:'Party state', executive:.8, accountability:.3, elections:0, delay:3, repression:.85, succession:'committee' },
    revolutionary: { name:'Revolutionary council', executive:.65, accountability:.55, elections:540, delay:4, repression:.65, succession:'council' },
    oligarchy: { name:'Commercial oligarchy', executive:.65, accountability:.4, elections:480, delay:5, repression:.4, succession:'council' },
    personalist: { name:'Personal dictatorship', executive:.95, accountability:.1, elections:0, delay:1, repression:.95, succession:'disputed' },
    coalition: { name:'Provisional coalition', executive:.35, accountability:.75, elections:240, delay:10, repression:.25, succession:'election' },
    federal: { name:'Federal compact', executive:.4, accountability:.9, elections:360, delay:9, repression:.2, succession:'election' },
    emergency: { name:'Emergency administration', executive:.85, accountability:.4, elections:180, delay:2, repression:.7, succession:'restoration' }
  };
  DATA.countries = [
    { id:0,name:'Aurelian Federation',short:'Aurelia',color:'#d4ad60',flag:['#233e61','#dcc276','#efe3c4'],government:'parliamentary',description:'Industrial river towns supply a capable citizen army. A fractious parliament must reconcile its defense pact with powerful labor unions and a dependence on imported oil.',focus:'industry',doctrine:'balanced',starting:{treasury:1400,education:76,admin:77,stability:73,legitimacy:78,corruption:16,manpower:58000},startingTech:['rifle','field_artillery','military_truck','fighter_airframe','machine_tools','depot_accounts','field_telephone'] },
    { id:1,name:'Vardic Crown',short:'Vardia',color:'#b56866',flag:['#7e3542','#e1c19a','#263b44'],government:'constitutional_monarchy',description:'An old crown with a professional staff and anxious landed estates. Armored ambitions strain its mountain railways; royal officers resent parliament watching their promotions.',focus:'armor',doctrine:'maneuver',starting:{treasury:1100,staff:78,education:65,legitimacy:67,stability:65,manpower:63000},startingTech:['rifle','field_artillery','light_tank','military_truck','field_telephone','welded_armor'] },
    { id:2,name:'Cinder Workers Union',short:'Cinder',color:'#a85d43',flag:['#813928','#f3c56b','#493738'],government:'revolutionary',description:'A mobilized industrial union born from a general strike. Worker councils demand a share of wartime decisions while revolutionary officers press to support sympathizers abroad.',focus:'doctrine',doctrine:'mass',starting:{treasury:800,education:57,admin:49,legitimacy:61,stability:58,warSupport:70,manpower:76000},startingTech:['rifle','field_artillery','machine_tools','reserve_manual','field_dressings'] },
    { id:3,name:'Namar Directorate',short:'Namar',color:'#789b76',flag:['#294b40','#c4aa73','#183d43'],government:'military',description:'Oil-rich border plains governed by rival security commands. Fuel exports finance modern weapons, but patronage, weak schools and regional resentment threaten the regime.',focus:'energy',doctrine:'firepower',starting:{treasury:1800,corruption:38,education:40,admin:46,legitimacy:45,stability:57,warSupport:65,manpower:61000},startingTech:['rifle','field_artillery','military_truck','oil_distillation','heavy_shells'] },
    { id:4,name:'Lyr Coast Republic',short:'Lyr',color:'#679baf',flag:['#295d6c','#e5ded0','#ab8050'],government:'oligarchy',description:'A maritime republic whose banks and shipyards profit from neutrality. Merchant houses fear blockade more than invasion and can withdraw political support when trade collapses.',focus:'naval',doctrine:'maritime',starting:{treasury:2300,education:79,admin:80,legitimacy:67,stability:76,corruption:24,manpower:34000},startingTech:['rifle','escort_hull','merchant_hull','submersible_hull','fighter_airframe','depot_accounts','marine_turbines'] },
    { id:5,name:'Kestrel Compact',short:'Kestrel',color:'#9990b3',flag:['#585676','#dcc9a0','#58817e'],government:'federal',description:'Mountain cantons share defense but guard their languages and tax powers. Excellent medicine and local troops compensate for a small army and slow national decisions.',focus:'medicine',doctrine:'defense',starting:{treasury:1200,education:82,health:82,legitimacy:82,stability:79,admin:72,manpower:30000},startingTech:['rifle','mountain_kit','field_dressings','blood_typing','road_survey','defense_depth'] },
    { id:6,name:'Orsan Principality',short:'Orsa',color:'#b09572',flag:['#705a42','#dbc196','#46625d'],government:'absolute_monarchy',description:'A fertile principality with contested royal succession. Grain exports feed the continent; an ambitious officer corps wants the revenues spent on army reform.',focus:'agriculture',doctrine:'defense',starting:{treasury:1000,education:43,health:57,legitimacy:62,stability:62,admin:51,manpower:56000},startingTech:['rifle','crop_selection','grain_silos','reserve_manual','field_telephone'] },
    { id:7,name:'Talven Provisional Union',short:'Talven',color:'#7c9ca1',flag:['#466568','#cec9ad','#916451'],government:'coalition',description:'A young post-imperial coalition holds a vital rail corridor. Rival provinces, displaced families and unpaid veterans make reform urgent; outside powers court its generals.',focus:'administration',doctrine:'irregular',starting:{treasury:650,education:52,admin:42,legitimacy:48,stability:44,corruption:31,manpower:49000},startingTech:['rifle','depot_accounts','civil_register','field_dressings','scout_patrols'] }
  ];
  DATA.terrains = {
    plains:{color:'#626e53',defense:1,move:1,supply:1,visibility:1}, forest:{color:'#3f6657',defense:1.3,move:.72,supply:.75,visibility:.6},
    hills:{color:'#847454',defense:1.25,move:.78,supply:.8,visibility:.8}, mountains:{color:'#888b83',defense:1.65,move:.45,supply:.48,visibility:.55},
    desert:{color:'#b4a27a',defense:.95,move:.8,supply:.55,visibility:1.1}, swamp:{color:'#667569',defense:1.35,move:.42,supply:.42,visibility:.65},
    urban:{color:'#8f8776',defense:1.6,move:.65,supply:1.05,visibility:.55}, coastal:{color:'#8c9b85',defense:1.05,move:.95,supply:1.05,visibility:.9},
    river:{color:'#6b9197',defense:1.45,move:.6,supply:.7,visibility:.9}
  };
  DATA.doctrines = {
    balanced:{name:'Combined services',description:'Preparation and reserves balance casualties against initiative.',retreat:30,initiative:.5,planning:.12,attack:.04,defense:.06,supply:.06,ammo:0,training:.05},
    maneuver:{name:'Mobile initiative',description:'Officers exploit openings and withdraw early; mobile forces consume more fuel and transport.',retreat:40,initiative:.85,planning:.06,attack:.14,defense:-.06,supply:-.06,ammo:.04,training:.12},
    firepower:{name:'Methodical fire support',description:'Patient plans and massed shells trade ammunition for lower close-combat risk.',retreat:32,initiative:.3,planning:.28,attack:.2,defense:.06,supply:-.1,ammo:.25,training:.1},
    defense:{name:'Elastic defense',description:'Local defense, fallback positions and prudent retreats preserve veteran formations.',retreat:43,initiative:.6,planning:.08,attack:-.08,defense:.22,supply:.12,ammo:-.08,training:.08},
    mass:{name:'Mobilized citizen army',description:'Rapid training and broad fronts tolerate losses but cannot ignore supply.',retreat:22,initiative:.35,planning:.1,attack:.12,defense:.02,supply:-.08,ammo:.1,training:-.18},
    irregular:{name:'Distributed resistance',description:'Small formations prioritize local knowledge and survival over direct assaults.',retreat:48,initiative:.9,planning:-.05,attack:-.08,defense:.08,supply:.22,ammo:-.15,training:-.08},
    maritime:{name:'Sea-lane coordination',description:'Escorts, coastal reserves and air reconnaissance protect a trading state.',retreat:38,initiative:.65,planning:.14,attack:0,defense:.08,supply:.15,ammo:.02,training:.14}
  };
  const unit = (name,domain,attack,defense,speed,fuel,ammo,supply,cost,manpower,days,reliability,tech) => ({name,domain,attack,defense,speed,fuel,ammo,supply,cost,manpower,days,reliability,...(tech?{tech}:{})});
  DATA.unitTypes = {
    infantry:unit('Line infantry','land',1,1.15,1,.05,.7,1,90,6000,32,92), militia:unit('Local militia','land',.62,.75,.9,0,.35,.65,40,4200,14,85),
    garrison:unit('Security brigade','land',.55,1.05,.7,.03,.3,.65,55,3600,22,93), cavalry:unit('Mounted scouts','land',.7,.75,1.4,.02,.45,1,70,3600,28,90),
    motorized:unit('Motor infantry','land',1.2,1.1,1.9,1,.85,1.55,145,5800,42,84,'military_truck'),
    mechanized:unit('Mechanized brigade','land',1.7,1.6,1.7,1.6,1.2,2.1,225,5000,60,78,'armored_carriers'),
    light_tank:unit('Light armored group','land',1.5,.95,2,1.4,1,1.8,185,3000,50,81,'light_tank'),
    armor:unit('Medium armored group','land',2.2,1.75,1.55,2,1.55,2.6,290,3600,72,76,'medium_tank'),
    heavy_tank:unit('Heavy breakthrough group','land',2.9,2.5,.8,3.1,2,3.6,420,3200,95,66,'heavy_tank'),
    artillery:unit('Field artillery group','land',1.85,.7,.65,.15,2.2,1.9,160,2800,44,88,'field_artillery'),
    anti_tank:unit('Anti-armor brigade','land',1.2,1.65,.8,.15,1.3,1.35,125,2600,40,89,'antitank_gun'),
    engineers:unit('Combat engineers','land',.95,1.2,1,.2,.6,1.15,115,3000,46,91,'combat_engineers'),
    mountain:unit('Alpine infantry','land',1.05,1.35,1.05,.02,.7,1,115,4500,50,93,'mountain_kit'),
    marines:unit('Marine brigade','land',1.2,1.1,1.1,.1,.9,1.35,145,4000,58,89,'marine_landing'),
    paratroopers:unit('Airborne brigade','land',1.1,1,1.1,.1,.85,1.2,170,3200,68,88,'airborne_training'),
    fighter:unit('Fighter wing','air',1.4,1.3,3.5,1.4,.8,1.8,210,800,60,83,'fighter_airframe'),
    bomber:unit('Bomber wing','air',2,.65,2.5,2.4,2.1,2.7,300,1200,76,78,'bomber_airframe'),
    recon_plane:unit('Reconnaissance wing','air',.45,.8,3.2,.9,.15,1.2,140,500,42,87,'recon_airframe'),
    transport_plane:unit('Transport wing','air',.2,.5,2.6,1.8,.05,2,250,700,66,85,'transport_airframe'),
    naval_bomber:unit('Maritime strike wing','air',1.8,.7,2.9,1.9,1.5,2.1,260,950,68,80,'torpedo_bomber'),
    destroyer:unit('Escort flotilla','naval',1.2,1.2,2,1.6,1.1,2,280,1800,90,88,'escort_hull'),
    submarine:unit('Submarine patrol','naval',1.5,.65,1.5,.9,1.3,1.7,230,650,80,81,'submersible_hull'),
    cruiser:unit('Cruiser squadron','naval',2.3,2,1.7,2.5,2.1,3.2,430,3600,130,87,'cruiser_hull'),
    carrier:unit('Fleet carrier group','naval',2.7,1.45,1.65,3,2.4,4,580,4400,170,79,'carrier_hull'),
    convoy:unit('Merchant convoy','naval',.15,.6,1.1,.9,.1,1.1,150,700,55,92,'merchant_hull')
  };
  const law = (id,name,description,rows) => ({id,name,category:id,description,options:rows.map(([key,title,desc,effects])=>({id:key,name:title,description:desc,effects}))});
  DATA.laws = [
    law('mobilization','Service obligation','Recruitment competes with skilled civilian labor.',[
      ['volunteer','Volunteer service','Preserve civilian workers; fewer recruits and longer training.',{manpower:-.15,training:.12,approval:.06}],
      ['selective','Selective service','Call eligible reservists while protecting skilled trades.',{manpower:.18,production:-.04,approval:-.02}],
      ['universal','Universal levy','Broaden call-up at the cost of factory labor and cohesion.',{manpower:.48,production:-.16,food:-.1,training:-.12,approval:-.12}]]),
    law('tax','Revenue code','Tax compliance depends on legitimacy and administration.',[
      ['low_tax','Light taxation','Leave disposable income with households while weakening revenue.',{tax:-.2,consumption:.08,approval:.08}],
      ['progressive','Graduated taxation','Collect ordinary revenue with a modest compliance burden.',{tax:.08,approval:.02}],
      ['war_levy','Emergency war levy','Extract revenue now; purchasing power and elite loyalty suffer.',{tax:.35,approval:-.12,corruption:.04}]]),
    law('censorship','Public information','Controlling news never prevents rumors or refugee testimony.',[
      ['free_press','Independent press','Open reporting improves credibility and intelligence, exposing bad news.',{legitimacy:.12,intelligence:.08,repression:-.08}],
      ['reviewed_press','Operational review','Delay military detail while retaining ordinary criticism.',{command:-.02,stability:.03,legitimacy:-.02}],
      ['state_press','State information monopoly','Suppress immediate dissent; officials increasingly conceal failures.',{repression:.2,stability:.06,intelligence:-.14,legitimacy:-.14,corruption:.05}]]),
    law('rationing','Civilian allocation','Rations stretch stocks but weaken health and purchasing power.',[
      ['open_market','Unrestricted supply','Households draw ordinary food, goods and fuel.',{consumption:.1,approval:.07}],
      ['fair_rations','Fair ration books','Share limited supplies with administrative cost.',{consumption:-.12,tax:-.04,approval:-.02}],
      ['military_priority','Military priority','Preserve reserves at a serious cost to civilian living standards.',{consumption:-.3,approval:-.16,health:-.12,corruption:.09}]]),
    law('labor','Industrial relations','Treatment of workers affects output and radicalization.',[
      ['bargaining','Collective bargaining','Protect labor voice; negotiated hours lower immediate output.',{approval:.12,legitimacy:.08,production:-.06}],
      ['mixed_labor','Protected essential labor','Expand employment while retaining workplace safeguards.',{production:.05,health:.02}],
      ['directed_labor','Directed emergency labor','Long compulsory shifts raise output and industrial illness.',{production:.19,health:-.15,approval:-.16,repression:.1}]]),
    law('military','Procurement standard','Quantity, quality and industrial learning compete.',[
      ['quality','Rigorous acceptance trials','Reject defects; reliable equipment takes longer to make.',{production:-.12,reliability:.19,training:.07}],
      ['standard','Standard procurement','Common components ease repair and stock accounting.',{standardization:.13,reliability:.03}],
      ['emergency_output','Emergency mass output','Rush weapons from factories with more defects and accidents.',{production:.25,reliability:-.22,training:-.08}]]),
    law('security','Domestic policing','Coercion can silence dissent while feeding its causes.',[
      ['community','Community constabulary','Local trust helps solve unrest, with less plot surveillance.',{legitimacy:.12,approval:.05,counterintelligence:-.06,repression:-.1}],
      ['professional','Professional security service','Court-supervised investigation balances security and trust.',{counterintelligence:.1,tax:-.03}],
      ['secret_police','Political secret police','Detect conspiracies at high cost in trust and honest reports.',{counterintelligence:.3,repression:.3,legitimacy:-.18,intelligence:-.09,corruption:.05}]]),
    law('trade','Trade regime','Markets expose the country to interdependence and blockade.',[
      ['open_trade','Open commercial exchange','Cheaper contracts and scientific exchange; higher consumption.',{trade:.2,research:.07,consumption:.05}],
      ['managed_trade','Strategic licensing','Protect essential imports with moderate customs administration.',{trade:.02,standardization:.06}],
      ['autarky','Closed strategic economy','Domestic industry gains preference while imports become expensive.',{trade:-.3,production:.08,research:-.12,approval:-.05}]]),
    law('occupation','Occupation charter','Conquered land requires administrators and political consent.',[
      ['civilian','Civilian trusteeship','Restore local government and services; extract less output.',{occupation:-.12,legitimacy:.09,repression:-.08}],
      ['collaboration','Local collaboration councils','Share revenues with local partners to improve compliance.',{occupation:.06,tax:-.03}],
      ['extraction','Military extraction charter','Requisition resources while increasing resistance and isolation.',{occupation:.25,repression:.16,legitimacy:-.2,approval:-.07}]]),
    law('rights','Political participation','Who can organize and challenge the state?',[
      ['pluralism','Equal political rights','Independent institutions improve legitimacy and candid analysis.',{legitimacy:.17,research:.07,intelligence:.04}],
      ['limited_rights','Restricted franchise','Retain constitutional channels for a narrower constituency.',{legitimacy:.02,stability:.03}],
      ['emergency_ban','Emergency party prohibitions','Reduce open organizing while creating radical underground groups.',{repression:.24,legitimacy:-.2,approval:-.09,research:-.08}]]),
    law('health','Public health service','Hospitals compete with procurement for revenue and staff.',[
      ['local_health','Local charitable clinics','Low public cost leaves preventable illness untreated.',{tax:.05,health:-.12,medical:-.06}],
      ['public_health','National sanitation service','Public clinics sustain labor and disease prevention.',{health:.12,medical:.06,tax:-.07}],
      ['universal_health','Universal recovery service','Support civilian care, field hospitals and veteran rehabilitation.',{health:.24,medical:.15,stressRecovery:.12,tax:-.18}]]),
    law('education','Knowledge institutions','Education provides capacity slowly and cannot be improvised in war.',[
      ['basic_schools','Basic district schooling','Protect a minimum system at low fiscal cost.',{education:-.06,tax:.03}],
      ['technical_schools','Technical scholarships','Build engineering skill and professional administration.',{education:.12,research:.09,tax:-.07}],
      ['open_universities','Independent national universities','Academic freedom and extensive funding increase innovation.',{education:.23,research:.19,legitimacy:.08,tax:-.17}]]),
    law('finance','Monetary mandate','Fiscal rules determine how shortages are financed.',[
      ['sound_money','Reserve-backed finance','Restrain debt service and prices at the cost of public spending.',{tax:.06,production:-.04,consumption:-.04}],
      ['managed_credit','Managed public credit','Invest through supervised public borrowing.',{production:.04,construction:.07,tax:-.05}],
      ['directed_credit','Directed emergency credit','Subsidized procurement accelerates output and patronage.',{production:.13,construction:.12,tax:-.15,corruption:.11}]]),
    law('administration','Civil service charter','Appointments set competence against political control.',[
      ['merit_service','Merit examinations','Professional staffing improves execution but threatens patronage.',{tax:.1,construction:.08,research:.05,corruption:-.16}],
      ['mixed_service','Coalition appointments','Share administration among partners with modest inefficiency.',{approval:.04,corruption:.03}],
      ['loyal_service','Loyalty appointments','Personal control of offices encourages waste and unreliable reports.',{repression:.12,corruption:.2,intelligence:-.15,research:-.12}]]),
  ];
  const traits = rows => rows.map(([id,name,description,effects])=>({id,name,description,effects}));
  DATA.commanderTraits = traits([
    ['logistician','Quartermaster instinct','Prioritizes depots before advancing.',{supply:.15,attack:-.03}],['bold','Bold spearhead','Exploits openings but spends shells rapidly.',{attack:.13,ammoEfficiency:-.07}],
    ['cautious','Prudent survivor','Builds fallback lines and avoids attrition.',{defense:.13,speed:-.05}],['mentor','Veteran mentor','Preserves cadres and trains replacements.',{training:.16,command:.03}],
    ['inspiring','Trusted under fire','Personal contact steadies exhausted troops.',{morale:.12,stressRecovery:.08}],['engineer','Engineer officer','Understands bridges and fortification weak points.',{engineering:.18,construction:.04}],
    ['mountaineer','High-country veteran','Selects mountain routes and compact supplies.',{speed:.05,supply:.08}],['scout','Patient reconnaissance','Waits for corroborated patrol reports.',{recon:.18,planning:.06}],
    ['artillerist','Artillery coordinator','Masses fire at a substantial ammunition cost.',{attack:.14,ammoEfficiency:-.12}],['mobile','Mobile staff','Keeps columns moving without losing orders.',{speed:.15,command:.07}],
    ['economical','Economical planner','Conserves fuel and shells through disciplined missions.',{fuelEfficiency:.1,ammoEfficiency:.1}],['mechanic','Workshop organizer','Maintains recovery crews close to the front.',{reliability:.12,salvage:.13}],
    ['medic','Evacuation advocate','Protects casualty routes and aid stations.',{medical:.17,supply:-.03}],['rotator','Rotation specialist','Insists on leave and rest cycles.',{stressRecovery:.18,morale:.05}],
    ['siege','Siege planner','Surveys strongpoints instead of rushing them.',{planning:.15,engineering:.1,speed:-.05}],['winter','Winter campaigner','Prepares shelter and transport before snow.',{supply:.1,reliability:.08}],
    ['naval','Sea-lane guardian','Coordinates patrols and convoy cover.',{navalPower:.12,convoyProtection:.14}],['aviator','Air coordinator','Balances sortie load against ground crew limits.',{airPower:.13,sortie:.1}],
    ['submariner','Silent hunter','Reads contact reports before committing torpedoes.',{detection:.18,navalPower:.08}],['amphibious','Landing planner','Rehearses beach parties and port supply.',{amphibious:.24,planning:.05}],
    ['delegator','Mission commander','Trusts intent and local initiative.',{command:.18,planning:-.04}],['centralizer','Central staff control','Detailed plans produce slower reactions.',{planning:.18,command:-.1}],
    ['disciplinarian','Strict disciplinarian','Inspections preserve order but harden tensions.',{morale:-.04,reliability:.1,defense:.08}],['empathetic','Soldiers advocate','Hears complaints before they become mutiny.',{morale:.1,stressRecovery:.12}],
    ['political','Political favorite','Strong access to procurement hides weak field judgment.',{production:.04,attack:-.07,planning:-.07}],['rivalrous','Service rival','Competes for honors at the cost of coordination.',{attack:.08,command:-.13}],
    ['improviser','Field improviser','Repurposes captured kit, complicating maintenance.',{salvage:.2,standardization:-.1}],['methodical','Methodical staffwork','Keeps accurate manifests and operation schedules.',{planning:.14,supply:.06}],
    ['reckless','Reckless glory seeker','Drives attacks beyond preparation and recovery.',{attack:.17,defense:-.13,reliability:-.07}],['reserved','Defensive reserve keeper','Holds disciplined forces back for counterattack.',{defense:.14,attack:-.04}],
    ['signals','Signals officer','Coordinates radio nets and short orders.',{command:.18,recon:.07}],['camouflage','Concealment expert','Uses dummy positions and careful dispersal.',{defense:.1,recon:.08}],
    ['tired','Worn by command','Experience survives while fatigue slows decisions.',{planning:.08,command:-.1,stressRecovery:-.08}],['professional','Nonpartisan professional','Preserves standards when governments change.',{training:.08,morale:.07}]
  ]);
  DATA.politicalTraits = traits([
    ['conciliator','Coalition conciliator','Maintains compromise and voluntary compliance.',{legitimacy:.08,stability:.06}],['demagogue','Mass orator','Mobilizes emotion while discouraging candid criticism.',{approval:.1,intelligence:-.06}],
    ['technocrat','Administrative technocrat','Coordinates resources with little patience for patronage.',{production:.07,tax:.07,corruption:-.06}],['reformer','Institutional reformer','Builds lawful continuity and professional services.',{legitimacy:.09,corruption:-.08}],
    ['patron','Patronage broker','Buys dependable support through favored contracts.',{stability:.06,corruption:.13,tax:-.07}],['austere','Austere treasurer','Protects revenue while limiting public consumption.',{tax:.12,approval:-.06}],
    ['educator','Education advocate','Protects universities through budget crises.',{research:.1,education:.12,tax:-.05}],['humanitarian','Public welfare advocate','Prioritizes health and civilian recovery.',{health:.14,approval:.06,tax:-.07}],
    ['industrialist','Industrial organizer','Strengthens procurement networks and factory learning.',{production:.12,construction:.07}],['agrarian','Rural organizer','Understands harvest schedules and village credit.',{food:.16,approval:.04}],
    ['trader','Commercial negotiator','Maintains reliable contracts and foreign contacts.',{trade:.18,intelligence:.04}],['isolationist','Guarded nationalist','Protects domestic suppliers while limiting exchange.',{production:.06,trade:-.15,research:-.04}],
    ['hawk','Security hawk','Presses for reserves and more intrusive investigation.',{manpower:.12,repression:.1,approval:-.05}],['dove','Settlement advocate','Defends negotiations and civic legitimacy.',{legitimacy:.1,trade:.07,manpower:-.06}],
    ['spymaster','Intelligence coordinator','Integrates reports across competing agencies.',{intelligence:.16,counterintelligence:.08}],['paranoid','Suspicious inner circle','Detects some plots but punishes inconvenient reports.',{counterintelligence:.14,intelligence:-.16,repression:.12}],
    ['lawyer','Constitutional jurist','Insists on legal continuity and court supervision.',{legitimacy:.13,corruption:-.06,repression:-.08}],['autocrat','Executive centralizer','Forces rapid compliance at an institutional cost.',{repression:.17,construction:.06,legitimacy:-.1}],
    ['unionist','Labor negotiator','Resolves workplace grievances through representation.',{approval:.11,health:.04,production:-.04}],['mobilizer','Workforce mobilizer','Expands industrial participation with fiscal support.',{production:.09,manpower:.07,tax:-.05}],
    ['chemist','Industrial chemist','Connects fuel research and production plants.',{fuel:.12,research:.05}],['engineer','Infrastructure planner','Coordinates rail, power and public works.',{construction:.15,transport:.07}],
    ['statistician','Candid statistician','Improves estimates and exposes waste.',{intelligence:.07,tax:.07,corruption:-.1}],['propagandist','Image manager','Strong public messaging slowly substitutes for honest reporting.',{approval:.08,intelligence:-.09}],
    ['federalist','Regional mediator','Makes local administration legitimate and responsive.',{legitimacy:.1,occupation:-.06,stability:.05}],['centralist','Provincial centralizer','Extracts regional revenue with heavier political pressure.',{tax:.12,occupation:.1,approval:-.08}],
    ['meritocrat','Merit patron','Protects competent appointments and technical promotion.',{research:.08,training:.07,corruption:-.09}],['crony','Court favorite','Routes resources to loyal friends and symbolic projects.',{corruption:.18,production:-.08}],
    ['resilient','Crisis mediator','Maintains confidence through prolonged pressure.',{stability:.12,stressRecovery:.05}],['venal','Private profiteer','Treats shortages as opportunities for private gain.',{corruption:.2,tax:-.12}],
    ['internationalist','Scientific internationalist','Welcomes specialists and technical exchange.',{research:.11,trade:.09,education:.04}],['security_reformer','Accountable investigator','Professional counterintelligence protects institutions.',{counterintelligence:.14,legitimacy:.05}],
    ['veteran_advocate','Veterans minister','Makes rehabilitation and reintegration politically visible.',{medical:.1,stressRecovery:.15,approval:.04,tax:-.06}],['procurement_auditor','Procurement auditor','Checks stores and contracts against field reports.',{standardization:.1,reliability:.08,corruption:-.12}]
  ]);
  DATA.branches = [
    ['infantry','Infantry equipment','#c9b279'],['artillery','Fire support','#c98965'],['armor','Armor and mechanization','#90a881'],['motor','Motor transport','#b99f70'],
    ['aviation','Aviation','#71a8c0'],['naval','Naval engineering','#678fba'],['communications','Signals and electronics','#a395c2'],['computing','Computing and ciphers','#a47cab'],
    ['logistics','Logistics and maintenance','#b8ae79'],['medicine','Medicine and recovery','#70b39c'],['industry','Industry and materials','#bd936f'],['energy','Energy and fuel','#d0aa60'],
    ['engineering','Civil engineering','#a4a288'],['agriculture','Food systems','#97b976'],['intelligence','Intelligence craft','#8b93b0'],['doctrine','Military doctrine','#be847f'],
    ['administration','State administration','#b2a5c0'],['strategic','Strategic science','#cc908c']
  ].map(([id,name,color])=>({id,name,color}));
  DATA.techs = [];
  // Each line defines a distinct design, its material foundations, and its operating consequence.
  const add = (branch,rows) => rows.forEach(([id,name,era,cost,prereqs,description,effects,unlock]) => DATA.techs.push({id,name,branch,era,cost,prereqs:prereqs?prereqs.split(' '):[],description,effects,...(unlock?{unlock}:{})}));
  add('infantry',[
    ['rifle','Standard service rifle',1934,45,'','Common ammunition and simple actions sustain the citizen infantry.',{attack:.035,standardization:.04}],
    ['section_lmg','Section light machine gun',1936,70,'rifle','Organic suppressive fire consumes more ammunition.',{attack:.07,ammoEfficiency:-.025}],
    ['crew_mg','Crew-served machine gun',1936,70,'rifle','Prepared teams strengthen defensive positions but carry heavy stores.',{defense:.08,supply:-.02}],
    ['hand_grenades','Safe fragmentation grenades',1936,55,'rifle','Reliable fuzes strengthen close assault and demand careful training.',{attack:.04,reliability:.02}],
    ['combat_webbing','Load-bearing field equipment',1936,55,'rifle','Distribute carried food and tools to reduce marching exhaustion.',{supply:.05,stressRecovery:.02}],
    ['mountain_kit','Alpine load and climbing kit',1936,65,'combat_webbing','Special packs and cold-weather equipment equip mountain formations.',{supply:.04},'mountain'],
    ['sniper_optics','Field observation optics',1937,80,'rifle optical_glass','Trained observers identify targets without exposing whole patrols.',{recon:.06,attack:.02}],
    ['semiauto_rifle','Self-loading service rifle',1937,100,'rifle machine_tools','Higher practical fire rate raises ammunition demand and factory complexity.',{attack:.1,ammoEfficiency:-.04,reliability:-.015}],
    ['squad_mortar','Portable squad mortar',1937,85,'section_lmg shell_fuzes','Indirect fire reaches cover while adding carried ammunition.',{attack:.06,defense:.02,supply:-.015}],
    ['antitank_rifle','Infantry anti-armor rifle',1937,85,'rifle hardened_steel','Cheap heavy rifles contest light armor without motor transport.',{defense:.07,attack:.02}],
    ['winter_clothing','Layered winter clothing',1937,70,'combat_webbing textile_standards','Dry layered clothing protects endurance during exposed operations.',{stressRecovery:.05,reliability:.025}],
    ['assault_weapon','Compact automatic weapon',1938,120,'semiauto_rifle section_lmg','Compact weapons support urban assaults at high ammunition cost.',{attack:.09,ammoEfficiency:-.05}],
    ['shaped_charge','Shoulder-fired shaped charge',1939,145,'antitank_rifle explosive_chemistry','Portable shaped charges give infantry a close-range answer to armor.',{defense:.12,attack:.035}],
    ['night_sights','Active night observation kit',1941,210,'sniper_optics compact_valves','Illuminators and trained scouts extend reconnaissance into darkness.',{recon:.12,command:.025}],
    ['combined_squad','Integrated infantry section',1942,250,'assault_weapon squad_mortar tactical_network small_unit_command','Radio-led sections coordinate automatic weapons and mortars; adoption retrains cadres.',{attack:.13,defense:.08,command:.08,ammoEfficiency:-.03}]
  ]);
  add('artillery',[
    ['field_artillery','Recoil field gun',1934,55,'','Reliable recoil mechanisms equip a mobile field artillery arm.',{attack:.035},'artillery'],
    ['shell_fuzes','Standard shell fuzes',1936,60,'field_artillery','Safe, consistent fuzes reduce duds and ammunition waste.',{ammoEfficiency:.06,reliability:.035}],
    ['heavy_shells','Heavy howitzer ammunition',1936,70,'field_artillery','Large shells suppress strongpoints but strain depots.',{attack:.075,ammoEfficiency:-.04}],
    ['antitank_gun','Towed high-velocity gun',1936,85,'field_artillery hardened_steel','Specialist gun crews contest armored corridors.',{defense:.035},'anti_tank'],
    ['antiair_gun','Automatic air-defense cannon',1937,90,'field_artillery section_lmg','Rapid traversing weapons protect field forces against aircraft.',{defense:.04,airPower:.04,ammoEfficiency:-.025}],
    ['artillery_tractor','Standard gun tractor',1937,85,'field_artillery military_truck','Tow heavier guns at marching pace while consuming motor fuel.',{speed:.04,attack:.025,fuelEfficiency:-.025}],
    ['forward_observers','Forward observer teams',1937,80,'field_artillery field_telephone','Observers correct fire and reduce shell expenditure.',{attack:.06,ammoEfficiency:.05,planning:.03}],
    ['survey_battery','Survey and sound-ranging battery',1937,95,'forward_observers optical_glass','Survey teams locate hostile batteries from sound and flash.',{recon:.07,planning:.05}],
    ['explosive_chemistry','Controlled explosive chemistry',1937,100,'shell_fuzes chemical_plants','Consistent propellants improve shell effects at industrial cost.',{attack:.07,reliability:.035}],
    ['long_barrel','Long-barrel field cannon',1938,135,'antitank_gun precision_boring','High velocity extends effective fire but accelerates barrel wear.',{attack:.11,reliability:-.035}],
    ['rocket_battery','Area rocket battery',1939,160,'rocket_motor heavy_shells','Massed rocket salvos provide shock with poor ammunition economy.',{attack:.14,ammoEfficiency:-.09,reliability:-.025},'rocket_artillery'],
    ['selfpropelled_gun','Self-propelled field gun',1939,180,'medium_tank artillery_tractor','Protected mobile guns follow armored formations at higher maintenance cost.',{attack:.1,speed:.035,reliability:-.025},'selfpropelled_artillery'],
    ['fire_control','Electromechanical fire director',1940,190,'analog_computer survey_battery','A dedicated director coordinates batteries against moving targets.',{attack:.1,ammoEfficiency:.08}],
    ['proximity_fuze','Radio proximity fuze',1942,250,'compact_valves explosive_chemistry radar_sets','Electronic fuzes improve air defense and demand quality electronics.',{airPower:.12,defense:.08,reliability:-.02}],
    ['radar_heavy_aa','Radar-directed heavy AA',1943,280,'fire_control proximity_fuze tracking_radar','Radar, computation and heavy guns form an integrated defense network.',{airPower:.17,defense:.08,detection:.13}]
  ]);
  add('armor',[
    ['tracked_testbed','Tracked vehicle testbed',1934,65,'','Trials establish the maintenance requirements of tracked combat machines.',{reliability:.025}],
    ['light_tank','Light reconnaissance tank',1936,90,'tracked_testbed petrol_engine','A fast light tank creates a new reconnaissance and exploitation force.',{recon:.025},'light_tank'],
    ['welded_armor','Welded armor structure',1936,80,'tracked_testbed hardened_steel','Welded seams reduce weight, requiring trained factory crews.',{defense:.055,reliability:.025}],
    ['wide_tracks','Wide track and suspension set',1937,95,'tracked_testbed','Weight distribution improves cross-country mobility and workshop demands.',{speed:.05,reliability:.03}],
    ['turret_ergonomics','Three-person turret layout',1937,100,'light_tank','Separate command and loading duties improve reaction under stress.',{command:.055,attack:.035}],
    ['diesel_powerpack','Vehicle diesel powerpack',1937,110,'petrol_engine oil_distillation','Efficient engines reduce fire risk but complicate early tooling.',{fuelEfficiency:.08,reliability:.03}],
    ['medium_tank','Balanced medium tank',1938,165,'light_tank welded_armor turret_ergonomics antitank_gun','A coordinated design combines protection, cannon and practical crew layout.',{attack:.035},'armor'],
    ['armored_carriers','Armored personnel carriers',1938,140,'military_truck welded_armor','Protected troop carriers enable mechanized units and raise parts demand.',{defense:.025},'mechanized'],
    ['tank_radio','Armored intercom and radio',1938,115,'light_tank portable_radio','Vehicle commanders communicate through noise and movement.',{command:.08,planning:.03}],
    ['heavy_tank','Heavy breakthrough tank',1939,200,'medium_tank hardened_steel high_output_engine','Thick armor opens fortified fronts but costs fuel, transport and reliability.',{defense:.06,fuelEfficiency:-.05,reliability:-.04},'heavy_tank'],
    ['wet_stowage','Protected ammunition stowage',1939,130,'medium_tank shell_fuzes','Separate ammunition stowage reduces catastrophic crew losses.',{medical:.06,reliability:.05}],
    ['recovery_tank','Armored recovery tractor',1939,145,'medium_tank mobile_workshop','Winches and armored recovery crews return disabled vehicles to workshops.',{salvage:.15,reliability:.04}],
    ['torsion_suspension','Advanced torsion suspension',1940,170,'wide_tracks precision_boring','Suspension handles heavier vehicles without sacrificing road endurance.',{speed:.08,reliability:.06}],
    ['gun_stabilizer','Stabilized cannon mounting',1941,210,'medium_tank analog_computer precision_boring','Gyroscopic mounts shorten aiming delays while requiring specialist mechanics.',{attack:.1,command:.05,reliability:-.03}],
    ['advanced_medium','Integrated late medium tank',1942,280,'medium_tank gun_stabilizer high_output_engine tank_radio torsion_suspension','Converging powertrain, armor, radio and sights create an effective but expensive fleet.',{attack:.13,defense:.1,speed:.04,fuelEfficiency:-.035},'advanced_armor']
  ]);
  add('motor',[
    ['petrol_engine','Reliable petrol engine',1934,50,'','Standard engine service schedules establish motor transport capacity.',{fuelEfficiency:.025,reliability:.02}],
    ['military_truck','Military cargo truck',1936,70,'petrol_engine','A common cargo chassis enables motor infantry and transport columns.',{transport:.04},'motorized'],
    ['truck_standard','Standard fleet components',1936,75,'military_truck interchangeable_parts','Shared filters, bolts and tires reduce the burden of mixed fleets.',{standardization:.1,reliability:.04}],
    ['allterrain_drive','All-terrain driveline',1937,95,'military_truck hardened_steel','Driven axles improve rough-road movement at higher fuel cost.',{speed:.07,fuelEfficiency:-.025}],
    ['fuel_tanker','Protected fuel tanker',1937,80,'military_truck','Baffled tanks and transfer pumps reduce fuel handling losses.',{fuelEfficiency:.06,transport:.04}],
    ['mobile_workshop','Mobile workshop trucks',1937,100,'truck_standard machine_tools','Repair crews travel with columns rather than waiting at distant depots.',{reliability:.08,salvage:.08}],
    ['high_output_engine','High-output liquid-cooled engine',1938,130,'petrol_engine precision_boring','Better cooling and machining raise power with a maintenance tradeoff.',{speed:.08,reliability:-.02}],
    ['ambulance_motor','Motor ambulance corps',1937,100,'military_truck field_surgery','Dedicated vehicles speed evacuation along functioning supply routes.',{medical:.09,transport:-.015}],
    ['bridging_lorry','Mobile bridging train',1938,130,'military_truck combat_engineers','Transported bridge sections shorten river delays and consume heavy lift.',{engineering:.12,transport:-.025}],
    ['snow_tractor','Winter tractor conversion',1938,115,'allterrain_drive winter_clothing','Specialized tracks and insulation keep supply moving in snow.',{reliability:.065,supply:.035}],
    ['desert_filters','Desert filtration package',1938,105,'allterrain_drive','Sealed air intakes protect engines against dust at a small power cost.',{reliability:.07,speed:-.015}],
    ['heavy_transporter','Heavy equipment transporter',1939,150,'high_output_engine truck_standard','Tank carriers reduce track wear while consuming road capacity.',{reliability:.07,salvage:.06,transport:.05}],
    ['diesel_standard','Standard diesel vehicle fleet',1940,170,'diesel_powerpack truck_standard','Fleet-wide engine commonality improves fuel economy and parts compatibility.',{fuelEfficiency:.1,standardization:.12}],
    ['modular_truck','Modular cargo chassis',1941,195,'heavy_transporter assembly_lines','Interchangeable bodies support tankers, workshops and cargo without separate fleets.',{transport:.1,standardization:.08}],
    ['integrated_convoys','Coordinated motor columns',1942,225,'modular_truck mobile_command logistics_computer','Radio scheduling and inventory forecasts turn vehicle numbers into usable throughput.',{transport:.13,supply:.08,command:.035}]
  ]);
  add('aviation',[
    ['airframe_methods','Stressed-skin airframe methods',1934,65,'','Structural trials establish modern airframe production.',{airPower:.025,reliability:.02}],
    ['fighter_airframe','Monoplane fighter airframe',1936,95,'airframe_methods petrol_engine','A dedicated fighter wing contests airspace and intercepts bombers.',{airPower:.035},'fighter'],
    ['recon_airframe','Photographic reconnaissance aircraft',1936,85,'airframe_methods optical_glass','Camera-carrying aircraft generate wider, uncertain intelligence reports.',{recon:.04},'recon_plane'],
    ['bomber_airframe','Twin-engine bomber airframe',1937,125,'airframe_methods high_output_engine','Bombers reach industry and rail but demand fuel and trained aircrew.',{airPower:.025},'bomber'],
    ['transport_airframe','Heavy transport airframe',1937,120,'airframe_methods high_output_engine','Cargo aircraft enable air transport at high fuel and airfield cost.',{transport:.04},'transport_plane'],
    ['variable_propeller','Variable-pitch propeller',1937,95,'fighter_airframe precision_boring','Variable pitch improves climb and cruising efficiency.',{airPower:.065,fuelEfficiency:.035}],
    ['pilot_survival','Pilot survival and rescue',1937,85,'fighter_airframe field_dressings','Survival equipment and rescue training preserve experienced pilots.',{medical:.06,airPower:.02}],
    ['supercharged_engine','Two-stage aircraft supercharger',1938,145,'high_output_engine high_octane','High-altitude engines extend capability but increase maintenance.',{airPower:.11,reliability:-.03}],
    ['torpedo_bomber','Maritime strike airframe',1938,150,'bomber_airframe torpedo_gyroscope','Naval attack aircraft threaten convoys and exposed fleets.',{navalPower:.035},'naval_bomber'],
    ['close_support','Armored ground-support cockpit',1938,130,'fighter_airframe welded_armor forward_observers','Specialist attack crews coordinate close support with ground observers.',{airPower:.07,attack:.025}],
    ['air_navigation','Radio approach and navigation',1939,150,'bomber_airframe direction_finding','Beacon navigation improves sortie completion in poor visibility.',{sortie:.1,reliability:.025}],
    ['drop_tanks','Jettisonable external fuel tanks',1939,135,'fighter_airframe fuel_tanker','External tanks extend escort endurance at added fuel and maintenance cost.',{airPower:.08,fuelEfficiency:-.025}],
    ['airborne_training','Airborne operations school',1939,175,'transport_airframe small_unit_command','Specialist formations train for dispersed landings and isolated supply.',{planning:.03},'paratroopers'],
    ['pressurized_airframe','Pressurized long-range bomber',1941,230,'bomber_airframe supercharged_engine air_navigation','High-altitude airframes increase strategic reach at substantial workshop burden.',{airPower:.14,sortie:-.025,reliability:-.035}],
    ['jet_airframe','Operational turbine fighter',1944,320,'turbine_research heat_resistant_alloy radar_sets','Jet propulsion requires metallurgy, electronics and a new maintenance culture.',{airPower:.22,fuelEfficiency:-.08,reliability:-.055},'jet_fighter']
  ]);
  add('naval',[
    ['marine_turbines','Marine turbine machinery',1934,65,'','Efficient ship machinery supports sustained coastal patrols.',{fuelEfficiency:.025,navalPower:.025}],
    ['merchant_hull','Standard merchant hull',1934,60,'marine_turbines','Purpose-built cargo hulls create replenishable merchant convoys.',{transport:.03},'convoy'],
    ['escort_hull','Ocean escort hull',1936,95,'marine_turbines','Specialist escorts protect merchant shipping and patrol coast sectors.',{convoyProtection:.035},'destroyer'],
    ['submersible_hull','Patrol submarine hull',1936,100,'marine_turbines','Submersible patrols contest trade through concealment and torpedo attacks.',{detection:.025},'submarine'],
    ['torpedo_gyroscope','Gyroscopic torpedo control',1937,105,'submersible_hull precision_boring','Improved course control raises torpedo effectiveness.',{navalPower:.075,ammoEfficiency:.025}],
    ['hydrophones','Passive hydrophone arrays',1937,95,'escort_hull compact_valves','Sound contacts improve submarine detection without exact positions.',{detection:.12,convoyProtection:.04}],
    ['cruiser_hull','Protected cruiser hull',1937,145,'escort_hull welded_armor','Larger surface groups project sea control at considerable fuel cost.',{navalPower:.035},'cruiser'],
    ['watertight_drills','Watertight damage-control system',1937,95,'escort_hull','Compartment design and practiced crews keep damaged ships afloat.',{reliability:.065,navalPower:.03}],
    ['landing_craft','Purpose-built landing craft',1938,125,'merchant_hull combat_engineers','Shallow-draft craft enable planned amphibious operations with limited beach supply.',{amphibious:.15},'amphibious'],
    ['marine_landing','Marine landing school',1938,130,'landing_craft small_unit_command','Beach parties coordinate assault waves, unloading and port capture.',{amphibious:.1},'marines'],
    ['active_sonar','Active ranging sonar',1939,165,'hydrophones radar_sets','Active pulses localize underwater contacts but reveal the searching vessel.',{detection:.14,convoyProtection:.09}],
    ['carrier_hull','Fleet aviation carrier',1939,210,'cruiser_hull fighter_airframe air_navigation','Floating airfields integrate naval aviation, escort requirements and deck capacity.',{sortie:.035},'carrier'],
    ['fleet_radar','Integrated fleet radar',1940,190,'tracking_radar cruiser_hull','Shared radar plots improve detection and coordinated engagements.',{navalPower:.09,detection:.13}],
    ['underway_replenishment','Underway fleet replenishment',1940,190,'fuel_tanker merchant_hull convoy_scheduling','At-sea transfer sustains patrols but occupies merchant lift.',{navalPower:.07,supply:.08,convoyProtection:.07}],
    ['integrated_taskforce','Integrated naval task force',1942,265,'fleet_radar carrier_hull active_sonar joint_staff','Air cover, escorts and surface groups share tactical priorities.',{navalPower:.15,convoyProtection:.12,command:.06}]
  ]);
  add('communications',[
    ['field_telephone','Field telephone network',1934,45,'','Wire links shorten orders when routes remain intact.',{command:.05}],
    ['compact_valves','Rugged miniature radio valves',1936,65,'machine_tools','Shock-resistant valves make field electronics practical.',{reliability:.03}],
    ['portable_radio','Portable military radio',1936,80,'field_telephone compact_valves','Portable sets connect mobile forces while increasing interceptable traffic.',{command:.08,recon:.025}],
    ['direction_finding','Radio direction finding',1936,80,'compact_valves','Separated listening stations estimate the origin of transmissions.',{detection:.09,intelligence:.045}],
    ['tactical_network','Battalion radio network',1937,105,'portable_radio','Standard call signs and net discipline connect battalion headquarters.',{command:.1,planning:.04}],
    ['radar_sets','Pulsed early-warning radar',1937,125,'compact_valves direction_finding','Ground stations identify approaching air activity with uncertain classification.',{detection:.12,airPower:.05}],
    ['mobile_command','Mobile command radio station',1938,130,'tactical_network military_truck','Mobile headquarters keep coherent orders during an advance.',{command:.11,planning:.045}],
    ['frequency_control','Crystal frequency control',1938,120,'portable_radio precision_boring','Stable frequencies reduce interference and wasted communication time.',{command:.07,reliability:.035}],
    ['secure_tactical','Encrypted tactical procedures',1939,160,'frequency_control rotor_cipher','Stronger secrecy slows early operators while protecting plans.',{counterintelligence:.12,command:-.025}],
    ['tracking_radar','Precision tracking radar',1939,175,'radar_sets analog_computer','Tracking circuits guide defense against moving contacts.',{detection:.13,airPower:.065}],
    ['radio_jamming','Directed radio interference',1940,180,'direction_finding frequency_control','Specialist teams disrupt hostile communications at detectable frequencies.',{intelligence:.09,command:.035},'jamming'],
    ['counter_jamming','Frequency agility procedures',1940,165,'frequency_control radio_jamming','Alternate channels and rehearsed fallbacks preserve command under interference.',{command:.12,counterintelligence:.045}],
    ['microwave_links','Microwave staff links',1941,215,'tracking_radar mobile_command','High-bandwidth directional links connect major command centers.',{command:.12,planning:.07}],
    ['iff_system','Identification transponder system',1941,210,'tracking_radar secure_tactical','Authenticated responses reduce mistaken engagements and wasted sorties.',{airPower:.075,sortie:.09,reliability:.025}],
    ['integrated_signals','Integrated battlefield signals',1943,285,'microwave_links iff_system electronic_computer joint_staff','Staff, air and artillery networks share timely reports while preserving secure channels.',{command:.18,planning:.1,intelligence:.075}]
  ]);
  add('computing',[
    ['mechanical_calc','Mechanical calculation bureau',1934,45,'','Reliable calculators support finance and engineering tables.',{research:.03,tax:.025}],
    ['punch_cards','Punched-card tabulation',1936,75,'mechanical_calc','Records can be counted consistently across factories and ministries.',{production:.035,intelligence:.03}],
    ['cipher_analysis','Statistical cipher analysis',1936,80,'mechanical_calc','Language and traffic statistics reveal patterns without guaranteeing decryption.',{intelligence:.065}],
    ['rotor_cipher','Electromechanical rotor cipher',1937,105,'compact_valves precision_boring','Machine ciphers defend routine traffic and require operator training.',{counterintelligence:.09,command:-.015}],
    ['analog_computer','Analog fire-control calculator',1937,120,'mechanical_calc precision_boring','Continuous mechanical computation supports moving-target solutions.',{attack:.035,airPower:.025}],
    ['crypto_bombe','Electromechanical cryptanalysis',1938,145,'cipher_analysis rotor_cipher punch_cards','Parallel search turns captured fragments into time-limited intelligence.',{intelligence:.1}],
    ['weather_tables','Numerical weather tables',1938,120,'punch_cards climate_stations','Systematic observations improve scheduling of fragile air operations.',{sortie:.065,planning:.04}],
    ['inventory_models','Inventory forecasting models',1938,125,'punch_cards depot_accounts','Statistical demand models expose upcoming stock and transport shortages.',{supply:.07,transport:.03}],
    ['operations_research','Operational research group',1939,165,'inventory_models joint_staff','Measured trials identify efficient convoy, patrol and maintenance policies.',{planning:.07,convoyProtection:.06,research:.03}],
    ['electronic_computer','Early electronic computing',1941,230,'compact_valves crypto_bombe punch_cards','Electronic switching accelerates numerical work at high laboratory cost.',{research:.08,intelligence:.075}],
    ['logistics_computer','Rail and depot computation',1941,220,'electronic_computer inventory_models rail_scheduling','Machine schedules coordinate depots and transport across the theater.',{supply:.12,transport:.085}],
    ['weather_computer','Computed weather forecasting',1942,235,'electronic_computer weather_tables','Larger calculations improve sortie timing and operational forecasts.',{sortie:.1,planning:.06}],
    ['secure_archives','Compartmented data archives',1940,160,'rotor_cipher civil_register','Controlled records protect scientific programs while slowing exchange.',{counterintelligence:.12,research:-.025}],
    ['industrial_optimization','Industrial scheduling computation',1942,235,'electronic_computer assembly_lines','Production schedules coordinate machine time and materials consumption.',{production:.1,standardization:.04}],
    ['staff_computation','Operational planning computation',1944,300,'logistics_computer weather_computer integrated_signals','Integrated calculations improve staff estimates without replacing human judgment.',{planning:.16,command:.07,intelligence:.06}]
  ]);
  add('logistics',[
    ['depot_accounts','Depot manifests and accounts',1934,45,'','Recorded receipts expose missing stores and improve usable supply.',{supply:.055,corruption:-.025}],
    ['packaging','Standard field packaging',1936,55,'depot_accounts','Weather-resistant packages reduce loss in loading and storage.',{supply:.045,ammoEfficiency:.025}],
    ['rail_scheduling','National railway schedules',1936,75,'depot_accounts rail_survey','Timetables allocate scarce rolling stock between army and civilians.',{transport:.09,supply:.035}],
    ['fuel_distribution','Bulk fuel distribution',1937,90,'depot_accounts fuel_tanker','Dedicated distribution chains reduce leaks and empty return journeys.',{fuelEfficiency:.065,supply:.035}],
    ['spares_catalogue','Unified spare-parts catalogue',1936,75,'depot_accounts interchangeable_parts','Shared parts codes reduce incompatibility and inventory confusion.',{standardization:.11,reliability:.035}],
    ['field_maintenance','Forward maintenance echelons',1937,90,'spares_catalogue mobile_workshop','Separated servicing levels return routine failures to duty quickly.',{reliability:.085,salvage:.05}],
    ['medical_routes','Protected casualty routes',1937,95,'depot_accounts field_surgery','Evacuation timetables reserve capacity for wounded personnel.',{medical:.07,transport:-.015}],
    ['cold_supply','Cold-weather supply discipline',1937,85,'packaging winter_clothing','Insulation and shelter routines protect supplies and soldiers in winter.',{supply:.055,stressRecovery:.03}],
    ['desert_supply','Arid-theater water columns',1937,90,'packaging fuel_tanker','Water transport and shade discipline reduce non-combat attrition.',{supply:.065,medical:.025}],
    ['port_handling','Mechanized port handling',1938,125,'packaging port_cranes','Cranes and cargo marshaling turn port frontage into usable throughput.',{transport:.095,convoyProtection:.025}],
    ['convoy_scheduling','Escorted convoy schedules',1938,120,'rail_scheduling escort_hull','Coordinated arrivals make escorts more effective at the cost of waiting time.',{convoyProtection:.11,transport:.04}],
    ['salvage_depots','Battlefield salvage depots',1938,130,'field_maintenance recovery_tank','Recovered materiel is sorted and repaired instead of counted as instant weapons.',{salvage:.18,reliability:.04}],
    ['pallet_system','Intermodal cargo pallets',1940,170,'port_handling heavy_transporter','Common cargo units speed transitions between road, rail and ship.',{transport:.12,supply:.055}],
    ['reserve_forecasting','Strategic reserve forecasting',1940,185,'inventory_models rail_scheduling','Demand trends guide buffers without creating resources.',{supply:.09,ammoEfficiency:.05,fuelEfficiency:.04}],
    ['theater_logistics','Integrated theater logistics',1942,260,'pallet_system logistics_computer field_maintenance','Unified manifests and schedules reduce bottlenecks across service boundaries.',{supply:.14,transport:.1,standardization:.08}]
  ]);
  add('medicine',[
    ['field_dressings','Sterile field dressings',1934,45,'','Prompt clean treatment reduces preventable permanent losses.',{medical:.055}],
    ['blood_typing','Blood grouping service',1936,65,'field_dressings','Recorded compatibility prepares safe transfusion services.',{medical:.035,health:.035}],
    ['field_surgery','Mobile surgical stations',1936,85,'field_dressings','Trained teams operate near supply hubs instead of delaying evacuation.',{medical:.08}],
    ['camp_sanitation','Military camp sanitation',1936,60,'field_dressings','Clean water and waste separation preserve manpower and civilian health.',{health:.055,medical:.04}],
    ['blood_bank','Refrigerated blood banks',1937,100,'blood_typing cold_storage','Stored blood improves survival but needs reliable energy and transport.',{medical:.095,fuelEfficiency:-.01}],
    ['sulfa_drugs','Mass-produced antibacterial drugs',1937,110,'chemical_plants field_surgery','Industrial medicines reduce wound infection and lengthy hospitalization.',{medical:.08,health:.035}],
    ['nutrition_science','Clinical nutrition service',1937,90,'camp_sanitation ration_formula','Targeted rations protect recovery and worker health.',{medical:.04,health:.07,food:.02}],
    ['psychiatric_triage','Combat stress triage',1937,95,'field_surgery','Recognize acute psychological injury and move affected soldiers out of combat.',{stressRecovery:.11,morale:.04}],
    ['ambulance_dispatch','Coordinated ambulance dispatch',1938,120,'ambulance_motor medical_routes','Dispatch priorities shorten delays while retaining civilian emergency capacity.',{medical:.09,transport:.025}],
    ['vaccine_program','National vaccination program',1938,130,'camp_sanitation chemical_plants','Preventive medicine reduces disease among troops and displaced communities.',{health:.11,medical:.045}],
    ['rehabilitation','Veteran rehabilitation centers',1938,125,'field_surgery psychiatric_triage','Physical and psychological rehabilitation supports return to work and duty.',{medical:.06,stressRecovery:.12,approval:.025}],
    ['prosthetic_workshops','Standard prosthetic workshops',1939,140,'rehabilitation precision_boring','Repairable prosthetics improve civilian reintegration after permanent injury.',{health:.08,production:.025,approval:.025}],
    ['antibiotic_fermentation','Antibiotic fermentation plants',1941,220,'sulfa_drugs industrial_fermentation blood_bank','Controlled fermentation produces effective medicines at industrial scale.',{medical:.16,health:.08}],
    ['trauma_network','Integrated trauma evacuation network',1942,240,'ambulance_dispatch blood_bank tactical_network','Linked triage, transport and surgery preserve more wounded personnel.',{medical:.16,stressRecovery:.06}],
    ['longterm_recovery','Long-term military mental health service',1942,215,'rehabilitation personnel_records','Follow-up and stable unit rotation treat accumulated strain instead of hiding it.',{stressRecovery:.2,morale:.08,health:.04}]
  ]);
  add('industry',[
    ['machine_tools','National machine-tool standards',1934,55,'','Tooling standards support reproducible production and technical experiments.',{production:.045,research:.025}],
    ['interchangeable_parts','Interchangeable parts gauges',1936,70,'machine_tools','Parts built to shared tolerances are easier to replace and license.',{standardization:.07,production:.04}],
    ['hardened_steel','Controlled steel hardening',1936,75,'machine_tools','Heat treatment balances strength and brittleness for guns and armor.',{reliability:.035,defense:.025}],
    ['optical_glass','Military optical glass',1936,65,'machine_tools','Consistent glass supports sights, cameras and engineering observation.',{recon:.035,research:.02}],
    ['chemical_plants','Industrial chemical plants',1936,80,'machine_tools','Reproducible chemical processing supplies medicines, propellants and fertilizers.',{production:.045}],
    ['textile_standards','Industrial textile standards',1936,65,'interchangeable_parts','Consistent cloth and insulation improve practical field equipment.',{production:.025,reliability:.025}],
    ['precision_boring','Precision boring and milling',1937,110,'interchangeable_parts hardened_steel','Accurate machining supports engines, guns and reliable instruments.',{production:.045,reliability:.04}],
    ['assembly_lines','Flexible assembly-line production',1937,115,'interchangeable_parts','Specialized stations improve output but conversion requires retraining.',{production:.095,standardization:.045}],
    ['quality_labs','Independent acceptance laboratories',1937,95,'precision_boring','Statistical inspection rejects defective output at a quantity cost.',{reliability:.11,production:-.03}],
    ['industrial_fermentation','Controlled industrial fermentation',1938,120,'chemical_plants','Sterile reactors support pharmaceuticals and substitute food inputs.',{health:.04,food:.025,production:.025}],
    ['light_alloys','Light-alloy structural production',1938,130,'hardened_steel chemical_plants','Lighter structures improve transport and aircraft performance.',{airPower:.045,transport:.045}],
    ['dispersed_plants','Dispersed industrial workshops',1938,130,'assembly_lines road_survey','Smaller workshops aid repair and resilience but lose some concentration efficiency.',{construction:.08,reliability:.06,production:-.025}],
    ['heat_resistant_alloy','Heat-resistant turbine alloys',1940,190,'light_alloys precision_boring','High-temperature alloys allow powerful engines and advanced propulsion.',{reliability:.08,fuelEfficiency:.025}],
    ['automated_tools','Programmed machine-tool control',1942,245,'electronic_computer precision_boring assembly_lines','Automated sequences reduce skill bottlenecks while retaining costly specialist upkeep.',{production:.13,standardization:.075}],
    ['modular_manufacture','Modular repairable manufacturing',1943,270,'automated_tools quality_labs industrial_optimization','Factory cells can be repaired and converted without halting an entire line.',{production:.12,construction:.1,reliability:.07}]
  ]);
  add('energy',[
    ['oil_distillation','Controlled oil distillation',1934,55,'','Consistent refining provides predictable fuel for military and civilian engines.',{fuel:.055}],
    ['coal_efficiency','High-efficiency coal boilers',1936,65,'machine_tools','Better combustion reduces industrial fuel demand.',{fuelEfficiency:.05,production:.025}],
    ['grid_control','Regional grid control rooms',1936,75,'field_telephone','Coordinated power dispatch limits factory interruptions.',{production:.055,construction:.025}],
    ['fuel_storage','Protected strategic fuel storage',1936,70,'oil_distillation','Tank separation and handling discipline prevent reserve losses.',{fuel:.035,fuelEfficiency:.035}],
    ['catalytic_refining','Catalytic fuel cracking',1937,110,'oil_distillation chemical_plants','Process catalysts increase useful refinery output.',{fuel:.11}],
    ['high_octane','High-octane aviation blend',1937,100,'oil_distillation chemical_plants','Controlled blends support higher-performance aircraft engines.',{airPower:.055,fuelEfficiency:.025}],
    ['fuel_additives','Cold-start and lubricant additives',1937,85,'chemical_plants oil_distillation','Stable lubricants preserve engine life in harsh conditions.',{reliability:.065,fuelEfficiency:.035}],
    ['pipeline_pumps','Regional pipeline pumping',1938,120,'fuel_storage precision_boring','Pipelines release road transport from routine fuel hauling.',{fuel:.055,transport:.065}],
    ['hydroelectric','Hydroelectric generation',1938,135,'grid_control bridge_design','Large civil works reduce industrial dependence on imported fuel.',{fuelEfficiency:.075,production:.055}],
    ['synthetic_fuel','Coal-to-liquid synthetic fuel',1938,150,'catalytic_refining coal_efficiency','Fuel substitution reduces oil dependence at an industrial opportunity cost.',{fuel:.17,production:-.045}],
    ['emergency_generators','Distributed emergency generation',1938,115,'grid_control petrol_engine','Portable generation restores critical factory and hospital services.',{production:.055,construction:.035,fuelEfficiency:-.025}],
    ['turbine_research','High-speed turbine research',1939,165,'marine_turbines precision_boring','High-speed compressors and turbines prepare advanced propulsion.',{fuelEfficiency:.04,research:.025}],
    ['buried_pipeline','Protected pipeline network',1940,175,'pipeline_pumps combat_engineers','Protected routes reduce disruption and transport competition.',{fuel:.085,transport:.06}],
    ['grid_interconnect','National grid interconnection',1941,220,'hydroelectric emergency_generators logistics_computer','Balanced regional supply reduces cascading industrial outages.',{production:.115,fuelEfficiency:.055}],
    ['integrated_energy','Integrated fuel and power dispatch',1943,265,'grid_interconnect synthetic_fuel industrial_optimization','Forecasts balance substitution, reserve withdrawals and civilian power needs.',{fuel:.15,fuelEfficiency:.09,production:.05}]
  ]);
  add('engineering',[
    ['road_survey','National road survey',1934,45,'','Surveyed road grades make construction and movement more predictable.',{construction:.04,speed:.025}],
    ['rail_survey','Rail and bridge survey',1934,50,'','Engineers identify loading limits and missing links in the rail network.',{transport:.04,construction:.025}],
    ['combat_engineers','Combat engineering school',1936,75,'road_survey','Trained engineers repair routes and assist river and fortification assaults.',{engineering:.04},'engineers'],
    ['bridge_design','Standard steel bridge spans',1936,80,'rail_survey hardened_steel','Shared span designs shorten bridge reconstruction and inspection.',{construction:.07,engineering:.045}],
    ['port_cranes','Powered port cranes',1936,85,'rail_survey marine_turbines','Reliable cranes reduce cargo handling delays at usable ports.',{transport:.065}],
    ['airfield_design','All-weather airfield foundations',1936,85,'road_survey','Drained runways and servicing hardstands improve sustainable sortie rates.',{sortie:.065,construction:.03}],
    ['prefab_shelters','Prefabricated shelters',1937,85,'interchangeable_parts road_survey','Standard shelters accelerate housing and field support construction.',{construction:.07,health:.025}],
    ['fort_bunkers','Reinforced field bunkers',1937,100,'combat_engineers hardened_steel','Protected positions reduce losses but take materials and engineers.',{defense:.085,engineering:.025}],
    ['tunnel_methods','Mountain tunnel engineering',1937,115,'bridge_design','Survey and ventilation methods improve difficult transport links.',{transport:.075,construction:.035}],
    ['runway_repair','Rapid runway repair teams',1938,110,'airfield_design prefab_shelters','Specialized crews restore operating surfaces after airfield damage.',{sortie:.085,construction:.05}],
    ['civil_shelters','Civil defense shelters',1938,110,'prefab_shelters fort_bunkers','Distributed shelters improve public health and resilience under bombardment.',{health:.075,stability:.035}],
    ['pontoon_bridges','Heavy pontoon bridge trains',1938,135,'bridging_lorry bridge_design','Heavy floating spans shorten operational river delays.',{engineering:.14,transport:.035}],
    ['urban_reconstruction','Integrated urban reconstruction',1940,170,'prefab_shelters grid_control civil_register','Coordinated housing, power and road restoration supports displaced workers.',{construction:.14,health:.05}],
    ['modular_port','Modular expeditionary harbor',1941,220,'port_cranes pontoon_bridges landing_craft','Portable harbor works improve beach throughput without eliminating port requirements.',{amphibious:.17,supply:.065}],
    ['rapid_engineering','Theater engineering command',1942,235,'urban_reconstruction runway_repair mobile_command','Shared labor and equipment schedules restore rail, airfields and towns.',{construction:.16,engineering:.08,transport:.045}]
  ]);
  add('agriculture',[
    ['crop_selection','Regional crop selection',1934,45,'','Seed trials improve yields in familiar local conditions.',{food:.06}],
    ['grain_silos','Ventilated grain silos',1934,45,'','Dry storage reduces seasonal spoilage and protects usable reserves.',{food:.04,consumption:-.015}],
    ['fertilizer','Industrial fertilizer production',1936,75,'crop_selection chemical_plants','Manufactured nutrients raise yields but divert industrial inputs.',{food:.12,production:-.015}],
    ['irrigation','Managed irrigation districts',1936,70,'crop_selection road_survey','Canal maintenance improves harvest reliability and local construction demands.',{food:.085,construction:-.01}],
    ['tractor_farming','Mechanized agricultural tractors',1936,90,'crop_selection military_truck','Tractors replace scarce labor while increasing fuel dependence.',{food:.12,fuelEfficiency:-.035}],
    ['food_preservation','Industrial food preservation',1936,65,'grain_silos chemical_plants','Canning and drying reduce transport spoilage.',{food:.055,supply:.025}],
    ['cold_storage','Powered cold storage',1937,90,'grain_silos grid_control','Refrigeration protects perishables and medical supplies.',{food:.075,health:.025}],
    ['ration_formula','Balanced field ration formulation',1937,75,'food_preservation camp_sanitation','Portable balanced rations protect morale without raising consumption.',{supply:.04,morale:.035,medical:.025}],
    ['farm_cooperatives','Agricultural purchasing cooperatives',1937,90,'crop_selection civil_register','Shared purchasing and extension staff improve rural productivity.',{food:.09,approval:.025}],
    ['climate_stations','Agricultural weather stations',1937,80,'crop_selection field_telephone','Weather observations guide harvest timing and emergency preparations.',{food:.065,planning:.02}],
    ['seed_banks','National seed reserves',1938,105,'crop_selection grain_silos','Protected diverse seed stocks reduce persistent harvest disruption.',{food:.075,health:.02}],
    ['food_rail','Refrigerated agricultural logistics',1938,115,'cold_storage rail_scheduling','Scheduled food trains reduce shortages in industrial cities.',{food:.07,transport:.035,approval:.025}],
    ['labor_sparing_farms','Labor-sparing farm equipment',1939,140,'tractor_farming assembly_lines','Mechanized harvesting cushions the agricultural cost of mobilization.',{food:.12,manpower:.025,fuelEfficiency:-.02}],
    ['substitute_foods','Safe substitute-food processing',1940,160,'industrial_fermentation ration_formula','Nutritional substitutes stretch reserves with public acceptance costs.',{food:.13,approval:-.025}],
    ['food_security','Integrated food-security service',1942,215,'food_rail seed_banks inventory_models','Forecasts coordinate seed, harvest, transport and household requirements.',{food:.14,health:.06,consumption:-.025}]
  ]);
  add('intelligence',[
    ['scout_patrols','Systematic scout patrols',1934,45,'','Patrol logs distinguish observed activity from conjecture.',{recon:.065}],
    ['cover_networks','Commercial and diplomatic cover',1936,65,'civil_register','Recruitment networks gain access through ordinary professional contacts.',{intelligence:.06},'networks'],
    ['microphotography','Document microphotography',1936,70,'optical_glass','Compact copies move sensitive technical records with less physical exposure.',{intelligence:.045},'blueprint_theft'],
    ['agent_radios','Clandestine radio procedure',1936,85,'portable_radio','Short transmissions connect networks while limiting interception time.',{intelligence:.06,counterintelligence:.025}],
    ['document_forgery','Secure-document examination',1936,80,'civil_register textile_standards','Examining papers improves both cover preparation and detection of infiltration.',{counterintelligence:.065,intelligence:.025}],
    ['traffic_analysis','Signals traffic analysis',1937,100,'direction_finding cipher_analysis','Transmission patterns reveal activity without reading every message.',{intelligence:.085,recon:.025}],
    ['photo_interpretation','Photographic interpretation school',1937,100,'recon_airframe microphotography','Analysts compare shadows, terrain and dates instead of treating photos as certainty.',{intelligence:.065,recon:.065}],
    ['double_agent','Controlled double-agent networks',1937,110,'cover_networks document_forgery','Cross-checked controlled sources permit deception and network investigation.',{counterintelligence:.075,intelligence:.04},'doubleagent'],
    ['sabotage_cells','Compartmented sabotage cells',1938,135,'agent_radios explosive_chemistry','Trained networks can disrupt infrastructure while carrying discovery risk.',{intelligence:.06},'sabotage'],
    ['deception_staff','Strategic deception staff',1938,135,'traffic_analysis dummy_equipment','Plausible false traffic and concentrations distort enemy estimates.',{intelligence:.045,counterintelligence:.065},'deception'],
    ['source_grading','Corroborated source grading',1938,110,'photo_interpretation traffic_analysis','Structured comparisons expose conflicts rather than suppressing inconvenient reports.',{intelligence:.1}],
    ['psychological_ops','Credible psychological operations',1938,135,'cover_networks psychiatric_triage','Messages exploit actual exhaustion and grievances; credibility limits their effect.',{intelligence:.055,morale:.025},'psyops'],
    ['secure_labs','Research protection service',1939,145,'document_forgery rotor_cipher','Laboratory security protects research without shutting down all scientific exchange.',{counterintelligence:.11,research:.025}],
    ['joint_intelligence','Joint intelligence assessment center',1941,220,'source_grading operations_research joint_staff','Military, foreign and internal agencies compare evidence across service boundaries.',{intelligence:.13,planning:.055}],
    ['electronic_deception','Coordinated electronic deception',1943,275,'deception_staff radio_jamming electronic_computer','Electronic signatures and false schedules support a plausible operational story.',{intelligence:.13,counterintelligence:.085,command:.035}]
  ]);
  add('doctrine',[
    ['reserve_manual','Reserve mobilization manual',1934,50,'','Assembly rosters preserve trained reserves without permanent mass call-up.',{training:.05,manpower:.025}],
    ['small_unit_command','Small-unit leadership school',1936,65,'reserve_manual','Junior leaders practice intent, local judgment and casualty replacement.',{training:.06,command:.04}],
    ['defense_depth','Defense in depth',1936,70,'reserve_manual','Local reserves and fallback positions preserve cohesion during retreat.',{defense:.075,planning:.025}],
    ['joint_staff','Professional joint staff college',1936,85,'reserve_manual civil_register','Staff officers learn allocation and coordination across military services.',{planning:.065,command:.04}],
    ['fire_discipline','Controlled fire discipline',1936,65,'reserve_manual field_artillery','Measured fire reduces waste while preserving prepared defensive effect.',{ammoEfficiency:.095,defense:.025}],
    ['march_discipline','March and rest doctrine',1937,75,'small_unit_command depot_accounts','Planned pauses protect readiness on long movements.',{stressRecovery:.065,supply:.035}],
    ['mobile_warfare','Mechanized operational school',1937,115,'light_tank small_unit_command','Training combines mobile infantry, armor and recovery rather than isolated charges.',{speed:.065,planning:.05}],
    ['dummy_equipment','Concealment and dummy formations',1937,80,'scout_patrols small_unit_command','False positions consume field effort while complicating enemy interpretation.',{recon:.04,defense:.04},'dummy_formations'],
    ['mission_command','Delegated mission command',1938,135,'tactical_network small_unit_command','Officers interpret intent quickly, requiring trained and trusted subordinates.',{command:.13,training:.045},'mission_command'],
    ['artillery_integration','Observed fire support doctrine',1938,135,'forward_observers joint_staff','Observers and staff coordinate scarce shells against operational priorities.',{attack:.06,ammoEfficiency:.08,planning:.04}],
    ['rotation_system','Mandatory front-line rotation',1938,115,'march_discipline psychiatric_triage','Scheduled replacement and rest preserves veteran effectiveness over long wars.',{stressRecovery:.13,morale:.055}],
    ['combined_arms','Combined-arms field exercises',1939,165,'mobile_warfare artillery_integration tank_radio','Real exercises internalize radio, infantry, armor and fire-support cooperation.',{attack:.09,defense:.05,planning:.065}],
    ['interservice_training','Joint air-ground training',1939,165,'joint_staff close_support tactical_network','Common procedures reduce service rivalry and mistaken target requests.',{airPower:.075,command:.065}],
    ['elastic_counterstroke','Elastic counterstroke operations',1941,215,'defense_depth combined_arms mobile_command','Prepared reserves withdraw, absorb and counterattack based on local information.',{defense:.11,attack:.045,command:.065}],
    ['theater_command','Integrated theater command',1942,250,'combined_arms interservice_training operations_research','Institutional staff training connects operational plans to actual supply and intelligence.',{planning:.14,command:.085,supply:.055}]
  ]);
  add('administration',[
    ['civil_register','Civil and property registers',1934,45,'','Credible records improve administration and lawful collection.',{tax:.05,legitimacy:.025}],
    ['budget_accounts','Audited public accounts',1936,65,'civil_register','Independent reconciliation exposes missing revenue and stores.',{tax:.055,corruption:-.055}],
    ['merit_exams','Professional civil-service examinations',1936,70,'civil_register','Qualifications improve policy execution and scientific recruitment.',{research:.045,tax:.035,corruption:-.025}],
    ['personnel_records','Service and personnel records',1936,65,'civil_register','Personnel records improve replacement, benefits and return-to-duty accounting.',{manpower:.045,training:.035,medical:.025}],
    ['local_governance','Accountable district administration',1936,75,'civil_register','Local reporting and appeal mechanisms improve regional legitimacy.',{legitimacy:.06,occupation:-.035}],
    ['tax_compliance','Progressive tax administration',1937,95,'budget_accounts punch_cards','Better assessment and collection improve revenue without changing nominal rates.',{tax:.095,corruption:-.025}],
    ['procurement_audit','Independent procurement inspection',1937,95,'budget_accounts spares_catalogue','Physical inspection checks manifests against what troops actually receive.',{corruption:-.075,supply:.045,reliability:.025}],
    ['labor_exchange','National labor exchange',1937,100,'personnel_records field_telephone','Match displaced and demobilized workers to industry and reconstruction.',{production:.055,construction:.04,approval:.025}],
    ['university_charter','Independent university charter',1937,110,'merit_exams','Secure academic careers protect research against political upheaval.',{research:.1,education:.075,legitimacy:.025}],
    ['emergency_plans','Constitutional emergency plans',1937,100,'local_governance reserve_manual','Pre-agreed procedures coordinate crisis powers and credible restoration.',{stability:.055,legitimacy:.035,planning:.035}],
    ['refugee_integration','Refugee professional accreditation',1938,125,'labor_exchange university_charter','Recognize qualified displaced professionals while funding language and local integration.',{research:.045,health:.055,production:.035}],
    ['civic_statistics','Independent statistical service',1938,120,'punch_cards tax_compliance','Publish uncertainty and cross-check local reports to reduce false precision.',{intelligence:.065,tax:.05,corruption:-.045}],
    ['regional_compacts','Negotiated regional fiscal compacts',1939,145,'local_governance tax_compliance','Shared revenue supports local consent but reduces direct occupation extraction.',{legitimacy:.08,stability:.045,occupation:-.06}],
    ['mobilization_science','Labor-protected mobilization schedules',1940,185,'personnel_records labor_exchange inventory_models','Call-up timing protects scarce industrial skills while improving reserve readiness.',{manpower:.09,production:.055,training:.05}],
    ['resilient_state','Institutional continuity system',1942,240,'civic_statistics emergency_plans secure_archives','Distributed records and professional succession preserve administration during regime change.',{tax:.095,research:.065,legitimacy:.07,stability:.055}]
  ]);
  add('strategic',[
    ['rocket_motor','Liquid rocket test motor',1936,85,'chemical_plants','Controlled propulsion trials establish a costly experimental engineering path.',{research:.025,reliability:.015}],
    ['nuclear_physics','Nuclear measurement laboratory',1936,100,'university_charter','Precision instruments study nuclear processes without producing a weapon.',{research:.05}],
    ['wind_tunnel','High-speed wind tunnel',1937,110,'airframe_methods precision_boring','Measured aerodynamics support propulsion and advanced aircraft programs.',{airPower:.035,research:.025}],
    ['guidance_gyro','Inertial guidance instruments',1938,145,'rocket_motor analog_computer','Gyroscopes and integration tables improve unmanned weapon guidance.',{planning:.035,reliability:.025}],
    ['solid_propellant','Stable solid rocket propellant',1938,140,'rocket_motor explosive_chemistry','Safer storage and rapid preparation support field rockets.',{reliability:.065,ammoEfficiency:.025}],
    ['cruise_pulsejet','Pulsejet cruise test vehicle',1939,175,'wind_tunnel guidance_gyro','An inexpensive unmanned design trades accuracy and reliability for range.',{airPower:.06,reliability:-.03},'cruise_program'],
    ['ballistic_airframe','Ballistic experimental airframe',1939,190,'rocket_motor wind_tunnel light_alloys','Large rocket structures require new testing methods and costly ground facilities.',{research:.035},'ballistic_program'],
    ['research_reactor','Controlled research reactor',1940,220,'nuclear_physics heat_resistant_alloy grid_control','A national-scale reactor consumes industrial expertise before useful production.',{research:.075,production:-.025}],
    ['isotope_separation','Isotope separation engineering',1941,245,'nuclear_physics precision_boring chemical_plants','Industrial separation creates a long, energy-intensive strategic program.',{research:.04,production:-.025}],
    ['rocket_telemetry','Rocket telemetry and tracking',1940,200,'ballistic_airframe tracking_radar','Telemetry identifies failures and improves repeatable launches.',{reliability:.075,planning:.035}],
    ['strategic_navigation','Long-range strategic navigation',1940,190,'air_navigation guidance_gyro','Navigation and weather calculations improve long-range strike missions.',{airPower:.085,planning:.035}],
    ['ballistic_weapon','Operational ballistic weapon',1943,290,'rocket_telemetry guidance_gyro solid_propellant','Operational rockets require engineering, delivery planning and expensive consumable stocks.',{airPower:.09},'ballistic_strike'],
    ['nuclear_engineering','Nuclear weapon engineering program',1943,330,'research_reactor isotope_separation electronic_computer','A difficult engineering program integrates material production, safety and weapon design.',{research:.045},'nuclear_program'],
    ['delivery_integration','Strategic delivery integration',1944,310,'nuclear_engineering pressurized_airframe strategic_navigation','Weapons, aircraft and trained crews are integrated before strategic delivery becomes possible.',{airPower:.065},'nuclear_strike'],
    ['strategic_deterrence','Credible strategic deterrence doctrine',1945,350,'delivery_integration ballistic_weapon theater_command','Dispersed readiness and political communication connect capability to deterrence.',{counterintelligence:.1,legitimacy:-.025},'deterrence']
  ]);
  const event = (id,name,metric,op,value,description,options) => ({id,name,description,condition:{metric,op,value},options:options.map(([label,effects])=>({label,effects}))});
  DATA.events = [
    event('bread_queues','Bread queues lengthen','stock.food','<',180,'Urban bakeries report exhausted flour allotments. Families are skipping work to stand in line.',[['Release emergency imports',{treasury:-90,'stock.food':130,approval:3}],['Divert army reserves',{'stock.food':65,warSupport:-3,stability:2}],['Deny the shortage',{credibility:-6,approval:-3,radicalization:3}]]),
    event('fuel_auction','Fuel auction scandal','stock.fuel','<',110,'Officials have auctioned scarce transport fuel to favored firms while military trucks wait.',[['Audit and recover stocks',{treasury:-45,corruption:-5,'stock.fuel':35}],['Buy the fuel back',{treasury:-100,'stock.fuel':75,corruption:2}],['Protect the contracts',{corruption:4,legitimacy:-4}]]),
    event('tool_breakage','Machine-tool failures','productionEfficiency','<',.5,'Rushed factory conversion has left scarce tools running beyond their maintenance intervals.',[['Pause for repairs',{treasury:-60,'stock.parts':-15,productionEfficiency:.06}],['Purchase replacement tools',{treasury:-110,productionEfficiency:.04}],['Press the same crews',{health:-3,approval:-3,corruption:1}]]),
    event('strike_ballot','Industrial strike ballot','approval','<',46,'Factory delegates demand food allowances and limits on compulsory overtime before voting on a strike.',[['Negotiate allowances',{treasury:-80,approval:6,legitimacy:2}],['Accept a shorter workweek',{productionEfficiency:-.04,approval:8,health:2}],['Detain the organizers',{stability:3,legitimacy:-6,radicalization:7}]]),
    event('disabled_veterans','Veterans petition for rehabilitation','casualties.wounded','>',5000,'Wounded veterans report delays in pensions, prosthetic repairs and work placement.',[['Fund recovery centers',{treasury:-100,health:4,approval:4,exhaustion:-3}],['Create work-placement teams',{treasury:-55,unemployment:-3,approval:2}],['Postpone the claims',{radicalization:4,legitimacy:-3,exhaustion:2}]]),
    event('missing_families','Families ask for missing-person lists','casualties.missing','>',1000,'Relatives want the government to distinguish confirmed deaths from missing soldiers and prisoners.',[['Publish a candid accounting',{credibility:7,warSupport:-3,legitimacy:3}],['Fund tracing teams',{treasury:-50,credibility:4,approval:2}],['Classify the lists',{credibility:-6,stability:2,radicalization:3}]]),
    event('prison_camp','Prisoner camp overcrowding','pow','>',2000,'Captured troops require food, shelter and medical care. Guards warn that current facilities are overloaded.',[['Expand humane accommodation',{treasury:-85,'stock.food':-25,health:2,reputation:5}],['Seek a supervised exchange',{treasury:-30,reputation:3,exhaustion:-2}],['Ignore the inspection',{health:-4,reputation:-8,credibility:-3}]]),
    event('harvest_credit','Farmers request seed credit','stock.food','<',320,'Farmers can expand the next harvest if they receive credit and transport priority before sowing.',[['Provide agricultural credit',{treasury:-90,'stock.food':90,approval:3}],['Reassign transport',{ 'stock.transport':-15,'stock.food':60,approval:2}],['Leave it to private lenders',{corruption:2,approval:-2}]]),
    event('debt_refinance','Bondholders demand terms','debt','>',1800,'Domestic lenders will refinance debt only if they believe taxation and peace prospects are credible.',[['Honor repayments',{treasury:-120,debt:-170,reputation:3}],['Negotiate a longer maturity',{debt:60,treasury:80,reputation:-2}],['Monetize the payment',{treasury:160,inflation:6,credibility:-3}]]),
    event('price_spiral','Wages trail rising prices','inflation','>',18,'Food and rent prices have moved ahead of wages. Nominal production masks falling civilian purchasing power.',[['Target household assistance',{treasury:-110,approval:5,health:2}],['Restrict credit',{inflation:-5,productionEfficiency:-.025}],['Publish optimistic price indices',{credibility:-7,corruption:2}]]),
    event('customs_fraud','Customs officials under scrutiny','corruption','>',30,'Inspectors found duplicate manifests at a crossing used for strategic imports.',[['Prosecute the network',{treasury:-55,corruption:-7,legitimacy:3}],['Replace the local director',{treasury:-25,corruption:-3,admin:2}],['Preserve elite cooperation',{corruption:4,legitimacy:-4}]]),
    event('officer_letter','Officers circulate a critical letter','exhaustion','>',25,'A group of officers questions the war aims and accuses ministers of ignoring field conditions.',[['Hear their assessment',{credibility:3,staff:3,warSupport:-2}],['Order an independent inquiry',{treasury:-35,legitimacy:3,corruption:-2}],['Threaten disciplinary action',{staff:-4,legitimacy:-4,radicalization:3}]]),
    event('rail_bottleneck','Rail dispatchers request priority','stock.transport','<',60,'Civilian freight and military supply are competing for the same rolling stock.',[['Purchase emergency lift',{treasury:-95,'stock.transport':40}],['Suspend civilian freight',{approval:-4,'stock.transport':25,health:-1}],['Publish a shared schedule',{treasury:-30,admin:2,'stock.transport':15}]]),
    event('unpaid_troops','Soldiers report wage arrears','treasury','<',80,'Regimental pay offices warn that unkept promises are beginning to affect discipline.',[['Issue emergency bonds',{treasury:180,debt:220,credibility:-1}],['Cut ministerial allowances',{treasury:60,approval:3,corruption:-1}],['Delay another month',{warSupport:-5,legitimacy:-4,radicalization:4}]]),
    event('refugee_specialists','Displaced specialists seek accreditation','refugees','>',5000,'Among displaced families are doctors, engineers and teachers whose certificates cross obsolete borders.',[['Recognize and integrate skills',{treasury:-85,education:3,health:3,admin:2,reputation:3}],['Offer temporary apprenticeships',{treasury:-40,productionEfficiency:.025,approval:1}],['Keep credentials suspended',{education:-1,reputation:-3,radicalization:2}]]),
    event('housing_pressure','Shelters exceed safe capacity','refugees','>',12000,'Local authorities report overcrowded schools and warehouses. Disease and resentment are rising together.',[['Fund temporary housing',{treasury:-100,'stock.materials':-20,health:5,approval:3}],['Coordinate regional placement',{treasury:-45,'stock.transport':-10,health:2,admin:2}],['Leave districts unaided',{health:-5,approval:-4,radicalization:4}]]),
    event('academic_exit','Universities warn of emigration','legitimacy','<',45,'Researchers fear politicized appointments and are seeking secure posts abroad.',[['Guarantee academic independence',{treasury:-60,education:4,legitimacy:4}],['Protect essential laboratories',{treasury:-35,education:2,admin:1}],['Require political loyalty oaths',{education:-4,legitimacy:-3,radicalization:3}]]),
    event('labor_shortage','Skilled workshop vacancies','mobilization','>',1,'Workshops report that conscription has removed the technicians needed to maintain complex equipment.',[['Protect critical trades',{manpower:-1500,productionEfficiency:.05,approval:2}],['Expand apprenticeships',{treasury:-65,education:2,productionEfficiency:.025}],['Order longer shifts',{productionEfficiency:.02,health:-4,approval:-3}]]),
    event('ration_fraud','Ration-book fraud uncovered','corruption','>',25,'Officials issued multiple ration books to connected households while ordinary queues lengthened.',[['Audit the registry',{treasury:-40,corruption:-5,credibility:3}],['Compensate affected districts',{treasury:-60,'stock.food':-20,approval:4}],['Quietly transfer the officials',{corruption:2,credibility:-4}]]),
    event('court_challenge','Court challenges emergency procedure','legitimacy','<',60,'Judges demand a legal basis for recent emergency decisions. The cabinet can comply or force a confrontation.',[['Respect judicial review',{legitimacy:6,admin:2,stability:-1}],['Negotiate temporary authority',{treasury:-25,legitimacy:2,stability:2}],['Bypass the court',{stability:4,legitimacy:-8,radicalization:4}]]),
    event('provincial_petition','Provinces demand a fiscal settlement','admin','<',55,'Regional councils say that central taxes arrive more reliably than public services.',[['Negotiate revenue sharing',{treasury:-80,legitimacy:5,stability:3,admin:2}],['Send a public-service commission',{treasury:-45,admin:4,approval:2}],['Centralize collection by force',{treasury:60,legitimacy:-6,radicalization:5}]]),
    event('army_rivalry','Services contest procurement credits','industryAllocation','>',.6,'Army, navy and aviation chiefs each claim that the other branches are consuming indispensable machinery.',[['Use an independent staff review',{treasury:-40,staff:4,corruption:-2}],['Share the contracts evenly',{productionEfficiency:-.025,stability:2}],['Reward political allies',{corruption:5,staff:-3,legitimacy:-2}]]),
    event('war_correspondent','Correspondent reports a supply failure','exhaustion','>',15,'A correspondent has documented empty depots behind an operation praised in official bulletins.',[['Publish and investigate',{credibility:6,corruption:-3,warSupport:-2}],['Restrict operational details',{credibility:-1,stability:2}],['Discredit the witnesses',{credibility:-8,radicalization:3,stability:2}]]),
    event('peace_march','Citizens organize a peace march','exhaustion','>',40,'Casualty lists and shortages have brought several rival political groups into the same march.',[['Open a public peace debate',{legitimacy:5,warSupport:-5,exhaustion:-2}],['Meet representatives privately',{treasury:-25,approval:3,exhaustion:-1}],['Disperse the march',{stability:3,legitimacy:-6,radicalization:6}]]),
    event('volunteer_drives','Veterans organize a recruitment drive','prestige','>',55,'Decorated veterans offer to train volunteers, provided experienced cadres remain with the new units.',[['Fund veteran instruction',{treasury:-70,manpower:1400,staff:2}],['Accept volunteers immediately',{manpower:2200,productionEfficiency:-.02}],['Keep the veterans in civilian work',{approval:2,productionEfficiency:.015}]]),
    event('recovery_milestone','Recovery workshops exceed expectations','casualties.returned','>',1000,'Medical and workshop teams demonstrate that rehabilitation can return skills to both units and civilian firms.',[['Expand proven practices',{treasury:-65,health:3,staff:2,approval:2}],['Honor recovery teams',{treasury:-20,approval:3,credibility:2}],['Redirect the appropriation',{treasury:40,health:-1}]]),
    event('food_rumor','Rumors of hidden grain reserves','credibility','<',50,'Market gossip claims that ministers are concealing plentiful stores. Weak records make the rumor hard to refute.',[['Open an independent inspection',{treasury:-30,credibility:6,corruption:-2}],['Publish district estimates',{credibility:3,admin:1}],['Arrest rumor spreaders',{credibility:-5,legitimacy:-3,radicalization:4}]]),
    event('health_alert','District physicians warn of disease','health','<',55,'Poor nutrition and crowded housing are turning ordinary illnesses into a workforce crisis.',[['Fund sanitation and food distribution',{treasury:-85,'stock.food':-15,health:7}],['Mobilize volunteer clinics',{treasury:-40,health:3,approval:2}],['Suppress the medical reports',{health:-4,credibility:-6}]]),
    event('school_budget','Teachers petition against closures','education','<',58,'Teachers warn that continued school closures will reduce officer, engineer and administrative skills.',[['Restore district schools',{treasury:-80,education:4,approval:2}],['Protect technical classes',{treasury:-45,education:2,productionEfficiency:.015}],['Maintain the closures',{education:-3,legitimacy:-2,treasury:30}]]),
    event('inspection_gap','Stores differ from the ledger','corruption','>',35,'An inspection found that reported spare parts exist only on paper.',[['Trace the missing consignments',{treasury:-50,corruption:-6,'stock.parts':25}],['Purchase emergency replacements',{treasury:-90,'stock.parts':45,corruption:1}],['Alter the ledgers',{credibility:-6,corruption:5}]]),
    event('currency_controls','Merchants demand convertible payments','inflation','>',25,'Importers will no longer accept payment at the official exchange rate.',[['Support essential imports',{treasury:-120,'stock.materials':60,'stock.fuel':30}],['Negotiate realistic contracts',{inflation:2,reputation:2,'stock.materials':35}],['Impose stricter controls',{corruption:4,approval:-3,inflation:-1}]]),
    event('cabinet_exhaustion','Cabinet members request delegation','exhaustion','>',30,'Continuous crisis meetings are slowing administration and encouraging contradictory instructions.',[['Delegate to professional deputies',{treasury:-35,admin:4,staff:2}],['Convene a smaller crisis committee',{admin:2,legitimacy:-1}],['Retain personal control',{admin:-3,corruption:2}]]),
    event('bond_success','A credible bond drive attracts savings','credibility','>',70,'Households are willing to finance reconstruction if the government publishes clear terms.',[['Issue transparent public bonds',{treasury:160,debt:180,credibility:1}],['Limit borrowing to repair needs',{treasury:90,debt:95,approval:2}],['Thank savers and avoid new debt',{reputation:2,legitimacy:2}]]),
    event('surplus_dispute','Officials debate the grain surplus','stock.food','>',900,'A strong harvest creates a choice between reserves, civilian consumption and export revenue.',[['Build strategic reserves',{'stock.food':-50,'stock.goods':30,approval:1}],['Subsidize household food',{'stock.food':-100,health:4,approval:4}],['Export the surplus',{'stock.food':-130,treasury:110,reputation:1}]]),
    event('manufacturing_award','Factories propose a common components pact','productionEfficiency','>',.72,'Competing firms can share standards if the state guarantees fair procurement access.',[['Fund shared tooling',{treasury:-75,productionEfficiency:.035,'stock.parts':20}],['Require open technical tenders',{corruption:-3,legitimacy:2}],['Favor the largest contractor',{productionEfficiency:.02,corruption:4}]]),
    event('officer_academy','Staff college requests protected places','staff','<',55,'Accelerated promotions have left gaps in staff competence and institutional memory.',[['Restore full staff courses',{treasury:-65,staff:5,manpower:-500}],['Use veteran instructors',{treasury:-35,staff:3}],['Continue emergency promotion',{staff:-2,manpower:500,corruption:1}]]),
    event('local_militia','District militias demand recognition','radicalization','>',25,'Armed local groups offer security while demanding political authority outside regular institutions.',[['Integrate vetted volunteers',{treasury:-60,manpower:1200,radicalization:-3,staff:-1}],['Negotiate civilian supervision',{treasury:-35,legitimacy:3,radicalization:-4}],['Sponsor loyal armed groups',{manpower:1700,legitimacy:-5,radicalization:5}]]),
    event('demobilized_workers','Demobilized workers seek livelihoods','unemployment','>',10,'Returning personnel need housing and employment; idle veteran associations are becoming political.',[['Fund reconstruction employment',{treasury:-100,unemployment:-5,approval:4}],['Support private apprenticeships',{treasury:-55,unemployment:-3,education:1}],['Delay the settlement',{radicalization:5,legitimacy:-3}]]),
    event('civil_service_leak','Civil servants leak falsified figures','credibility','<',40,'Internal documents reveal that officials altered production reports to avoid criticism.',[['Protect the whistleblowers',{credibility:8,corruption:-4,legitimacy:3}],['Replace reporting supervisors',{treasury:-35,admin:3,credibility:3}],['Prosecute the disclosure',{credibility:-8,corruption:4,legitimacy:-5}]]),
    event('security_warning','Investigators seek oversight','radicalization','>',35,'Security investigators say indiscriminate arrests are producing unreliable accusations and new enemies.',[['Require evidence and review',{treasury:-35,legitimacy:5,radicalization:-4}],['Audit politically sensitive cases',{treasury:-20,corruption:-2,radicalization:-2}],['Expand detention authority',{stability:4,legitimacy:-7,radicalization:7}]]),
    event('foreign_credit','Foreign creditors question repayment','debt','>',2800,'Creditors propose an emergency refinancing arrangement that would leave future budgets constrained.',[['Accept a limited refinancing',{treasury:180,debt:240,reputation:-1}],['Publish a repayment program',{treasury:-90,debt:-130,reputation:4}],['Announce selective default',{debt:-240,reputation:-10,inflation:3}]]),
    event('public_service','District service audit shows progress','admin','>',75,'Better registration and professional appointments have reduced delays in public services.',[['Expand independent audits',{treasury:-45,corruption:-3,legitimacy:3}],['Invest the savings in clinics',{treasury:-55,health:3,approval:2}],['Return the savings to the treasury',{treasury:35,approval:1}]]),
    event('siege_families','Front-line families ask for evacuation','exhaustion','>',20,'Communities near damaged transport routes ask for organized evacuation before another offensive.',[['Fund protected transport',{treasury:-70,'stock.transport':-20,health:3,reputation:3}],['Support local shelters',{treasury:-45,'stock.materials':-15,health:2,approval:2}],['Require households to remain',{approval:-4,health:-3,legitimacy:-3}]]),
    event('ambitious_staff','Decorated officers demand a political voice','prestige','>',70,'Senior officers claim battlefield success entitles the armed forces to direct national policy.',[['Defend civilian procedure',{legitimacy:4,staff:-1,stability:-2}],['Create a supervised advisory council',{treasury:-25,staff:3,legitimacy:-1}],['Grant senior officers cabinet control',{staff:4,legitimacy:-6,radicalization:3}]]),
    event('labor_health','Factory physicians report exhaustion','health','<',45,'Illness and long shifts are lowering the useful output of an already strained workforce.',[['Mandate recovery shifts',{productionEfficiency:-.025,health:6,approval:3}],['Expand meals and clinics',{treasury:-80,'stock.food':-20,health:4}],['Demand the production quota',{health:-5,credibility:-3,productionEfficiency:.015}]]),
    event('reconstruction_compact','Civic groups propose reconstruction priorities','exhaustion','>',35,'Municipalities, veterans and employers want transparent priorities for repairing housing and transport.',[['Convene a public reconstruction board',{treasury:-55,admin:3,legitimacy:4,exhaustion:-2}],['Fund the most damaged services',{treasury:-95,health:4,approval:4}],['Reserve all funds for procurement',{warSupport:2,approval:-4,exhaustion:2}]])
  ];
  DATA.techById = Object.fromEntries(DATA.techs.map(t=>[t.id,t]));
  DATA.effectDescriptions = {
    attack:'Combat firepower',defense:'Defensive combat power',speed:'Operational movement',supply:'Supply throughput',transport:'Transport capacity',
    fuelEfficiency:'Fuel economy',ammoEfficiency:'Ammunition economy',reliability:'Equipment reliability',medical:'Casualty survival and recovery',
    stressRecovery:'Recovery from combat strain',morale:'Unit morale resilience',training:'Recruit training quality',recon:'Reconnaissance quality',command:'Order responsiveness',
    planning:'Operational preparation',salvage:'Battlefield equipment recovery',airPower:'Air mission effectiveness',navalPower:'Naval mission effectiveness',
    standardization:'Equipment compatibility',sortie:'Airfield sortie capacity',amphibious:'Amphibious preparation',engineering:'Bridge and fortification engineering',
    detection:'Air and naval detection',convoyProtection:'Convoy protection',production:'Industrial output',food:'Agricultural output',fuel:'Refining output',
    construction:'Construction rate',tax:'Effective revenue',research:'Institutional research rate',intelligence:'Intelligence quality',counterintelligence:'Counterintelligence',
    stability:'Social order trend',approval:'Public approval trend',legitimacy:'Institutional legitimacy trend',corruption:'Corruption pressure',education:'Education trend',
    health:'Public health trend',manpower:'Recruitment capacity',trade:'Trade terms',consumption:'Civilian consumption',repression:'Coercive pressure',occupation:'Occupation extraction'
  };
})(globalThis);
