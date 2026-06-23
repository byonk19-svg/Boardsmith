# Real Project Dogfood Findings

## Date Of Pass

June 10, 2026

This pass predates the June 20, 2026 deeper planter packet planning follow-through. The follow-through now has local focused packet/detail/print test coverage, including planter-specific readiness actions, plus a sanitized planter-specific hosted detail/print route smoke pass. A fresh live hosted generated-plan dogfood pass for a clearly labeled non-critical planter project was completed on June 21, 2026. A post-merge hosted wall-shelf buying-trip pass was completed on June 22, 2026 after the explicit buying-decision checklist reached the deployed protected path.

## Fresh Hosted Planter Generated-Plan Dogfood

Date: June 21, 2026

Scope: one fresh clearly labeled non-critical hosted planter project using realistic outdoor herb-planter details. The hosted URL, project ID, project title, row data, cookies, request headers, screenshots, session-file content, and sensitive logs are intentionally not recorded.

Coverage:

- Created one clearly labeled non-critical hosted planter project.
- Generated the first planter plan successfully; the generated plan validated and saved.
- Opened generated-plan detail and Browser Print Plan routes through the protected hosted path.
- Confirmed both routes rendered the planter packet sections, including planter hero/cut layout and Planter Box Buying Plan.
- Confirmed rendered copy preserved drainage, liner, outdoor exposure, finish, stock-board, panel-cut, and connection review language.
- Confirmed no positive export/CAD/CNC/shopping/vendor/price/cart/load-rating/approval claims appeared; no-PDF/no-CAD/browser-print and planning-aid disclaimers remained present.

Result:

The fresh hosted planter generated-plan path is good enough for private MVP dogfood. Browser print remains enough for planter review. This single pass did not expose a repeated failure mode, so no prompt, schema, template, export, shopping, CAD, CNC, or broader app change is justified from this evidence.

## Fresh Hosted Friction Signal Pass

Date: June 21, 2026

Scope: three fresh clearly labeled non-critical hosted dogfood projects plus one retry on a low-risk wall-shelf project from the same pass. The hosted URL, project IDs, project titles, row data, cookies, request headers, screenshots, session-file content, and sensitive logs are intentionally not recorded.

Coverage:

- Two low-risk wall-shelf projects generated and saved successfully, then rendered detail and Browser Print Plan.
- Both successful wall-shelf packets rendered Buying Plan, Materials and Parts, stock-board/stock-length review language, and hardware/fastener/bracket/stud review language.
- One bathroom/above-toilet wall-shelf project stayed without a saved generated plan after generation review blocked it. This is conservative safety posture for humid wall-mounted work, not a reason to weaken review.
- One planter connection/build-step project generated and saved successfully, then rendered detail and Browser Print Plan.
- The planter packet included Build Guide, connection planning aid, panel-specific labels, drainage, liner, outdoor exposure, finish, screw/fastener, and manual connection review language.
- No positive export/CAD/CNC/shopping/vendor/price/cart/load-rating/approval claims appeared in the rendered dogfood packets.

Friction signal:

- Stock-board/stock-length selection remains the repeated wall-shelf Buying Plan gap in successful packets.
- Hardware and fastener review remains split across Buying Plan, Materials and Parts, and review notes. This is safer than pretending to choose exact brackets or anchors, but it is still the main place where a real buying trip may feel incomplete.
- Planter build-step and connection depth did not show a repeated failure in this pass. It still uses generic adapters in places, but the rendered output preserved panel labels and review-first connection language well enough for private MVP dogfood.

Result:

This pass justified only a narrow wall-shelf Buying Plan clarity follow-through: make stock-board selection, support/frame review, hardware/site review, and finish/exposure review visible as explicit pre-purchase decisions. It still does not justify exact stock-board selection, optimized cuts, vendors, pricing, carts, load ratings, exports, CAD, CNC, or broader shopping behavior.

## Fresh Hosted Private-Use Signal Pass

Date: June 22, 2026

Scope: five fresh clearly labeled non-critical hosted dogfood projects: three wall-shelf variants and two planter-box variants. The hosted URL, project IDs, project titles, row data, cookies, request headers, screenshots, session-file content, and sensitive logs are intentionally not recorded.

Coverage:

- Hosted route/content smoke passed through the protected path before the pass.
- Three wall-shelf projects were created, generated, and rendered through detail plus Browser Print Plan: one single open-wall shelf, one two-shelf pantry/spice scenario, and one connected light-display shelf unit.
- Two planter-box projects were created, generated, and rendered through detail plus Browser Print Plan: one covered outdoor cedar herb planter and one small indoor windowsill planter shell.
- No generated-plan block occurred across the five supported non-critical projects.
- Both planter packets rendered Planter Box Buying Plan, drainage/liner review, panel-connection review, Build Guide, and panel/part labels.
- The currently configured hosted URL did not render the branch-only wall-shelf `Buying decisions before purchase` section. The branch code and focused packet tests do render it, so this is deployment-state evidence rather than proof that the explicit buying-decision checklist failed in use.

Friction signal:

- Wall-shelf explicit buying-decision usefulness could not be judged on the configured hosted URL because the hosted deployment did not include the branch-only decision checklist yet.
- Planter connection/build-step confusion did not repeat in this pass. Both planter packets preserved connection review and panel labels well enough for private MVP review.
- Generation blocks did not repeat across similar supported wall-shelf and planter projects in this pass.

Result:

No new product code change is justified from this pass. The next useful wall-shelf buying-trip signal should be collected only after `codex/wall-shelf-buying-decisions` is merged/deployed or a branch preview URL for that commit is used. After that, rerun a small wall-shelf buying-trip pass and judge whether the explicit buying decisions are still insufficient.

## Post-Merge Hosted Wall-Shelf Buying-Trip Pass

Date: June 22, 2026

Scope: one fresh clearly labeled non-critical hosted wall-shelf project after the buying-decision branch was merged to `main` and deployed to the configured protected hosted path. The hosted URL, project ID, project title, row data, cookies, request headers, screenshots, session-file content, and sensitive logs are intentionally not recorded.

Coverage:

- Created one low-risk wall-shelf project through the hosted protected path.
- Generated the first plan successfully; the generated plan validated and saved.
- Opened generated-plan detail and Browser Print Plan routes through the protected hosted path.
- Confirmed both routes rendered Buying Plan and `Buying decisions before purchase`.
- Confirmed the decision checklist rendered stock-board selection, mounting hardware/site review, and stock-length selection language instead of inventing an exact purchase.
- Confirmed the only shopping-cart language was the explicit guardrail that the packet is not a shopping cart or optimized cut plan.

Friction signal:

- The deployed checklist closes the earlier branch-only hosted caveat.
- This single post-merge pass did not show repeated wall-shelf buying-trip friction after the explicit decision checklist was present.
- No planter connection/build-step issue was evaluated in this pass because the requested follow-up was wall-shelf buying-trip focused.

Result:

No product code change is justified from this post-merge pass. Keep using wall-shelf Buying Plans manually and only expand behavior if repeated real buying/building use shows that the explicit buying decisions are still insufficient.

## Local Visual Packet Browser Regression Pass

Date: June 23, 2026

Scope: local deterministic visual-packet regression pass for the private-MVP wall-shelf and planter packet surfaces. This pass used seeded local JSON fallback records only. No hosted data, hosted routes, Supabase cloud rows, OpenAI calls, migrations, packages, exports, screenshots, or permanent project records were created.

Coverage:

- Rendered seeded planter, single wall-shelf, multiple separate wall-shelf, and connected wall-shelf review packets through project detail and Browser Print Plan routes.
- Confirmed the browser-rendered packet order remained Hero Visual, Project Visuals / Diagrams, Cut Checklist, Buying Plan, then Build Guide inside the packet container.
- Confirmed visual packet routes rendered nonblank SVG graphics with accessible `role="img"` labels.
- Confirmed deterministic part labels stayed visible in the browser packet, including `Part A - Shelf board(s)`, `Part E - Bottom panel`, and connected-unit `Support/frame review` language.
- Confirmed the connected-unit review case now keeps a deterministic Hero Visual SVG visible while preserving review-first support/frame copy.
- Confirmed no vendor, price, cart, checkout, load-rated, certified, CAD-ready, CNC-ready, or fabrication-ready claims appeared in the smoke path.

Result:

The local visual packet browser regression pass closes the main visuals testing gap for this lane. It does not justify new product features or visual expansion. Continue to let repeated private use choose the next implementation lane.

## Scope

This pass used the private hosted app through the existing protected hosted smoke path after authenticated route smoke, hosted `Tweak this plan` active-flow smoke, archived revision-blocking smoke, and project-detail navigation smoke had already passed.

The sweep reused clearly labeled non-critical hosted smoke/dogfood projects. No new project records, revisions, archive/restore actions, generated plans, schema changes, migrations, packages, exports, screenshots, or runtime artifacts were created by this pass.

No hosted URL, project ID, project title, row data, cookie, request header, session-file content, screenshot, or sensitive log is recorded in this document.

## Coverage

- Hosted route smoke: passed before the dogfood sweep.
- Project list: loaded through the protected hosted path.
- Project mix: representative non-critical hosted records covered plant-riser/shelf, simple shelf, wood sign, book ledge, and outdoor planter-style projects.
- No-plan project: covered.
- Generated-plan project: covered.
- Revised-plan project using the existing one-shot `Tweak this plan` flow: covered by an existing revised hosted record.
- Notes/build-log usage: covered by an existing project record with saved private record content.
- Browser print preview: opened for a generated-plan project and rendered expected shop-plan sections.
- Archived project state: covered as a control case; archived detail stayed viewable and did not expose a revision form.

## What Worked

- The project list can now support a crowded dogfood workspace: Active/Archived/All, plan state, and record state make it practical to find the right project state without hiding active projects unexpectedly.
- The project detail `Project sections` nav gives a useful map of a long generated-plan page. It makes Project intake, Project structure, Plan Review, Tweak this plan, Plan comparison, Printable Plan Sheet, Plan history, and Project record easier to reach.
- The `Project actions` panel keeps the main actions in one place. Generate Plan, Duplicate project, Browser print preview, Archive/Restore, and Back to projects read as workspace actions rather than scattered links.
- No-plan projects stay understandable. They still show intake, structure, project record, and generate-plan affordances, while omitting absent plan-only navigation and print-preview actions.
- Generated-plan projects are easier to scan than earlier versions of the app. Plan Review, action checklist, visual planning aids, build step cards, plan history, and browser print preview all feel reachable from the detail page.
- Revised-plan projects preserve the core product loop: the revised plan is visible as the latest version, the previous plan remains in history, and the revised marker helps separate revision history from ordinary generations.
- Print preview remains the strongest build-facing surface. Build Snapshot, Project Visuals, Check Before Building, Materials and Parts, Cut Checklist, Build Guide, and Review Appendix give the plan a clearer shop-plan flow.
- Project notes and build log fields are useful as private project memory. The copy correctly frames them as records, not certification or plan approval.

## Confusing Or Rough Edges

- Generated-plan detail pages are necessarily long. The jump nav helps, but it does not show the user's current section or stay visible while scrolling. That is a possible future navigation polish item, not a blocker.
- On a project that already has a generated plan, `Generate Plan` can still read like it might replace the current plan. Existing behavior preserves history, but future copy could make "creates another version" clearer in the actions panel.
- `Tweak this plan` is the right first revision shape, but users may expect a chat-like follow-up loop once they see plain-English revision input. The current one-shot model should remain intentional until repeated dogfood shows a real need.
- Project record is useful, but notes and build-log content sit lower on a long detail page. The nav makes it reachable; further work should avoid turning it into a larger project-management system.
- Print preview is clear, but it remains browser-rendered only. Users may ask for PDF/export after seeing the shop-plan layout; that should stay out of scope until explicitly approved.

## Copy Or Navigation Follow-Ups To Consider

- Addressed in Task 78A: latest-plan project detail pages now use version-aware generate copy, while no-plan pages keep first-time generation copy.
- Consider a small current-section or sticky behavior for the no-print project-section nav only if manual use shows users still lose their place.
- Addressed in Task 78A: `Tweak this plan` copy now reinforces that the user should describe one change and that the flow is a one-shot revision, not a chat thread.
- Consider making the Project record jump label slightly more descriptive only if users miss notes/build-log fields during manual use.

## Do Not Build Yet

- Do not add app-generated PDF, SVG, DXF, CAD, CNC, or fabrication-ready export work from this dogfood pass.
- Do not add image upload, public sharing, marketplace, shopping, pricing, vendor, purchasing, or inventory behavior.
- Do not add multi-turn AI chat, background agents, new project types, bulk archive, permanent delete, folders, tags, or production multi-user/auth expansion without a separate explicit task.
- Do not weaken the planning-aid, manual-review, no-approval, no-load-rating, no-wall-safety-guarantee, and no-child-safety-certification guardrails.

## Result

No small app defect was found that justified product code changes in this task. The right outcome is to keep using Boardsmith manually and select a narrow follow-up only from a repeated dogfood pain point.

## Fresh End-To-End Hosted Dogfood

Date: June 10, 2026

Scope: one fresh clearly labeled non-critical hosted dogfood project from a realistic supported craft project type. The project title, hosted URL, project ID, plan IDs, row data, cookies, request headers, screenshots, session-file content, and sensitive logs are intentionally not recorded.

Coverage:

- Created one fresh non-critical supported project.
- Confirmed the no-plan detail state showed first-time generation copy, project navigation, project actions, and project record.
- Generated a first validated plan.
- Confirmed the generated-plan detail state showed version-aware `Generate another plan version` copy, Plan Review, `Tweak this plan`, Plan comparison, Plan history, Printable Plan Sheet, and Project record.
- Submitted one `Tweak this plan` revision instruction.
- Confirmed the revised plan became latest, the prior plan remained in history, the `Revised` marker appeared, and comparison against the prior version was available.
- Opened browser print preview and confirmed the shop-plan sections rendered.
- Saved a small private project note.
- Saved a small build-log note.
- Archived the project, confirmed the revision form was blocked while archived, then restored it.

What felt clear:

- The updated `Generate another plan version` action made the second generation path easier to understand.
- The `Tweak this plan` section made the one-change revision flow understandable without making it feel like chat.
- Revised-vs-prior comparison and the plan-history markers made the saved-version model clear.
- Browser print preview remained the clearest build-facing view.
- Project notes and build-log fields were easy to reach from the Project record section.
- Archive/restore copy continued to read as hide/restore, not delete.

What felt annoying:

- The hosted generation and revision waits are still noticeable. The current "keep this page open" copy is useful, but this remains the slowest part of the flow.
- The project detail page is long after a plan exists. The section navigation helps, but users still need to move through several review surfaces.
- The print preview is strong, but opening a separate route still feels like a context switch.

Browser print assessment:

Browser print remains enough for the private MVP. The printed shop-plan flow is clearer than the generated-plan detail page for build review, and this dogfood pass did not surface a need to start PDF/export/CAD/CNC work.

No product code change was needed from this fresh dogfood pass. Larger feature ideas remain documentation-only and should not be built without a separate scoped task.

This fresh pass is the dogfood evidence for the `private-mvp-1.0` baseline checkpoint. It supports pausing broad feature work and using the app manually before choosing another major lane.

## Wall-Shelf Buying Plan Dogfood

Date: June 15, 2026

Scope: authenticated hosted route smoke plus manual Buying Plan dogfood on clearly labeled non-critical wall-shelf smoke/dogfood projects. Hosted URLs, project IDs, project titles, row data, cookies, request headers, screenshots, session-file content, and sensitive logs are intentionally not recorded.

Hosted lifecycle smoke:

- `npm run smoke:hosted` passed through the protected hosted access path.
- Deterministic generation failure was verified with an impossible connected multi-shelf height; no plan was saved.
- Archived direct generation blocking was verified; archived projects stayed readable and required restore before generation.
- Revision input failure was verified with an empty `Tweak this plan` instruction; no plan version was changed.
- Normal hosted generation was verified on successful wall-shelf dogfood projects, with browser print preview rendering the Buying Plan.

Buying Plan dogfood coverage:

- Single bathroom wall shelf: generated successfully; Buying Plan appeared after Cut Checklist and before Materials and Parts on detail and print.
- Five separate wall shelves: initially blocked when the hosted intake used individual board thickness as height; rerun with a total wall span generated successfully and rendered Buying Plan on detail and print.
- Single kitchen spice ledge: generated successfully; Buying Plan appeared in the expected packet order on detail and print.
- Connected bathroom shelf unit with side supports: blocked by generated-plan review. This is useful generation-quality friction, not a reason to weaken safety checks.
- Toddler/nursery book ledge: blocked by generated-plan review. Child-adjacent work should stay conservative until repeated real use shows a narrower safe template path.

What worked:

- The deterministic packet order held in all successful dogfood packets: Cut Checklist -> Buying Plan -> Materials and Parts.
- Buying Plan consistently grouped modeled wood pieces by material and kept the output framed as material planning, not a purchase order.
- Detail and print both carried the stock-length review note instead of inventing an exact board purchase.
- Hardware, fastener, bracket, anchor, stud, and support review language stayed present without becoming vendor, pricing, cart, or inventory behavior.

Friction log:

- Stock length still needs selection in every successful Buying Plan. That is intentionally conservative, but it is also the most repeated manual gap.
- Hardware and fasteners remain split between Buying Plan, Materials and Parts, and review notes. This is safer than pretending to know exact bracket/anchor purchases, but it may make the packet feel less like a complete buying checklist.
- Separate wall shelves exposed a validation mismatch: the pre-fix hosted app treated individual board thickness as impossible total stacked height. The follow-up narrows the impossible-height blocker to connected shelf units, and the post-push hosted check generated the same separate-shelves shape successfully.
- Connected shelf units and child-adjacent ledges can still be blocked by generated-plan review. That is acceptable for now; do not change prompts until more examples show the same specific failure mode.

Result:

The Buying Plan is useful enough for private MVP manual use, but it should remain conservative. The only code change justified by this dogfood pass was the narrow separate-shelf validation fix plus clearer lifecycle copy for projects whose latest attempt failed while an older saved plan remains available.

## Wall-Shelf Visual Plan Packet Dogfood

Date: June 15, 2026

Scope: local static route-component dogfood plus browser visual inspection for the completed wall-shelf Visual Plan Packet. The pass used non-sensitive temporary fixtures and disposable local output only. No hosted data, hosted routes, Supabase cloud rows, OpenAI calls, migrations, packages, exports, screenshots, or permanent project records were created.

Coverage:

- Rendered realistic wall-shelf packet scenarios for a single bathroom shelf, five separate wall shelves, and a connected wall shelf unit.
- Checked project detail and Browser Print Plan section order for Build Snapshot, Hero Visual, Project Visuals / Diagrams, Cut Checklist, Buying Plan, Materials and Parts, Build Guide, Check Before Building, and Reference Review Notes.
- Checked deterministic visual surfaces for finished-project hero, exploded assembly view, top view, stock-board planning visual, and build-step mini diagrams.
- Checked planning-aid, no-PDF/export, no-CAD/CNC, no-load-rating, wall-safety, and no-shopping/cart boundaries stayed present.
- Browser-inspected the hero SVGs at mobile width for fallback states, out-of-bounds text, and label overlap.

What worked:

- The finished wall-shelf hero, assembly/diagram packet, cut planning, Buying Plan, material grouping, and Build Guide now read as one coherent wall-shelf packet.
- Single-shelf, multiple-separate-shelf, and connected-unit hero visuals all render without falling back when the production project-aware wall-shelf view model is used.
- The packet order remained aligned between detail and Browser Print Plan.
- Safety and review boundaries stayed visible without turning the Buying Plan into shopping, pricing, vendor, cart, inventory, CAD, CNC, PDF, or export behavior.

Finding fixed:

- Mobile-width browser inspection found the hero SVG's bottom `shelf count / material thickness` label overlapping the `finished wall-shelf preview` label.
- The fix moved the `finished wall-shelf preview` label to the top-right of the SVG and left the bottom line for shelf count and material thickness.
- A route-rendered regression assertion now pins the new label position, and the post-fix browser check reported no out-of-bounds SVG text, no text overlap, and no fallback for the three wall-shelf hero scenarios.

Result:

The completed wall-shelf Visual Plan Packet is coherent enough for continued private dogfood. The next implementation lane should still come from repeated real use, not from speculative visual expansion. Do not expand visuals to another project type until wall-shelf use shows a repeated pain point or the next template is explicitly selected.
