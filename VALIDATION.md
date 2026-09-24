# Verification record — Sovereigns at War

Date: 6 September 2026. Engine and browser use the same JavaScript source. Node.js v24.19.0 was already installed; no dependencies were installed or updated.

## Recorded automated result

The exact claimed job was validated through `agentctl.mjs validate` with five substantive commands. All returned exit code 0. The workspace record is `.workspace/validations/t-mtnmyfc6-2j5w_1788652829218.json`.

| Command, from this game folder | Result |
|---|---|
| `node tests/research.test.cjs` | 28/28 checks passed |
| `node tests/warfare.test.cjs` | 36/36 checks passed |
| `node tests/integration.test.cjs` | 31/31 checks passed |
| `node tests/server.test.cjs` | 7/7 checks passed |
| `node --check ui.js` | Passed |

Total: **102 automated checks passed**, plus interface syntax validation.

The integrated campaign ran the full **1,460 days** with no nonfinite state or invalid campaign structure. It reached **victory**, with 213 retained battle records, 3,000 retained chronicle entries and active AI economies, research and military command. No country completed all 270 technologies. The focused research campaign advanced from 9 initial to 68 adopted technologies over the same duration.

## Meaningful scenarios covered

- All 32 combinations of eight countries and four starting situations initialize correctly; all 128 province routes are reciprocal.
- Finite recruitment and supply, shared bottlenecks, neutral access, damaged rail, missing fuel and ammunition, delayed orders, planned offensives, commander effects and doctrine adoption.
- Simultaneous battle casualties, territorial movement, psychological exhaustion and recovery, replacement dilution, surrender and POWs, mutiny conditions, incompatible foreign equipment, bombing, interception, reconnaissance, convoy raiding, escort and amphibious requirements.
- A military AI adversarial test throws if it reads hidden foreign unit fields. Identical reports produce identical AI orders despite changed hidden enemy strength.
- Civil war conserves the parent's combined money, stockpiles, manpower and unit count as it splits territory and command. Coup resolution reaches failure, regime replacement and civil war.
- Mobilization lowers civilian output; allocations normalize and incur retooling; legal enactment is delayed; construction consumes resources and changes the province; shortage and occupation decisions affect society.
- Alliances/guarantees create belligerents; imported sea trade responds to both ends of a blockade; land-border trade remains possible; aid loses intercepted quantities and introduces foreign-equipment costs; jamming delays real orders.
- Research forms a complete acyclic 270-node graph. Institutions, costs, prerequisites, four stages, adoption, licensing, stolen fragments and restored random state function.
- Unresearched strategic weapons are rejected. A fully prepared strike requires war and resources and records physical damage, civilian losses, sanctions and political harm.
- Rejected actions preserve resources and cooldowns for tested mobilization, propaganda, relief, promotion, intelligence, diplomatic initiatives and strategic delivery paths.
- Events emerge from conditions and their chosen responses affect state. Daily ledger changes include research, warfare and diplomacy as well as the economy.
- Defeat, government exile, the 180-day exile limit, victory, retirement and continuing government are exercised.
- Complete simulation save/resume is deterministic. Damaged checksums, unknown versions, missing essential fields, invalid ownership and unknown unit types are rejected.
- Local save tests verify exact served assets, manual restore, append-only revisions, fallback after an interrupted revision, rejected invalid writes, foreign-origin rejection and static-file isolation. Test records remain in separate `tests/evidence/server-*` folders; the test process exits afterward.

## Expanded specification completion gate

The following groups map the specification's section 318 to actual implementation and evidence. Regional and daily abstractions preserve consequences without simulating individual citizens or every vehicle.

| Completion requirement | Implementation and evidence |
|---|---|
| Hundreds of meaningful research nodes, incomplete campaign coverage, institutions/funding, prototypes/adoption, licensing | data.js + research.js; 28 focused checks and full campaign |
| Command delay, initiative, plans, staff, replacements, maintenance, standardization | warfare.js; delay/plan/recovery/reliability tests and operation UI |
| POWs, surrender, negotiated peace, war aims | warfare.js + systems.js; surrender and diplomatic settlement paths |
| Mobilization/demobilization, rationing, finance/debt, labor, energy/transport, repair | economy/political/society ticks and actionable policies; integration cases |
| Functional air and naval warfare | mission simulation, interception, bombing, raiding, escort and landing tests |
| Uncertain reports, deception, counterintelligence, credibility | intelligence service and report metadata; adversarial military AI checks |
| Administration, cabinet/institutions, occupation choices, organized resistance | policy enactment, coups, civil war, regional decisions and resistance scenarios |
| Active research/logistics AI with imperfect information | focused AI cases and four-year campaign |
| Emergent chronicle and explanations | dated event/battle/decision history; dossiers, supply constraints and daily ledger |

## Live browser and launch validation

The game was launched with the provided PowerShell launcher and its actual local listener, then visually inspected in the Codex browser at desktop sizes around 1083×808 and 1280×720. The setup, atlas, government, economy, military, diplomacy, intelligence, society, research and chronicle screens were reviewed. The final checks also include program-management controls and preferences. Map/department text, panels and forms were inspected as rendered rather than inferred from source.

A real Aurelian campaign was played through the interface from 1 January to 3 November 1936 using pause and 5× controls. Two infantry formations received a coordinated operation with a separate reserve and reached the capital. A light machine-gun program was queued. Manual saves and rotating autosaves were created; restoring manual slot 1 returned to 1 January with its queued research and prepared operation intact. The browser reported no console warnings or errors during the checked flow.

The startup script was verified to reuse a matching running server. The stop script independently checks the health identity, port owner, executable and project command line before terminating only that instance. Stop/restart and repeated startup passed. The lightweight final server is intentionally left running for immediate play.

## Failures found and corrected

Integration repaired intercepted aid being delivered in full, importer ports being omitted from naval trade interdiction, intelligence jamming not reaching command delay, and foreign equipment not reaching compatibility costs. Other corrections addressed per-origin prisoners, civilian/military transport competition, political technology modifiers, research espionage fragments, complete daily ledgers, repeated diplomacy rewards, partial costs on rejected actions, malformed saves and numeric report bounds.

Live review corrected inherited department scroll positions, narrow operation selection fields, raw save timestamps, country/province selection in intelligence, training-time display and fractional government indicators.

The first parent integration run had two test-harness mistakes: it expected the outcome string `retired` instead of `retirement`, and tried to queue an already adopted starting technology. Both were corrected and the full suite reran successfully. The warfare/research helper records retain their earlier corrected harness issues as well.

The restricted shell initially could not inspect the listener and PowerShell's stop operation failed. An approved scoped invocation verified the exact process and used the Windows process utility; the stop script was corrected to use that verified path. Its final stop and restart passed. This did not involve terminating other applications.

## Practical limits

- The game is single player. Sea lanes, air operations and population behavior use regional/aggregate models; there is no tactical 3D battlefield, historical Earth map or graphical scenario editor.
- Browser rendering and controls were tested on this Windows desktop. Other operating systems, physical mobile/touch devices and assistive technology were not independently tested.
- The score is synthesized locally. Runtime/UI audio controls are checked, but subjective listening quality is not claimed as verified.
- Tests cover representative adverse cases and a full deterministic campaign, not every possible seed and policy sequence. Long-term competitive balance can still benefit from human playtesting.
- Save revisions are intentionally retained and consume disk space over time. There is no automatic deletion of old records.
- Original job and reference documents remain unchanged; their historical OPEN heading is superseded by the completed task record and this project's AI_STATUS.md.
