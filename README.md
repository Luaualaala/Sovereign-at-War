# Sovereigns at War

An original, single-player grand-strategy game about governing an industrial state through war, peace and political upheaval. Eight countries share the fictional Amar continent. The campaign begins on 1 January 1936 and reaches its first settlement after 1,460 days; a surviving state can continue beyond that date.

## Play

Double-click **Start Sovereigns at War.cmd**. The launcher opens your browser at **http://127.0.0.1:8837/** and keeps campaign saves in this folder. It uses the installed Node.js runtime, starts its small local server without a console window, and reuses the existing server on subsequent launches. There are no package downloads, accounts, external assets or internet services.

Choose a country, starting situation and difficulty, then select **Take national command**. Time begins paused. Aurelian Federation is a comfortable first country; Vardic Crown and Cinder Workers Union begin at war in the continental powder-keg scenario. **Command school tutorial** walks through real decisions.

If Node.js is unavailable, open **index.html** directly. The game runs in the browser; use **Save & restore → Portable campaign record** to export or import a text save. Automatic disk saves require the launcher.

## Your first decisions

1. Open **National overview** for national objectives and the current assessment. An objective can be achieved through stable government and alliances, not only conquest.
2. Open **Economy** and inspect food, fuel and the daily ledger. Production shares are normalized; changing priorities temporarily disrupts factory efficiency. Mobilization removes workers from civilian production.
3. Open **Research**, select a program and queue its prerequisite path. Institutions must complete theory, prototype, production engineering and field adoption. A discovery does not immediately equip your army.
4. Inspect **Armed forces** and the **Supply network** map lens. Rest tired formations, appoint commanders, recruit with an appropriate training standard, and prepare operations the transport network can support.
5. Open **Diplomacy** to build alliances, purchase resources, offer assistance, license technologies or negotiate settlement. An alliance or guarantee can bring your country into a partner's war.
6. Resume time. Read the wire and **Daily briefing**, respond to decisions, and save before making a large strategic commitment.

## Controls

| Control | Effect |
|---|---|
| Space / top play button | Pause or resume |
| 1×, 2×, 3×, 5× | Change time speed |
| M | Open the strategic atlas |
| B | Open the daily briefing |
| Click a province | Show its dossier and your formations |
| Click your formation | Select it for orders |
| Right-click a destination | Send an order to the selected formation |
| Shift + right-click | Issue a prepared order |
| Province dossier / military order form | Accessible alternative to map orders |
| Drag map, mouse wheel, + / − | Pan and zoom |
| Ctrl or Shift in operation formation lists | Select several participating units or reserves |
| Escape | Close a dialog |

The gear button controls interface scale, map palette, motion, sound, crisis pauses and key bindings. Music and feedback use an original synthesized score; audio starts only after you enable it.

## Govern a state, not an immortal leader

Government structure, laws, factions, cabinet members and institutions affect enforcement, production, public trust and military loyalty. Stability measures immediate order; legitimacy measures acceptance of the right to govern. Credibility determines whether official claims are believed. These are separate systems.

Officer conspiracies recruit support and prepare to seize institutions. Coups can fail, replace the government, or split territory, resources and forces into a civil war. Your campaign continues after regime change. Purges can disrupt conspiracies while removing competent commanders and weakening staff work. Protests, strikes, desertion, mutinies and resistance grow from conditions in the simulation.

Military supply consumes finite food, ammunition, fuel and spare parts through shared routes. Ports, hubs, railways, neutral access, damaged infrastructure and transport stocks matter. Units carry experience, stress, fatigue, morale, training, organization, reliability and current manpower. Replacements may dilute veteran quality. Captured or imported equipment creates compatibility costs. Aircraft and fleets perform missions; amphibious landings require appropriate capabilities, reconnaissance, transport and naval control.

Foreign reports include a source, age and confidence. They can contain broad estimates, obsolete positions or deceptive concentrations. Your own administrative reports can also be inaccurate. The ledger records holdings while inspections help uncover diversion. Use intelligence, ciphers, reconnaissance and counterintelligence to improve decisions.

Peace agreements consider war aims and bargaining leverage. Reconstruction, demobilization, debt, refugees and veterans remain after the front becomes quiet. Occupation choices balance extraction, local consent, security and resistance. Strategic weapons require their research and delivery chain, have substantial costs and persistent civilian and diplomatic consequences, and do not automatically end a war.

## Saves and recovery

Three manual slots and three rotating autosave slots are available. Every disk save creates a new revision under **saves/**; prior revisions are retained. The latest intact revision is loaded if a newer file is interrupted or damaged. Import checks the format, checksum and campaign structure before replacing the current state. Save files include the seeded random state, so restoring and repeating the same decisions gives the same simulation.

The supplied manual slots contain validation campaigns: slot 1 preserves the opening of an Aurelian campaign with a research queue and prepared operation; slot 2 records the same campaign in November. You can start a fresh campaign from the title button. Saving to these slots retains earlier revisions.

**Stop Sovereigns at War.ps1** closes only the independently verified server belonging to this folder. Save your campaign before stopping it. The game is local to this computer; it is not a multiplayer service.

## Content and scope

The game contains 8 playable countries, 128 provinces, 270 technologies across 18 branches, 42 law options, 34 political traits, 34 commander traits, 46 conditional event templates, 25 unit families, 12 government archetypes and 7 doctrines. It uses a generated but coherent fictional continent and reusable political/economic systems.

The simulation resolves daily at the province and formation level. Sea lanes and air missions are regional abstractions, and populations are aggregated rather than individual people. It is a compact original strategy game, with room for further content and balance tuning. It does not reproduce the historical world or presentation of Hearts of Iron IV. There is no multiplayer or graphical scenario editor; editable content tables and a documented engine contract support expansion without a build step.

## Files and verification

- **data.js**: country, government, law, doctrine, equipment, event and technology data.
- **core.js**: world creation, deterministic time, common rules and validated campaign serialization.
- **research.js**, **warfare.js**, **systems.js**: interconnected simulation and player/AI actions.
- **index.html**, **styles.css**, **ui.js**: browser interface, atlas, research tree, audio and player controls.
- **server.cjs** and launch/stop scripts: local delivery and append-only save service.
- **ENGINE_CONTRACT.md**: extension interfaces and state conventions.
- **VALIDATION.md** and **AI_STATUS.md**: verification evidence, status and practical limits.

From this folder, run `node tests/research.test.cjs`, `node tests/warfare.test.cjs`, `node tests/integration.test.cjs`, and `node tests/server.test.cjs`. The server test uses its own project-contained evidence directory and a separate local port. No test removes existing save revisions.

Your original **AGENT_JOB.md** and **Job References/** specification are preserved as received.
