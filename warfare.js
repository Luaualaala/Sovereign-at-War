/* Sovereigns at War: deterministic command, supply and combined operations. */
(function (G) {
  'use strict';
  const GS = G.GS = G.GS || {};
  const clamp = (x, a = 0, b = 100) => Math.max(a, Math.min(b, Number.isFinite(x) ? x : a));
  const num = (x, fallback = 0) => Number.isFinite(x) ? x : fallback;
  const C = (s, id) => s.countries.find(c => c.id === id);
  const R = (s, id) => s.regions.find(r => r.id === id);
  const typeOf = u => GS.DATA.unitTypes[u.type] || GS.DATA.unitTypes.infantry;
  const domain = u => typeOf(u).domain || 'land';
  const atWar = (s, a, b) => a !== b && GS.atWar(s, a, b);
  const rel = (s, a, b) => s.relations.find(r => (r.a === a && r.b === b) || (r.a === b && r.b === a));
  const access = (s, a, b) => a === b || (!atWar(s, a, b) && !!(rel(s, a, b)?.alliance || rel(s, a, b)?.access));
  const mod = (c, key) => num(GS.mod?.(c, key));
  const modifier = (c, key) => Math.max(.15, 1 + mod(c, key));
  const log = (s, type, text, cid, rid) => GS.log?.(s, type, text, cid, rid);
  const commander = (s, u) => C(s, u.country)?.commanders?.find(o => o.id === u.commander && o.active !== false && !o.dead) || { competence: 35, loyalty: 60, initiative: .3, stress: 0, influence: 0, experience: 0, traits: [] };
  const doctrine = c => GS.DATA.doctrines?.[c.doctrine] || { retreat: 28, initiative: .4, planning: 0, attack: 0, defense: 0, supply: 0, ammo: 0, training: 0 };
  const doctrineMod = (c, key) => num(doctrine(c)[key] ?? doctrine(c).effects?.[key]) * clamp(num(c.doctrineProgress, 100)) / 100;
  const traitMod = (o, key) => (o.traits || []).reduce((sum, id) => sum + num(GS.DATA.commanderTraits?.find(t => t.id === id)?.effects?.[key]), 0);
  const unitMod = (s, u, key) => mod(C(s, u.country), key) + traitMod(commander(s, u), key);
  const unitModifier = (s, u, key) => Math.max(.15, 1 + unitMod(s, u, key));
  const weather = r => ({ clear: 1, rain: .84, snow: .67, storm: .48, heat: .79, cold: .74, mud: .49 }[r?.weather] || 1);
  const terrain = r => GS.DATA.terrains?.[r?.terrain] || { defense: 1, move: 1, supply: 1, visibility: 1 };
  const terrainFactor = (r, key) => Math.max(.15, num(terrain(r)[key], 1));
  const sum = (arr, fn) => arr.reduce((n, x) => n + fn(x), 0);
  const owned = (s, cid) => s.regions.filter(r => r.owner === cid);
  const sortedUnits = s => [...s.units].filter(u => !u.destroyed && u.strength > 0).sort((a, b) => a.id - b.id);
  const coastal = r => !!r && (!!r.port || r.terrain === 'coastal' || !!r.coastal);
  const sector = r => Math.floor(num(r?.x) / 4);
  const resources = ['food', 'ammo', 'fuel', 'parts'];

  function normalize(s, u) {
    const t = typeOf(u);
    const defaults = { strength: 100, maxStrength: 100, manpower: t.manpower || 6000, equipment: 100, organization: 75,
      morale: 75, cohesion: 65, readiness: 75, fatigue: 0, stress: 0, supply: 75, training: 50, experience: 5,
      planning: 0, entrenchment: 0, honors: 0, losses: 0, reliability: t.reliability || 80, foreignEquipment: 0,
      stance: 'hold', mission: 'reserve', missionTarget: null, order: null, history: [], isolatedDays: 0,
      combatDays: 0, familiarity: {}, supplyStores: { food: 1.5, ammo: 1.5, fuel: t.fuel > 0 ? 1.5 : 0, parts: .4 } };
    for (const [key, value] of Object.entries(defaults)) if (u[key] === undefined || u[key] === null && !['order', 'missionTarget'].includes(key)) u[key] = value;
    return u;
  }

  function dailyDemand(s, u, projected = false) {
    const t = typeOf(u), c = C(s, u.country), moving = !!u.order, firing = projected || u.inCombat || (moving && atWar(s, c.id, R(s, u.order.target)?.owner));
    const mission = domain(u) !== 'land' && !['reserve', 'repair'].includes(u.mission);
    const scale = Math.max(.1, u.strength / Math.max(1, u.maxStrength));
    const complexity = 1 + clamp(u.foreignEquipment) / 100 * Math.max(.1, .7 - unitMod(s, u, 'standardization'));
    const logisticalDiscipline = Math.max(.3, 1 + traitMod(commander(s, u), 'supply'));
    const activity = firing || mission ? 1 : moving || u.stance === 'exercise' ? .62 : .12;
    return {
      food: (.25 + num(t.supply, 1) * .28) * scale / logisticalDiscipline,
      ammo: num(t.ammo, 1) * activity * scale * complexity / unitModifier(s, u, 'ammoEfficiency') * Math.max(.2, 1 + doctrineMod(c, 'ammo')) / logisticalDiscipline,
      fuel: (num(t.fuel) * activity + num(t.supply, 1) * .03) * scale * complexity / unitModifier(s, u, 'fuelEfficiency') / logisticalDiscipline,
      parts: (.025 + num(t.fuel) * .045 + num(t.cost, 60) / 4000) * scale * complexity / logisticalDiscipline
    };
  }

  function source(s, c) {
    const capital = R(s, c.capital);
    if (capital?.owner === c.id) return { region: capital, emergency: false };
    const alternatives = owned(s, c.id).sort((a, b) => (b.industry + b.infrastructure / 30) - (a.industry + a.infrastructure / 30) || a.id - b.id);
    return alternatives.length ? { region: alternatives[0], emergency: true } : null;
  }

  function nodeCapacity(s, c, r) {
    const security = Math.max(.12, 1 - num(r.resistance) / 130);
    const damage = Math.max(.04, 1 - num(r.damage) / 105);
    const road = (.4 + num(r.infrastructure, 60) / 8 + num(r.rail) * 5) * terrainFactor(r, 'supply');
    const hub = r.hub ? 1.4 : 1;
    return Math.max(.1, road * damage * weather(r) * security * hub * modifier(c, 'supply') * Math.max(.2, 1 + doctrineMod(c, 'supply')));
  }

  function makeNetwork(s, c) {
    const src = source(s, c), edges = new Map(), adjacency = new Map();
    if (!src) return { src: null, edges, adjacency };
    const valid = s.regions.filter(r => access(s, c.id, r.owner));
    const add = (a, b, capacity, kind, cost) => {
      const key = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
      if (edges.has(key)) return;
      const edge = { key, a: a.id, b: b.id, capacity, kind, cost, demand: 0, delivered: 0 };
      edges.set(key, edge);
      if (!adjacency.has(a.id)) adjacency.set(a.id, []);
      if (!adjacency.has(b.id)) adjacency.set(b.id, []);
      adjacency.get(a.id).push(edge); adjacency.get(b.id).push(edge);
    };
    for (const a of valid) for (const bid of a.neighbors || []) {
      const b = R(s, bid);
      if (!b || !access(s, c.id, b.owner)) continue;
      const river = a.river || b.river ? Math.min(1, .72 + mod(c, 'engineering')) : 1;
      add(a, b, Math.min(nodeCapacity(s, c, a), nodeCapacity(s, c, b)) * river,
        a.river || b.river ? 'river bridge' : (a.rail && b.rail ? 'railway' : 'road'), 1 + (100 - Math.min(a.infrastructure, b.infrastructure)) / 90 + (a.damage + b.damage) / 80);
    }
    const ports = valid.filter(r => r.port);
    const shipping = Math.max(0, num(c.stock.transport)) * .16 * modifier(c, 'transport');
    for (let i = 0; i < ports.length; i++) for (let j = i + 1; j < ports.length; j++) {
      const a = ports[i], b = ports[j], block = Math.max(num(a.blockade), num(b.blockade));
      const control = num(c.navalControl?.[sector(b)], .55);
      add(a, b, Math.min(nodeCapacity(s, c, a), nodeCapacity(s, c, b), shipping) * Math.max(.02, 1 - block) * (.4 + control * .6), 'convoy / port', 4 + Math.abs(a.x - b.x) / 4);
    }
    return { src, edges, adjacency };
  }

  function pathsFrom(network) {
    const paths = new Map();
    if (!network.src) return paths;
    const root = network.src.region.id, frontier = [{ id: root, cost: 0, path: [root], edges: [] }];
    while (frontier.length) {
      frontier.sort((a, b) => a.cost - b.cost || a.id - b.id);
      const here = frontier.shift();
      if (paths.has(here.id)) continue;
      paths.set(here.id, here);
      for (const edge of network.adjacency.get(here.id) || []) {
        const next = edge.a === here.id ? edge.b : edge.a;
        if (!paths.has(next)) frontier.push({ id: next, cost: here.cost + edge.cost + 1 / Math.max(.1, edge.capacity), path: [...here.path, next], edges: [...here.edges, edge.key] });
      }
    }
    return paths;
  }

  GS.computeSupply = function (s, cid) {
    const c = C(s, cid);
    if (!c) return null;
    c.stock = c.stock || {};
    const units = sortedUnits(s).filter(u => u.country === cid).map(u => normalize(s, u));
    const network = makeNetwork(s, c), paths = pathsFrom(network), perRegion = new Map();
    const demand = { food: 0, ammo: 0, fuel: 0, parts: 0 };
    const allocations = [];
    for (const u of units) {
      const needs = dailyDemand(s, u), requested = {};
      for (const k of resources) {
        requested[k] = needs[k] + Math.max(0, needs[k] * 2 - num(u.supplyStores[k])) * .3;
        demand[k] += requested[k];
      }
      const route = paths.get(u.region), total = sum(resources, k => requested[k]);
      const allocation = { unit: u.id, region: u.region, needs, requested, delivered: {}, total, route, ratio: 0, bottleneck: 'No friendly route to national depot' };
      allocations.push(allocation);
      if (route) for (const key of route.edges) network.edges.get(key).demand += total;
      if (!perRegion.has(u.region)) perRegion.set(u.region, []);
      perRegion.get(u.region).push(allocation);
    }
    const requestedTotal = sum(resources, k => demand[k]);
    const transportFuel = Math.min(1, num(c.stock.fuel) / Math.max(1, num(c.stock.transport) * .025));
    const transportCapacity = num(c.stock.transport) * .3 * modifier(c, 'transport') * (.45 + num(c.staff, 50) / 100) * (.2 + .8 * transportFuel);
    const sourceCapacity = network.src ? (20 + num(network.src.region.industry) * 8 + (network.src.region.hub ? 15 : 0)) * (network.src.emergency ? .45 : 1) * Math.max(.2, 1 - num(c.corruption) / 140) : 0;
    const sourceRatio = Math.min(1, sourceCapacity / Math.max(.001, requestedTotal));
    const transportRatio = Math.min(1, transportCapacity / Math.max(.001, requestedTotal));
    let deliveredTotal = 0;
    for (const a of allocations) {
      let routeRatio = a.route ? Math.min(sourceRatio, transportRatio) : 0;
      a.bottleneck = !a.route ? 'No friendly route to national depot' : transportRatio < sourceRatio ? transportFuel < .5 ? 'National transport fleet: fuel shortage' : 'National transport fleet' : network.src.emergency ? 'Emergency depot after capital loss' : 'National depot throughput';
      if (a.route) for (const key of a.route.edges) {
        const e = network.edges.get(key), edgeRatio = Math.min(1, e.capacity / Math.max(.001, e.demand));
        if (edgeRatio < routeRatio) { routeRatio = edgeRatio; a.bottleneck = `${e.kind}: ${R(s, e.a).name} → ${R(s, e.b).name}`; }
      }
      let worstRatio = 1;
      for (const k of resources) {
        const stockRatio = Math.min(1, num(c.stock[k]) / Math.max(.001, demand[k]));
        const ratio = Math.min(routeRatio, stockRatio);
        a.delivered[k] = a.requested[k] * ratio;
        if (a.requested[k] > .001 && ratio < worstRatio) {
          worstRatio = ratio;
          if (stockRatio < routeRatio) a.bottleneck = `National ${k === 'parts' ? 'spare parts' : k} stockpile`;
        }
      }
      a.ratio = a.total > 0 ? sum(resources, k => a.delivered[k]) / a.total : routeRatio;
      deliveredTotal += sum(resources, k => a.delivered[k]);
      if (a.route) for (const key of a.route.edges) network.edges.get(key).delivered += sum(resources, k => a.delivered[k]);
      const u = units.find(x => x.id === a.unit);
      u.logistics = { demand: a.needs, requested: a.requested, delivered: a.delivered, ratio: a.ratio, route: a.route?.path || [], bottleneck: a.ratio > .995 ? 'Adequate' : a.bottleneck };
    }
    for (const r of owned(s, cid)) {
      const route = paths.get(r.id), regAlloc = perRegion.get(r.id) || [];
      r.supplyPath = route?.path || [];
      r.supplyCapacity = route ? Math.min(sourceCapacity, transportCapacity, ...route.edges.map(k => network.edges.get(k).capacity)) : 0;
      r.supply = regAlloc.length ? 100 * sum(regAlloc, a => sum(resources, k => a.delivered[k])) / Math.max(.001, sum(regAlloc, a => a.total)) : route ? Math.min(100, r.supplyCapacity * 12) : 0;
      r.supplyBottleneck = regAlloc.length ? r.supply > 99.5 ? 'Adequate' : [...regAlloc].sort((a, b) => a.ratio - b.ratio)[0].bottleneck : route ? 'No formation demand' : 'No friendly route';
      r.depotStock = r.id === network.src?.region.id ? { ...c.stock } : null;
    }
    c.logistics = { day: s.day, demand, requestedTotal, deliveredTotal, transportCapacity, sourceCapacity,
      source: network.src?.region.id ?? null, emergency: !!network.src?.emergency,
      satisfaction: requestedTotal ? deliveredTotal / requestedTotal : 1,
      bottlenecks: allocations.filter(a => a.ratio < .8).map(a => ({ unit: a.unit, region: a.region, ratio: a.ratio, reason: a.bottleneck })),
      links: [...network.edges.values()].filter(e => e.demand > 0), allocatedTransport: Math.min(num(c.stock.transport), requestedTotal / .3) };
    return c.logistics;
  };

  GS.supplyForecast = function (s, cid, unitIds) {
    const c = C(s, cid);
    if (!c) return null;
    const units = sortedUnits(s).filter(u => u.country === cid && (!unitIds || unitIds.includes(u.id)));
    const demand = { food: 0, ammo: 0, fuel: 0, parts: 0 };
    for (const u of units) { const needs = dailyDemand(s, u, true); for (const k of resources) demand[k] += needs[k]; }
    const dailyTotal = sum(resources, k => demand[k]);
    const capacity = Math.min(num(c.logistics?.sourceCapacity), num(c.logistics?.transportCapacity));
    return { demand, dailyTotal, capacity, sustainableFormations: dailyTotal ? Math.floor(units.length * capacity / dailyTotal) : 0,
      fuelDays: demand.fuel > 0 ? num(c.stock.fuel) / demand.fuel : null,
      ammoDays: demand.ammo > 0 ? num(c.stock.ammo) / demand.ammo : null,
      foodDays: demand.food > 0 ? num(c.stock.food) / demand.food : null,
      warning: dailyTotal > capacity ? 'Planned offensive exceeds national transport or depot capacity.' : 'National capacity sufficient; inspect the route for local restrictions.' };
  };

  GS.visibleRegions = function (s, cid) {
    const visible = new Set();
    for (const r of s.regions) if (access(s, cid, r.owner)) { visible.add(r.id); for (const n of r.neighbors) visible.add(n); }
    const c = C(s, cid);
    for (const [rid, coverage] of Object.entries(c?.airCoverage || {})) if (coverage.recon > .05) visible.add(Number(rid));
    return visible;
  };

  function pathTo(s, cid, from, target, allowEnemy = true) {
    if (from === target) return [from];
    const queue = [[from]], seen = new Set([from]);
    while (queue.length) {
      const path = queue.shift(), r = R(s, path[path.length - 1]);
      for (const id of [...(r?.neighbors || [])].sort((a, b) => a - b)) {
        if (seen.has(id)) continue;
        const n = R(s, id);
        if (!n || (!access(s, cid, n.owner) && !(allowEnemy && atWar(s, cid, n.owner)))) continue;
        const next = [...path, id];
        if (id === target) return next;
        seen.add(id); queue.push(next);
      }
    }
    return null;
  }

  GS.issueOrder = function (s, cid, uid, target, { plan = false, amphibious = false } = {}) {
    const c = C(s, cid), u = s.units.find(x => x.id === uid), dest = R(s, target);
    if (!c || !u || u.country !== cid || u.destroyed || !dest) return { ok: false, message: 'Select one of your active formations and a region.' };
    normalize(s, u);
    if (domain(u) !== 'land') return { ok: false, message: 'Aircraft and ships use mission assignments.' };
    if (!access(s, cid, dest.owner) && !atWar(s, cid, dest.owner)) return { ok: false, message: 'Military access or a declared war is required.' };
    if (u.mutinied) return { ok: false, message: 'This formation has mutinied. Restore pay, food and confidence before issuing orders.' };
    if (u.region === target) { u.order = null; return { ok: true, message: 'Formation will hold its current position.' }; }
    let route = pathTo(s, cid, u.region, target), embark = null;
    if (amphibious) {
      const home = R(s, u.region), unlocked = c.capabilities?.includes('marines') || c.capabilities?.includes('landing_craft') || c.capabilities?.includes('amphibious') || mod(c, 'amphibious') > 0 || u.type === 'marines';
      if (!unlocked) return { ok: false, message: 'Landing craft doctrine or marine capability is required.' };
      if (!home?.port || !coastal(dest)) return { ok: false, message: 'Embark at a friendly port and target a coastal region.' };
      if (num(c.stock.transport) < 15 || num(c.stock.fuel) < 8) return { ok: false, message: 'Landing requires 15 transport capacity and 8 fuel in reserve.' };
      if (num(c.navalControl?.[sector(dest)]) < .55) return { ok: false, message: 'Establish at least 55% naval control in the landing sector.' };
      const report = c.intel?.reports?.[dest.id];
      if (!report || s.day - report.day > 20 || report.confidence < 30) return { ok: false, message: 'A recent reconnaissance report with at least 30% confidence is required.' };
      route = [u.region, target]; embark = u.region;
    }
    if (!route) return { ok: false, message: 'No land route with military access exists.' };
    const o = commander(s, u), home = R(s, u.region), capital = R(s, c.capital);
    const distance = capital ? Math.hypot(home.x - capital.x, home.y - capital.y) : 6;
    const govDelay = num(GS.DATA.governments?.[c.government]?.delay, 1);
    const friction = (2 + distance * .16 + (100 - u.cohesion) / 55 + (100 - num(c.staff, 50)) / 35 + (1 - weather(home)) * 3 + (100 - home.infrastructure) / 50 + num(c.communicationsDisruption) / 25 + (num(c.jammedUntil)>s.day ? 3 : 0))
      / Math.max(.25, (1 + mod(c, 'command') + traitMod(o, 'command')) * (.65 + o.competence / 100));
    const delay = Math.max(1, Math.ceil(friction + govDelay * .25));
    if (u.order?.target !== target) u.planning *= .4;
    u.order = { target, delay, progress: 0, plan: !!plan, amphibious: !!amphibious, path: route, embark, issued: s.day, readyDay: s.day + delay, startDay: plan ? s.day + delay + 7 : s.day + delay };
    u.stance = 'advance'; u.entrenchment = 0;
    return { ok: true, message: `${u.name}: orders arrive in ${delay} days${plan ? '; seven days of preparation follow' : ''}.` };
  };

  GS.setStance = function (s, cid, uid, stance) {
    if (stance === 'train') stance = 'exercise';
    const u = s.units.find(x => x.id === uid && x.country === cid);
    if (!u || u.destroyed || !['hold', 'rest', 'exercise', 'garrison', 'reserve', 'advance', 'leave'].includes(stance)) return { ok: false, message: 'Unknown formation or stance.' };
    normalize(s, u);
    if (stance === 'leave' && (u.inCombat || u.supply < 40)) return { ok: false, message: 'Leave requires a supplied formation out of combat.' };
    u.stance = stance;
    if (stance !== 'advance') u.order = null;
    return { ok: true, message: `${u.name} assigned to ${stance}.` };
  };

  GS.setDoctrine = function (s, cid, id) {
    const c = C(s, cid);
    if (!c || !GS.DATA.doctrines[id]) return { ok: false, message: 'Unknown doctrine.' };
    if (c.doctrine === id) return { ok: false, message: 'This doctrine is already in use.' };
    if (c.treasury < 35) return { ok: false, message: 'Staff reform requires 35 treasury.' };
    c.treasury -= 35; c.doctrine = id; c.doctrineProgress = 0;
    for (const u of s.units.filter(x => x.country === cid)) { u.organization = clamp(u.organization - 12); u.planning *= .25; }
    log(s, 'military', `${c.name} begins adopting ${GS.DATA.doctrines[id].name}; retraining temporarily disrupts command.`, cid);
    return { ok: true, message: 'Doctrine reform begun. Exercises and staff quality determine adoption speed.' };
  };

  GS.assignCommander = function (s, cid, uid, commanderId) {
    const c = C(s, cid), u = s.units.find(x => x.id === uid && x.country === cid), o = c?.commanders.find(x => x.id === commanderId && !x.dead && x.active !== false);
    if (!u || u.destroyed || !o) return { ok: false, message: 'Choose an active formation and serving commander.' };
    u.commander = commanderId; u.organization = clamp(u.organization - 5); u.planning *= .8;
    o.influence = clamp(num(o.influence) + .5);
    return { ok: true, message: `${o.name} assigned to ${u.name}; command handover costs some organization.` };
  };

  GS.createOperation = function (s, cid, { name = 'Operation Resolve', unitIds = [], target, startDay, reserveIds = [] } = {}) {
    const c = C(s, cid), units = s.units.filter(u => u.country === cid && unitIds.includes(u.id) && !reserveIds.includes(u.id));
    if (!c || !units.length || !R(s, target)) return { ok: false, message: 'Select an objective and participating formations.' };
    const results = units.map(u => ({ id: u.id, result: GS.issueOrder(s, cid, u.id, target, { plan: true }) }));
    const accepted = results.filter(x => x.result.ok);
    if (!accepted.length) return results[0].result;
    const op = { id: s.nextId++, name: String(name).slice(0, 80), country: cid, unitIds: accepted.map(x => x.id), reserveIds: [...reserveIds], target, created: s.day, startDay: Math.max(s.day + 8, num(startDay, s.day + 14)), active: true };
    s.operations = s.operations || []; s.operations.push(op);
    for (const u of units.filter(u => accepted.some(a => a.id === u.id))) { u.order.startDay = Math.max(u.order.readyDay, op.startDay); u.order.operation = op.id; }
    for (const uid of reserveIds) { const u = s.units.find(u => u.id === uid && u.country === cid); if (u) GS.setStance(s, cid, uid, 'reserve'); }
    log(s, 'military', `${op.name} prepared for ${R(s, target).name}. ${accepted.length} formations; ${reserveIds.length} reserves.`, cid, target);
    return { ok: true, message: `${op.name} scheduled with ${accepted.length} formations.`, operation: op.id, forecast: GS.supplyForecast(s, cid, op.unitIds) };
  };

  GS.recruit = function (s, cid, type, trainingMode = 'balanced') {
    const c = C(s, cid), t = GS.DATA.unitTypes[type];
    if (!c || !c.alive || !t) return { ok: false, message: 'Unknown country or formation type.' };
    if (num(c.disarmedUntil) > s.day) return { ok: false, message: 'Peace terms temporarily prohibit recruitment.' };
    if (t.tech && !c.research?.adopted?.includes(t.tech) && !c.capabilities?.includes(type)) return { ok: false, message: 'This formation requires its production technology to be adopted.' };
    if (!['rapid', 'balanced', 'extended'].includes(trainingMode)) return { ok: false, message: 'Choose rapid, balanced or extended training.' };
    const bases = owned(s, cid).filter(r => t.domain === 'naval' ? r.port : t.domain === 'air' ? r.airfield > 0 : true).sort((a, b) => (b.infrastructure + b.industry * 4) - (a.infrastructure + a.industry * 4) || a.id - b.id);
    if (!bases.length) return { ok: false, message: t.domain === 'naval' ? 'A controlled port is required.' : t.domain === 'air' ? 'A controlled airfield is required.' : 'A controlled region is required.' };
    const costs = typeof t.cost === 'object' ? t.cost : { equipment: num(t.cost, 70), ammo: num(t.ammo, 1) * 6, fuel: num(t.fuel) * 5, materials: num(t.cost, 70) * .2 };
    const manpower = num(t.manpower, 6000), cash = num(t.treasuryCost, typeof t.cost === 'number' ? t.cost * .35 : 25);
    if (c.manpower < manpower || c.treasury < cash || Object.entries(costs).some(([k, v]) => num(c.stock[k]) < v)) return { ok: false, message: 'Recruitment needs manpower, treasury and the listed equipment resources.' };
    c.manpower -= manpower; c.treasury -= cash;
    for (const [k, v] of Object.entries(costs)) c.stock[k] -= v;
    const mode = { rapid: [.6, 30], balanced: [1, 55], extended: [1.5, 75] }[trainingMode];
    const days = Math.max(4, Math.ceil(num(t.days, 28) * mode[0] / modifier(c, 'training')));
    c.trainingQueue = c.trainingQueue || [];
    c.trainingQueue.push({ id: s.nextId++, type, region: bases[0].id, manpower, days, progress: 0, mode: trainingMode, quality: mode[1], paid: { ...costs }, requested: s.day, stalled: '' });
    return { ok: true, message: `${t.name} queued: ${days} training days with ${trainingMode} preparation.` };
  };

  const missionLists = { air: ['reserve', 'superiority', 'interception', 'recon', 'support', 'bombing', 'transport', 'naval_strike'], naval: ['reserve', 'escort', 'raid', 'blockade', 'patrol', 'repair'] };
  GS.missions = missionLists;
  GS.setMission = function (s, cid, uid, mission, target) {
    const c = C(s, cid), u = s.units.find(x => x.id === uid && x.country === cid), r = R(s, target);
    if (!c || !u || u.destroyed || !missionLists[domain(u)]?.includes(mission)) return { ok: false, message: 'This mission is not available for the selected formation.' };
    normalize(s, u);
    const d = domain(u);
    if (!['reserve', 'repair'].includes(mission) && !r) return { ok: false, message: 'Select a mission region.' };
    if (d === 'air' && !R(s, u.region)?.airfield) return { ok: false, message: 'Aircraft require a friendly airfield.' };
    if (d === 'naval' && !R(s, u.region)?.port) return { ok: false, message: 'The fleet needs a friendly home port.' };
    if (['bombing', 'naval_strike', 'raid', 'blockade'].includes(mission) && !atWar(s, cid, r?.owner)) return { ok: false, message: 'This offensive mission requires a declared war.' };
    if (d === 'naval' && r && !coastal(r)) return { ok: false, message: 'Naval missions require a coastal region.' };
    if (mission === 'transport' && r && !access(s, cid, r.owner)) return { ok: false, message: 'Air supply requires a friendly or accessible destination.' };
    u.mission = mission; u.missionTarget = r?.id ?? null;
    return { ok: true, message: `${u.name}: ${mission.replaceAll('_', ' ')}${r ? ' over ' + r.name : ''}.` };
  };

  function doctrineRetreat(c) {
    const r = num(doctrine(c).retreat, 28);
    return r <= 1 ? r * 100 : r;
  }

  GS.combatPower = function (s, u, defending = false) {
    if (!u || u.destroyed || u.strength <= 0) return 0;
    const t = typeOf(u), c = C(s, u.country), o = commander(s, u), r = R(s, u.region);
    if (!c || !r) return 0;
    const physical = clamp(u.strength) / 100 * (.15 + clamp(u.equipment) / 118) * (.25 + clamp(u.readiness) / 135);
    const human = (.2 + clamp(u.organization) / 125) * (.3 + clamp(u.morale) / 142) * (.45 + clamp(u.cohesion) / 180) * (1 + clamp(u.training) / 160 + clamp(u.experience) / 130);
    const mental = Math.max(.12, 1 - clamp(u.fatigue) * .006 - clamp(u.stress) * .005);
    const supply = (.12 + clamp(u.supply) / 114) * (.12 + .88 * clamp(num(u.ammunition, 1), 0, 1));
    const leader = (.7 + clamp(o.competence) / 150) * (1 - clamp(o.stress) / 220) * (1 + traitMod(o, defending ? 'defense' : 'attack'));
    const tech = modifier(c, defending ? 'defense' : 'attack') * Math.max(.2, 1 + doctrineMod(c, defending ? 'defense' : 'attack'));
    let environment = weather(r);
    if (defending) environment *= terrainFactor(r, 'defense') * (1 + clamp(u.entrenchment) / 220 + num(r.fort) * .16);
    else environment *= 1 + clamp(u.planning) / 190;
    environment *= 1 + Math.min(.12, num(u.familiarity?.[r.terrain]) / 700);
    if (u.type === 'mountain' && r.terrain === 'mountains') environment *= 1.18;
    if (u.stance === 'leave') environment *= .65;
    if (u.mutinied) environment *= .12;
    const domainTech = domain(u) === 'air' ? unitModifier(s, u, 'airPower') : domain(u) === 'naval' ? unitModifier(s, u, 'navalPower') : 1;
    return Math.max(.01, num(t[defending ? 'defense' : 'attack'], 10) * physical * human * mental * supply * leader * tech * environment * domainTech);
  };

  function recordLoss(s, u, points, enemyId = null, cause = 'combat') {
    const c = C(s, u.country), actual = Math.min(u.strength, Math.max(0, points));
    if (!c || actual <= 0) return 0;
    const people = Math.min(u.manpower, Math.round(num(typeOf(u).manpower, 6000) * actual / 100));
    const medical = Math.min(.7, .34 + unitMod(s, u, 'medical') * .2 + clamp(u.supply) / 800);
    const wounded = Math.round(people * medical), killed = Math.round((people - wounded) * (cause === 'desertion' ? .02 : .76)), missing = people - wounded - killed;
    c.casualties = c.casualties || { killed: 0, wounded: 0, missing: 0, captured: 0, returned: 0 };
    c.casualties.killed += killed; c.casualties.wounded += wounded; c.casualties.missing += missing;
    c.woundedPool = num(c.woundedPool) + wounded;
    c.exhaustion = clamp(c.exhaustion + people / 28000); c.warSupport = clamp(c.warSupport - people / 75000);
    u.manpower = Math.max(0, u.manpower - people); u.strength = Math.max(0, u.strength - actual); u.losses += people;
    u.equipment = clamp(u.equipment - actual * .62); u.morale = clamp(u.morale - actual * 1.15); u.cohesion = clamp(u.cohesion - actual * .45);
    if (enemyId !== null) { const enemy = C(s, enemyId); if (enemy) enemy.prestige = clamp(num(enemy.prestige) + actual / 140); }
    if (u.strength < .5 || u.manpower <= 0) { u.destroyed = true; u.strength = 0; u.order = null; log(s, 'battle', `${u.name} was destroyed by ${cause}.`, u.country, u.region); }
    return people;
  }

  function surrender(s, u, enemyId, reason) {
    if (u.destroyed) return;
    const c = C(s, u.country), enemy = C(s, enemyId), people = Math.round(u.manpower);
    c.casualties.captured += people;
    if (enemy) {
      enemy.pow = num(enemy.pow) + people;
      enemy.prisoners = enemy.prisoners || {}; enemy.prisoners[c.id] = num(enemy.prisoners[c.id]) + people;
      enemy.stock.equipment = num(enemy.stock.equipment) + u.equipment * .22;
      enemy.capturedEquipment = num(enemy.capturedEquipment) + u.equipment * .22;
      enemy.foreignEquipmentStock = num(enemy.foreignEquipmentStock) + u.equipment * .22;
    }
    c.exhaustion = clamp(c.exhaustion + people / 10000); c.stability = clamp(c.stability - people / 50000);
    u.destroyed = true; u.surrendered = true; u.manpower = 0; u.strength = 0; u.order = null;
    u.history.push({ day: s.day, event: 'surrender', text: reason, prisoners: people });
    const o = commander(s, u); o.stress = clamp(num(o.stress) + 12); o.influence = clamp(num(o.influence) - 4);
    log(s, 'battle', `${u.name} surrendered ${people.toLocaleString('en-US')} personnel: ${reason}.`, u.country, u.region);
  }

  function retreat(s, u, enemyId, origin, reason) {
    const r = R(s, u.region), c = C(s, u.country), o = commander(s, u);
    const candidates = (r.neighbors || []).map(id => R(s, id)).filter(n => n && n.id !== origin && access(s, c.id, n.owner) && !s.units.some(x => !x.destroyed && x.region === n.id && atWar(s, c.id, x.country)));
    candidates.sort((a, b) => (num(b.supply) + b.infrastructure / 3 + (b.owner === c.id ? 20 : 0)) - (num(a.supply) + a.infrastructure / 3 + (a.owner === c.id ? 20 : 0)) || a.id - b.id);
    if (!candidates.length) {
      u.isolatedDays += 1; u.organization = clamp(u.organization - 6); u.morale = clamp(u.morale - 5); u.stress = clamp(u.stress + 6);
      if (u.morale < 20 || u.organization < 12 || u.strength < 20) surrender(s, u, enemyId, 'encircled without a viable retreat route');
      return false;
    }
    const rout = u.morale < 18 || u.cohesion < 20 || u.stress > 87;
    if (rout) recordLoss(s, u, Math.min(6, 1 + (100 - o.competence) / 25), enemyId, 'rout');
    u.region = candidates[0].id; u.order = null; u.stance = 'rest'; u.entrenchment = 0; u.planning = 0;
    u.organization = Math.max(12, u.organization); u.retreatUntil = s.day + (rout ? 6 : 3);
    u.history.push({ day: s.day, event: rout ? 'rout' : 'retreat', text: reason });
    log(s, 'battle', `${u.name} ${rout ? 'routed' : 'withdrew'} to ${candidates[0].name}: ${reason}.`, u.country, u.region);
    return true;
  }

  function capture(s, u, rid) {
    const r = R(s, rid), prior = r.owner;
    u.region = rid; u.entrenchment = 0;
    if (prior === u.country || access(s, u.country, prior)) return;
    r.owner = u.country; r.compliance = r.core === u.country ? Math.max(50, num(r.compliance)) : 15;
    r.resistance = r.core === u.country ? Math.max(0, num(r.resistance) - 20) : clamp(num(r.resistance) + 20);
    r.unrest = clamp(num(r.unrest) + 12); r.damage = clamp(num(r.damage) + 2); r.occupation = 'civilian';
    const c = C(s, u.country), o = commander(s, u), loser = C(s, prior);
    c.prestige = clamp(num(c.prestige) + (r.city ? 1.2 : .4));
    if (loser) loser.exhaustion = clamp(loser.exhaustion + (r.city ? 1 : .25));
    o.experience = clamp(num(o.experience) + .4); o.influence = clamp(num(o.influence) + .25); o.stress = clamp(num(o.stress) - .2);
    for (const war of s.wars.filter(w => w.active && ((w.a === u.country && w.b === prior) || (w.b === u.country && w.a === prior)))) war.score = num(war.score) + (war.a === u.country ? 1 : -1) * (r.city ? 3 : 1);
    u.honors += r.city ? 1 : 0; u.history.push({ day: s.day, event: 'capture', region: rid, text: `${r.name} secured` });
    c.stock.equipment += num(r.salvage) * (.5 + unitMod(s, u, 'salvage')); r.salvage = 0;
    log(s, 'territory', `${c.name} secured ${r.name}${r.core === u.country ? ' and restored local administration' : '; occupation administration begins'}.`, u.country, rid);
  }

  function resupply(s) {
    for (const c of s.countries.filter(c => c.alive)) GS.computeSupply(s, c.id);
    for (const u of sortedUnits(s)) {
      const c = C(s, u.country), a = u.logistics;
      if (!c || !a) continue;
      const ratios = {};
      for (const k of resources) {
        const delivered = Math.min(num(c.stock[k]), a.delivered[k]); c.stock[k] = Math.max(0, num(c.stock[k]) - delivered);
        u.supplyStores[k] = num(u.supplyStores[k]) + delivered;
        const consumed = Math.min(u.supplyStores[k], a.demand[k]);
        u.supplyStores[k] -= consumed; ratios[k] = a.demand[k] > .001 ? consumed / a.demand[k] : 1;
      }
      u.rations = ratios.food; u.ammunition = ratios.ammo; u.fuelRatio = ratios.fuel; u.maintenance = ratios.parts;
      u.supply = clamp(100 * (.35 * ratios.food + .3 * ratios.ammo + .2 * ratios.fuel + .15 * ratios.parts));
      u.isolatedDays = a.route.length ? 0 : u.isolatedDays + 1;
      if (!a.route.length && num(R(s, u.region)?.farms) > 0) {
        const r = R(s, u.region), forage = Math.min(.3, num(r.farms) / 30);
        u.rations = Math.min(1, u.rations + forage); u.supply = clamp(u.supply + forage * 15);
        r.unrest = clamp(num(r.unrest) + .2); r.compliance = clamp(num(r.compliance) - .1); r.wealth = clamp(num(r.wealth) - .1);
      }
    }
  }

  function trainingTick(s) {
    for (const c of s.countries.filter(c => c.alive)) {
      c.doctrineProgress = clamp(num(c.doctrineProgress, 100) + .35 + num(c.staff, 50) / 100);
      for (const q of c.trainingQueue || []) {
        const base = R(s, q.region), t = GS.DATA.unitTypes[q.type];
        if (!base || base.owner !== c.id) {
          const fallback = owned(s, c.id).find(r => t.domain === 'air' ? r.airfield > 0 : t.domain === 'naval' ? r.port : true);
          if (!fallback) { q.stalled = 'No secure training base'; continue; }
          q.region = fallback.id; q.progress = Math.max(0, q.progress - 3); q.stalled = 'Training evacuated to a new base'; continue;
        }
        const fuel = num(t.fuel) * .15, food = q.manpower / 15000;
        if (num(c.stock.fuel) < fuel || num(c.stock.food) < food || c.treasury < .1) { q.stalled = 'Training lacks fuel, food or payroll'; continue; }
        c.stock.fuel -= fuel; c.stock.food -= food; c.treasury -= .1; q.stalled = '';
        q.progress += (.55 + num(c.education, 50) / 110 + num(c.staff, 50) / 250) * (1 + doctrineMod(c, 'training'));
        if (q.progress < q.days) continue;
        const cadre = num(c.veteranCadres), quality = clamp(q.quality + mod(c, 'training') * 20 + Math.min(12, cadre / 200));
        const u = { id: s.nextId++, country: c.id, region: q.region, name: `${1 + s.units.filter(x => x.country === c.id && x.type === q.type).length}. ${t.name}`, type: q.type,
          manpower: q.manpower, training: quality, experience: q.mode === 'extended' ? 12 : 3, organization: 45 + quality * .4, readiness: 50 + quality * .4,
          commander: c.commanders?.filter(o => !o.dead && o.active !== false).sort((a, b) => b.competence - a.competence)[0]?.id ?? 0 };
        normalize(s, u); u.history.push({ day: s.day, event: 'formed', text: `${q.mode} training completed` });
        s.units.push(u); q.complete = true; c.veteranCadres = Math.max(0, cadre - 50);
        log(s, 'military', `${u.name} completed training at ${R(s, q.region).name}.`, c.id, q.region);
      }
      c.trainingQueue = (c.trainingQueue || []).filter(q => !q.complete);
      const recovered = Math.min(num(c.woundedPool), Math.max(0, num(c.woundedPool) * .004 * modifier(c, 'medical') * (.5 + num(c.health, 50) / 100)));
      c.woundedPool = Math.max(0, num(c.woundedPool) - recovered); c.manpower += recovered;
      if (c.casualties) c.casualties.returned += recovered;
    }
  }

  function missionPower(s, u) {
    const c = C(s, u.country), base = R(s, u.region), target = R(s, u.missionTarget), d = domain(u);
    if (!base || !target || !access(s, c.id, base.owner)) return 0;
    const distance = Math.hypot(base.x - target.x, base.y - target.y);
    const range = num(typeOf(u).range, d === 'air' ? 9 : 25) * modifier(c, 'speed');
    if (distance > range) { u.missionStatus = 'Target outside operational range'; return 0; }
    const planes = s.units.filter(v => !v.destroyed && v.region === u.region && v.country === c.id && domain(v) === d);
    const capacity = d === 'air' ? num(base.airfield) * 3 * unitModifier(s, u, 'sortie') : base.port ? 8 : 0;
    const crowding = Math.min(1, capacity / Math.max(1, planes.length));
    // Equipment attack/defense are normalized around 1; mission throughput is measured in sortie groups.
    const power = GS.combatPower(s, u) * 10 * crowding * Math.max(0, num(u.fuelRatio, 1)) * Math.max(0, num(u.maintenance, 1)) * weather(target);
    u.missionStatus = power < .1 ? 'Grounded by fuel, maintenance or base capacity' : crowding < 1 ? 'Reduced operations: base overcrowded' : 'Mission active';
    return power;
  }

  function missionsTick(s) {
    for (const c of s.countries) { c.airCoverage = {}; c.navalControl = {}; }
    for (const r of s.regions) r.blockade = 0;
    const air = [], sea = [];
    for (const u of sortedUnits(s)) {
      if (domain(u) === 'land' || ['reserve', 'repair'].includes(u.mission)) continue;
      const power = missionPower(s, u), target = R(s, u.missionTarget);
      if (power <= .01 || !target) continue;
      (domain(u) === 'air' ? air : sea).push({ u, power, target });
      u.fatigue = clamp(u.fatigue + .35); u.experience = clamp(u.experience + .04);
    }
    // Mission combat is resolved from a common snapshot so iteration order cannot award first fire.
    const airLoss = new Map(), seaLoss = new Map();
    for (const f of air) {
      const interceptors = air.filter(e => atWar(s, f.u.country, e.u.country) && ['superiority', 'interception'].includes(e.u.mission) && Math.hypot(e.target.x - f.target.x, e.target.y - f.target.y) <= 3);
      const enemyPower = sum(interceptors, e => e.power), escort = sum(air.filter(e => e.u.country === f.u.country && ['superiority', 'interception'].includes(e.u.mission) && Math.hypot(e.target.x - f.target.x, e.target.y - f.target.y) <= 3), e => e.power);
      const suppression = 1 / (1 + enemyPower / Math.max(2, f.power + escort));
      f.effective = f.power * suppression;
      if (enemyPower > 0) airLoss.set(f.u.id, Math.min(4, enemyPower / Math.max(3, f.power + escort) * .7));
      const c = C(s, f.u.country), rid = f.target.id;
      if (!c.airCoverage[rid]) c.airCoverage[rid] = { superiority: 0, recon: 0, support: 0 };
      const coverage = c.airCoverage[rid];
      if (['superiority', 'interception'].includes(f.u.mission)) coverage.superiority += f.effective / 10;
      if (f.u.mission === 'recon') coverage.recon += f.effective / 12 * unitModifier(s, f.u, 'recon');
      if (f.u.mission === 'support') coverage.support += f.effective / 15;
      if (f.u.mission === 'bombing' && atWar(s, c.id, f.target.owner)) {
        const damage = Math.min(2, f.effective * .075), target = f.target, victim = C(s, target.owner);
        target.damage = clamp(num(target.damage) + damage); target.housing = clamp(num(target.housing, 100) - damage * .15);
        target.unrest = clamp(num(target.unrest) + damage * .1); target.displaced = num(target.displaced) + Math.round(target.population * damage / 20000);
        if (victim) { victim.exhaustion = clamp(victim.exhaustion + damage * .04); victim.stock.fuel = Math.max(0, victim.stock.fuel - damage * .3); }
        if (s.day % 10 === c.id % 10) log(s, 'air', `${c.name} aircraft damaged infrastructure near ${target.name}; civilian disruption is growing.`, c.id, rid);
      }
      if (f.u.mission === 'transport' && access(s, c.id, f.target.owner)) {
        const receivers = sortedUnits(s).filter(u => u.country === c.id && u.region === rid && domain(u) === 'land');
        const amount = Math.min(num(c.stock.food), f.effective * .12);
        if (receivers.length) { c.stock.food -= amount; for (const u of receivers) u.supplyStores.food += amount / receivers.length; }
      }
      if (f.u.mission === 'naval_strike' && atWar(s, c.id, f.target.owner)) for (const fleet of sea.filter(e => atWar(s, c.id, e.u.country) && sector(e.target) === sector(f.target))) seaLoss.set(fleet.u.id, num(seaLoss.get(fleet.u.id)) + Math.min(3, f.effective * .08));
    }
    for (const f of sea) {
      const enemies = sea.filter(e => atWar(s, f.u.country, e.u.country) && sector(e.target) === sector(f.target));
      const friends = sea.filter(e => access(s, f.u.country, e.u.country) && sector(e.target) === sector(f.target));
      const enemyPower = sum(enemies, e => e.power), friendlyPower = sum(friends, e => e.power), c = C(s, f.u.country);
      c.navalControl[sector(f.target)] = friendlyPower / Math.max(.01, friendlyPower + enemyPower + 2);
      const detection = clamp(.25 + unitMod(s, f.u, 'detection') + (f.u.type === 'destroyer' ? .25 : .1), .1, .9);
      if (enemyPower > 0 && GS.rand(s) < detection) seaLoss.set(f.u.id, num(seaLoss.get(f.u.id)) + Math.min(5, enemyPower / Math.max(2, friendlyPower) * .65));
      if (['raid', 'blockade'].includes(f.u.mission) && atWar(s, c.id, f.target.owner)) {
        const victim = C(s, f.target.owner), escorts = sea.filter(e => e.u.country === f.target.owner && e.u.mission === 'escort' && sector(e.target) === sector(f.target));
        const protection = sum(escorts, e => e.power * unitModifier(s, e.u, 'convoyProtection'));
        const effect = clamp(f.power / (f.power + protection + 6), 0, .9);
        f.target.blockade = Math.max(f.target.blockade, effect);
        if (f.u.mission === 'raid' && victim) {
          const lost = Math.min(victim.stock.transport, effect * .18); victim.stock.transport -= lost;
          victim.metrics = victim.metrics || {}; victim.metrics.convoyLosses = num(victim.metrics.convoyLosses) + lost;
          for (const shipment of s.shipments || []) if (shipment.to === victim.id && !shipment.arrived) shipment.loss = clamp(num(shipment.loss) + effect * .03, 0, .95);
        }
      }
    }
    for (const [uid, loss] of [...airLoss, ...seaLoss]) {
      const u = s.units.find(u => u.id === uid); recordLoss(s, u, loss, null, domain(u) === 'air' ? 'air combat' : 'naval action');
      u.organization = clamp(u.organization - loss * 2); u.stress = clamp(u.stress + loss * 1.2);
      if (u.strength < 35 || u.organization < 22) { u.mission = domain(u) === 'naval' ? 'repair' : 'reserve'; u.missionStatus = 'Withdrawn to recover'; }
    }
  }

  function moveAndFight(s) {
    const active = sortedUnits(s).filter(u => domain(u) === 'land'), engagements = new Map(), pending = [];
    for (const u of active) u.inCombat = false;
    for (const u of active) {
      const o = u.order, c = C(s, u.country), cmd = commander(s, u);
      if (!o || u.mutinied || num(u.retreatUntil) > s.day) continue;
      const target = R(s, o.target);
      if (!target || (!access(s, c.id, target.owner) && !atWar(s, c.id, target.owner))) { u.order = null; continue; }
      if (o.delay > 0) { o.delay = Math.max(0, o.delay - 1); continue; }
      if (o.plan && s.day < o.startDay) {
        u.planning = clamp(u.planning + (1.5 + c.staff / 40) * unitModifier(s, u, 'planning') * (1 + doctrineMod(c, 'planning'))); continue;
      }
      const initiative = clamp((num(cmd.initiative, .4) + num(doctrine(c).initiative, .4)) / 2, 0, 1);
      if ((u.supply < 20 || u.morale < 18) && initiative > .55) {
        u.order = null; u.stance = 'rest'; log(s, 'military', `${cmd.name || 'Local command'} suspended ${u.name}'s advance because supplies or morale were collapsing.`, c.id, u.region); continue;
      }
      if (cmd.loyalty < 20 && c.legitimacy < 30 && GS.rand(s) < .03) { o.delay += 2; u.organization = clamp(u.organization - 2); continue; }
      let path = o.amphibious ? [u.region, o.target] : pathTo(s, c.id, u.region, o.target);
      if (!path || path.length < 2) { u.order = null; continue; }
      o.path = path; const next = R(s, path[1]), home = R(s, u.region), t = typeOf(u);
      if (o.amphibious && num(c.navalControl?.[sector(next)]) < .35) { o.status = 'Landing held: naval control lost'; continue; }
      const river = next.river || home.river ? Math.max(.4, .62 + unitMod(s, u, 'engineering') + (u.type === 'engineers' ? .2 : 0)) : 1;
      const move = num(t.speed, 1) * .33 * terrainFactor(next, 'move') * weather(next) * (.15 + u.supply / 118) * (t.fuel > .2 ? num(u.fuelRatio, 1) : 1) * unitModifier(s, u, 'speed') * river * (1 - u.fatigue / 150);
      const amph = o.amphibious ? .42 : 1;
      o.progress += Math.max(0, move * amph);
      u.fatigue = clamp(u.fatigue + .7 + (1 - weather(next)) + (1 - terrainFactor(next, 'move')));
      u.familiarity[next.terrain] = clamp(num(u.familiarity[next.terrain]) + .1);
      if (o.progress < 1) continue;
      const defenders = active.filter(d => !d.destroyed && d.region === next.id && atWar(s, u.country, d.country));
      if (defenders.length) {
        const key = `${next.id}:${u.country}`;
        if (!engagements.has(key)) engagements.set(key, { region: next.id, attacker: u.country, attackers: [], defenders });
        engagements.get(key).attackers.push(u); u.inCombat = true; for (const d of defenders) d.inCombat = true;
      } else pending.push({ u, next: next.id });
    }
    // All combat powers and casualties are accumulated before changing any strength or ownership.
    const losses = new Map(), pressures = new Map(), battles = [];
    for (const e of engagements.values()) {
      const r = R(s, e.region), c = C(s, e.attacker), width = r.terrain === 'mountains' || r.terrain === 'urban' ? 2 : r.terrain === 'forest' || r.terrain === 'swamp' ? 3 : 5;
      const attackWidth = Math.min(1, width / e.attackers.length), defenseWidth = Math.min(1, (width + 1) / e.defenders.length);
      const rivals = new Set(e.attackers.map(u => u.commander));
      const rivalry = e.attackers.some(u => rivals.has(commander(s, u).rival)) ? Math.max(.72, .82 + num(c.staff) / 600) : 1;
      let ap = sum(e.attackers, u => GS.combatPower(s, u) * (u.order?.amphibious ? Math.min(1, .4 + unitMod(s, u, 'amphibious') + (u.type === 'marines' ? .2 : 0)) : 1)) * attackWidth * rivalry;
      const dp = sum(e.defenders, u => GS.combatPower(s, u, true)) * defenseWidth;
      const river = r.river ? Math.min(1, .7 + mod(c, 'engineering') + (e.attackers.some(u => u.type === 'engineers') ? .18 : 0)) : 1;
      ap *= river * (1 + Math.min(.7, num(c.airCoverage?.[r.id]?.support)));
      const total = Math.max(.01, ap + dp), attackerDamage = clamp(dp / total * 4.5, .08, 6), defenderDamage = clamp(ap / total * 4.5, .08, 6);
      for (const u of e.attackers) {
        const loss = attackerDamage / Math.sqrt(e.attackers.length) * (.85 + GS.rand(s) * .3);
        losses.set(u.id, num(losses.get(u.id)) + loss);
        if (!pressures.has(u.id)) pressures.set(u.id, { enemy: e.defenders[0].country, origin: null, organization: 0 });
        pressures.get(u.id).organization += 1.6 + dp / Math.max(.1, ap) * .65;
      }
      for (const u of e.defenders) {
        const loss = defenderDamage / Math.sqrt(e.defenders.length) * (.85 + GS.rand(s) * .3);
        losses.set(u.id, num(losses.get(u.id)) + loss);
        if (!pressures.has(u.id)) pressures.set(u.id, { enemy: e.attacker, origin: e.attackers[0].region, organization: 0 });
        pressures.get(u.id).organization += 1.4 + ap / Math.max(.1, dp) * .65;
      }
      const battle = { day: s.day, region: r.id, name: `Battle of ${r.name}`, attacker: e.attacker, defender: e.defenders[0].country, attackers: e.attackers.map(u => u.id), defenders: e.defenders.map(u => u.id), attackPower: ap, defensePower: dp, attackerLosses: 0, defenderLosses: 0, outcome: 'contested' };
      battles.push({ battle, e });
      r.damage = clamp(num(r.damage) + .25 + (r.city ? .12 : 0)); r.salvage = num(r.salvage) + (attackerDamage + defenderDamage) * .2;
      r.displaced = num(r.displaced) + Math.round(r.population * .000015); r.unrest = clamp(num(r.unrest) + .08);
    }
    for (const [uid, points] of losses) {
      const u = active.find(x => x.id === uid), p = pressures.get(uid), cmd = commander(s, u);
      recordLoss(s, u, points, p.enemy);
      u.organization = clamp(u.organization - Math.min(15, p.organization)); u.fatigue = clamp(u.fatigue + 1.2); u.stress = clamp(u.stress + 1 + points * .5);
      u.experience = clamp(u.experience + .18); u.training = clamp(u.training + .025); u.combatDays += 1; u.planning = clamp(u.planning - 2);
      cmd.stress = clamp(num(cmd.stress) + .12); cmd.experience = clamp(num(cmd.experience) + .03);
      const c = C(s, u.country), threshold = doctrineRetreat(c);
      if (!u.destroyed && (u.organization < 17 || u.morale < threshold || u.strength < 18 || u.stress > 95)) retreat(s, u, p.enemy, p.origin, u.organization < 17 ? 'organization exhausted' : u.morale < threshold ? 'morale collapse' : 'unsustainable losses or combat stress');
    }
    for (const { battle, e } of battles) {
      battle.attackerLosses = sum(e.attackers, u => num(losses.get(u.id)) * typeOf(u).manpower / 100);
      battle.defenderLosses = sum(e.defenders, u => num(losses.get(u.id)) * typeOf(u).manpower / 100);
      const defendersRemain = e.defenders.some(u => !u.destroyed && u.region === e.region);
      const attackersRemain = e.attackers.filter(u => !u.destroyed && u.order && u.order.target === R(s, u.order.target)?.id);
      if (!defendersRemain && attackersRemain.length) {
        battle.outcome = 'breakthrough';
        for (const u of attackersRemain) pending.push({ u, next: e.region });
      } else if (!attackersRemain.length) battle.outcome = 'defensive victory';
      s.battles.push(battle);
    }
    if (s.battles.length > 300) s.battles = s.battles.slice(-300);
    for (const { u, next } of pending) {
      if (u.destroyed || !u.order) continue;
      // A simultaneous enemy arrival prevents a free teleport through its new screen.
      if (s.units.some(d => !d.destroyed && d.region === next && atWar(s, u.country, d.country) && domain(d) === 'land')) continue;
      capture(s, u, next); u.order.progress = Math.max(0, u.order.progress - 1);
      if (u.order.amphibious) { C(s, u.country).stock.fuel = Math.max(0, C(s, u.country).stock.fuel - 8); u.order.amphibious = false; u.beachhead = !R(s, next).port; }
      if (u.region === u.order.target) { u.order = null; u.stance = 'hold'; u.morale = clamp(u.morale + 3); }
    }
    for (const op of s.operations || []) if (op.active && R(s, op.target)?.owner === op.country) { op.active = false; op.finished = s.day; log(s, 'military', `${op.name} achieved its territorial objective.`, op.country, op.target); }
  }

  function recoveryTick(s) {
    for (const u of sortedUnits(s)) {
      const c = C(s, u.country), r = R(s, u.region), o = commander(s, u), t = typeOf(u);
      if (domain(u) !== 'land' && !access(s, c.id, r.owner)) {
        const bases = owned(s, c.id).filter(base => domain(u) === 'air' ? base.airfield > 0 : base.port);
        bases.sort((a, b) => Math.hypot(r.x - a.x, r.y - a.y) - Math.hypot(r.x - b.x, r.y - b.y) || a.id - b.id);
        if (bases.length && u.fuelRatio > .1) {
          const loss = Math.min(15, 2 + (100 - u.readiness) / 8);
          recordLoss(s, u, loss, r.owner, 'emergency base evacuation');
          u.region = bases[0].id; u.mission = domain(u) === 'naval' ? 'repair' : 'reserve'; u.missionTarget = null;
          u.organization = clamp(u.organization - 20);
          log(s, 'military', `${u.name} evacuated its lost base to ${bases[0].name}, abandoning equipment in the withdrawal.`, c.id, bases[0].id);
        } else surrender(s, u, r.owner, 'home base overrun with no viable evacuation');
        continue;
      }
      const recovering = !u.inCombat && !u.order, rest = ['rest', 'leave', 'reserve'].includes(u.stance) || ['reserve', 'repair'].includes(u.mission) && domain(u) !== 'land';
      const served = u.supply / 100, care = unitModifier(s, u, 'stressRecovery') * unitModifier(s, u, 'medical');
      if (recovering) {
        u.organization = clamp(u.organization + served * (rest ? 3 : 1.4) * (.6 + o.competence / 100));
        u.fatigue = clamp(u.fatigue - served * (rest ? 2.8 : 1));
        u.stress = clamp(u.stress - served * care * (rest ? 1.35 : .25));
        u.morale = clamp(u.morale + served * (rest ? .8 : .22) * unitModifier(s, u, 'morale') + (num(c.approval, 50) - 50) / 500 - num(c.exhaustion) / 450);
        u.entrenchment = domain(u) === 'land' ? clamp(u.entrenchment + (rest ? .5 : 1.8) * unitModifier(s, u, 'engineering')) : 0;
      }
      if (u.stance === 'exercise' && !u.inCombat && served > .6) {
        u.training = clamp(u.training + .32 * unitModifier(s, u, 'training')); u.experience = clamp(u.experience + .025);
        u.fatigue = clamp(u.fatigue + .65); c.doctrineProgress = clamp(c.doctrineProgress + .25); s.tension = clamp(num(s.tension) + .001);
      }
      if (u.type === 'engineers' && recovering && served > .6 && r.damage > 0 && c.stock.materials > .2 && c.stock.parts > .1) {
        c.stock.materials -= .2; c.stock.parts -= .1;
        r.damage = clamp(r.damage - .35 * unitModifier(s, u, 'engineering'));
      }
      const reliabilityTarget = clamp(num(t.reliability, 80) + unitMod(s, u, 'reliability') * 100 - u.foreignEquipment * Math.max(.04, .18 - unitMod(s, u, 'standardization')) - (1 - num(u.maintenance, 1)) * 30 - (1 - weather(r)) * 12, 10, 99);
      u.reliability += (reliabilityTarget - u.reliability) * .1;
      const breakdown = (100 - u.reliability) / 180 * (u.order || u.inCombat || !['reserve', 'repair'].includes(u.mission) && domain(u) !== 'land' ? 1 : .12);
      u.equipment = clamp(u.equipment - breakdown);
      u.readiness = clamp(u.readiness + (u.maintenance > .7 ? .9 : -.8) - breakdown * .5);
      if (domain(u) === 'naval' && u.mission === 'repair' && r.port && c.stock.parts > .4 && c.stock.materials > .5) {
        const gain = Math.min(100 - u.strength, .5 * modifier(c, 'medical'));
        c.stock.parts -= .4; c.stock.materials -= .5; u.strength += gain; u.equipment = clamp(u.equipment + .8);
      }
      if (u.supply < 35) { u.morale = clamp(u.morale - (35 - u.supply) / 32); u.fatigue = clamp(u.fatigue + .5); u.stress = clamp(u.stress + .35); }
      if (u.isolatedDays > 2) { u.morale = clamp(u.morale - .35); u.stress = clamp(u.stress + .5); }
      if (u.isolatedDays > 10 && u.morale < 15 && u.supply < 20) {
        const enemy = (r.neighbors || []).map(id => R(s, id)?.owner).find(cid => atWar(s, c.id, cid));
        if (enemy !== undefined) { surrender(s, u, enemy, 'prolonged isolation and starvation exhausted the garrison'); continue; }
      }
      if (u.supply < 20 && u.isolatedDays > 4) recordLoss(s, u, .08 + (20 - u.supply) / 130, null, 'disease and starvation');
      if (u.morale < 18 && u.supply < 35 && c.legitimacy < 45) recordLoss(s, u, .13, null, 'desertion');
      if (u.morale < 12 && u.stress > 75 && c.legitimacy < 30 && !u.mutinied && GS.rand(s) < .015) {
        u.mutinied = true; u.order = null; u.stance = 'rest'; c.stability = clamp(c.stability - 2); o.loyalty = clamp(o.loyalty - 4);
        log(s, 'crisis', `${u.name} mutinied amid exhaustion, shortages and distrust of the government.`, c.id, r.id);
      }
      if (u.mutinied && u.supply > 75 && u.morale > 38 && c.legitimacy > 35) { u.mutinied = false; log(s, 'military', `${u.name} returned to duty after conditions improved.`, c.id, r.id); }
      if (recovering && !u.mutinied && served > .65 && c.manpower > 0 && c.stock.equipment > 0 && u.strength < 99.95 && domain(u) !== 'naval') {
        const gain = Math.min(100 - u.strength, rest ? .75 : .25, c.manpower / num(t.manpower, 6000) * 100, c.stock.equipment * 2);
        const old = u.strength, quality = clamp(25 + c.education * .35 + unitMod(s, u, 'training') * 25 - num(c.mobilization) * 5);
        const people = num(t.manpower, 6000) * gain / 100;
        c.manpower -= people; c.stock.equipment -= gain * .5; u.manpower += people; u.strength += gain;
        u.experience = (u.experience * old + 2 * gain) / u.strength; u.training = (u.training * old + quality * gain) / u.strength;
        u.cohesion = clamp(u.cohesion - gain * .12); u.morale = clamp(u.morale - gain * .03);
      }
      if (recovering && served > .6 && c.stock.equipment > .3 && u.equipment < 100) { const amount = Math.min(.35, c.stock.equipment, (100 - u.equipment) / 2); const foreign=amount*Math.min(1,num(c.foreignEquipmentStock)/Math.max(.001,c.stock.equipment)); c.foreignEquipmentStock=Math.max(0,num(c.foreignEquipmentStock)-foreign); c.stock.equipment -= amount; u.foreignEquipment=clamp((u.foreignEquipment*u.equipment+foreign*200)/Math.max(.001,u.equipment+amount*2)); u.equipment = clamp(u.equipment + amount * 2); }
      if (u.foreignEquipment > 0 && u.maintenance > .8 && recovering) u.foreignEquipment = clamp(u.foreignEquipment - .02 * unitModifier(s, u, 'standardization'));
      u.history = u.history.slice(-50);
    }
    for (const c of s.countries) {
      const units = sortedUnits(s).filter(u => u.country === c.id);
      c.military = { units: units.length, personnel: sum(units, u => u.manpower), meanMorale: units.length ? sum(units, u => u.morale) / units.length : 0,
        meanSupply: units.length ? sum(units, u => u.supply) / units.length : 0, stressed: units.filter(u => u.stress > 65).length,
        isolated: units.filter(u => u.isolatedDays > 0).length, mutinies: units.filter(u => u.mutinied).length, training: (c.trainingQueue || []).length };
    }
  }

  GS.militaryTick = function (s) {
    for (const u of sortedUnits(s)) normalize(s, u);
    resupply(s); trainingTick(s); missionsTick(s); moveAndFight(s); recoveryTick(s);
  };

  function estimatedThreat(s, c, rid) {
    const report = c.intel?.reports?.[rid];
    if (!report) return 1.1;
    const age = Math.max(0, s.day - num(report.day));
    const people = (num(report.min) + num(report.max)) / 2;
    const formations = people / 6000;
    const caution = (100 - clamp(report.confidence)) / 200 + Math.min(.8, age / 60);
    return Math.max(.15, formations + caution);
  }

  GS.militaryAI = function (s, cid) {
    const c = C(s, cid);
    if (!c || !c.alive) return;
    // Only own units are inspected here. Foreign strength comes exclusively from intelligence reports.
    const ownUnits = s.units.filter(u => u.country === cid && !u.destroyed).map(u => normalize(s, u));
    const lands = ownUnits.filter(u => domain(u) === 'land'), ownRegions = owned(s, cid);
    const front = ownRegions.filter(r => r.neighbors.some(id => atWar(s, cid, R(s, id)?.owner)));
    const attackTargets = s.regions.filter(r => atWar(s, cid, r.owner) && r.neighbors.some(id => access(s, cid, R(s, id)?.owner)));
    c.ai = c.ai || { beliefs: {}, actions: 0 }; c.ai.beliefs = c.ai.beliefs || {};
    for (const r of attackTargets) c.ai.beliefs[r.id] = { day: s.day, threat: estimatedThreat(s, c, r.id), reportDay: c.intel?.reports?.[r.id]?.day ?? null };
    c.ai.goal = front.length ? c.logistics?.satisfaction < .55 ? 'Restore front supply and rotate exhausted formations' : 'Prepare supported offensives and defend supply centers' : 'Train forces and preserve strategic reserves';
    for (const u of lands) {
      if (u.order || u.mutinied || num(u.retreatUntil) > s.day) continue;
      const here = R(s, u.region);
      if (u.morale < 40 || u.fatigue > 65 || u.stress > 70 || u.supply < 35) {
        GS.setStance(s, cid, u.id, 'rest');
        const rear = here.neighbors.map(id => R(s, id)).filter(r => r?.owner === cid && !r.neighbors.some(id => atWar(s, cid, R(s, id)?.owner))).sort((a, b) => num(b.supply) - num(a.supply));
        if (rear.length && here.neighbors.some(id => atWar(s, cid, R(s, id)?.owner))) GS.issueOrder(s, cid, u.id, rear[0].id);
        continue;
      }
      const adjacent = attackTargets.filter(r => here.neighbors.includes(r.id));
      const friendPower = sum(lands.filter(v => v.region === u.region || here.neighbors.includes(v.region)), v => v.strength / 100 * v.organization / 100 * v.supply / 100);
      const objectiveScore = r => (r.city ? 2 : 0) + (r.hub ? 1.5 : 0) + r.industry / 4 - estimatedThreat(s, c, r.id) * terrainFactor(r, 'defense');
      adjacent.sort((a, b) => objectiveScore(b) - objectiveScore(a) || a.id - b.id);
      const target = adjacent.find(r => friendPower > estimatedThreat(s, c, r.id) * terrainFactor(r, 'defense') * (s.options?.ai === 0 ? .75 : 1.05));
      if (target && u.organization > 62 && u.supply > 65 && u.strength > 55) {
        if (GS.issueOrder(s, cid, u.id, target.id, { plan: true }).ok) c.ai.actions++;
        continue;
      }
      if (front.length && !front.some(r => r.id === here.id)) {
        const destinations = [...front].sort((a, b) => {
          const need = r => (r.hub ? 3 : 1) + r.industry / 5 + sum(r.neighbors.filter(id => atWar(s, cid, R(s, id)?.owner)), id => estimatedThreat(s, c, id)) - lands.filter(v => v.region === r.id).length * 1.3 - Math.hypot(here.x - r.x, here.y - r.y) * .08;
          return need(b) - need(a) || a.id - b.id;
        });
        if (GS.issueOrder(s, cid, u.id, destinations[0].id).ok) c.ai.actions++;
      } else u.stance = front.length ? 'hold' : u.training < 65 ? 'exercise' : 'reserve';
    }
    for (const u of ownUnits.filter(u => domain(u) !== 'land')) {
      if (u.strength < 50 || u.fatigue > 70) { u.mission = domain(u) === 'naval' ? 'repair' : 'reserve'; continue; }
      const target = [...attackTargets].sort((a, b) => (b.industry + (b.hub ? 3 : 0)) - (a.industry + (a.hub ? 3 : 0)))[0];
      if (domain(u) === 'air') {
        if (!target) { u.mission = 'reserve'; continue; }
        const mission = u.type === 'recon_plane' ? 'recon' : u.type === 'fighter' ? 'superiority' : u.type === 'bomber' ? 'bombing' : u.type === 'transport_plane' ? 'transport' : u.type === 'naval_bomber' ? 'naval_strike' : 'support';
        const destination = mission === 'transport' ? front[0] || ownRegions[0] : target;
        if (destination) GS.setMission(s, cid, u.id, mission, destination.id);
      } else {
        const coast = s.regions.find(r => coastal(r) && atWar(s, cid, r.owner));
        const home = ownRegions.find(r => r.port);
        if (u.type === 'convoy' || !coast) { if (home) GS.setMission(s, cid, u.id, 'escort', home.id); }
        else GS.setMission(s, cid, u.id, u.type === 'submarine' ? 'raid' : 'blockade', coast.id);
      }
    }
    if (c.trainingQueue.length < 2 && c.stock.equipment > 160 && c.manpower > 7000 && c.treasury > 100 && (lands.length < Math.max(4, ownRegions.length / 2) || front.length > lands.length / 2)) {
      const candidate = c.stock.fuel < 60 ? 'infantry' : c.capabilities?.includes('artillery') && GS.rand(s) < .3 ? 'artillery' : c.capabilities?.includes('motorized') && GS.rand(s) < .3 ? 'motorized' : 'infantry';
      if (GS.recruit(s, cid, candidate, c.manpower < 15000 ? 'extended' : 'balanced').ok) c.ai.actions++;
    }
  };

})(globalThis);
