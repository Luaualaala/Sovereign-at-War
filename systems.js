'use strict';
(function (GS) {
  const clamp = (...v) => GS.clamp(...v), avg = v => GS.average(v);
  const C = (s, id) => GS.country(s, Number(id)), R = (s, id) => GS.region(s, Number(id));
  const success = message => ({ ok: true, message }), reject = message => ({ ok: false, message });
  const atWar = (s, cid) => s.wars.some(w => w.active && (w.a === cid || w.b === cid));
  const f = (c, id) => c.factions.find(v => v.id === id);
  const minister = (c, role) => c.leaders.find(l => l.role === role && l.active !== false);
  const skill = (c, role) => (minister(c, role)?.competence || 35) / 100;
  const numeric = (v, lo, hi) => Number.isFinite(Number(v)) && Number(v) >= lo && Number(v) <= hi;
  GS.applyEffects = (c, effects) => {
    for (const [key, value] of Object.entries(effects || {})) {
      if (!Number.isFinite(value)) continue;
      if (key.startsWith('stock.') && key.slice(6) in c.stock) c.stock[key.slice(6)] = Math.max(0, c.stock[key.slice(6)] + value);
      else if (typeof c[key] === 'number') {
        if (key === 'treasury' && c.treasury + value < 0) { c.debt += -(c.treasury + value); c.treasury = 0; }
        else if (key === 'productionEfficiency') c[key] = clamp(c[key] + value, .2, 1);
        else if (['stability','legitimacy','approval','credibility','health','education','corruption','radicalization','exhaustion','warSupport','staff','admin','reputation','prestige'].includes(key)) c[key] = clamp(c[key] + value);
        else c[key] = Math.max(0, c[key] + value);
      }
      else if (key.startsWith('faction.')) { const group = f(c, key.split('.')[1]); if (group) group.loyalty = clamp(group.loyalty + value); }
    }
  };
  const cost = (c, money, materials = 0) => {
    if (c.treasury < money || c.stock.materials < materials) return false;
    c.treasury -= money; c.stock.materials -= materials; return true;
  };
  function cooldown(s, c, key, duration) { if ((c.cooldowns[key] || 0) > s.day) return false; c.cooldowns[key] = s.day + duration; return true; }
  function relationMemory(r, s, kind, amount) { r.memory ||= []; r.memory.push({ day: s.day, kind, amount }); if (r.memory.length > 30) r.memory.shift(); r.opinion = clamp(r.opinion + amount, -100, 100); }

  GS.economyTick = s => {
    for (const c of s.countries) {
      if (!c.alive) continue;
      const land = GS.owned(s, c.id); if (!land.length) continue;
      const before = { ...c.stock, treasury: c.treasury }, p = GS.effects(c), pop = land.reduce((a, r) => a + r.population, 0);
      const mobilized = c.mobilization * .115;
      const workforce = clamp((1 - mobilized) * (.65 + c.health / 200) * (1 - c.exhaustion / 220) * (1 - c.unemployment / 250), .25, 1.2);
      const admin = clamp((c.admin / 100) * (1 - c.corruption / 180), .15, 1);
      const occupationCost = land.filter(r => r.core !== c.id).length * 1.4;
      let industry = 0, farms = 0, oil = 0, materials = 0, energy = 0;
      for (const r of land) {
        const occupied = r.core !== c.id;
        const extract = !occupied ? 1 : (r.occupation === 'extract' ? .9 : r.occupation === 'harsh' ? .78 : r.occupation === 'military' ? .64 : r.occupation === 'collaboration' ? .6 : .46) * Math.max(.5, 1 + GS.mod(c,'occupation'));
        const control = (1 - r.unrest / 145) * (1 - r.resistance / 140) * (1 - r.damage / 125) * extract * (1 - r.autonomy / 300);
        industry += r.industry * control;
        farms += r.farms * (1 - r.damage / 200) * (1 - r.unrest / 180) * (occupied ? .65 : 1);
        oil += r.oil * control; materials += r.materials * control; energy += r.energy * (1 - r.damage / 110);
      }
      const grid = clamp(energy / Math.max(1, industry * .8), .1, 1);
      const transport = clamp(Math.max(0, c.stock.transport - (c.logistics?.allocatedTransport || 0)) / Math.max(20, industry * 1.1 + pop / 250000 + occupationCost), .1, 1);
      const workers = clamp(workforce * (c.labor.industry / .4), .15, 1.4);
      const matFactor = clamp(c.stock.materials / Math.max(10, industry * .5), .1, 1);
      const efficiency = c.productionEfficiency * (1 - c.corruption / 150) * (.7 + skill(c, 'industry') * .5);
      const output = industry * .66 * Math.min(workers, grid, transport, matFactor) * efficiency * (1 + GS.mod(c, 'production'));
      c.productionEfficiency = clamp(c.productionEfficiency + .0035, .2, 1);
      if (c.automation.production) {
        const smallest = Object.keys(c.production).sort((a, b) => c.stock[a] - c.stock[b])[0];
        for (const key of Object.keys(c.production)) c.production[key] += ((key === smallest ? .4 : .15) - c.production[key]) * .025;
        const sum = Object.values(c.production).reduce((a,b)=>a+b,0); for (const key of Object.keys(c.production)) c.production[key] /= sum;
      }
      const military = output * c.industryAllocation, civilian = output * (1 - c.industryAllocation);
      for (const [key, allocation] of Object.entries(c.production)) c.stock[key] += military * allocation * (key === 'ammo' ? 2 : key === 'goods' ? 1.3 : 1);
      c.stock.goods += civilian * 1.55;
      c.stock.materials += materials * .7 - output * .5;
      c.stock.fuel += oil * .8 * (1 + GS.mod(c, 'fuel'));
      const seasonal = Math.floor(s.day / 90) % 4 === 0 ? .85 : 1.05;
      const harvest = farms * 1.85 * workforce * clamp(c.labor.agriculture / .3, .25, 1.8) * seasonal * (1 + GS.mod(c, 'food'));
      c.stock.food += harvest;
      const ration = clamp(1 + (p.consumption || 0), .5, 1.5);
      const pressure = s.options.economy;
      const needs = { food: pop / 100000 * .85 * ration * pressure, goods: pop / 100000 * .28 * ration * pressure, fuel: pop / 100000 * .08 + industry * .045 };
      let shortage = 0;
      for (const [key, demand] of Object.entries(needs)) { const gap = Math.max(0, demand - c.stock[key]); shortage += gap / Math.max(1, demand); c.stock[key] = Math.max(0, c.stock[key] - demand); }
      c.stock.transport += Math.max(0, civilian * .12 * clamp(c.labor.transport / .15, .2, 2)) - .1 * c.stock.transport / 100;
      const revenue = pop / 100000 * 1.45 * admin * (.55 + c.legitimacy / 180) * (1 + GS.mod(c, 'tax')) + civilian * .6;
      const units = s.units.filter(u => u.country === c.id && !u.destroyed);
      const spending = pop / 100000 * .19 * c.spending.welfare + units.length * .9 * c.spending.military + c.spending.intelligence * 2.5 + c.debt * .0003 + occupationCost + c.pow / 2000;
      c.stock.food = Math.max(0, c.stock.food - c.pow / 5000);
      c.treasury += revenue - spending;
      if (c.treasury < 0) { const deficit = -c.treasury; c.treasury = 0; c.debt += deficit; c.debtArrears += deficit; }
      c.inflation = clamp(c.inflation + shortage * .14 + Math.max(0, c.debt - 2000) * .000008 - .015 * skill(c, 'finance'), 0, 200);
      c.blackMarket = clamp((c.blackMarket || 5) + shortage * .2 + Math.max(0, -((p.consumption || 0))) * .07 - .025 * c.admin / 100);
      c.health = clamp(c.health + (.025 * c.spending.welfare + GS.mod(c, 'health') * .03) - shortage * .18 - c.refugees / 1e8);
      c.education = clamp(c.education + .008 * (c.spending.research - .5) + GS.mod(c, 'education') * .025 - mobilized * .008);
      c.unemployment = clamp(c.unemployment - .017 * workforce, 0, 60);
      c.veteranBurden = Math.max(0, c.veteranBurden - c.spending.welfare * .1);
      c.metrics = { ...c.metrics, population: pop, industry, output, labor: workforce, energy: grid, transport, civilianNeeds: needs, shortage, militaryOutput: military, civilianOutput: civilian, revenue, spending, occupationCost, harvest, daily: {}, reasons: [], stabilityReasons: c.metrics.stabilityReasons || [] };
      if (workforce < .8) c.metrics.reasons.push(`Mobilization and health leave ${Math.round(workforce * 100)}% of the civilian workforce available.`);
      if (grid < .95) c.metrics.reasons.push(`Power capacity limits industrial work to ${Math.round(grid * 100)}%.`);
      if (transport < .95) c.metrics.reasons.push(`Shared transport limits deliveries to ${Math.round(transport * 100)}%.`);
      if (matFactor < .95) c.metrics.reasons.push('Material shortages are idling production lines.');
      if (shortage > .05) c.metrics.reasons.push('Civilian consumption cannot be met: health, trust and public order are declining.');
      c.metrics.reasons.push(`Production familiarity ${Math.round(c.productionEfficiency * 100)}%; corruption diverts ${Math.round(c.corruption / 1.5)}% of potential output.`);
      for (const project of [...c.construction]) {
        const r = R(s, project.region);
        if (!r || r.owner !== c.id) { c.construction = c.construction.filter(x => x !== project); GS.log(s, 'economy', 'A construction site was lost with its province.', c.id); continue; }
        if (c.stock.materials < 1 || c.stock.goods < .5) continue;
        const rate = Math.max(.2, civilian / 8 * (1 + GS.mod(c, 'construction')) * (.65 + skill(c, 'transport') * .5));
        project.remaining -= rate; c.stock.materials -= 1; c.stock.goods -= .5;
        if (project.remaining <= 0) {
          const k = project.kind;
          if (k === 'repair') { r.damage = Math.max(0, r.damage - 50); r.infrastructure = clamp(r.infrastructure + 18); }
          else if (k === 'rail') { r.rail = Math.min(5, r.rail + 1); r.infrastructure = clamp(r.infrastructure + 10); }
          else if (k === 'hub') r.hub = true;
          else if (k === 'port') r.port = true;
          else if (k === 'power') r.energy += 3;
          else if (k === 'farm') r.farms += 2;
          else if (k === 'housing') r.housing = clamp(r.housing + 30);
          else if (['industry', 'fort', 'airfield'].includes(k)) r[k] += 1;
          c.construction = c.construction.filter(x => x !== project);
          GS.log(s, 'construction', `${r.name}: ${project.kind} works completed.`, c.id, r.id);
        }
      }
      for (const [key, value] of Object.entries(c.stock)) { c.stock[key] = clamp(value, 0, 10000); c.metrics.daily[key] = c.stock[key] - before[key]; }
      c.metrics.daily.treasury = c.treasury - before.treasury;
    }
  };

  GS.coupRisk = (s, cid) => {
    const c = C(s, cid); if (!c?.alive) return 0;
    const military = f(c, 'military'), officerLoyalty = avg(c.commanders.filter(g => g.active !== false).map(g => g.loyalty));
    const capital = R(s, c.capital), guard = s.units.filter(u => !u.destroyed && u.country === cid && u.region === c.capital && u.stance !== 'rest').length;
    const support = (100 - c.institutions.army) * .14 + (100 - officerLoyalty) * .12 + (100 - (military?.loyalty || 50)) * .16 + (100 - c.stability) * .21 + (100 - c.legitimacy) * .18 + c.exhaustion * .12 + c.corruption * .05 + (c.foreignCoupSupport || 0) + (capital?.owner !== cid ? 10 : 0) - c.intel.counter * .08 - guard * 2;
    return clamp(support);
  };
  GS.politicsTick = s => {
    for (const c of [...s.countries]) {
      if (!c.alive) continue;
      const p = GS.effects(c), shortage = c.metrics.shortage || 0, war = atWar(s, c.id), gov = GS.gov(c);
      c.exhaustion = clamp(c.exhaustion + (war ? .032 + c.mobilization * .008 : -.11) + shortage * .09);
      const welfare = (c.spending.welfare - .75) * .035;
      const living = shortage > .05 ? -shortage * .2 : .035;
      const exhaustion = -Math.max(0, c.exhaustion - 25) * .0011;
      const inflation = -Math.max(0, c.inflation - 8) * .0016;
      const repression = (p.repression || 0) * .08;
      const legitimacy = (c.legitimacy - 55) * .001;
      c.stability = clamp(c.stability + living + welfare + exhaustion + inflation + repression + legitimacy + (p.stability || 0) * .12 - c.unemployment * .001);
      c.approval = clamp(c.approval + living + welfare + exhaustion + (p.approval || 0) * .09 - (p.repression || 0) * .07);
      c.radicalization = clamp(c.radicalization + Math.max(0, 45 - c.approval) * .004 + Math.max(0, p.repression || 0) * .1 - Math.max(0, c.approval - 55) * .002);
      c.legitimacy = clamp(c.legitimacy + (c.approval - 58) * .0007 + (p.legitimacy || 0) * .04 - Math.max(0, p.repression || 0) * .035);
      c.corruption = clamp(c.corruption + (p.corruption || 0) * .06 + (c.blackMarket || 0) * .0002 - c.admin * .0001);
      c.admin = clamp(c.admin + ((c.education + c.institutions.civilService) / 2 - c.admin) * .001 - c.corruption * .00015);
      c.credibility = clamp(c.credibility + (p.repression > .1 ? -.025 : .014) - Math.max(0, c.hiddenLosses || 0) * .00001);
      c.hiddenLosses = Math.max(0, (c.hiddenLosses || 0) * .992);
      c.metrics.stabilityReasons = [`Civilian needs: ${living >= 0 ? '+' : ''}${living.toFixed(3)}/day`, `Welfare: +${welfare.toFixed(3)}/day`, `War exhaustion: ${exhaustion.toFixed(3)}/day`, `Inflation: ${inflation.toFixed(3)}/day`, `Legitimacy: ${legitimacy >= 0 ? '+' : ''}${legitimacy.toFixed(3)}/day`, `Policing: ${repression >= 0 ? '+' : ''}${repression.toFixed(3)}/day; coercion also radicalizes opposition.`];
      for (const faction of c.factions) {
        const satisfaction = faction.id === 'labor' ? c.approval : faction.id === 'military' ? 45 + c.spending.military * 20 - c.exhaustion * .35 : faction.id === 'industry' ? 55 + c.metrics.output * .25 - c.inflation * .5 : faction.id === 'regional' ? 65 - avg(GS.owned(s, c.id).map(r => r.unrest)) * .3 : c.legitimacy;
        faction.loyalty = clamp(faction.loyalty + (satisfaction - faction.loyalty) * .002);
        faction.influence = clamp(faction.influence + (faction.id === 'military' && war ? .012 : -.001), 5, 90);
      }
      for (const leader of c.leaders) {
        leader.stress = clamp(leader.stress + (c.stability < 45 ? .035 : -.04));
        if (leader.role !== 'reserve' && leader.active !== false) {
          const peerConflict = c.leaders.some(other => other.id === leader.rival && other.role !== 'reserve');
          c.admin = clamp(c.admin - (peerConflict ? .003 : 0));
          const faction = f(c, leader.faction); if (faction) leader.loyalty = clamp(leader.loyalty + (faction.loyalty - leader.loyalty) * .001);
        }
      }
      for (const policy of [...c.pendingPolicies]) {
        policy.remaining -= Math.max(.2, c.admin / 100);
        if (policy.remaining <= 0) {
          c.policies[policy.category] = policy.option;
          c.pendingPolicies = c.pendingPolicies.filter(v => v !== policy);
          c.legitimacy = clamp(c.legitimacy - policy.opposition * .025);
          for (const group of c.factions) group.loyalty = clamp(group.loyalty + (group.id === policy.backer ? 5 : -policy.opposition / 35));
          GS.log(s, 'politics', `${policy.name} entered force. Administrative capacity determines how much of its promise reaches the regions.`, c.id);
        }
      }
      if (gov.elections && s.day - c.lastElection >= gov.elections) {
        c.lastElection = s.day;
        const old = c.coalition.join('/');
        const ranked = [...c.factions].sort((a, b) => (b.support + b.loyalty * .15 + (b.id === 'labor' ? 100 - c.approval : 0)) - (a.support + a.loyalty * .15 + (a.id === 'labor' ? 100 - c.approval : 0)));
        c.coalition = ranked.slice(0, 2).map(v => v.id);
        c.legitimacy = clamp(c.legitimacy + 9); c.stability = clamp(c.stability + 3);
        for (const group of c.factions) if (c.coalition.includes(group.id)) group.loyalty = clamp(group.loyalty + 8);
        GS.log(s, 'government', `Election in ${c.name}: ${ranked[0].name} forms a coalition with ${ranked[1].name}. ${old === c.coalition.join('/') ? 'The cabinet retains its mandate.' : 'The governing coalition changes; your campaign continues.'}`, c.id);
      }
      if (!gov.elections && s.day >= c.successionDay) {
        c.successionDay += 900;
        const uncertainty = avg(c.leaders.map(l => l.loyalty)) < 60;
        c.stability = clamp(c.stability + (uncertainty ? -12 : 4)); c.legitimacy = clamp(c.legitimacy + (uncertainty ? -8 : 3));
        c.coup.progress += uncertainty ? 20 : 0;
        GS.log(s, 'government', `${c.name} enters a succession: ${uncertainty ? 'rival claimants challenge the transfer of power' : 'institutions recognize the new leadership'}.`, c.id);
      }
      c.coup.cooldown = Math.max(0, c.coup.cooldown - 1);
      const risk = GS.coupRisk(s, c.id); c.coup.support = risk;
      if (!c.coup.cooldown) {
        if (risk > 43) c.coup.progress += (risk - 40) * .09;
        else c.coup.progress = Math.max(0, c.coup.progress - .25);
        const stage = c.coup.progress > 65 ? 3 : c.coup.progress > 30 ? 2 : c.coup.progress > 5 ? 1 : 0;
        if (stage !== c.coup.stage && stage > 0) { c.coup.stage = stage; if (GS.rand(s) * 100 < c.intel.counter + c.spending.intelligence * 10) c.coup.detected = true; if (c.coup.detected) GS.log(s, 'crisis', `Officer conspiracy: ${['', 'recruitment detected', 'conspirators are preparing to seize institutions', 'a seizure attempt is approaching'][stage]}. Monitoring, negotiation, reform and officer arrests have different costs.`, c.id); }
        if (c.coup.progress >= 100) GS.resolveCoup(s, c.id);
      }
    }
  };

  GS.resolveCoup = (s, cid) => {
    const c = C(s, cid); if (!c?.alive) return null;
    const guard = s.units.filter(u => !u.destroyed && u.country === cid && u.region === c.capital).length;
    const support = clamp(GS.coupRisk(s, cid) + (100 - c.institutions.intelligence) * .12 + (100 - c.institutions.police) * .1 - guard * 3, 5, 95);
    const roll = GS.rand(s) * 100;
    let outcome;
    if (roll > support + 15) {
      outcome = 'failed'; c.legitimacy = clamp(c.legitimacy + 5); c.institutions.army = clamp(c.institutions.army + 9); c.staff = clamp(c.staff - 7); f(c, 'military').influence = clamp(f(c, 'military').influence - 8); c.stability = clamp(c.stability - 6);
      GS.log(s, 'coup', `The coup in ${c.name} fails. Loyal institutions retain the capital; disrupted staffs and political arrests weaken the army.`, cid);
    } else if (roll < support * .48 && c.institutions.police < 70) {
      outcome = 'regime'; c.government = GS.DATA.governments.military ? 'military' : Object.keys(GS.DATA.governments).find(k => /military|junta/.test(k)) || c.government;
      c.legitimacy = 43; c.stability = clamp(c.stability + 15); c.institutions.army = 80; c.institutions.legislature = 25; f(c, 'military').loyalty = 85; f(c, 'military').influence = 60; c.credibility = clamp(c.credibility - 12);
      for (const g of c.commanders) g.loyalty = clamp(g.loyalty + 15);
      GS.log(s, 'coup', `A military government seizes power in ${c.name}. The state survives and your campaign continues under new institutional constraints.`, cid);
    } else {
      outcome = GS.civilWar(s, cid, 'A divided officer corps rejects the seizure of power.') ? 'civil-war' : 'failed';
    }
    c.coup = { stage: 0, progress: 0, support: 0, detected: false, cooldown: 150 };
    s.outcomes.push({ type: 'coup', outcome, country: cid, day: s.day });
    return outcome;
  };
  GS.civilWar = (s, cid, reason) => {
    const c = C(s, cid), land = GS.owned(s, cid);
    if (!c || land.length < 4 || s.countries.length >= 24 || c.civilWarParent != null) return null;
    const id = Math.max(...s.countries.map(v => v.id)) + 1;
    const rebel = GS.makeCountry(s, { id, name: `${c.short || c.name.split(' ')[0]} Restoration Front`, short: `${c.short || 'State'} Front`, color: '#b8767d', flag: ['#7e3c4b', '#ded0aa'], government: 'revolutionary', doctrine: c.doctrine, focus: c.research.focus });
    rebel.civilWarParent = cid; rebel.research = JSON.parse(JSON.stringify(c.research)); rebel.techMods = { ...c.techMods }; rebel.manpower = Math.floor(c.manpower * .32); c.manpower -= rebel.manpower;
    rebel.treasury = c.treasury * .33; c.treasury *= .67; rebel.debt = c.debt * .33; c.debt *= .67;
    for (const key of Object.keys(c.stock)) { rebel.stock[key] = c.stock[key] * .33; c.stock[key] *= .67; }
    rebel.reserves = Object.fromEntries(Object.entries(c.reserves).map(([k, v]) => { c.reserves[k] *= .67; return [k, v * .33]; }));
    const selected = land.filter(r => r.id !== c.capital).sort((a, b) => (b.unrest + b.separatism - b.loyalty) - (a.unrest + a.separatism - a.loyalty)).slice(0, Math.max(2, Math.floor(land.length * .37)));
    for (const r of selected) { r.owner = id; r.resistance = 12; r.unrest = 25; r.loyalty = 55; }
    rebel.capital = selected[0].id; selected[0].hub = true; rebel.initialTerritory = selected.length; rebel.initialPopulation = selected.reduce((v, r) => v + r.population, 0); rebel.demographicPool = c.demographicPool * .33; c.demographicPool *= .67;
    const officers = [...c.commanders].sort((a, b) => a.loyalty - b.loyalty).slice(0, Math.max(1, Math.floor(c.commanders.length / 3)));
    rebel.commanders = officers; c.commanders = c.commanders.filter(g => !officers.includes(g));
    const rebelIds = new Set(officers.map(g => g.id));
    let count = 0;
    for (const u of s.units.filter(u => u.country === cid && !u.destroyed)) if (rebelIds.has(u.commander) || selected.some(r => r.id === u.region)) { u.country = id; u.region = selected[count++ % selected.length].id; u.order = null; u.commander = officers[0].id; u.morale = clamp(u.morale - 12); } else if (!c.commanders.some(g => g.id === u.commander)) u.commander = c.commanders[0].id;
    s.countries.push(rebel);
    s.wars.push({ id: s.nextId++, a: id, b: cid, aim: 'regime', started: s.day, score: 0, active: true, civil: true });
    c.stability = clamp(c.stability - 18); c.legitimacy = clamp(c.legitimacy - 10); c.coup.cooldown = 240;
    GS.log(s, 'civil-war', `${reason} ${selected.length} provinces, ${count} formations and disloyal officers break away as ${rebel.name}. The treasury, stockpiles and manpower split.`, cid, rebel.capital);
    s.outcomes.push({ type: 'civil-war', country: cid, rebel: id, day: s.day });
    return rebel;
  };

  GS.societyTick = s => {
    for (const r of s.regions) {
      const c = C(s, r.owner); if (!c?.alive) continue;
      const occupied = r.core !== r.owner, coercion = ['harsh', 'extract'].includes(r.occupation);
      const garrisons = s.units.filter(u => !u.destroyed && u.country === c.id && u.region === r.id && (u.stance === 'garrison' || u.type === 'garrison'));
      const security = garrisons.reduce((v, u) => v + u.strength / 100 * (u.morale / 100), 0);
      r.unrest = clamp(r.unrest + (c.metrics.shortage || 0) * .25 + Math.max(0, 50 - c.stability) * .008 + (100 - r.housing) * .001 + c.radicalization * .0005 - security * .09 - Math.max(0, c.spending.welfare - .5) * .025 - r.autonomy * .0005);
      r.loyalty = clamp(r.loyalty + (c.legitimacy - r.loyalty) * .001 - (coercion && occupied ? .05 : 0));
      r.separatism = clamp(r.separatism + r.unrest * .0005 - r.autonomy * .001 - c.legitimacy * .0001);
      if (occupied) {
        r.compliance = clamp(r.compliance + (r.occupation === 'civilian' ? .09 : r.occupation === 'collaboration' ? .065 : -.015) * c.admin / 100 - r.unrest * .001);
        r.resistance = clamp(r.resistance + (coercion ? .23 : .07) + (100 - c.legitimacy) * .0007 - security * .075 - r.compliance * .001);
        r.resistanceOrganization = clamp(r.resistanceOrganization + r.resistance * .0015 - security * .02);
        if (r.resistance > 35 && GS.rand(s) < r.resistanceOrganization / 10000) {
          r.damage = clamp(r.damage + 6); r.infrastructure = clamp(r.infrastructure - 5, 5, 100); c.stock.transport = Math.max(0, c.stock.transport - 4);
          GS.log(s, 'resistance', `Organized resistance sabotages the rail connection at ${r.name}. Rear-area security and local consent affect supply.`, c.id, r.id);
        }
        if (r.resistance > 85 && security < .2 && C(s, r.core)?.alive && GS.rand(s) < .015) { const old = r.owner; r.owner = r.core; r.resistance = 15; r.unrest = 35; GS.log(s, 'rebellion', `${r.name} expels the occupying administration.`, old, r.id); }
      } else r.resistance = Math.max(0, r.resistance - .02);
      if (r.unrest > 65) { r.industry = Math.max(.5, r.industry - .001); if (s.day % 30 === r.id % 30) GS.log(s, 'unrest', `Strike committees in ${r.name} demand food security, wages and political concessions. Production is falling.`, c.id, r.id); }
      if (r.damage > 30 && r.population > 70000) {
        const displaced = Math.floor(r.population * .0006 * (r.damage / 100));
        const safe = r.neighbors.map(n => R(s, n)).filter(n => n.owner === r.owner && n.damage < 20).sort((a, b) => b.housing - a.housing)[0];
        if (safe) { r.population -= displaced; r.displaced += displaced; safe.population += displaced; safe.housing = clamp(safe.housing - displaced / 3000); c.refugees += displaced; }
        else { r.housing = clamp(r.housing - .02); c.health = clamp(c.health - .003); }
      }
    }
    for (const c of [...s.countries]) if (c.alive && !c.coup.cooldown) {
      const land = GS.owned(s, c.id);
      if (land.length >= 5 && land.filter(r => r.separatism > 65 && r.unrest > 65).length >= 3) GS.civilWar(s, c.id, 'Autonomous regions unite in a separatist uprising.');
    }
  };

  function estimate(s, value, confidence, source) {
    const error = (1 - confidence / 100) * s.options.uncertainty;
    const center = Math.max(0, value * (1 + (GS.rand(s) - .5) * error));
    return { min: Math.max(0, Math.floor(center * (1 - error * .65))), max: Math.ceil(center * (1 + error * .65)), confidence: Math.round(confidence), day: s.day, source };
  }
  GS.intelligenceTick = (s, force = false) => {
    for (const c of s.countries) {
      if (!c.alive) continue;
      c.intel.counter = clamp(c.intel.counter + (.7 + skill(c, 'intelligence') + GS.mod(c, 'counterintelligence')) * c.spending.intelligence * .025 - .04);
      c.intel.deception = Math.max(0, c.intel.deception - .1); c.intel.cipher = Math.max(0, c.intel.cipher - .08); c.foreignCoupSupport = Math.max(0, (c.foreignCoupSupport || 0) - .03);
      for (const target of s.countries) if (target.id !== c.id) {
        c.intel.networks[target.id] ??= 8;
        const flow = c.spending.intelligence * (.025 + GS.mod(c, 'intelligence') * .01) - target.intel.counter * .0003;
        c.intel.networks[target.id] = clamp(c.intel.networks[target.id] + flow);
      }
      const domesticConfidence = clamp(c.admin * .55 + c.education * .2 + c.credibility * .25 - c.corruption * .25 - (GS.mod(c, 'repression') || 0) * 15, 25, 94);
      if (force || s.day % Math.max(2, Math.round(8 - c.admin / 18)) === 0) {
        c.domesticReport = {};
        const values = { stability: c.stability, legitimacy: c.legitimacy, treasury: c.treasury, manpower: c.manpower, food: c.stock.food * (1 + c.corruption / 500), fuel: c.stock.fuel, industry: c.metrics.industry || GS.owned(s, c.id).reduce((a, r) => a + r.industry, 0), army: s.units.filter(u => u.country === c.id && !u.destroyed).reduce((a, u) => a + u.manpower, 0), exhaustion: c.exhaustion, technology: c.research.adopted.length };
        for (const [key, value] of Object.entries(values)) c.domesticReport[key] = estimate(s, value, domesticConfidence, 'National statistical bureau');
      }
      for (const r of s.regions) {
        const visible = r.owner === c.id || r.neighbors.some(n => R(s, n).owner === c.id) || s.units.some(u => !u.destroyed && u.country === c.id && (u.region === r.id || R(s, u.region)?.neighbors.includes(r.id)));
        const target = C(s, r.owner), network = c.intel.networks[r.owner] || 0;
        const shared = s.relations.some(rel => rel.alliance && (rel.a === c.id ? rel.b === r.owner : rel.b === c.id ? rel.a === r.owner : false));
        const aerial = Math.min(25, (c.airCoverage?.[r.id]?.recon || 0) * 20);
        const confidence = clamp((visible ? 52 : shared ? 40 : 8) + network * .4 + aerial + GS.mod(c, 'recon') * 15 + GS.mod(c, 'intelligence') * 15 - target.intel.cipher * .14, 8, 94);
        const frequency = visible ? 2 : network > 45 ? 5 : 12;
        if (!force && s.day % frequency !== r.id % frequency) continue;
        if (!visible && !shared && aerial < 5 && GS.rand(s) * 100 > network) continue;
        const hostile = r.owner !== c.id;
        const actual = s.units.filter(u => !u.destroyed && u.region === r.id && u.country !== c.id);
        const phantom = hostile && target.intel.deception > c.intel.counter && GS.rand(s) < target.intel.deception / 180 ? 6000 * (1 + Math.floor(GS.rand(s) * 2)) : 0;
        const total = actual.reduce((v, u) => v + u.manpower, 0) + phantom;
        const report = estimate(s, total, confidence, visible ? 'Frontline reconnaissance' : shared ? 'Allied liaison' : network > 45 ? 'Signals and local network' : 'Uncorroborated diplomatic source');
        report.units = actual.slice(0, Math.ceil(confidence / 25)).map(u => ({ type: confidence > 45 ? u.type : 'unknown', ...estimate(s, u.manpower, confidence, report.source) }));
        if (phantom) report.units.push({ type: 'unknown', min: Math.round(phantom * .6), max: Math.round(phantom * 1.5) });
        report.deceptionSuspected = hostile && target.intel.deception > 20 && c.intel.counter > 60 && GS.rand(s) < .4;
        c.intel.reports[r.id] = report;
      }
      if (force || s.day % 7 === c.id % 7) {
        c.intel.countryReports ||= {};
        for (const other of s.countries) if (other.id !== c.id) {
          const confidence = clamp(22 + (c.intel.networks[other.id] || 0) * .6 + GS.mod(c, 'intelligence') * 12 - other.intel.cipher * .15, 10, 88);
          const report = {};
          const values = { stability: other.stability, legitimacy: other.legitimacy, treasury: other.treasury, manpower: other.manpower, food: other.stock.food, fuel: other.stock.fuel, industry: other.metrics.industry || GS.owned(s, other.id).reduce((a, r) => a + r.industry, 0), army: s.units.filter(u => u.country === other.id && !u.destroyed).reduce((a, u) => a + u.manpower, 0), exhaustion: other.exhaustion, technology: other.research.adopted.length };
          for (const [key, value] of Object.entries(values)) report[key] = estimate(s, value, confidence, 'Foreign analysis bureau');
          c.intel.countryReports[other.id] = report;
          c.ai.beliefs[other.id] = { day: s.day, strength: report.army, intentions: GS.rel(s, c.id, other.id).opinion < -25 ? 'Revisionist signals' : 'Unclear', supply: report.fuel };
        }
      }
      if (c.automation.intelligence && s.day % 14 === 0 && c.intel.operations.length < 2 && c.treasury > 90) {
        const priority = s.countries.filter(o => o.id !== c.id && o.alive).sort((a,b) => GS.rel(s,c.id,a.id).opinion - GS.rel(s,c.id,b.id).opinion)[0];
        if (priority) GS.act(s,c.id,'intel',{target:priority.id,operation:(c.intel.networks[priority.id]||0)<30?'network':'recon'});
      }
      for (const op of [...c.intel.operations]) {
        if (--op.remaining > 0) continue;
        GS.resolveIntel(s, c.id, op); c.intel.operations = c.intel.operations.filter(x => x.id !== op.id);
      }
    }
  };
  GS.publicCountry = (s, cid, viewer = s.player) => {
    const c = C(s, cid), v = C(s, viewer); if (!c || !v) return null;
    const values = cid === viewer ? c.domesticReport || {} : v.intel.countryReports?.[cid] || {};
    const bounded={...values};
    for(const key of ['stability','legitimacy','exhaustion']) if(bounded[key]) bounded[key]={...bounded[key],min:clamp(bounded[key].min),max:clamp(bounded[key].max)};
    return { id: c.id, name: c.name, short: c.short, color: c.color, flag: c.flag, government: c.government, alive: c.alive, ...bounded };
  };
  GS.resolveIntel = (s, cid, op) => {
    const c = C(s, cid), target = C(s, op.target); if (!target || !target.alive) return;
    const network = c.intel.networks[target.id] || 0;
    const chance = clamp(40 + network * .5 + skill(c, 'intelligence') * 15 + GS.mod(c, 'intelligence') * 20 - target.intel.counter * .45, 12, 92);
    const ok = ['network', 'recon'].includes(op.operation) || GS.rand(s) * 100 < chance;
    if (!ok) { c.intel.networks[target.id] = Math.max(0, network - 12); c.reputation = clamp(c.reputation - 4); relationMemory(GS.rel(s, cid, target.id), s, 'Discovered operation', -12); GS.log(s, 'intelligence', `The ${op.operation} operation in ${target.name} failed; agents were exposed and diplomatic trust suffered.`, cid); return; }
    if (op.operation === 'network') c.intel.networks[target.id] = clamp(network + 16);
    if (op.operation === 'recon') { c.intel.networks[target.id] = clamp(network + 7); const r = R(s, op.region) || GS.owned(s, target.id)[0]; if (r) { const total = s.units.filter(u => !u.destroyed && u.region === r.id && u.country !== cid).reduce((n, u) => n + u.manpower, 0); c.intel.reports[r.id] = { ...estimate(s, total, 86, 'Corroborated reconnaissance mission'), units: [], deceptionSuspected: false }; } }
    if (op.operation === 'sabotage') { const r = R(s, op.region) || GS.owned(s, target.id).sort((a, b) => b.rail - a.rail)[0]; if (r && r.owner === target.id) { r.damage = clamp(r.damage + 22); r.infrastructure = clamp(r.infrastructure - 18, 5, 100); target.stock.transport = Math.max(0, target.stock.transport - 20); } }
    if (op.operation === 'coup') { target.foreignCoupSupport = (target.foreignCoupSupport || 0) + 12; f(target, 'military').loyalty = clamp(f(target, 'military').loyalty - 10); }
    if (op.operation === 'psyops') { for (const u of s.units.filter(u => !u.destroyed && u.country === target.id && (!op.region || u.region === Number(op.region)))) { u.morale = clamp(u.morale - 7 * c.credibility / 100); u.stress = clamp(u.stress + 4); } target.credibility = clamp(target.credibility - 3); }
    if (op.operation === 'jamming') { target.jammedUntil = s.day + 20; target.intel.cipher = Math.max(0, target.intel.cipher - 8); }
    if (op.operation === 'steal') { const tech = target.research.adopted.find(id => !c.research.adopted.includes(id)); if (tech) { GS.queueResearch(s, cid, tech); GS.gainResearchFragment(s, cid, tech, 25); GS.log(s, 'intelligence', `Recovered fragments of ${GS.DATA.techs.find(t => t.id === tech)?.name || tech}; engineering and adoption are still required.`, cid); } else { c.intel.networks[target.id] = clamp(network + 5); } }
    if (op.operation === 'doubleagent') { target.intel.networks[cid] = Math.max(0, (target.intel.networks[cid] || 0) - 20); c.intel.deception = clamp(c.intel.deception + 25); }
    GS.log(s, 'intelligence', `${op.operation[0].toUpperCase() + op.operation.slice(1)} operation in ${target.name} completed. Intelligence remains an estimate, even after successful collection.`, cid);
  };

  GS.declareWar = (s, a, b, aim = 'territory', intervention = false) => {
    const c = C(s, a), target = C(s, b); if (!c?.alive || !target?.alive || a === b || GS.atWar(s, a, b)) return reject('No valid new belligerent.');
    const rel = GS.rel(s, a, b);
    if (rel.pactUntil > s.day) { c.reputation = clamp(c.reputation - 28); c.legitimacy = clamp(c.legitimacy - 10); relationMemory(rel, s, 'Non-aggression pact broken', -40); }
    rel.alliance = false; rel.access = false; rel.trade = null; rel.pactUntil = 0;
    s.wars.push({ id: s.nextId++, a, b, aim, started: s.day, score: 0, active: true });
    c.reputation = clamp(c.reputation - (intervention ? 2 : 12)); c.warSupport = clamp(c.warSupport + (aim === 'defense' ? 10 : -4)); s.tension = clamp(s.tension + 14);
    GS.log(s, 'war', `${c.name} enters war with ${target.name}. Declared aim: ${aim}.`, null);
    if (!intervention) for (const ally of s.countries) {
      if (!ally.alive || ally.id === a || ally.id === b) continue;
      const r = GS.rel(s, ally.id, b);
      if (r.alliance || r.guarantee === ally.id || (Array.isArray(r.guarantee) && r.guarantee.includes(ally.id))) {
        if (ally.stability > 30 && ally.exhaustion < 70) GS.declareWar(s, ally.id, a, 'defense', true);
        else { ally.reputation = clamp(ally.reputation - 12); r.trust = clamp(r.trust - 20); GS.log(s, 'diplomacy', `${ally.name} cannot honor its commitment to ${target.name}; domestic crisis undermines the guarantee.`, null); }
      }
    }
    return success('War declared. Supply, war aims and domestic consent now constrain operations.');
  };
  GS.peaceLeverage = (s, a, b, terms = 'white') => {
    const c = C(s, a), target = C(s, b), own = GS.owned(s, a), theirs = GS.owned(s, b);
    const captured = s.regions.filter(r => r.core === b && r.owner === a).length, lost = s.regions.filter(r => r.core === a && r.owner === b).length;
    const war = s.wars.find(w => w.active && ((w.a === a && w.b === b) || (w.a === b && w.b === a)));
    const duration = war ? s.day - war.started : 0;
    const demand = { white: 0, territory: 18, reparations: 13, regime: 28, resources: 10, disarmament: 22 }[terms] ?? 100;
    const aimMatch = war?.aim === terms || war?.aim === 'defense' && terms === 'white' ? 9 : 0;
    const value = target.exhaustion * .45 + Math.max(0, 65 - target.stability) * .4 + (captured - lost) * 8 + Math.min(20, duration / 8) + (theirs.length < 4 ? 20 : 0) + aimMatch - demand - 28;
    return { value, reasons: [`Their visible losses of core territory: ${captured}; your losses: ${lost}.`, `Terms: ${terms}; ${aimMatch ? 'consistent with declared war aims' : 'additional concessions require more leverage'}.`, `War duration: ${duration} days.`, value >= 0 ? 'The other cabinet judges compromise preferable to continuing the war.' : 'The other cabinet still expects a better outcome by continuing resistance.'] };
  };
  GS.makePeace = (s, a, b, terms = 'white', forced = false) => {
    if (!GS.atWar(s, a, b)) return reject('There is no war to settle.');
    const c = C(s, a), target = C(s, b), leverage = GS.peaceLeverage(s, a, b, terms);
    if (!forced && leverage.value < 0) return reject(leverage.reasons.join(' '));
    for (const war of s.wars) if (war.active && ((war.a === a && war.b === b) || (war.a === b && war.b === a))) war.active = false;
    if (terms === 'white' || terms === 'reparations' || terms === 'resources' || terms === 'disarmament' || terms === 'regime') for (const r of s.regions) if ((r.owner === a && r.core === b) || (r.owner === b && r.core === a)) { r.owner = r.core; r.resistance *= .5; }
    if (terms === 'territory') for (const r of s.regions.filter(r => r.owner === a && r.core === b)) { r.claimedBy = a; r.occupation = 'civilian'; r.resistance = Math.max(r.resistance, 20); }
    const rel = GS.rel(s, a, b); rel.pactUntil = s.day + 180; rel.trust = clamp(rel.trust + 8); rel.opinion = clamp(rel.opinion + 8, -100, 100);
    if (terms === 'reparations') rel.reparations = { payer: b, receiver: a, daily: 2, until: s.day + 180 };
    if (terms === 'resources') rel.concession = { payer: b, receiver: a, resource: 'fuel', daily: 3, until: s.day + 180 };
    if (terms === 'disarmament') target.disarmedUntil = s.day + 240;
    if (terms === 'regime') { target.government = c.government; target.patron = a; target.legitimacy = 38; target.stability = 42; }
    for (const side of [c, target]) { side.exhaustion = clamp(side.exhaustion - 8); side.legitimacy = clamp(side.legitimacy + 4); side.memories.push({ day: s.day, type: 'peace', other: side.id === a ? b : a, terms }); }
    c.prisoners ||= {}; target.prisoners ||= {};
    const exchange = Math.min(c.prisoners[b] || 0, target.casualties.captured); target.manpower += exchange * .85; target.casualties.captured -= exchange; c.pow -= exchange; c.prisoners[b] = Math.max(0,(c.prisoners[b]||0)-exchange);
    const exchange2 = Math.min(target.prisoners[a] || 0, c.casualties.captured); c.manpower += exchange2 * .85; c.casualties.captured -= exchange2; target.pow -= exchange2; target.prisoners[a] = Math.max(0,(target.prisoners[a]||0)-exchange2);
    for (const u of s.units.filter(u => !u.destroyed && (u.country === a || u.country === b))) if (R(s, u.region).owner !== u.country && !GS.atWar(s, u.country, R(s, u.region).owner) && !GS.rel(s, u.country, R(s, u.region).owner).access) { const safe = GS.owned(s, u.country)[0]; if (safe) { u.region = safe.id; u.order = null; u.organization = clamp(u.organization - 15); } }
    GS.log(s, 'peace', `${c.name} and ${target.name} sign a ${terms} settlement. Reconstruction, demobilization and veterans remain national responsibilities.`, null);
    s.outcomes.push({ type: 'peace', day: s.day, a, b, terms }); s.tension = clamp(s.tension - 10);
    return success(`Peace signed: ${terms}. ${leverage.reasons[1]}`);
  };

  GS.diplomacyTick = s => {
    for (const rel of s.relations) {
      const a = C(s, rel.a), b = C(s, rel.b); if (!a?.alive || !b?.alive) continue;
      if (rel.trade && !GS.atWar(s, a.id, b.id)) {
        const trade = rel.trade, buyer = C(s, trade.buyer), seller = C(s, trade.seller);
        const sellerLand = GS.owned(s, seller.id), buyerLand = GS.owned(s, buyer.id);
        const landRoute = sellerLand.some(r => r.neighbors.some(n => R(s, n).owner === buyer.id));
        const blocked = rel.sanctions.length ? 1 : landRoute ? 0 : Math.max(avg(sellerLand.filter(r => r.port).map(r => r.blockade || 0)), avg(buyerLand.filter(r => r.port).map(r => r.blockade || 0)));
        const access = landRoute || sellerLand.some(r => r.port) && buyerLand.some(r => r.port);
        const price = 1.2 / Math.max(.7, 1 + GS.mod(buyer,'trade'));
        const amount = access && seller.stock.transport > 1 ? Math.min(trade.amount, seller.stock[trade.resource], buyer.treasury / price, seller.stock.transport / .03) * Math.max(0, 1 - blocked) : 0;
        if (amount > 0) { seller.stock[trade.resource] -= amount; buyer.stock[trade.resource] += amount; if(trade.resource==='equipment') buyer.foreignEquipmentStock=(buyer.foreignEquipmentStock||0)+amount; buyer.treasury -= amount * price; seller.treasury += amount * price; seller.stock.transport -= .03 * amount; rel.aid += .01 * amount; }
        trade.lastDelivery = amount; trade.reason = !access ? 'No land border or functioning sea route' : blocked ? 'Sanctions or naval interdiction' : amount < trade.amount ? 'Seller stocks or buyer credit' : 'Route operating';
      }
      for (const key of ['reparations', 'concession']) if (rel[key] && rel[key].until > s.day) { const deal = rel[key], payer = C(s, deal.payer), receiver = C(s, deal.receiver), pool = key === 'concession' ? payer.stock : payer, other = key === 'concession' ? receiver.stock : receiver, resource = key === 'concession' ? deal.resource : 'treasury'; const n = Math.min(deal.daily, pool[resource]); pool[resource] -= n; other[resource] += n; if (n < deal.daily) { payer.radicalization = clamp(payer.radicalization + .02); rel.trust = clamp(rel.trust - .05); } }
      if (rel.pactUntil === s.day) GS.log(s, 'diplomacy', `The non-aggression agreement between ${a.short} and ${b.short} expires today.`, null);
      if (rel.loan) { const debtor = C(s, rel.loan.debtor), creditor = C(s, rel.loan.creditor), payment = Math.min(debtor.treasury, 1.1); debtor.treasury -= payment; creditor.treasury += payment; rel.loan.remaining -= payment; if (rel.loan.remaining <= 0) { rel.loan = null; rel.trust = clamp(rel.trust + 10); } }
    }
    for (const shipment of [...s.shipments]) {
      if (--shipment.remaining > 0) continue;
      const from = C(s, shipment.from), to = C(s, shipment.to); if (from && to && to.alive) {
        const blockade = avg(GS.owned(s, to.id).filter(r => r.port).map(r => r.blockade || 0));
        const delivered = shipment.amount * (1 - blockade * .7) * (1-clamp(shipment.loss||0,0,.95));
        if (shipment.kind === 'proxy') { const share=delivered/Math.max(1,shipment.amount); to.foreignCoupSupport = (to.foreignCoupSupport || 0) + 5*share; for (const r of GS.owned(s, to.id)) { r.resistanceOrganization = clamp(r.resistanceOrganization + 3*share); r.unrest = clamp(r.unrest + share); } }
        else { to.stock[shipment.resource] += delivered; if(shipment.resource==='equipment') to.foreignEquipmentStock=(to.foreignEquipmentStock||0)+delivered; }
        GS.log(s, 'diplomacy', `${from.short} shipment reaches ${to.short}: ${Math.round(delivered)} of ${shipment.amount} ${shipment.resource}.`, from.id);
      }
      s.shipments = s.shipments.filter(v => v !== shipment);
    }
    for (const u of s.declarations) if (!u.resolved && s.day >= u.deadline) { u.resolved = true; const target = C(s, u.to); if (target.stability < 40 && target.reputation < 40) { const border = GS.owned(s, target.id).find(r => r.neighbors.some(n => R(s, n).owner === u.from)); if (border) { border.owner = u.from; border.resistance = 35; GS.log(s, 'diplomacy', `${target.name} accepts a territorial concession under ultimatum.`, null, border.id); } } else GS.declareWar(s, u.from, u.to, u.aim); }
  };

  function eventCondition(s, c, condition) {
    if (!condition) return false;
    if (Array.isArray(condition)) return condition.every(k => eventCondition(s, c, k));
    let value;
    if (condition.metric === 'war') value = atWar(s, c.id) ? 1 : 0;
    else if (condition.metric === 'occupied') value = GS.owned(s, c.id).filter(r => r.core !== c.id).length;
    else if (condition.metric === 'unrest') value = avg(GS.owned(s, c.id).map(r => r.unrest));
    else if (condition.metric === 'resistance') value = avg(GS.owned(s, c.id).map(r => r.resistance));
    else value = condition.metric?.split('.').reduce((o, k) => o?.[k], c);
    if (!Number.isFinite(value)) return false;
    const test = Number(condition.value);
    return ({ '>': value > test, '>=': value >= test, '<': value < test, '<=': value <= test, '==': value === test, eq: value === test, gt: value > test, lt: value < test }[condition.op || '>'] || false);
  }
  GS.eventTick = s => {
    for (const ev of [...s.events]) if (ev.expires <= s.day || ev.country !== s.player) {
      const c = C(s, ev.country);
      if (c?.alive) {
        const ranked = ev.options.map((option, i) => ({ i, score: (option.effects?.stability || 0) * (c.stability < 50 ? 3 : 1) + (option.effects?.legitimacy || 0) * 1.4 + (option.effects?.treasury || 0) / 35 + (option.effects?.approval || 0) }));
        ranked.sort((a, b) => b.score - a.score);
        GS.applyEffects(c, ev.options[ranked[0]?.i || 0]?.effects);
        GS.log(s, 'event', `${ev.name}: ${ev.options[ranked[0]?.i || 0]?.label || 'cabinet response'}.`, c.id);
      }
      s.events = s.events.filter(v => v.id !== ev.id);
    }
    if (s.day % 15 !== 0) return;
    for (const c of s.countries) {
      if (!c.alive || s.events.some(e => e.country === c.id)) continue;
      const eligible = (GS.DATA.events || []).filter(e => eventCondition(s, c, e.condition) && (c.cooldowns[`event:${e.id}`] || 0) <= s.day);
      if (!eligible.length) continue;
      const ev = GS.pick(s, eligible);
      s.events.push({ id: s.nextId++, country: c.id, template: ev.id, name: ev.name, description: ev.description.replace(/\{country\}/g, c.name), options: ev.options, day: s.day, expires: s.day + 25 });
      c.cooldowns[`event:${ev.id}`] = s.day + 120;
      GS.log(s, 'decision', `${ev.name}: a cabinet decision is required within 25 days.`, c.id);
    }
  };
  GS.nationalAI = (s, cid) => {
    const c = C(s, cid); if (!c?.alive) return;
    const war = atWar(s, cid), land = GS.owned(s, cid), risk = GS.coupRisk(s, cid);
    c.ai.goal = risk > 48 ? 'Prevent an officer seizure' : c.metrics.shortage > .3 ? 'Restore civilian supply' : war ? 'Secure supply and an acceptable peace' : c.stock.fuel < 120 ? 'Secure fuel imports' : 'Build a resilient industrial state';
    const choose = (type, payload) => { const r = GS.act(s, cid, type, payload); if (r.ok) c.ai.actions++; return r; };
    if (risk > 47 && c.treasury > 90) choose('reform', { kind: c.coup.detected ? 'negotiate' : 'monitor' });
    if (c.stability < 45 && c.treasury > 120) choose('reform', { kind: 'election' });
    if (c.corruption > 32 && c.treasury > 200) choose('reform', { kind: 'anticorruption' });
    if (c.metrics.shortage > .1) { c.industryAllocation = Math.max(.22, c.industryAllocation - .025); if (c.stock.food < 100) choose('policy', { category: 'rationing', option: 'fair_rations' }); }
    else if (war) c.industryAllocation = Math.min(.66, c.industryAllocation + .01);
    else c.industryAllocation = Math.max(.3, c.industryAllocation - .008);
    if (war && c.manpower < 12000 && c.mobilization < 2) choose('mobilize', { level: c.mobilization + 1 });
    if (!war && c.mobilization > 0 && c.exhaustion < 45) choose('mobilize', { level: c.mobilization - 1 });
    if (c.treasury > 200 && c.construction.length < 2) {
      const damaged = land.filter(r => r.damage > 20).sort((a, b) => b.damage - a.damage)[0];
      const weak = land.filter(r => r.supply < 50 && r.rail < 4).sort((a, b) => a.supply - b.supply)[0];
      if (damaged) choose('build', { region: damaged.id, kind: 'repair' });
      else if (weak) choose('build', { region: weak.id, kind: 'rail' });
      else if (s.day % 15 === cid % 3) choose('build', { region: c.capital, kind: c.stock.food < 150 ? 'farm' : c.metrics.energy < .95 ? 'power' : 'industry' });
    }
    if (c.stock.food < 100 || c.stock.fuel < 80) {
      const resource = c.stock.food < 100 ? 'food' : 'fuel';
      const partner = s.countries.filter(v => v.id !== cid && v.alive && !GS.atWar(s, cid, v.id) && GS.rel(s, cid, v.id).opinion > -20).sort((a, b) => (c.intel.countryReports?.[b.id]?.[resource]?.min || 0) - (c.intel.countryReports?.[a.id]?.[resource]?.min || 0))[0];
      if (partner && !GS.rel(s, cid, partner.id).trade) choose('diplomacy', { target: partner.id, proposal: 'trade', resource, amount: 4 });
    }
    if (s.day % 21 === cid % 3) for (const target of s.countries) {
      if (!target.alive || target.id === cid) continue;
      const rel = GS.rel(s, cid, target.id);
      if (GS.atWar(s, cid, target.id)) {
        if (c.exhaustion > 48 || c.stability < 35 || GS.owned(s, cid).length < c.initialTerritory * .65) choose('diplomacy', { target: target.id, proposal: 'peace', terms: 'white' });
      } else if (rel.opinion > 30 && rel.trust > 55 && !rel.alliance && c.reputation > 40) choose('diplomacy', { target: target.id, proposal: 'alliance' });
      else if (!war && s.day > 60 && s.tension > 42 && rel.opinion < -45 && rel.pactUntil < s.day && c.stability > 57 && c.stock.food > 250 && c.stock.fuel > 200 && c.research.adopted.length > 1) {
        const border = land.some(r => r.neighbors.some(n => R(s, n).owner === target.id));
        const believed = c.ai.beliefs[target.id]?.strength?.max || Infinity;
        const own = s.units.filter(u => u.country === cid && !u.destroyed).reduce((a, u) => a + u.manpower, 0);
        if (border && !target.deterrencePublic && own > believed * (1.35 - s.options.ai * .08) && GS.rand(s) < .16 * s.options.ai) choose('diplomacy', { target: target.id, proposal: 'war', aim: 'territory' });
      }
    }
    if (c.spending.intelligence > .5 && c.treasury > 170 && c.intel.operations.length < 1 && s.day % 12 === cid % 3) {
      const target = s.countries.find(v => v.alive && v.id !== cid && GS.atWar(s, cid, v.id));
      if (target) choose('intel', { target: target.id, operation: (c.intel.networks[target.id] || 0) < 30 ? 'network' : 'recon' });
    }
    if (c.treasury < 40 && c.debt < 3000) choose('finance', { operation: 'bonds' });
    for (const r of land.filter(r => r.core !== cid && r.resistance > 40)) r.occupation = c.legitimacy > 50 ? 'civilian' : 'collaboration';
  };
  GS.outcomeTick = s => {
    for (const c of s.countries) {
      if (!c.alive) continue;
      const land = GS.owned(s, c.id);
      if (!land.length) {
        const ally = s.countries.find(a => a.alive && a.id !== c.id && GS.rel(s, c.id, a.id).alliance);
        if (ally && !c.exileSince) { c.exileSince = s.day; c.patron = ally.id; GS.log(s, 'government', `${c.name}'s government escapes into exile under ${ally.short}'s protection. Its surviving forces and foreign networks remain.`, c.id); }
        if (!ally || s.day - c.exileSince > 180) {
          c.alive = false;
          for (const u of s.units.filter(u => u.country === c.id && !u.destroyed)) { u.destroyed = true; u.strength = 0; u.manpower = 0; u.order = null; }
          for (const w of s.wars) if (w.a === c.id || w.b === c.id) w.active = false;
          s.outcomes.push({ type: 'annexation', country: c.id, day: s.day }); GS.log(s, 'collapse', `${c.name} no longer retains sovereign territory or a viable recognized government.`, null);
          if (c.id === s.player) s.result = { type: 'defeat', title: 'The state has dissolved', text: 'The country lost its territory and the means to continue as a sovereign government.', day: s.day, continued: false };
        }
        continue;
      }
      c.exileSince = null;
      if (R(s, c.capital)?.owner !== c.id && c.stability < 25 && c.exhaustion > 70 && s.day % 15 === 0) {
        const occupier = R(s, c.capital)?.owner; if (occupier !== undefined && GS.atWar(s, occupier, c.id)) GS.makePeace(s, occupier, c.id, 'territory', true);
      }
      c.collapseDays = c.stability < 5 && c.legitimacy < 10 && c.stock.food < 1 && c.treasury < 1 ? (c.collapseDays || 0) + 1 : 0;
      if (c.collapseDays > 45 && !c.coup.cooldown) { GS.civilWar(s, c.id, 'Fiscal failure and starvation dissolve central authority.'); c.collapseDays = 0; }
      const resilience = c.objectives.find(o => o.id === 'resilience'); if (resilience) { resilience.progress = c.legitimacy >= 55 && c.stock.food > 200 ? resilience.progress + 1 : Math.max(0, resilience.progress - 1); resilience.done = resilience.progress >= 180; }
      const accord = c.objectives.find(o => o.id === 'accord'); if (accord) accord.done = c.research.adopted.length >= 8 && s.relations.some(r => r.alliance && (r.a === c.id || r.b === c.id));
      const survive = c.objectives.find(o => o.id === 'survival'); if (survive) survive.done = s.day >= s.horizon;
    }
    const player = C(s, s.player);
    if (player.alive && !s.result && s.day >= s.horizon) {
      const objectives = player.objectives.filter(o => o.done).length;
      s.result = { type: objectives >= 2 ? 'victory' : 'survival', title: objectives >= 2 ? 'A durable settlement' : 'Sovereignty preserved', text: `${player.name} reaches ${GS.date(s.day)} with ${GS.owned(s, player.id).length} provinces and ${objectives} national objectives fulfilled. You may continue governing beyond the scenario horizon.`, day: s.day, continued: false };
    }
    if (player.alive && !s.result && GS.owned(s, s.player).length >= s.regions.length * .6 && player.legitimacy > 45) s.result = { type: 'victory', title: 'Continental ascendancy', text: 'Your state commands most of the continent. Occupation and postwar society still need governing; you may continue.', day: s.day, continued: false };
  };

  GS.act = (s, cid, type, payload = {}) => {
    cid = Number(cid); const c = C(s, cid), p = payload;
    if (!c?.alive && type !== 'continue') return reject('This state no longer has a functioning government.');
    const region = p.region !== undefined ? R(s, p.region) : null;
    if (type === 'continue') { if (!s.result || s.result.type === 'defeat') return reject('A dissolved state cannot continue.'); s.result.continued = true; return success('Campaign continues beyond its evaluated outcome.'); }
    if (type === 'retire') { s.result = { type: 'retirement', title: 'A chapter closes', text: `You retire on ${GS.date(s.day)}. The chronicle preserves the story of ${c.name}.`, day: s.day, continued: false }; return success('Campaign retired. You can review or continue it.'); }
    if (s.result && !s.result.continued) return reject('Review the campaign result or choose to continue first.');
    s.tutorial.actions ||= [];
    if (cid === s.player && !s.tutorial.actions.includes(type)) s.tutorial.actions.push(type);
    if (type === 'order') return GS.issueOrder(s, cid, Number(p.unit), Number(p.target), { plan: !!p.plan, amphibious: !!p.amphibious });
    if (type === 'recruit') { if (c.disarmedUntil > s.day) return reject('Peace terms temporarily prohibit recruitment.'); return GS.recruit(s, cid, p.unitType, p.training || 'balanced'); }
    if (type === 'stance') return GS.setStance(s, cid, Number(p.unit), p.stance === 'train' ? 'exercise' : p.stance);
    if (type === 'mission') return GS.setMission(s, cid, Number(p.unit), p.mission, Number(p.target));
    if (type === 'commander') return GS.assignCommander(s, cid, Number(p.unit), Number(p.commander));
    if (type === 'doctrine') return GS.setDoctrine(s, cid, p.doctrine);
    if (type === 'operation') return GS.createOperation(s, cid, p);
    if (type === 'research') return GS.queueResearch(s, cid, p.tech, p.institution);
    if (type === 'researchCancel') return GS.cancelResearch(s,cid,p.tech);
    if (type === 'researchInstitution') return GS.setResearchInstitution(s,cid,p.tech,p.institution);
    if (type === 'researchFunding') { if (!numeric(p.funding, .5, 2)) return reject('Research funding must be between 0.5 and 2.'); c.research.funding = Number(p.funding); c.spending.research = Number(p.funding); return success('Research funding adjusted. Institutional capacity and fiscal cost constrain the program.'); }
    if (type === 'automate') { if (!['production', 'military', 'intelligence'].includes(p.system)) return reject('Unknown delegation.'); c.automation[p.system] = !!p.enabled; return success(`${p.system} delegation ${p.enabled ? 'enabled' : 'disabled'}. You may override it at any time.`); }
    if (type === 'policy') {
      const law = GS.DATA.laws.find(l => l.category === p.category || l.id === p.category), option = law?.options.find(o => o.id === p.option);
      if (!law || !option) return reject('Choose a valid law and option.');
      if (c.policies[law.category] === option.id || c.pendingPolicies.some(v => v.category === law.category)) return reject('This policy is already active or awaiting enactment.');
      const gov = GS.gov(c), unpopular = Math.max(0, -(option.effects.approval || 0)) * 100;
      const opposition = clamp((100 - c.institutions.legislature) * (1 - gov.executive) + unpopular);
      if (opposition > 55 && gov.executive < .7 && c.legitimacy < 45) return reject('The legislature cannot sustain this law. Restore legitimacy, negotiate with factions or reform the constitution first.');
      if (!cost(c, 35 + opposition * .25)) return reject('The treasury cannot fund legal and administrative implementation.');
      c.pendingPolicies.push({ category: law.category, option: option.id, name: option.name, remaining: gov.delay + opposition / 10, opposition, backer: option.effects.production > .05 ? 'industry' : option.effects.repression > .1 ? 'security' : 'labor' });
      GS.log(s, 'policy', `${option.name} submitted for enactment; constitutional process and administrative capacity determine the delay.`, cid);
      return success(`${option.name} is pending. Enactment takes approximately ${Math.ceil((gov.delay + opposition / 10) / Math.max(.2, c.admin / 100))} days.`);
    }
    if (type === 'mobilize') {
      if (!Number.isInteger(Number(p.level)) || !numeric(p.level, 0, 3)) return reject('Select a mobilization level from 0 to 3.');
      const level = Number(p.level), delta = level - c.mobilization;
      if (!delta) return reject('This mobilization level is already in force.');
      if ((c.cooldowns.mobilization||0)>s.day) return reject('Mobilization offices need 20 days between national transitions.');
      if(delta>0 && c.treasury<delta*70) return reject('Mobilization requires 70 treasury per stage.');
      cooldown(s,c,'mobilization',20);
      if (delta > 0) {
        const recruits = Math.floor(c.initialPopulation * .007 * delta * (c.admin / 100) * (1 + GS.mod(c, 'manpower')));
        const eligible = Math.min(recruits, c.demographicPool); if (!cost(c, delta * 70)) return reject('Mobilization requires 70 treasury per stage.');
        c.manpower += eligible; c.demographicPool -= eligible; c.approval = clamp(c.approval - delta * 4); s.tension = clamp(s.tension + delta * 3);
      } else { const returned = Math.min(c.manpower, c.initialPopulation * .006 * -delta); c.manpower -= returned; c.demographicPool += returned; c.unemployment = clamp(c.unemployment - delta * 4); c.veteranBurden += -delta * 10; c.productionEfficiency = clamp(c.productionEfficiency - .07, .2, 1); }
      c.mobilization = level;
      GS.log(s, 'mobilization', `${c.short} shifts to mobilization stage ${level}. ${delta > 0 ? 'New recruits reduce the workforce in farms, factories and transport.' : 'Returning reservists need jobs and benefits; industrial reconversion temporarily slows output.'}`, cid);
      return success(`Mobilization stage ${level} enacted, with civilian labor and public consequences.`);
    }
    if (type === 'allocation') { if (!numeric(p.military, .1, .9)) return reject('Allocate 10–90% of industry to military production.'); const n = Number(p.military); c.productionEfficiency = clamp(c.productionEfficiency - Math.abs(n - c.industryAllocation) * .35, .2, 1); c.industryAllocation = n; return success('Factories begin conversion; production familiarity falls temporarily.'); }
    if (type === 'production' || type === 'labor') {
      const pool = type === 'production' ? c.production : c.labor;
      if (!(p.key in pool) || !numeric(p.value, .01, .9)) return reject('Select a valid allocation between 1% and 90%.');
      const value = Number(p.value), other = Object.entries(pool).filter(([k]) => k !== p.key), sum = other.reduce((n, [, v]) => n + v, 0);
      for (const [key, old] of other) pool[key] = sum ? old / sum * (1 - value) : (1 - value) / other.length;
      pool[p.key] = value; if (type === 'production') c.productionEfficiency = clamp(c.productionEfficiency - .05, .2, 1);
      return success(`${type} allocation updated; all shares still sum to 100%.`);
    }
    if (type === 'spending') { if (!(p.key in c.spending) || !numeric(p.value, .5, 2)) return reject('Spending must be 0.5–2 times the standard budget.'); c.spending[p.key] = Number(p.value); if (p.key === 'research') c.research.funding = Number(p.value); return success('Budget priorities updated. Daily expenditure and service capacity will change.'); }
    if (type === 'strategic') {
      const capabilities = c.capabilities || [];
      if (p.weapon === 'demonstrate') {
        if (!capabilities.includes('deterrence') && !capabilities.includes('nuclear_strike') && !capabilities.includes('ballistic_strike')) return reject('A credible strategic demonstration requires adopted delivery and weapons programs.');
        if (c.deterrencePublic) return reject('Your strategic capability has already been demonstrated.');
        if (!cost(c, 200, 80)) return reject('The demonstration requires 200 treasury and 80 materials.');
        c.deterrencePublic = true; c.prestige = clamp(c.prestige + 15); s.tension = clamp(s.tension + 12);
        for (const other of s.countries) if (other.id !== cid) other.intel.networks[cid] = clamp((other.intel.networks[cid] || 0) + 12);
        GS.log(s,'strategic',`${c.name} publicly demonstrates a strategic delivery capability. Rivals reconsider aggression while analysts learn from the demonstration.`,null);
        return success('Demonstration complete. Deterrence is now public, with a cost in secrecy and international tension.');
      }
      const targetRegion = R(s,p.target), nuclear = p.weapon === 'nuclear';
      if (!['ballistic','nuclear'].includes(p.weapon) || !capabilities.includes(nuclear ? 'nuclear_strike' : 'ballistic_strike')) return reject('The weapon and its delivery chain must be researched, engineered and adopted.');
      if (!targetRegion || !GS.atWar(s,cid,targetRegion.owner)) return reject('A strategic strike requires an enemy-held target during an active war.');
      if ((c.cooldowns.strategic || 0) > s.day) return reject('Strategic ordnance and delivery preparations take 60 days between strikes.');
      if (c.stock.fuel < 80 || !cost(c,nuclear?650:250,nuclear?250:90)) return reject('Insufficient treasury, materials or fuel for strategic delivery.');
      c.stock.fuel -= 80; c.cooldowns.strategic = s.day + 60;
      const enemy = C(s,targetRegion.owner), harm = nuclear ? 75 : 28;
      targetRegion.damage = clamp(targetRegion.damage + harm); targetRegion.infrastructure = clamp(targetRegion.infrastructure - harm*.7,5,100); targetRegion.housing = clamp(targetRegion.housing - harm*.8);
      const civilians = Math.floor(targetRegion.population * (nuclear ? .035 : .002)); targetRegion.population -= civilians; enemy.civilianLosses = (enemy.civilianLosses || 0) + civilians; enemy.exhaustion = clamp(enemy.exhaustion + (nuclear?15:4));
      c.reputation = clamp(c.reputation - (nuclear?50:12)); c.legitimacy = clamp(c.legitimacy - (nuclear?18:4)); s.tension = clamp(s.tension + (nuclear?40:14));
      for (const foreign of s.countries) if (foreign.id !== cid) { const relation = GS.rel(s,cid,foreign.id); relationMemory(relation,s,'Strategic escalation',nuclear?-25:-6); if (nuclear && !relation.sanctions.includes(foreign.id)) relation.sanctions.push(foreign.id); }
      GS.log(s,'strategic',`${c.name} uses a ${p.weapon} weapon at ${targetRegion.name}. Civilian deaths, damaged infrastructure and diplomatic shock persist beyond the strike.`,null,targetRegion.id);
      return success('Strike resolved. Civilian suffering, sanctions, legitimacy loss and escalation are recorded; the war does not automatically end.');
    }
    if (type === 'build') {
      const prices = { rail: [80, 35, 24], hub: [120, 45, 32], industry: [150, 60, 42], farm: [75, 25, 25], power: [100, 40, 32], fort: [65, 35, 25], repair: [35, 15, 12], airfield: [110, 45, 36], port: [150, 70, 45], housing: [55, 25, 20] }, price = prices[p.kind];
      if (!price || !region || region.owner !== cid) return reject('Construction needs an owned province and a valid project.');
      if (p.kind === 'port' && !region.coastal) return reject('A port needs coastline.');
      if (p.kind === 'hub' && region.hub || p.kind === 'port' && region.port || p.kind === 'rail' && region.rail >= 5) return reject('This facility is already built to the requested level.');
      if (c.construction.length >= 6 || c.construction.some(v => v.region === region.id && v.kind === p.kind)) return reject('Construction capacity is full or this project is already queued.');
      if (!cost(c, price[0], price[1])) return reject(`Requires ${price[0]} treasury and ${price[1]} materials.`);
      c.construction.push({ id: s.nextId++, region: region.id, kind: p.kind, remaining: price[2], total: price[2] });
      return success(`${p.kind} construction begins in ${region.name}; civilian output, material deliveries and transport set its pace.`);
    }
    if (type === 'appoint') {
      const leader = c.leaders.find(l => l.id === Number(p.leader) && l.active !== false), roles = ['defense', 'foreign', 'finance', 'industry', 'interior', 'intelligence', 'transport'];
      if (!leader || !roles.includes(p.role)) return reject('Choose an available official and ministry.');
      if (leader.role === p.role) return reject('This official already holds the ministry.');
      if (!cost(c, 30)) return reject('Cabinet reorganization needs 30 treasury.');
      const old = minister(c, p.role); if (old) { old.role = 'reserve'; const group = f(c, old.faction); if (group) group.loyalty = clamp(group.loyalty - 7); }
      leader.role = p.role; leader.loyalty = clamp(leader.loyalty + 8); const group = f(c, leader.faction); if (group) group.influence = clamp(group.influence + 5); c.stability = clamp(c.stability - 2);
      return success(`${leader.name} appointed to ${p.role}; the displaced faction loses influence and confidence.`);
    }
    if (type === 'promote' || type === 'purge') {
      const officer = c.commanders.find(v => v.id === Number(p.commander) && v.active !== false); if (!officer) return reject('Select an active commander.');
      if (type === 'purge') {
        if (c.commanders.filter(v => v.active !== false).length < 2) return reject('Removing the last functioning commander would leave no command structure.');
        officer.active = false; c.staff = clamp(c.staff - officer.competence * .13); c.institutions.army = clamp(c.institutions.army - 6); c.legitimacy = clamp(c.legitimacy - 5); c.coup.progress = Math.max(0, c.coup.progress - 30); f(c, 'military').loyalty = clamp(f(c, 'military').loyalty + 8);
        const replacement = c.commanders.find(v => v.active !== false);
        for (const u of s.units.filter(u => u.country === cid && u.commander === officer.id)) { u.commander = replacement.id; u.organization = clamp(u.organization - 15); u.morale = clamp(u.morale - 8); }
        GS.log(s, 'politics', `${officer.name} is removed in an officer purge. Conspiracy preparation falls; staff competence and institutional trust also suffer.`, cid);
        return success('Officer removed. Political risk and military competence both changed.');
      }
      if ((c.cooldowns[`promote:${officer.id}`]||0)>s.day || !cost(c,25)) return reject('Promotion needs 25 treasury and cannot repeat within 60 days.');
      cooldown(s,c,`promote:${officer.id}`,60);
      officer.loyalty = clamp(officer.loyalty + 10); officer.influence = clamp(officer.influence + 10); c.prestige = clamp(c.prestige + 3); for (const o of c.commanders) if (o.id !== officer.id) o.loyalty = clamp(o.loyalty - 2);
      return success('Promotion rewards loyalty and builds a more influential military figure; rivals resent being passed over.');
    }
    if (type === 'reform') {
      if (!['election', 'constitution', 'anticorruption', 'negotiate', 'monitor', 'arrest', 'patronage', 'succession'].includes(p.kind)) return reject('Select a valid institutional response.');
      if ((c.cooldowns[`reform:${p.kind}`] || 0) > s.day) return reject('This reform needs time before it can be repeated.');
      if (!cost(c, p.kind === 'constitution' ? 150 : 75)) return reject('The treasury cannot fund this institutional response.');
      c.cooldowns[`reform:${p.kind}`] = s.day + (p.kind === 'constitution' ? 180 : 45);
      if (p.kind === 'election') { c.legitimacy = clamp(c.legitimacy + 10); c.approval = clamp(c.approval + 6); c.stability = clamp(c.stability + 5); c.lastElection = s.day; c.institutions.legislature = clamp(c.institutions.legislature + 5); f(c, 'military').loyalty = clamp(f(c, 'military').loyalty - 3); }
      if (p.kind === 'constitution') { c.government = 'parliamentary'; c.legitimacy = clamp(c.legitimacy + 12); c.stability = clamp(c.stability - 8); c.institutions.courts = 75; c.institutions.legislature = 75; f(c, 'security').loyalty = clamp(f(c, 'security').loyalty - 12); }
      if (p.kind === 'anticorruption') { c.corruption = clamp(c.corruption - 12); c.admin = clamp(c.admin + 6); f(c, 'industry').loyalty = clamp(f(c, 'industry').loyalty - 9); f(c, 'security').loyalty = clamp(f(c, 'security').loyalty - 6); c.credibility = clamp(c.credibility + 4); }
      if (p.kind === 'negotiate') { c.coup.progress = Math.max(0, c.coup.progress - 22); c.stability = clamp(c.stability + 5); f(c, 'military').loyalty = clamp(f(c, 'military').loyalty + 12); f(c, 'military').influence = clamp(f(c, 'military').influence + 8); c.spending.military = Math.min(2, c.spending.military + .1); }
      if (p.kind === 'monitor') { c.intel.counter = clamp(c.intel.counter + 15); c.coup.detected = c.coup.stage > 0; c.credibility = clamp(c.credibility - 2); c.institutions.intelligence = clamp(c.institutions.intelligence + 5); }
      if (p.kind === 'arrest') { c.coup.progress = Math.max(0, c.coup.progress - 35); c.legitimacy = clamp(c.legitimacy - (c.coup.detected ? 3 : 12)); c.radicalization = clamp(c.radicalization + 6); c.staff = clamp(c.staff - 5); c.institutions.army = clamp(c.institutions.army - 4); }
      if (p.kind === 'patronage') { for (const g of c.factions) g.loyalty = clamp(g.loyalty + 7); c.corruption = clamp(c.corruption + 7); c.admin = clamp(c.admin - 3); }
      if (p.kind === 'succession') { c.successionDay = Math.max(c.successionDay, s.day + 700); c.legitimacy = clamp(c.legitimacy + 5); c.coup.progress = Math.max(0, c.coup.progress - 12); }
      GS.log(s, 'politics', `Institutional response: ${p.kind}. Political consent, competence and government resources change together.`, cid);
      return success(`${p.kind} response enacted. See institutions, factions and the daily situation report for its effects.`);
    }
    if (type === 'propaganda') {
      if (!['unity', 'victory', 'sacrifice', 'truth'].includes(p.theme)) return reject('Choose a public information theme.');
      if ((c.cooldowns.propaganda||0)>s.day || !cost(c,45)) return reject('A campaign needs 45 treasury and 20 days between broadcasts.');
      cooldown(s,c,'propaganda',20);
      const trust = c.credibility / 100;
      if (p.theme === 'truth') { c.credibility = clamp(c.credibility + 9); c.legitimacy = clamp(c.legitimacy + 4); c.approval = clamp(c.approval - c.exhaustion * .06); c.hiddenLosses = 0; }
      else { c.approval = clamp(c.approval + 6 * trust); c.warSupport = clamp(c.warSupport + 5 * trust); if (p.theme === 'victory' && c.exhaustion > 35 || c.metrics.shortage > .3) { c.credibility = clamp(c.credibility - 12); c.radicalization = clamp(c.radicalization + 4); } else c.credibility = clamp(c.credibility - 1); }
      return success('Broadcast campaign launched. Claims that contradict shortages or losses damage future credibility.');
    }
    if (type === 'occupation') { if (!region || region.owner !== cid || region.core === cid || !['civilian', 'collaboration', 'military', 'harsh', 'extract'].includes(p.policy)) return reject('Choose a valid administration for an occupied province.'); region.occupation = p.policy; c.reputation = clamp(c.reputation + (['harsh', 'extract'].includes(p.policy) ? -2 : 1)); return success('Occupation administration changed; extraction, compliance and organized resistance will respond over time.'); }
    if (type === 'region') {
      if (!region || region.owner !== cid) return reject('Regional decisions require territorial control.');
      const allowed = ['autonomy', 'negotiate', 'suppress', 'evacuate', 'evacuateIndustry', 'scorch', 'relief'];
      if (!allowed.includes(p.operation)) return reject('Select a valid regional operation.');
      if (['negotiate','relief'].includes(p.operation) && c.treasury<40) return reject('Relief and negotiated concessions need 40 treasury.');
      if (['evacuate','evacuateIndustry'].includes(p.operation) && (c.stock.transport<30 || !GS.owned(s,cid).some(r=>r.id!==region.id && r.damage<15))) return reject('Evacuation needs a safe destination and 30 transport.');
      if (!cooldown(s, c, `${p.operation}:${region.id}`, 30)) return reject('This province needs time before the operation can be repeated.');
      if (p.operation === 'autonomy') { region.autonomy = clamp(region.autonomy + 20); region.unrest = clamp(region.unrest - 12); region.separatism = clamp(region.separatism - 15); c.admin = clamp(c.admin - 1); }
      if (p.operation === 'negotiate' || p.operation === 'relief') { if (!cost(c, 40)) return reject('Relief and negotiated concessions need 40 treasury.'); region.unrest = clamp(region.unrest - 15); region.compliance = clamp(region.compliance + 8); region.housing = clamp(region.housing + 8); c.legitimacy = clamp(c.legitimacy + 2); }
      if (p.operation === 'suppress') { region.unrest = clamp(region.unrest - 18); region.resistance = clamp(region.resistance + 12); region.separatism = clamp(region.separatism + 7); c.legitimacy = clamp(c.legitimacy - 4); c.radicalization = clamp(c.radicalization + 3); }
      if (p.operation === 'scorch') { region.damage = clamp(region.damage + 55); region.infrastructure = clamp(region.infrastructure - 45, 5, 100); region.housing = clamp(region.housing - 25); c.legitimacy = clamp(c.legitimacy - 8); c.reputation = clamp(c.reputation - 6); }
      if (p.operation === 'evacuate' || p.operation === 'evacuateIndustry') {
        const safe = GS.owned(s, cid).filter(r => r.id !== region.id && r.damage < 15).sort((a, b) => b.housing - a.housing)[0];
        if (!safe || c.stock.transport < 30) return reject('Evacuation needs a safe destination and 30 transport.');
        c.stock.transport -= 30;
        if (p.operation === 'evacuate') { const n = Math.floor(region.population * .2); region.population -= n; safe.population += n; region.displaced += n; safe.housing = clamp(safe.housing - n / 6000); c.refugees += n; c.health = clamp(c.health + 1); }
        else { const capacity = Math.min(2, region.industry * .5); region.industry -= capacity; safe.industry += capacity * .75; c.productionEfficiency = clamp(c.productionEfficiency - .08, .2, 1); }
        GS.log(s, 'society', `${region.name}: ${p.operation} to ${safe.name} preserves people or industrial machinery, with transport and relocation costs.`, cid, region.id);
      }
      return success(`${p.operation} carried out in ${region.name}. Regional autonomy, civilian hardship and economic costs persist.`);
    }
    if (type === 'finance') {
      if (!['bonds', 'print', 'repay', 'reserve', 'release'].includes(p.operation)) return reject('Choose a finance action.');
      if(p.operation==='repay' && (c.debt<=0 || c.treasury<=0)) return reject('No affordable debt repayment is available.');
      if (!cooldown(s, c, `finance:${p.operation}`, 25)) return reject('Financial operations need 25 days between repeats.');
      if (p.operation === 'bonds') { const n = Math.round(100 + c.credibility * 2); c.treasury += n; c.debt += n; c.approval = clamp(c.approval - 1); }
      if (p.operation === 'print') { c.treasury += 250; c.inflation += 5; c.credibility = clamp(c.credibility - 4); }
      if (p.operation === 'repay') { const n = Math.min(200, c.debt, c.treasury); if (n <= 0) return reject('No affordable debt repayment is available.'); c.treasury -= n; c.debt -= n; c.reputation = clamp(c.reputation + 2); }
      if (p.operation === 'reserve') for (const k of ['food', 'fuel', 'ammo']) { const n = Math.min(100, c.stock[k]); c.stock[k] -= n; c.reserves[k] += n; }
      if (p.operation === 'release') for (const k of ['food', 'fuel', 'ammo']) { const n = Math.min(100, c.reserves[k]); c.reserves[k] -= n; c.stock[k] += n; }
      return success(`${p.operation} completed. Debt, inflation and reserve buffers remain part of the campaign.`);
    }
    if (type === 'intel') {
      const local = ['deception', 'counter', 'cipher', 'inspect'].includes(p.operation);
      const target = local ? c : C(s, p.target);
      if (!target?.alive || !local && target.id === cid) return reject('Choose another functioning state as the operation target.');
      const allowed = ['network', 'recon', 'sabotage', 'deception', 'counter', 'cipher', 'coup', 'steal', 'psyops', 'inspect', 'jamming', 'doubleagent'];
      if (!allowed.includes(p.operation)) return reject('Select an intelligence operation.');
      if (c.intel.operations.length >= 4) return reject('The service can support four simultaneous field operations.');
      if(!local && region && region.owner!==target.id) return reject('The selected province is not controlled by the target.');
      if(local && (c.cooldowns[`intel:${p.operation}`]||0)>s.day) return reject('This internal operation cannot be repeated within 20 days.');
      if (!cost(c, local ? 45 : 65)) return reject('The intelligence budget cannot fund this operation.');
      if (local) {
        if (!cooldown(s, c, `intel:${p.operation}`, 20)) return reject('This internal operation cannot be repeated within 20 days.');
        if (p.operation === 'deception') c.intel.deception = clamp(c.intel.deception + 40);
        if (p.operation === 'counter') { c.intel.counter = clamp(c.intel.counter + 15); c.legitimacy = clamp(c.legitimacy - 2); for (const other of s.countries) if (other.id !== cid) other.intel.networks[cid] = Math.max(0, (other.intel.networks[cid] || 0) - 8); }
        if (p.operation === 'cipher') { c.intel.cipher = clamp(c.intel.cipher + 55); c.jammedUntil = s.day + 5; }
        if (p.operation === 'inspect') { c.corruption = clamp(c.corruption - 4); c.domesticReport = {}; for (const k of ['food', 'fuel']) c.domesticReport[k] = estimate(s, c.stock[k], 98, 'Independent stock inspection'); c.credibility = clamp(c.credibility + 2); }
        return success(`${p.operation} program deployed. Security has costs in secrecy, trust or command responsiveness.`);
      }
      if (region && region.owner !== target.id) return reject('The selected province is not controlled by the target.');
      c.intel.operations.push({ id: s.nextId++, target: target.id, operation: p.operation, region: region?.id ?? null, remaining: p.operation === 'recon' ? 5 : 14, total: p.operation === 'recon' ? 5 : 14 });
      return success(`${p.operation} operation underway. Success depends on networks, analysis and hostile counterintelligence.`);
    }
    if (type === 'event') {
      const ev = s.events.find(v => v.id === Number(p.event) && v.country === cid), option = ev?.options[Number(p.option)];
      if (!ev || !option) return reject('This decision is no longer pending.');
      GS.applyEffects(c, option.effects); s.events = s.events.filter(v => v.id !== ev.id); GS.log(s, 'event', `${ev.name}: ${option.label}.`, cid); return success('Cabinet decision enacted and recorded in the chronicle.');
    }
    if (type === 'diplomacy') return diplomaticAction(s, c, p);
    return reject(`Unknown action: ${type}.`);
  };

  function diplomaticAction(s, c, p) {
    const target = C(s, p.target), cid = c.id;
    if (!target?.alive || target.id === cid) return reject('Choose another sovereign country.');
    const rel = GS.rel(s, cid, target.id), war = GS.atWar(s, cid, target.id);
    const proposal = p.proposal, recognized = ['alliance', 'pact', 'guarantee', 'access', 'sanction', 'trade', 'aid', 'loan', 'influence', 'proxy', 'ultimatum', 'war', 'peace', 'exchange', 'recognize', 'conference', 'license', 'investment'];
    if (!recognized.includes(proposal)) return reject('Select a valid diplomatic proposal.');
    if (proposal === 'war') {
      const gov = GS.gov(c);
      if (gov.executive < .6 && c.legitimacy < 40) return reject('The legislature refuses a new offensive war while the government lacks a mandate.');
      return GS.declareWar(s, cid, target.id, ['territory', 'regime', 'reparations', 'defense'].includes(p.aim) ? p.aim : 'territory');
    }
    if (proposal === 'peace') return GS.makePeace(s, cid, target.id, p.terms || 'white');
    if (war && !['exchange', 'conference', 'proxy', 'sanction'].includes(proposal)) return reject('Active war prevents this agreement; use negotiations or a prisoner exchange.');
    if (proposal === 'alliance' || proposal === 'pact' || proposal === 'access') {
      if (proposal === 'alliance' && rel.alliance || proposal === 'access' && rel.access || proposal === 'pact' && rel.pactUntil > s.day) return reject('This agreement is already active.');
      const score = rel.opinion * .5 + rel.trust * .5 + c.reputation * .25 + skill(c, 'foreign') * 10 - (proposal === 'alliance' ? 40 : proposal === 'access' ? 33 : 24) - target.exhaustion * .08;
      if (score < 0) return reject(`Proposal rejected: ${rel.opinion < 0 ? 'distrust and conflicting interests' : 'insufficient treaty credibility'} outweigh the benefits. Improve relations through trade, assistance or restraint.`);
      if (!cost(c, 30)) return reject('Diplomatic negotiations require 30 treasury.');
      if (proposal === 'alliance') { rel.alliance = true; rel.access = true; rel.trust = clamp(rel.trust + 8); }
      if (proposal === 'access') rel.access = true;
      if (proposal === 'pact') rel.pactUntil = s.day + 180;
      GS.log(s, 'diplomacy', `${c.name} and ${target.name} conclude a ${proposal} agreement.`, null);
      return success(`${proposal} accepted: shared interests and your treaty reputation support the agreement.`);
    }
    if (proposal === 'guarantee') { if(rel.guarantee===cid) return reject('Your guarantee is already in force.'); rel.guarantee = cid; rel.trust = clamp(rel.trust + 4); c.reputation = clamp(c.reputation + 1); return success('Guarantee issued. If the country is attacked, your state will be called into its defense.'); }
    if (proposal === 'sanction') { const already = rel.sanctions.includes(cid); rel.sanctions = already ? rel.sanctions.filter(v => v !== cid) : [...rel.sanctions, cid]; relationMemory(rel, s, already ? 'Sanctions lifted' : 'Economic sanctions', already ? 4 : -8); s.tension = clamp(s.tension + (already ? -2 : 3)); return success(already ? 'Sanctions lifted; lawful trade can resume.' : 'Sanctions imposed. Bilateral deliveries halt and relations deteriorate.'); }
    if (proposal === 'trade') {
      const resource = ['food', 'fuel', 'materials', 'equipment', 'ammo', 'parts', 'goods'].includes(p.resource) ? p.resource : 'food', amount = clamp(Number(p.amount) || 5, 1, 20);
      if (rel.sanctions.length || rel.opinion < -35) return reject('Sanctions or political hostility prevent a trade contract.');
      if (rel.trade) return reject('A bilateral resource contract is already active.');
      rel.trade = { buyer: cid, seller: target.id, resource, amount, price: 1.2, started: s.day, lastDelivery: 0, reason: 'First shipment pending' };
      relationMemory(rel, s, 'Trade contract', 5); return success(`Contract signed for up to ${amount} ${resource}/day at 1.2 treasury each. Delivery depends on seller stocks, credit and routes.`);
    }
    if (proposal === 'aid' || proposal === 'proxy') {
      const amount = clamp(Number(p.amount) || 30, 10, 200), resource = proposal === 'proxy' ? 'equipment' : p.resource in c.stock ? p.resource : 'equipment';
      if (c.stock[resource] < amount || c.stock.transport < 8) return reject('Assistance requires the promised stock and 8 transport.');
      c.stock[resource] -= amount; c.stock.transport -= 8; s.shipments.push({ id: s.nextId++, from: cid, to: target.id, resource, amount, kind: proposal, remaining: 8, total: 8 });
      if (proposal === 'aid') { relationMemory(rel, s, 'Material aid', 10); rel.trust = clamp(rel.trust + 5); }
      else { s.tension = clamp(s.tension + 3); if (GS.rand(s) < target.intel.counter / 180) relationMemory(rel, s, 'Proxy support exposed', -18); }
      return success('Material dispatched. Transport takes eight days and interception can reduce the delivery.');
    }
    if (proposal === 'loan') {
      if (rel.loan || rel.trust < 30 || c.reputation < 30) return reject('Creditors require trust, a repayment reputation and no outstanding bilateral loan.');
      const amount = Math.min(250, target.treasury * .2); if (amount < 50) return reject('The prospective lender lacks available capital.'); target.treasury -= amount; c.treasury += amount; c.debt += amount; rel.loan = { debtor: cid, creditor: target.id, remaining: amount * 1.15 }; return success('Foreign credit agreed. Daily repayments create lasting creditor influence.');
    }
    if (proposal === 'influence' || proposal === 'investment') {
      if ((c.cooldowns[`${proposal}:${target.id}`]||0)>s.day) return reject('This initiative requires 45 days before renewal.');
      const amount = proposal === 'investment' ? 160 : 65; if (!cost(c, amount)) return reject(`Requires ${amount} treasury.`);
      cooldown(s,c,`${proposal}:${target.id}`,45);
      if (proposal === 'investment') { const site = GS.owned(s, target.id)[0]; if (site) { site.industry += 1; site.energy += 1; } target.treasury += 50; rel.aid += 20; }
      relationMemory(rel, s, proposal, 10); rel.trust = clamp(rel.trust + 6); f(target, 'industry').influence = clamp(f(target, 'industry').influence + 2); return success('An economic and political relationship grows; the recipient also becomes more dependent on your support.');
    }
    if (proposal === 'ultimatum') {
      if (s.declarations.some(u => !u.resolved && u.from === cid && u.to === target.id)) return reject('An ultimatum is already pending.');
      if (!GS.owned(s, cid).some(r => r.neighbors.some(n => R(s, n).owner === target.id))) return reject('Territorial ultimatums require a shared border.');
      s.declarations.push({ from: cid, to: target.id, deadline: s.day + 14, aim: p.aim || 'territory', resolved: false }); s.tension = clamp(s.tension + 10); c.reputation = clamp(c.reputation - 6);
      GS.log(s, 'crisis', `${c.name} issues ${target.name} a fourteen-day ultimatum. Refusal will begin a war.`, null); return success('Ultimatum delivered. It commits your government to escalation if rejected.');
    }
    if (proposal === 'exchange') {
      c.prisoners ||= {}; target.prisoners ||= {};
      const n = Math.min(c.prisoners[target.id]||0, target.prisoners[cid]||0); if (n < 1) return reject('There are no reciprocal prisoner pools from these two states available for exchange.'); c.pow -= n; target.pow -= n; c.prisoners[target.id]-=n; target.prisoners[cid]-=n; c.manpower += n * .8; target.manpower += n * .8; c.casualties.captured = Math.max(0, c.casualties.captured - n); target.casualties.captured = Math.max(0, target.casualties.captured - n); c.credibility = clamp(c.credibility + 2); target.credibility = clamp(target.credibility + 2); return success(`${Math.round(n)} prisoners repatriated on each side. Most recover to the manpower pool.`);
    }
    if (proposal === 'recognize') { if(rel.recognized) return reject('Diplomatic recognition is already established.'); target.legitimacy = clamp(target.legitimacy + 4); relationMemory(rel, s, 'Diplomatic recognition', 8); rel.recognized = true; return success('Diplomatic recognition strengthens the new government and bilateral ties.'); }
    if (proposal === 'conference') { if (!cost(c, 60)) return reject('A mediation conference needs 60 treasury.'); s.tension = clamp(s.tension - 8); rel.trust = clamp(rel.trust + 8); if (war) return GS.makePeace(s, cid, target.id, p.terms || 'white'); relationMemory(rel, s, 'Mediation', 6); return success('The conference lowers regional tension and opens a credible backchannel.'); }
    if (proposal === 'license') { if (rel.trust < 40 || rel.sanctions.length) return reject('Technology transfer requires trust and no sanctions.'); const tech = p.tech || target.research.adopted.find(id => !c.research.adopted.includes(id)); if (!tech) return reject('No suitable foreign technology is available to license.'); return GS.licenseTechnology(s, target.id, cid, tech); }
    return reject('The proposal could not be resolved.');
  }
})(globalThis.GS);
