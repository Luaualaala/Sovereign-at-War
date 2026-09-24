'use strict';
(function (G) {
  const GS = G.GS = G.GS || {};
  GS.clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : lo));
  GS.rand = s => { s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0; return s.rng / 4294967296; };
  GS.country = (s, id) => s.countries.find(c => c.id === Number(id));
  GS.region = (s, id) => s.regions.find(r => r.id === Number(id));
  GS.owned = (s, cid) => s.regions.filter(r => r.owner === Number(cid));
  GS.atWar = (s, a, b) => a !== b && s.wars.some(w => w.active && ((w.a === a && w.b === b) || (w.a === b && w.b === a)));
  GS.rel = (s, a, b) => {
    let r = s.relations.find(r => (r.a === a && r.b === b) || (r.a === b && r.b === a));
    if (!r) { r = { a, b, opinion: 0, trust: 50, alliance: false, access: false, guarantee: null, pactUntil: 0, sanctions: [], trade: null, aid: 0, memory: [] }; s.relations.push(r); }
    return r;
  };
  GS.log = (s, type, text, country = null, region = null) => {
    const item = { id: s.nextId++, day: s.day, type, text, country, region };
    s.chronicle.push(item);
    if (s.chronicle.length > 3000) s.chronicle.splice(0, s.chronicle.length - 3000);
    if (country === s.player || country === null) { s.alerts.push(item); if (s.alerts.length > 80) s.alerts.shift(); }
    return item;
  };
  GS.date = day => new Date(Date.UTC(1936, 0, 1) + day * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  GS.policyEffects = c => {
    const out = {};
    for (const law of GS.DATA.laws || []) {
      const selected = c.policies[law.category] ?? c.policies[law.id];
      const option = law.options?.find(o => o.id === selected) || law.options?.[0];
      for (const [key, value] of Object.entries(option?.effects || {})) if (typeof value === 'number') out[key] = (out[key] || 0) + value;
    }
    return out;
  };
  GS.mod = (c, key) => {
    const cache = GS._modCache?.get(c);
    if (cache && key in cache) return cache[key];
    const value = (c.techMods?.[key] || 0) + (GS.policyEffects(c)[key] || 0) + (c.leaders || []).filter(l => l.active !== false && l.role !== 'reserve').reduce((n, l) => n + (l.traits || []).reduce((v, id) => v + (GS.DATA.politicalTraits?.find(t => t.id === id)?.effects?.[key] || 0) * (l.competence / 100) * .25, 0), 0);
    if (GS._modCache) { if (!cache) GS._modCache.set(c, { [key]: value }); else cache[key] = value; }
    return value;
  };
  GS.effects = c => Object.fromEntries(Object.keys(GS.DATA.effectDescriptions || {}).map(key => [key, GS.mod(c, key)]));
  GS.gov = c => GS.DATA.governments[c.government] || Object.values(GS.DATA.governments)[0];
  GS.average = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  GS.pick = (s, values) => values[Math.floor(GS.rand(s) * values.length)];
  const names = ['Aster', 'Bellhaven', 'Cairn', 'Dunwich', 'Eastmere', 'Fallow', 'Greyford', 'Highwater', 'Istren', 'Juniper', 'Kestrel', 'Lowmarch', 'Marden', 'Northglass', 'Orris', 'Pell', 'Quarry', 'Redbank', 'Sable', 'Thorn', 'Uplands', 'Valewood', 'Westreach', 'Yarrow'];
  const first = ['Elian', 'Mara', 'Tomas', 'Irena', 'Cassian', 'Sera', 'Anton', 'Liora', 'Neris', 'Viktor', 'Ada', 'Lucen'];
  const last = ['Venn', 'Korda', 'Merek', 'Hale', 'Orsic', 'Delmar', 'Roven', 'Erd', 'Saye', 'Cavan', 'Noll', 'Arden'];
  const anchors = [[3, 2], [7, 2], [11, 2], [14, 3], [3, 7], [7, 7], [11, 7], [14, 7]];

  GS.makeWorld = s => {
    for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) {
      const bounds = y === 0 ? [3, 11] : y === 1 ? [1, 13] : y === 9 ? [4, 12] : y === 8 ? [2, 14] : [1, 14];
      if (x < bounds[0] || x > bounds[1]) continue;
      const distances = anchors.map(([ax, ay], i) => ({ i, d: ((x - ax) * 1.1) ** 2 + (y - ay) ** 2 }));
      distances.sort((a, b) => a.d - b.d);
      const owner = distances[0].i;
      const roll = GS.rand(s);
      let terrain = roll < .25 ? 'forest' : roll < .42 ? 'hills' : 'plains';
      if (x >= 7 && x <= 9 && y > 1 && y < 8) terrain = y % 3 ? 'mountains' : 'hills';
      if (y >= 7 && x >= 11) terrain = roll < .7 ? 'desert' : 'plains';
      if (x <= 3 && y >= 4 && y <= 6) terrain = 'swamp';
      const coastal = x === bounds[0] || x === bounds[1] || y === 0 || y === 9;
      const city = (x + y * 3) % 7 === 0;
      if (city) terrain = 'urban'; else if (coastal && terrain === 'plains') terrain = 'coastal';
      const id = s.regions.length;
      s.regions.push({ id, name: `${names[id % names.length]} ${['Vale', 'Reach', 'March', 'Coast', 'Heights', 'Basin'][Math.floor(id / names.length)] || 'Ward'}`, x, y, owner, core: owner, terrain, neighbors: [], population: city ? 480000 + Math.round(GS.rand(s) * 250000) : 130000 + Math.round(GS.rand(s) * 200000), culture: owner, wealth: 35 + GS.rand(s) * 40, loyalty: 62 + GS.rand(s) * 20, unrest: 5 + GS.rand(s) * 12, resistance: 0, compliance: 60, autonomy: 0, infrastructure: city ? 85 : 48 + GS.rand(s) * 28, rail: city || x % 3 === 0 ? 2 : 1, hub: city, port: coastal && (y % 2 === 0 || x > 12), coastal, airfield: city ? 2 : 0, city, river: x === 5 || (x === 11 && y < 6), fort: terrain === 'mountains' ? 1 : 0, industry: city ? 5 : terrain === 'mountains' ? 1 : 2, farms: terrain === 'plains' ? 5 : terrain === 'forest' ? 3 : 1, oil: owner === 6 || owner === 7 ? 3 : id % 9 === 0 ? 2 : .3, materials: terrain === 'mountains' || terrain === 'hills' ? 5 : 2, energy: city ? 5 : 2, damage: 0, housing: 100, weather: 'clear', supply: 80, supplyPath: [], supplyBottleneck: 'Awaiting dispatch', supplyCapacity: 0, displaced: 0, occupation: 'civilian', separatism: owner === 5 ? 18 : 3, resistanceOrganization: 0 });
    }
    for (const r of s.regions) {
      const diagonal = r.y % 2 === 0 ? -1 : 1;
      const coords = [[r.x - 1, r.y], [r.x + 1, r.y], [r.x, r.y - 1], [r.x + diagonal, r.y - 1], [r.x, r.y + 1], [r.x + diagonal, r.y + 1]];
      r.neighbors = coords.map(([x, y]) => s.regions.find(o => o.x === x && o.y === y)?.id).filter(id => id !== undefined);
      r.oil = r.owner === 3 ? 3.5 : r.id % 9 === 0 ? 2 : .3;
      if (r.owner === 6) r.farms *= 1.65;
    }
  };
  function person(s, cid, i, role, traits) {
    return { id: cid * 100 + i, name: `${first[(cid * 3 + i) % first.length]} ${last[(cid + i * 2) % last.length]}`, role, competence: 43 + Math.round(GS.rand(s) * 45), loyalty: 45 + Math.round(GS.rand(s) * 42), ambition: 25 + Math.round(GS.rand(s) * 65), influence: 10 + Math.round(GS.rand(s) * 25), stress: 0, experience: 15, initiative: .3 + GS.rand(s) * .5, traits: traits.length ? [traits[(cid * 5 + i) % traits.length].id, traits[(cid * 7 + i + 11) % traits.length].id] : [], faction: ['reform', 'military', 'industry', 'labor', 'regional', 'security'][i % 6], rival: i ? cid * 100 : null, health: 90, active: true };
  }
  GS.makeCountry = (s, template) => {
    const c = Object.assign({ id: template.id, name: template.name, short: template.short, color: template.color, flag: template.flag, description: template.description, capital: 0, government: template.government, legitimacy: 67, stability: 66, credibility: 75, approval: 62, warSupport: 48, exhaustion: 0, corruption: 16, admin: 68, education: 64, health: 73, treasury: 800, debt: 100, inflation: 3, manpower: 85000, casualties: { killed: 0, wounded: 0, missing: 0, captured: 0, returned: 0 }, pow: 0, refugees: 0, radicalization: 7, unemployment: 4, reputation: 60, prestige: 30, staff: 62, doctrine: template.doctrine || 'balanced', doctrineProgress: 100, mobilization: 0, policies: {}, stock: { food: 850, fuel: 500, materials: 650, equipment: 450, ammo: 500, parts: 300, goods: 450, transport: 220 }, reserves: { food: 200, fuel: 150, ammo: 100 }, production: { equipment: .3, ammo: .25, fuel: .15, parts: .15, goods: .15 }, productionEfficiency: .6, industryAllocation: .42, labor: { agriculture: .3, industry: .4, transport: .15, research: .15 }, spending: { welfare: 1, research: 1, intelligence: 1, military: 1 }, factions: [], institutions: { army: 66, police: 68, intelligence: 64, legislature: 63, courts: 67, media: 64, civilService: 70 }, leaders: [], commanders: [], research: { queue: [], active: [], completed: [], adopted: [], progress: {}, institutions: [], funding: 1, focus: template.focus || 'logistics' }, techMods: {}, intel: { networks: {}, reports: {}, counter: 40, deception: 0, cipher: 0, operations: [] }, ai: { goal: 'Preserve sovereignty', beliefs: {}, actions: 0 }, automation: { production: false, military: false, intelligence: false }, trainingQueue: [], construction: [], pendingPolicies: [], history: [], coup: { stage: 0, progress: 0, support: 0, detected: false, cooldown: 0 }, alive: true, objectives: [], metrics: {}, lastElection: 0, successionDay: 540 + Math.floor(GS.rand(s) * 600), patron: null, memories: [], promises: [], cooldowns: {}, coalition: ['reform', 'labor'], fatigue: 0, veteranBurden: 0, debtArrears: 0 }, template.starting || {});
    const fl = [['reform', 'Constitutional League', 'constitutional', 'Protect civil liberties'], ['military', 'Officer Directorate', 'militarist', 'Fund the armed forces'], ['industry', 'Industrial Chamber', 'market', 'Protect investment'], ['labor', 'Workers Assembly', 'social', 'Secure wages and food'], ['regional', 'Regional Congress', 'autonomist', 'Respect regional self-government'], ['security', 'National Security Bureau', 'order', 'Strengthen internal security']];
    c.factions = fl.map(([id, name, ideology, demand], i) => ({ id, name, ideology, demand, support: [24, 18, 16, 22, 12, 8][i], influence: [20, 27, 23, 15, 10, 18][i], loyalty: 48 + GS.rand(s) * 35, leader: c.id * 100 + i }));
    const roles = ['defense', 'foreign', 'finance', 'industry', 'interior', 'intelligence', 'transport', 'reserve', 'reserve', 'reserve'];
    c.leaders = roles.map((role, i) => person(s, c.id, i, role, GS.DATA.politicalTraits || []));
    c.commanders = Array.from({ length: 5 }, (_, i) => person(s, c.id, i + 20, 'general', GS.DATA.commanderTraits || []));
    for (const law of GS.DATA.laws || []) c.policies[law.category || law.id] = law.options?.[0]?.id;
    GS.initResearch?.(c);
    return c;
  };
  GS.newUnit = (s, cid, type, region, overrides = {}) => {
    const c = GS.country(s, cid), d = GS.DATA.unitTypes[type] || Object.values(GS.DATA.unitTypes)[0];
    const index = s.units.filter(u => u.country === cid).length + 1;
    return Object.assign({ id: s.nextId++, country: cid, region, name: `${index}${index === 1 ? 'st' : index === 2 ? 'nd' : index === 3 ? 'rd' : 'th'} ${d.name}`, type, strength: 100, maxStrength: 100, manpower: d.manpower || 6000, equipment: 100, organization: 80, morale: 77, cohesion: 75, readiness: 80, fatigue: 0, stress: 0, supply: 80, training: 58, experience: 10, commander: c.commanders[index % c.commanders.length].id, order: null, stance: 'hold', planning: 0, entrenchment: 0, history: [], honors: 0, losses: 0, reliability: d.reliability || 85, foreignEquipment: 0, mission: 'reserve', missionTarget: null }, overrides);
  };
  GS.createGame = (options = {}) => {
    const seed = (Number(options.seed) || 1936) >>> 0;
    const s = { version: 1, seed, rng: seed, day: 0, player: Number(options.player) || 0, scenario: options.scenario || 'powderkeg', options: { ai: Number(options.ai) || 1, economy: Number(options.economy) || 1, uncertainty: Number(options.uncertainty) || 1 }, countries: [], regions: [], units: [], wars: [], relations: [], chronicle: [], alerts: [], events: [], battles: [], shipments: [], nextId: 1000, tension: 35, result: null, horizon: 1460, tutorial: { step: 0, actions: [] }, declarations: [], outcomes: [], weatherFront: 0 };
    GS.makeWorld(s);
    for (const template of GS.DATA.countries) {
      const c = GS.makeCountry(s, template), [ax, ay] = anchors[c.id];
      const land = s.regions.filter(r => r.owner === c.id).sort((a, b) => ((a.x - ax) ** 2 + (a.y - ay) ** 2) - ((b.x - ax) ** 2 + (b.y - ay) ** 2));
      c.capital = land[0].id; c.initialTerritory = land.length; c.initialPopulation = land.reduce((a, r) => a + r.population, 0); c.demographicPool = c.initialPopulation * .18;
      land[0].name = `${c.short || c.name.split(' ')[0]} City`; land[0].hub = true; land[0].city = true; land[0].industry = 7; land[0].energy = 8; land[0].airfield = 3; land[0].terrain = 'urban'; land[0].rail = 3; land[0].infrastructure = 92;
      c.objectives = [{ id: 'survival', name: 'Preserve a sovereign state until 1940', done: false }, { id: 'resilience', name: 'Keep legitimacy above 55 and food above 200 for 180 days', progress: 0, done: false }, { id: 'accord', name: 'Secure an alliance and adopt 8 research programs', done: false }];
      s.countries.push(c);
    }
    if (!GS.country(s, s.player)) s.player = 0;
    for (const c of s.countries) {
      const land = GS.owned(s, c.id), border = land.filter(r => r.neighbors.some(n => GS.region(s, n).owner !== c.id));
      const landTypes = Object.keys(GS.DATA.unitTypes).filter(k => GS.DATA.unitTypes[k].domain === 'land');
      const starters = ['infantry', 'infantry', 'infantry', 'motorized', 'artillery', 'garrison'];
      starters.forEach((type, i) => s.units.push(GS.newUnit(s, c.id, GS.DATA.unitTypes[type] ? type : landTypes[i % landTypes.length], (border[i % border.length] || land[0]).id)));
      const air = Object.keys(GS.DATA.unitTypes).filter(k => GS.DATA.unitTypes[k].domain === 'air');
      for (const type of air.slice(0, 2)) s.units.push(GS.newUnit(s, c.id, type, c.capital));
      const port = land.find(r => r.port), naval = Object.keys(GS.DATA.unitTypes).filter(k => GS.DATA.unitTypes[k].domain === 'naval');
      if (port) for (const type of naval.slice(0, 2)) s.units.push(GS.newUnit(s, c.id, type, port.id));
      for (const other of s.countries) if (c.id < other.id) { const r = GS.rel(s, c.id, other.id); r.opinion = [18, -24, 5, -8][(c.id + other.id) % 4]; r.trust = 50 + r.opinion / 2; }
    }
    GS.rel(s, 0, 4).opinion = 42; GS.rel(s, 0, 4).trust = 72;
    GS.rel(s, 1, 2).opinion = -60; GS.rel(s, 1, 2).trust = 15;
    if (s.scenario === 'powderkeg') { s.wars.push({ id: s.nextId++, a: 1, b: 2, aim: 'territory', started: 0, score: 0, active: true }); GS.log(s, 'war', `${GS.country(s, 1).name} and ${GS.country(s, 2).name} exchange fire along the central frontier.`); }
    if (s.scenario === 'fracture') { const c = GS.country(s, s.player); c.stability = 36; c.legitimacy = 43; c.exhaustion = 18; c.corruption = 30; c.coup.stage = 1; c.coup.progress = 12; c.coup.detected = true; c.factions.find(f => f.id === 'military').loyalty = 30; }
    GS.log(s, 'briefing', 'The Meridian Compact is fraying. Food, rail junctions and political consent will shape the coming years. You govern the state even when its government changes.', s.player);
    for (const c of s.countries) GS.computeSupply?.(s, c.id);
    GS.intelligenceTick?.(s, true);
    return s;
  };
  GS.tick = (s, days = 1) => {
    const count = Math.max(0, Math.min(2000, Math.floor(days)));
    for (let i = 0; i < count; i++) {
      if (s.result && !s.result.continued) break;
      s.day++;
      if (s.day % 6 === 1) { s.weatherFront = (s.weatherFront + 1) % 16; for (const r of s.regions) { const season = Math.floor(s.day / 90) % 4; r.weather = Math.abs(r.x - s.weatherFront) < 3 ? season === 0 ? (r.y < 5 ? 'snow' : 'cold') : season === 1 ? 'mud' : season === 2 ? (r.y > 6 ? 'heat' : 'storm') : 'rain' : 'clear'; } }
      const dayStart = new Map(s.countries.map(c=>[c.id,{...c.stock,treasury:c.treasury}]));
      GS._modCache = new Map();
      try {
      GS.economyTick(s); GS.researchTick(s); GS._modCache.clear(); GS.politicsTick(s); GS._modCache.clear(); GS.intelligenceTick(s);
      if (s.day % 3 === 0) for (const c of [...s.countries]) if (c.alive) {
        if (c.id !== s.player) GS.nationalAI(s, c.id);
        if (c.id !== s.player || c.automation.military) GS.militaryAI(s, c.id);
        if (c.id !== s.player) GS.researchAI(s, c.id);
      }
      GS.militaryTick(s); GS.societyTick(s); GS.diplomacyTick(s); GS.eventTick(s); GS.outcomeTick(s);
      for (const c of s.countries) { const before=dayStart.get(c.id); if(before) { c.metrics.daily ||= {}; for(const [key,value] of Object.entries(c.stock)) c.metrics.daily[key]=value-before[key]; c.metrics.daily.treasury=c.treasury-before.treasury; } }
      } finally { GS._modCache = null; }
      if (s.day % 7 === 0) for (const c of s.countries) { c.history.push({ day: s.day, stability: c.stability, treasury: c.treasury, food: c.stock.food, output: c.metrics.output || 0, inflation: c.inflation, debt: c.debt, exhaustion: c.exhaustion }); if (c.history.length > 600) c.history.shift(); }
    }
    return s;
  };
  function checksum(text) { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return (h >>> 0).toString(16); }
  GS.snapshot = s => { const payload = JSON.stringify(s); return JSON.stringify({ format: 'sovereigns-at-war', version: 1, checksum: checksum(payload), payload }); };
  GS.validateState = s => {
    if (!s || s.version !== 1 || !Number.isInteger(s.day) || s.day < 0 || s.day > 100000 || !Number.isInteger(s.rng)) throw new Error('Invalid campaign version, date or random state.');
    for (const key of ['countries', 'regions', 'units', 'relations', 'wars', 'chronicle', 'alerts', 'events', 'shipments', 'battles', 'declarations', 'outcomes']) if (!Array.isArray(s[key])) throw new Error(`Missing campaign ${key}.`);
    if(!Number.isInteger(s.nextId)||s.nextId<1||!s.options||!s.tutorial||!Number.isFinite(s.horizon)) throw new Error('Missing campaign controls.');
    const checkNumbers=(v,depth=0)=>{if(depth>60) throw new Error('Save nesting is too deep.'); if(typeof v==='number' && (!Number.isFinite(v)||Math.abs(v)>1e15)) throw new Error('Invalid numeric campaign state.'); if(v&&typeof v==='object') for(const [key,value] of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(key)) throw new Error('Invalid campaign key.'); checkNumbers(value,depth+1);}};
    checkNumbers(s);
    if (s.countries.length < 2 || s.countries.length > 40 || s.regions.length < 20 || s.regions.length > 2000 || s.units.length > 6000) throw new Error('Campaign dimensions are outside supported limits.');
    const ids = new Set(s.countries.map(c => c.id)), regions = new Set(s.regions.map(r => r.id));
    if (ids.size !== s.countries.length || regions.size !== s.regions.length || !ids.has(s.player)) throw new Error('Duplicate or missing country/region identifiers.');
    for (const c of s.countries) {
      for (const key of ['stock', 'research', 'policies', 'intel', 'casualties', 'production', 'spending', 'institutions', 'ai', 'coup', 'metrics','labor','reserves','automation','cooldowns']) if (!c[key] || typeof c[key] !== 'object' || Array.isArray(c[key])) throw new Error(`Missing state for ${c.name}: ${key}.`);
      for (const key of ['leaders', 'commanders', 'factions', 'trainingQueue', 'construction', 'history', 'pendingPolicies','objectives','memories']) if (!Array.isArray(c[key])) throw new Error(`Invalid ${key}.`);
      for(const key of ['treasury','debt','manpower','stability','legitimacy','admin','corruption','exhaustion','health','education','credibility','approval','staff','initialPopulation','demographicPool']) if(!Number.isFinite(c[key])) throw new Error(`Missing numeric country field: ${key}.`);
      for(const key of ['food','fuel','materials','equipment','ammo','parts','goods','transport']) if(!Number.isFinite(c.stock[key])) throw new Error(`Missing stockpile: ${key}.`);
      for(const key of ['queue','active','adopted','institutions']) if(!Array.isArray(c.research[key])) throw new Error(`Invalid research ${key}.`);
      if(!c.intel.networks||!c.intel.reports||!Array.isArray(c.intel.operations)||!GS.DATA.governments[c.government]) throw new Error('Invalid intelligence or government state.');
      for (const value of Object.values(c.stock)) if (!Number.isFinite(value) || value < -.01 || value > 1e12) throw new Error('Invalid stockpile.');
    }
    for (const r of s.regions) if (!ids.has(r.owner) || !ids.has(r.core) || !Array.isArray(r.neighbors) || r.neighbors.some(n => !regions.has(n))) throw new Error('Invalid territory ownership or route.');
    const unitIds = new Set();
    for (const u of s.units) { if (unitIds.has(u.id) || !ids.has(u.country) || !regions.has(u.region) || !GS.DATA.unitTypes[u.type] || !Number.isFinite(u.strength)) throw new Error('Invalid formation.'); unitIds.add(u.id); }
    return true;
  };
  GS.restore = text => {
    if (typeof text !== 'string' || text.length > 25e6) throw new Error('Save is empty or too large.');
    const wrapper = JSON.parse(text);
    if (wrapper.format !== 'sovereigns-at-war' || wrapper.version !== 1 || typeof wrapper.payload !== 'string' || checksum(wrapper.payload) !== wrapper.checksum) throw new Error('This save is incompatible or damaged. Your current campaign is unchanged.');
    const s = JSON.parse(wrapper.payload); GS.validateState(s); return s;
  };
})(globalThis);
