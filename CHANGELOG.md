# Changelog

> **Versioning re-baselined to the horizontal-slice model** (see `docs/ROADMAP.md`): MINOR = capability tier (`0.1` MVP / `0.2` V1 / `0.3` V2 …), PATCH = one feature advanced within the tier. `package.json` reset `0.3.1 → 0.1.0`. The `0.2.0`/`0.3.0`/`0.3.1` entries below were produced under the earlier depth-first scheme and are kept for history; their work (tree-canvas iter 1–2, node-editor iter 1) is "banked depth" the slice plan won't redo.

## 0.5.4 — book-export: play-ready file export (new feature, walking skeleton)

- **« Exporter le jeu ⬇ »** — a new control in the editor top bar downloads the book as a **self-contained, versioned play file** (`<titre>.jeu.json`, format `genliv-play` v1) destined for the (deferred) play runtime.
- **Pure brain transform `exportBookForPlay(book)`** — bakes in everything a runtime needs without recomputation: nodes (minus the editor-only `position`), authored edges **plus the config-derived automatic edges** (échec→Mort, KR-067) folded into one list, and the **resolved object catalog** (`collectObjects`). Reuses the existing derivations, so the export can never disagree with the canvas/outline.
- **Non-blocking referential-integrity report (KR-021)** — the export always succeeds and surfaces **dangling references** (deleted edge targets, prereq objects, countdown fallbacks, monster/PNJ targets, décor object refs, unconfigured rules) as structured `warnings` in the file; a transient status beside the button shows **« ✓ Export réussi »** or **« ⚠ N avertissement(s) »** and `book:exported` is emitted with the count.
- New brain utils `downloadJson` / `slugifyFilename` (Blob + object URL, **always revoked**; no-op outside a DOM). `EditorTopBar` gained a generic **`actions` slot** (KR-120) the editor shell fills with `<ExportGameButton>` — the bar never imports the feature. 299 tests passing (+17). New capability outside the ragged-iteration plan; play mode itself stays deferred.

## 0.5.3 — choice-linking refinement: lineage-scoped hidden-prereq picker (KR-118)

- **« Pré-requis caché » now offers only objects in the choice node's lineage** — the required-object picker used to list **every** acquirable object in the whole book; it now offers only objects collectable on the **path that reaches this screen** (the node itself + its ancestors), because a player can only own an object they could have found on the lineage they chose.
- New pure brain util **`collectLineageObjects(book, nodeId)`** — reverse-reachability over `book.edges` (all kinds count; cycles handled by a visited set), reusing `collectObjects` over the lineage-scoped node subset so de-dup/migration stay single-sourced. The whole-book `collectObjects` still **resolves** an existing reference.
- **Narrowing never silently drops a rule** — an already-set reference that resolves but lies outside the lineage stays selectable and is flagged **« ⓘ hors lignée »** (distinct from a deleted **« ⚠ introuvable »**); the dangling warning still renders when the lineage picker is empty. The empty state distinguishes « no objects in the book » from « none in this lineage ».
- `ChoicePrereqEditor` gained an `options` prop (lineage) beside `catalog` (full, for resolution). 282 tests passing (+7). User-requested refinement; no new tier.

## 0.5.2 — choice-linking iteration 4 (V4 slice — tier complete 🏁)

- **Per-choice countdown (§ 05)** — a choice can now carry a **« compte à rebours »**: a **délai** (Stepper clamped 5–60s, default 15) + a **fallback node** it expires to. The rule rides the choice edge as `Edge.countdown?: { delay, fallback }`, persisted via `BookService.updateEdge` (`EdgePatch` gained `countdown: ChoiceCountdown | null`); label, prereq, and countdown are independent.
- **Referential-integrity sweep (KR-063)** — the row validates **both** rules against the live book: the prereq vs `collectObjects` (⊘ / ⚠), and the countdown fallback vs `getNode` — **« ⏱ Ns »** when it resolves, **« ⏱ repli manquant »** when unset or deleted. A choice may hold both a prereq and a countdown (KR-065). The fallback is picked via the shared brain `TargetPicker` (excludes structural/self, surfaces a deleted target).
- New `ChoiceCountdownEditor` (mirrors the iter-3 `ChoicePrereqEditor`). The play-mode ticking/expiry is out of editor scope.
- **choice-linking is complete (n=4).** 275 tests passing (+3). **🏁 The 0.5.x / V4 tier is complete** — iteration 4 of every n≥4 feature (tree-canvas, node-editor, choice-linking). **All features are now at their full iteration depth.**

## 0.5.1 — node-editor iteration 4 (V4 slice)

- **Debounced Description commits** — typing in a node's Description now updates a fast local draft and writes through `BookService` only after the typing settles (or on blur), so a keystroke no longer fires `updateNode → node:updated → a canvas/outline re-read` per character. **No data loss**: a pending edit is flushed on blur **and** on the selection-swap unmount (the panel is keyed by node id, KR-053); the debounce timer is ref-tracked + cleared on unmount.
- New `useDebouncedText` hook + a `NodeDescription` component (so the hook stays unconditional past the panel's empty-state guard); the brain `Field` gained an optional `onBlur`. The rest of iter 4 (clean content swap, choices slot, deferred illustration, keyboard a11y) was already in place.
- **node-editor is complete (n=4).** 272 tests passing (+1).

## 0.5.0 — tree-canvas iteration 4 (V4 tier opens 🚀)

- **Off-screen culling for large books** — the canvas now measures its surface (a `ResizeObserver`) and renders **only the node cards + edges intersecting the visible viewport** (+ a `CULL_MARGIN` so panning never pops a card in), so a big book stays at 60fps. Pure, testable geometry: `viewportRect` maps the surface back to canvas space through the `translate scale` transform; `nodeInView` / `edgeInView` are box/segment intersection tests. Until the surface is measured (first paint / jsdom) nothing is culled — small cases are unchanged.
- Culling is a pure **view filter** (derived inline with `useMemo`, KR-013) over the existing layout + orphaned-edge drop (KR-021) — the SSOT and layout are untouched. Edge-label overlap avoidance deferred (minor visual).
- **tree-canvas is complete (n=4).** 271 tests passing (+3). **🚀 The 0.5.x / V4 tier opens** — iteration 4 of the features whose n≥4 (tree-canvas, node-editor, choice-linking).

## 0.4.9 — cloud-sync iteration 3 (V3 slice — tier complete 🏁)

- **Conflict handling instead of silent last-write-wins** — when a book diverged on **both** sides (local has unpushed edits **and** the cloud copy is newer), `book:opened` reconciliation no longer silently overwrites either side (KR-098). It stashes the cloud copy, emits a new **`sync:conflict`** event, and surfaces a resolution affordance. A clean local (no unpushed edits) still adopts a newer cloud via safe LWW — nothing to lose.
- **Resolution** — new `CloudSyncService.conflicts()` + `resolveConflict(bookId, 'local' | 'cloud')`: **« Garder ma version »** re-queues local to push over the cloud; **« Prendre la version du cloud »** adopts the cloud copy and drops the queued local edit. A new **`ConflictDialog`** (mounted once by App, a VIEW over `useSyncConflict`) presents the choice for the open book.
- **Deferred:** queued deletes/tombstones + cloud-only list reconciliation (need new `CloudTransport` delete + list capabilities) — shared with the book-library iter-3 deferral.
- 268 tests passing (+7). **🏁 The 0.4.x / V3 tier is complete** — iteration 3 of every feature that has one (`node-editor` iter 3 superseded).

## 0.4.8 — action-trap iteration 3 (V3 slice)

- **Trap-on-object** — a décor « Prendre » object's « jet requis » can now be marked **« Variante piège : échec → mort »**: taking the object and failing the roll is lethal. It reuses the **shared roll model** (`SkillRoll` gained a `fatal` flag) and the trap's **derived fatal → Mort edge** — `deriveAutomaticEdges` now emits the same `auto-fatal-<node>` edge for a décor node with a fatal takeable roll as for a « échec sanctionné » trap (KR-067/092). View-derived from config, never authored.
- The two features share only the brain `SkillRoll` + `deriveAutomaticEdges` (and the toggle lives in décor's `ObjectEditModal`) — neither imports the other.
- 261 tests passing (+4).

## 0.4.7 — action-monster iteration 3 (V3 slice)

- **Reusable monster library** — « Ajouter à la librairie du générateur » now actually **persists** a monster to a new cross-book **`MonsterLibraryService`** (brain, raw local store, not synced), and a searchable **`MonsterLibraryPicker`** (« ↪ Choisir dans la librairie… ») **instantiates** a saved monster onto a node. The long-wired `monster:savedToLibrary` event is now consumed (no longer a stub).
- **Copy, not reference** — unlike the within-book PNJ/object references (resolved live), a library monster is reused **across books**, so it's instantiated as an independent **copy**: node-specific targets are stripped on save, and loot gets a **fresh id** on instantiate (KR-097/003). New `useMonsterLibrary` external-store hook.
- 257 tests passing (+7).

## 0.4.6 — action-pnj iteration 3 (V3 slice)

- **Reuse a PNJ « du livre » by stable id** — a PNJ node can now reference an existing PNJ authored elsewhere instead of re-typing it. A new searchable **`PnjPicker`** (« ↪ Réutiliser un PNJ du livre… », mirrors the décor reuse picker) lists the book's other PNJs; picking one stores a **reference**.
- **The owner node id IS the PNJ's stable id** — no new id field, no minting, no migration (KR-096). `PnjConfig` gained `pnjRef?: string` (the owner node id). A reference resolves its identity **live** via the new derived `collectPnjs` / `resolvePnj` (`action-pnj/utils/pnjCatalog.ts`), so the PNJ stays single-sourced on its origin node (no desync, KR-020).
- **Read-only + dangling-safe** — a referenced PNJ renders read-only (resolved name/role/dialogue/gift + **« réutilisé »** badge + « défini sur <owner> », with a **« Ne plus réutiliser »** detach). A dangling reference (origin deleted, no longer a PNJ, or itself a ref — refs don't chain) shows **« ⚠ PNJ introuvable »** (KR-021).
- 250 tests passing (+6).

## 0.4.5 — action-decor iteration 3 (V3 slice)

- **Reuse an object « dans la liste » by stable id** — a décor « Prendre » can now reference an existing acquirable object (a décor takeable, PNJ gift or monster loot anywhere in the book) instead of authoring a duplicate. A new searchable **`ReuseObjectPicker`** (mirrors the relink popover) lists `collectObjects(book)` minus the objects already present here; picking one adds a **reference** takeable.
- **Reference, not copy** — `TakeableObject` is now `own { object }` **or** `ref { objectRef }` (`object` became optional; exactly one set). A ref is **resolved live** via `findObject`, so the object stays single-sourced on its authoring node (no desync, KR-020); `collectObjects` skips refs (no phantom catalog entry). A ref row is read-only (shows the resolved name + **« réutilisé »**) and a dangling reference (owner deleted) surfaces **« ⚠ objet supprimé »** (KR-021).
- **Not an owned `ObjectCatalogService`** — the derived `collectObjects` catalog (built for choice-linking iter 3) IS the catalog; this slice adds the décor authoring side over the same foundation. New `takeables.ts` helpers `refTakeable` / `isRefTakeable` / `takeableId` / `resolveTakeableObject`. `ReuseObjectPicker` extracted to keep `DecorEditor` under 400 lines (KR-112).
- 243 tests passing (+7).

## 0.4.4 — outline-view iteration 3 (V3 slice)

- **Outline expand/collapse state now persists per book** — collapsing a node in the outline survives switching to the canvas and back (and a reload). The collapsed-node set is a per-device, **non-synced** UI preference (KR-022): `BookUIPrefs` gained `outlineCollapsed?: string[]`, `UIPreferencesService.setOutlineCollapsed`, and a new brain **`useBookOutlineCollapsed(bookId)`** external-store hook (returns a `Set` memoised on the cache-stable array, KR-013). `OutlineView` dropped its local `useState<Set>` for the hook.
- **The view-mode half was already done** — `EditorScreen` has persisted the canvas↔outline view-mode via `useBookViewMode` since tree-canvas iter 3; this slice completes iter 3 with the remaining expand-state persistence.
- A stale collapsed id (its node was deleted) is harmless — `computeVisibleRows` simply never matches it (no cleanup needed, KR-021 spirit).
- 236 tests passing (+2).

## 0.4.3 — book-library iteration 3 (V3 slice)

- **Per-book cloud-sync status on each card** — a small chip reflects whether that book is **« ✓ à jour »**, **« ⏳ en attente »** (its write is still queued to the cloud), or **« ⚠ non synchronisé »** (last push errored). A local-only build (no transport) shows no chip — there's no cloud state to reflect. A live VIEW over `CloudSyncService`, never a private mirror (KR-095/020/013).
- **`CloudSyncService.pendingKeys()`** (new, generic) returns the queued storage keys; the decorator stays **book-agnostic** (KR-094). The book→key mapping lives in a new brain **`useBookPending(bookId)`** external-store hook (`bookKey(id) ∈ pendingKeys`), re-read on each `sync:status` emit (same cadence as the global indicator).
- **Deferred (transport-capability work, cloud-sync's domain):** list reconciliation (pulling cloud-only books needs a `CloudTransport` enumerate/list) and offline **delete** propagation (the decorator's `remove()` pushing a tombstone needs `CloudTransport` delete). `CloudTransport` currently has `push`/`pull` only.
- 234 tests passing (+5).

## 0.4.2 — choice-linking iteration 3 (V3 slice)

- **Hidden prerequisite on a choice (§ 05, KR-062)** — a choice can now require the player to own an object before it appears. Per-row **« pré-requis caché »** toggle + an object picker; the rule rides the choice edge as `Edge.prereq?: { objectId }`, persisted via `BookService.updateEdge` (`EdgePatch` gained `prereq: ChoicePrereq | null` — `null` clears, omitted leaves untouched; the label and prereq are independent).
- **Object catalog is a derived VIEW, not an owned store** — new pure brain `collectObjects(book)` / `findObject(book, id)` (`brain/utils/objects.ts`) union every acquirable object already authored on a node (décor « prendre » takeables, the PNJ gift, the monster loot), de-duped by stable id. Objects stay owned where they're authored (KR-020, no `ObjectCatalogService` to desync); everything references by id, so a future owned catalog could swap in transparently.
- **Dangling references surfaced, never silent** — the row shows a **⊘ « pré-requis »** badge when the id resolves and a **⚠ « pré-requis »** badge when it dangles (object deleted, or none chosen yet), validated at the view against the live catalog (KR-062/021/013).
- Per-row rule UI extracted to `ChoicePrereqEditor` so `OutgoingChoices` stays under the 400-line split signal (KR-112).
- 229 tests passing (+7). node-editor iter 3 was superseded; choice-linking iter 3 is the V3 tier's third shipped slice.

## 0.4.1 — tree-canvas iteration 3 (V3 slice)

- **New brain `UIPreferencesService`** — the single gateway for per-device, **non-synced** editor view state (pan/zoom, canvas↔outline view-mode, dragged node positions, KR-022/025). Wired in `createBrain` over the **raw local store, never the `CloudSyncService` decorator**, so this state can't enter the cloud queue (KR-093); its `genliv:ui:book:<id>` key stays out of `listBooks`. Reads are **cache-backed** for `useSyncExternalStore` snapshot stability; each write makes a new prefs object and notifies subscribers. New hooks `useUIPreferences` / `useBookViewMode` / `useBookNodePositions` (KR-013, external-store).
- **Pan/zoom persists per book** — `useViewport` seeds the live viewport from the service and **persists on settle** (drag-release, each zoom step, a centre request), not every pan frame.
- **Canvas↔outline view-mode persists per book** — `EditorScreen` reads/writes it through the service, so the switch survives a reload.
- **Drag a node to reposition it** — a new `useNodeDrag` hook (window pointer listeners, ref-tracked + unmount-cleaned, the BUG-001 pattern): travel past a threshold commits the position (persisted via `UIPreferencesService`) and consumes the click so a drag never selects; a press without travel stays a select. The dragged position is a **UI preference, not synced `node.position`**, and **overrides** the auto-layout slot in `resolvePositions` (only for nodes still in the book — a deleted node's stale override leaves no ghost, KR-021/023).
- 220 tests passing (+14). This unblocks the long-deferred tree-canvas layout-persistence work (the iter-3 dependency that needed `UIPreferencesService`).

## 0.4.0 — book-creation iteration 3 (V3 slice — tier opens 🚀)

- **Cloud-first create, surfaced + locked in.** The cloud-first persistence the iter-3 goal describes was already satisfied transparently by the `CloudSyncService` decorator (KR-093): `createBook` writes through `brain.sync`, so a new book is **local-first** (synchronous local write) and **queued for the background cloud push**, and `listBooks`/`getBook` **restore it on reload**. This slice surfaces that to the author and pins it with tests rather than re-plumbing persistence.
- **Sync-aware cloud-first hint** in `NewBookDialog`: a muted line reads the brain `useSyncStatus` external store (KR-013, no `useEffect` mirror) and derives its reassurance copy from a closed-set `Record<SyncStatus, string>` (KR-117) — **offline** promises a later sync (« Enregistré sur cet appareil, synchronisé au retour en ligne »), **online** an immediate one — so « Créer » visibly works without a connection and the book is saved on-device first. The copy Record lives in the feature (not brain): book-creation owns this author-facing string, distinct from `SyncIndicator`'s badge-label Record (KR-109).
- **Integration tests** pin the contract: a created book **persists + survives a reload** (a fresh brain over the same store re-reads it); a configured-but-unreachable transport **queues the create** (`pendingCount() >= 1`) while the book stays **readable locally**; the offline hint renders.
- 206 tests passing (+3). **🚀 The 0.4.x / V3 tier opens** — iteration 3 of each feature that has one, in build order, starting with `book-creation`.

## 0.3.8 — cloud-sync iteration 2 (V2 slice — tier complete 🏁)

- **Offline write queue**: the pending pushes are now a **persisted queue** (`CLOUDSYNC_QUEUE_KEY`, local namespace via the underlying store — no echo, not a book key) loaded at startup, so an **unconfirmed write survives a reload**. A failed push **keeps the queue** (status → `error`) instead of dropping the batch; on success only the entries actually pushed are dequeued (a newer write to the same key during the in-flight push stays queued), guarded by a `flushing` flag against double-push.
- **Flush on reconnect**: three triggers — the next write, an explicit `retry()`, and **startup** (a persisted backlog schedules a flush). New `CloudSyncService.pendingCount()` / `retry()`; the `sync:status` payload carries `pending`; a new `useSyncPending` external-store hook (KR-013).
- **« N changements en attente »**: the `SyncIndicator` surfaces the queued count (via `plural()`), keeping the status tone — derived, no new `SyncStatus` value (KR-095). Emits stay status-change-only (no per-keystroke noise).
- **Unblocks `book-creation` iteration 3** (cloud-first offline create). Conflict handling remains iter 3.
- 202 tests passing (+3). **🏁 The 0.3.x / V2 tier is complete — every feature has its iteration 2.**

## 0.3.7 — action-trap iteration 2 (V2 slice)

- **The « échec sanctionné » fatal flag now wires the automatic →Mort link (§ 05, KR-067)** — the long-deferred "dedicated combat/trap path". Built as a **view-derived** edge, never stored and never the manual `addEdge` API (which rejects a Mort target): a new pure brain **`deriveAutomaticEdges(book)`** emits a synthetic `{ kind: 'fatal' }` edge from each fatal-trap node (`actionType === 'piege' && trap.fatal`) to the Mort leaf; `TreeCanvas` resolves authored + derived edges together. The config stays the SSOT, so the link can never desync (KR-020/013) and is present iff fatal.
- New **`fatal` edge kind** in the `EDGE_KINDS` registry (one entry, KR-068): the canvas draws it as a dashed **« ✕ Mort »** edge (`EdgeLayer` already dashes every non-`choice` kind). The `TrapEditor` shows a « lien automatique vers la Mort » note when fatal.
- Scoped to the trap fatal→Mort link; `deriveAutomaticEdges` generalises to the deferred monster/PNJ outcome targets (a follow-up).
- 199 tests passing (+4). Trap-on-object variant remains iter 3.

## 0.3.6 — action-monster iteration 2 (V2 slice)

- **« Butin lâché » loot (§ 4D)**: a « Le monstre lâche un butin » toggle reveals the shared brain **`ObjectEditor`** (its **4th** reuse, after décor/pnj/the gift — KR-052/109) for the object dropped on victory, persisted on `monster.loot` with a stable id (`blankLoot`/`createId`, KR-003); toggling off drops it. Live-edited (no modal — a toggle-gated single object has no cancel-a-new-item need).
- **Combat reinforced by an inventory object deferred**: « si le joueur possède … → victoire automatique » is the **same by-id inventory reference** as choice-linking's hidden prerequisite (KR-062), so it pairs with the `ObjectCatalogService` work rather than introducing a by-name reference now (which KR-062 forbids). Recorded as a deviation.
- 195 tests passing (+1). Reusable `MonsterLibraryService` remains iter 3.

## 0.3.5 — action-pnj iteration 2 (V2 slice)

- **Richer identity (§ 4A)**: the PNJ editor gains a **RÔLE** field (`pnj.role` — « Marchand », « Gardien du seuil »…), carried through the canonical `patchPnj` write so editing one facet never drops another.
- **Portrait** ships as a **deferred dropzone** affordance (disabled, `aria-disabled`) — the actual image **upload is deferred project-wide** (no image scope yet, exactly like node-editor's illustration). The « dialogue affordance » in the iter-2 goal was already the skeleton's DIALOGUE field; the net-new is the role + the portrait affordance. (Recorded as a spec-vs-project-rule deviation.)
- 194 tests passing (+1). Reusable-PNJ catalog deferred to iter 3.

## 0.3.4 — action-decor iteration 2 (V2 slice)

- **« Écouter » / « Fouiller » reveal (§ 4B)**: the two décor interactions (previously stubs) gain a `RevealEditor` — the heard/found text plus an optional **« jet requis »** that gates it behind a skill roll: a **caractéristique** (`SegmentedControl` from the brain `CHARACTERISTICS` registry) + a **difficulté** `Stepper` + the shared brain **`OutcomesEditor`** for the réussite/échec reveal (the only semantic outcomes, KR-091/117). Toggling the gate off drops the roll + outcomes but keeps the base text.
- New `DecorReveal` domain type on `DecorConfig.reveal`; the per-interaction field copy lives in the `DECOR_INTERACTIONS` `Record` (KR-117), extended to carry `revealLabel`/`revealPlaceholder`. The third reuse of the extracted `OutcomesEditor` (after monster + trap) needed zero new shared code.
- All décor writes unified through one canonical `writeDecor(patch)` that re-emits `{ interaction, objects, reveal }` (legacy `object` dropped, KR-090), so editing one facet never drops the others.
- 193 tests passing (+2). Shared `ObjectCatalogService` remains iter 3.

## Code-health — inline-note cleanup (no version bump)

Resolved two flagged inline notes in `tree-canvas`:

- **Top-down tree canvas layout**: the canvas now **auto-lays-out** the book as a classic top-down tree (`resolvePositions` reads the `choice`-edge structure): the **sommaire sits at the top**, each node's direct children form **one evenly-spaced row beneath it** (parent centred over them), recursively, with downward links — so a branching book reads as proper triangles with sub-branches and leaves. **Linkless nodes** (the isolated `mort`, any page not reached from the sommaire by a `choice` edge) **wrap into a grid below the tree** — never a single horizontal row nor a single descending column. This fixes both the prior grid (children beside parents, unreadable sideways links) and the intermediate attempts that collapsed loose-page books into one line. The canvas stays a pure VIEW (KR-020); the layout is deterministic (KR-023). Manual drag + per-book position persistence is a later iteration (a stored position will then override the computed slot).
- **Per-kind snippet to the registry**: the node-card empty-state placeholder moved from an inline `kind === 'sommaire' ? … : …` test in `nodeView.ts` to an `emptySnippet` field on the `NODE_KINDS` registry, so the per-kind copy self-describes (KR-068).
- 188 tests passing.

## 0.3.3 — outline-view iteration 2 (V2 slice)

- **Node inspector (§ 03 B)**: focusing or hovering an outline row previews its structural relations in a pinned card — **« entre depuis »** (every edge leading here + its kind) and a monstre node's combat outcomes (**victoire / fuite** targets), built by a new pure `buildNodeInspector` (resolved by stable id; a deleted source/target surfaces as ⚠, never a crash — KR-021). The previewed node is local UI state (the focused row, falling back to the selection), so the card previews **without** committing selection.
- **Éditer**: selects the previewed node (drives the node-editor panel). Row-click selection (the iter-1 contract) is unchanged.
- **« Centrer dans l'arbre »**: reveals + centres the node on the canvas. Wired at the composition root (`EditorScreen` owns a `{nodeId, seq}` `RevealRequest`): the outline calls an `onRevealInTree` callback, the shell switches to the tree view and passes the request to `TreeCanvas`, which centres via the new `useViewport.centerOn`. outline-view and tree-canvas never import each other; the shell-owned prop survives the view switch (no event-before-mount loss), and a `seq` + consumed-seq ref makes repeat reveals work without re-centring on unrelated re-renders (**KR-081**).
- 187 tests passing (+7). View-mode/expand-state persistence remains iter 3 (needs `UIPreferencesService`).

## 0.3.2 — book-library iteration 2 (V2 slice)

- **Search + sort (list ergonomics)**: the library gains a **search** box (brain `Field`, case-insensitive title filter) and a **sort** toggle (brain `SegmentedControl`: « Récent » = `updatedAt` desc / « A→Z » = title). Both are derived inline over the live `useBooks` list (KR-013) — the cached snapshot array is never mutated (sorts a copy). The toolbar appears only when the library is non-empty.
- **Empty states**: a dashed, inviting « votre bibliothèque est vide » panel when there are zero books (alongside the always-present create affordance, KR-072), and a « aucun livre ne correspond » status line when a search matches nothing — never a blank void.
- **Open-book delete guard (KR-071)**: a composition-root subscription (in `App`) navigates home if the book currently open in the editor is deleted, so the editor never strands on a removed book. The route is read fresh in the handler (no stale-closure dependency); the guard lives at the root, not in book-library, so no feature owns cross-route navigation.
- 176 tests passing (+4). Per-book sync status + offline delete queue remain in iter 3 (need `cloud-sync`).

## 0.3.1 — choice-linking iteration 2 (V2 slice — tier 0.3.x opens)

- **Self-link + duplicate-edge guards at the SSOT (KR-061)**: `BookService.addEdge` now rejects a self-link (`from === to`) and any **duplicate identical edge** (same `from`/`to`/`kind` already present), returning `null` and emitting nothing. Identity is `from+to+kind`, so a second edge to the same target of a **different** kind (e.g. a `relink` then the future automatic `flee`) is legitimate convergence, not a duplicate.
- **Searchable relink popover (§ 06 B)**: « Relier… » gains a brain `Field` search box that filters candidates by title (case-insensitive), autofocused on open for keyboard use; a non-matching query shows « Aucun nœud ne correspond », distinct from the « Aucun autre nœud » no-candidates state. The picker mirrors both SSOT guards — the current node and any **already-relinked** target are excluded — so it never offers a rejected edge (SSOT is the law; the picker is convenience). Filtering is derived inline (KR-013), no `useEffect` mirror.
- 170 tests passing (+3). Hidden-prerequisite (iter 3) and countdown (iter 4) still await `ObjectCatalogService`. **Tier 0.3.x / V2 begins.**

**Follow-up refinements (user-requested, fold into 0.3.1 — no bump):**

- **Confirmation-gated branch deletion (dangerous-action rule + KR-064)**: the « Choix sortants » row ✕ no longer removes the edge immediately — it opens a `DeleteBranchDialog` (brain `Modal`, `confirmTone="error"`, labelled « Annuler »). The dialog states the destination **node is not deleted** (only the link) and, when this is the node's **sole incoming link**, warns it will become unreachable (the KR-064 orphan prompt, computed live). Removal still only deletes the edge; the orphaned node survives.
- **Removed the deferred « Libellé du choix » note** from the node-editor panel: it was a skeleton-era hint pointing authors to the parent's « Choix sortants », rendered read-only on **every** non-structural node. Now that the label is editable there (iter 1), the note was pure clutter — the panel drops the libellé section entirely.
- 172 tests passing (+2).

## Code-health — P4 (registry predicates + book lookups) — no version bump

Cross-cutting cleanup from a review of inline `// FIX:`/`// TODO:` notes (folds into the touched code; see `docs/ROADMAP.md` § Code-health sweep, P4):

- **Domain-invariant predicates**: new `kinds.ts` helpers `isStructural` / `canHaveOutgoing` / `canBeTarget` / `edgeNests` replace `NODE_KINDS[kind].flag` indexing at ~8 call sites (BookService, OutgoingChoices, TargetPicker, NodeEditorPanel, nodeKind) — callers stop importing the registry to ask a domain question (Law of Demeter; registry stays the SSOT, KR-068). Presentational reads (label/mark/tone/…) unchanged.
- **`getNode`/`getEdge`** (`brain/utils/book.ts`) hide the book's internal arrays, removing the repeated `book?.nodes.find(n => n.id === …) ?? null` from BookService + the four action editors + OutgoingChoices.
- **`buildOutline`** nests via `EDGE_KINDS.nests`, not `edge.kind === 'choice'`.
- **Decisions recorded** (KR-068/117 extended): event-name lists in `hooks.ts` are typed curated subsets (not magic strings — kept); per-variant behaviour (gift `apply`, caractéristique `compute/test`) is deferred to PLAY MODE as registry descriptor fields, never if/switch. 167 tests passing (+7); all inline notes resolved/removed.

## 0.2.8 — cloud-sync iteration 1 (V1 slice — tier complete 🏁)

- **Real transport machinery, local-target « cloud »**: per the production-target swap, the LOCAL build wires a new **`LocalStorageTransport`** — a `CloudTransport` backed by a separate `cloudsync:` localStorage namespace (a fake remote) — so the full local-first sync machinery runs with **no server**. The Cloudflare build target swaps in a worker-backed transport (client + worker route + SENSITIVE auth, KR-114) via the same interface later.
- **Debounced + batched pushes**: `set()` writes local synchronously, then rapid writes coalesce into one background push cycle (status syncing → synced/error once per batch; timer-safe, default 300ms).
- **Last-write-wins reconciliation on `book:opened`** (KR-094): `CloudTransport` gained `pull`; on open, the cloud copy is compared by `updatedAt` — a newer cloud copy is **adopted** locally (written underneath, never re-pushed → no echo loop) and `book:updated` is emitted so the open view re-reads; a newer local copy is **pushed up**; an empty cloud is seeded.
- `createBrain` stays transport-optional (a new `syncDebounceMs` option), so every existing test is transparent (offline). 160 tests passing (6 new). The real Cloudflare client/worker/auth + offline queue + conflict handling are iters 1(CF)/2/3. **🏁 The 0.2.x / V1 tier is complete — every feature has its iteration 1.**

## 0.2.7 — action-trap iteration 1 (V1 slice)

- **Skill roll (§ 05)**: the trap gains a **CARACTÉRISTIQUE** select + a **DIFFICULTÉ** stepper (shared brain `Stepper`) on `trap.roll`, beside the existing réussite/échec reveal texts (shared `OutcomesEditor`) and the « échec mène à la Mort » toggle.
- Caractéristiques are now a brain **`CHARACTERISTICS`** registry (Habileté / Endurance / Chance — a closed-set `Record`, KR-117), placed in brain like `ROLL_OUTCOMES` because skill-roll editors reuse it (trap now; décor « jet requis » later). The select derives from it — no hardcoded list. `SkillRoll.failureText` made **optional** so trap (outcomes-based) and décor (failureText-based) share one roll shape.
- `TrapConfig` gained `roll`; a skeleton trap migrates the default roll in on read (KR-116) and canonicalises on write. The automatic échec→Mort edge stays deferred to iter 2 (KR-067). 153 tests passing (1 new). **🏁 All four action editors have their V1 — only `cloud-sync` remains in the 0.2.x tier.**

## 0.2.6 — action-monster iteration 1 (V1 slice)

- **Combat mechanics (§ 4D)**: the monster gains **PV / Attaque / Défense** stats (shared brain `Stepper`) and **outcome targets** — **victoire → poursuivre** and **fuite → relier** via the shared brain `TargetPicker` (structural screens excluded KR-067, deleted target surfaced KR-021/063). **Défaite → Mort** is shown as the **automatic** combat path (KR-067) — surfaced read-only, never an authored edge.
- Two brain extractions at their **second consumer** (KR-109, same rule as `ObjectEditor`/`OutcomesEditor`): the value **`Stepper`** (pnj gift + monster stats) and the **`TargetPicker`** (pnj « mène à » + monster targets) moved to `brain/components`; `action-pnj` refactored to import them (feature-local `TargetPicker` deleted, `GiftSection`'s local stepper removed). `TargetPicker` gained `label`/`emptyLabel` props.
- `MonsterConfig` gained `pv`/`attack`/`defense` + `victoryTarget`/`fleeTarget`; a skeleton monster (name + outcomes) normalises with stat defaults on read (KR-116) and canonicalises on write. réussite/échec reveal texts still derive from `ROLL_OUTCOMES` (KR-091/117). Loot + reusable library deferred to iters 2–3. 152 tests passing (3 new + the pnj refactor).

## 0.2.5 — action-pnj iteration 1 (V1 slice)

- **Gift effect (§ 4A)**: the « Le PNJ donne un objet » gift now carries an **effect** — **+PV / +Attaque / +Défense / objet de scénario** (a closed-set `Record`, KR-117) — with a **− N + value stepper** (clamped 1–99) for the stat bonuses; a plot object hides the stepper. The gift's identity still uses the shared brain `ObjectEditor` (KR-052).
- **« Ensuite, le PNJ mène à »**: a target picker wires the PNJ to a follow-up node (a non-choice screen change). Structural screens are excluded (KR-067) and a deleted target is surfaced « ⚠ cible supprimée » (KR-021/063). Stored on `pnj.target` for now; promotion to a rendered tree edge pairs with the dedicated action-edge path (like trap's deferred échec→Mort edge).
- Domain model gained **`PnjGift`** (object + `effect` + `value`) and **`PnjGiftEffect`**; the skeleton's bare-object gift **migrates** on read (pure `giftOf`) and canonicalises on the next write (KR-116). `PnjEditor` split into `GiftSection` + `TargetPicker` (SRP), each a VIEW over `BookService`; gift ids stable (KR-003). Portrait + reusable-PNJ catalog stay in iters 2–3. 147 tests passing (9 new).

## 0.2.4 — action-decor iteration 1 (V1 slice)

- **« Prendre » full (§ 4B)**: the décor « prendre » action is now a **list of takeable objects** as rows — add / remove / reorder (↑↓), each with a **utile / leurre** badge and an optional **« jet requis »** marker. Each object is edited in a **modal** with real commit/cancel semantics (a local draft; « Annuler » discards, so a cancelled new object never lands), composing the shared brain `ObjectEditor` (KR-052) + a utile/leurre `SegmentedControl` + a « jet requis » `Toggle` revealing caractéristique / difficulté / texte d'échec.
- Domain model gained **`TakeableObject`** (object + `kind` + optional `roll`), **`SkillRoll`** (trait/difficulty/failureText), and **`TakeableKind`** (`'utile' | 'leurre'`, a closed-set `Record` per KR-117, non-semantic tones — good/bad reserved for réussite/échec, KR-091). The walking-skeleton single `decor.object` is **migrated** to `decor.objects` on read (pure `takeablesOf`) and canonicalised on the next write (KR-090/116 spirit), so old persisted books still load.
- `DecorEditor` stays a VIEW over `BookService` (KR-020): all list ops write the canonical `{ interaction, objects }` via `updateNode`; object ids are stable (KR-003). Écouter/Fouiller stay stubs (iter 2); shared `ObjectCatalogService` is iter 3. 138 tests passing (12 new).

## 0.2.3 — outline-view iteration 1 (V1 slice)

- **Expand/collapse** in the « plan du livre »: each node with nested children gets a ▸/▾ disclosure (≥44px, aria-labelled with the node title); collapsing hides the exact subtree while later siblings stay. The rule is a new **pure `computeVisibleRows`** helper (unit-tested, KR-080 spirit) over the flat pre-order rows; collapsed ids are local UI state derived with `useMemo` (no `useEffect` mirror, KR-013).
- **Hover preview**: each row's `title` tooltip previews the screen's authored text (via the shared `textLines`, placeholder for an empty screen); reference rows instead read « Aller au nœud … » (or « Cible supprimée » for a dangling target, KR-021). End-leaf labels already render through `NodeBadge`.
- Deferred (documented): per-row rule badges ⊘/⏱ (the edge rules land with choice-linking iters 3–4 — nothing to badge yet) and « centrer dans l'arbre » (needs canvas viewport centering — pairs with the iter-2 node inspector). 126 tests passing (7 new).

## 0.2.2 — book-library iteration 1 (V1 slice)

- **Richer book cards**: each card now shows écrans · liens · fins counts (the « fins » count derives from `effectiveKind === 'fin'`, consistent with the FIN badge, KR-054/068) plus a « Modifié le {date} » line (feature-local timezone-stable `formatDate`).
- **In-place rename** + **duplicate** + delete, revealed on hover/focus via a CSS-only `.book-card` rule (the canonical hover-reveal pattern — no `isHovered` JS state, keyboard-reachable). Rename edits the title in place (Enter/blur commits, Esc cancels; blank is a no-op).
- Two new SSOT mutations on **`BookService`**: **`renameBook`** (trims, rejects blank, persist → new **`book:updated`** event) and **`duplicateBook`** (deep copy with a fresh book id + fresh node/edge ids, edge endpoints remapped by stable id so the copy references its own nodes, KR-003; « (copie) » title; persist → `book:created`). `book:updated` is wired into `useBooks` (list re-reads on rename) and `useOpenBook` (KR-020/013/071/004).
- 117 tests passing (7 new). Search/sort + open-book-delete guard stay in iteration 2; per-book sync status in iteration 3.

## 0.2.1 — choice-linking iteration 1 (V1 slice — first of the 0.2.x tier 🚀)

- **Editable « libellé du choix » per outgoing row** — the player-facing button text now rides the edge (`Edge.label`) and persists through a new **`BookService.updateEdge`** (`EdgePatch`), the SSOT for every edge mutation (KR-060/020). A **blank label is dropped** at the SSOT so the canvas falls back to the kind's label (an empty `edge.label` never renders as a blank button); the field shows an inviting placeholder when empty.
- New brain **`edge:updated`** event, wired into `useOpenBook`'s mutation list, so the panel row **and** the canvas (which already renders `edge.label ?? canvasLabel`) reflect a label change live — no `useEffect` mirror (KR-013). Each row is now a two-line card (→ destination + kind badge + delete · libellé `Field` with an `ariaLabel` naming its destination).
- The libellé renders on every outgoing row (choice + relink), consistent with the canvas honouring `edge.label` for all kinds. Per-choice **rule badges** (⊘ prereq / ⏱ countdown) stay deferred to iterations 3–4 (need `ObjectCatalogService`). 110 tests passing (4 new). **🚀 Opens the 0.2.x / V1 tier** — `book-creation` / `tree-canvas` / `node-editor` iter-1 were banked depth-first, so `choice-linking` is the first V1 slice.

## 0.1.8 — cloud-sync walking skeleton (MVP slice — tier complete 🏁)

- New **`CloudSyncService`** (brain) — a **local-first Decorator** over `PersistenceService` (Liskov; `BookService` + every feature unchanged), wired once in `createBrain`. Writes hit local **synchronously** (offline-ready, KR-004), then push to a cloud transport in the background: status `idle → syncing → synced` (or `error`, local write preserved). With no transport the store is **`offline`** (local-only) and emits no per-write noise — so the existing suite is fully transparent. New **KR-093**.
- New `sync:status` event + `useSyncStatus` hook; the **`cloud-sync`** feature's `SyncIndicator` (a corner Badge pill, aria-live) surfaces the live state, derived from a `SyncStatus`→label/tone `Record` (KR-117), mounted once by `App` over both routes. Real cloud transport / offline queue / reconciliation deferred to iterations.
- 106 tests passing (7 new). **🏁 The 0.1.x MVP tier is complete — every feature now has a walking skeleton.**

## 0.1.7 — action-trap walking skeleton (MVP slice)

- New **`action-trap`** feature — the fourth and last `action-*`: self-registers a « Piège » editor with the brain **ActionRegistry**, so node-editor now offers **all four** action types (Décor / PNJ / Monstre / Piège) with zero changes. `TrapEditor` is a VIEW over `BookService`: a DESCRIPTION + réussite/échec reveal texts + a « L'échec mène à la Mort » toggle (the « échec sanctionné » variant), persisted on `node.trap`.
- Extracted a shared **`brain/components/OutcomesEditor`** (KR-109) at the **second consumer** of the réussite/échec rows: monster + trap now render outcomes from one component derived from `ROLL_OUTCOMES` (KR-117/091); `MonsterEditor` refactored to use it (rows de-duplicated). New **KR-092**.
- The automatic `échec → Mort` edge is deferred (KR-067) — the skeleton captures the `fatal` intent. Domain model gained `node.trap` (`TrapConfig`); `NodePatch` carries `trap` (text-only guard covers it, KR-055/090, regression-tested). 99 tests passing (2 new + MonsterEditor refactor). **All MVP action editors complete; only `cloud-sync` remains in the 0.1.x tier.**

## 0.1.6 — action-monster walking skeleton (MVP slice)

- New **`action-monster`** feature — third `action-*`: self-registers a « Monstre » editor with the brain **ActionRegistry** (node-editor now offers Décor / PNJ / Monstre with zero changes). `MonsterEditor` is a VIEW over `BookService`: a NAME + a player-facing reveal text per combat outcome, persisted on `node.monster`.
- **réussite / échec** — the only semantic outcomes/colours — modelled as a new brain **`ROLL_OUTCOMES`** registry (`Record<RollOutcome, {label, tone}>`, an instance of **KR-117**), placed in brain so trap/skill-roll editors reuse it (KR-109). The editor **derives** both outcome rows (good/bad `Badge` + field) from it — no hardcoded labels. New **KR-091**.
- The monster-library is **stubbed** via a new `monster:savedToLibrary` event on the brain EventBus (wired now, consumed later). Added `ariaLabel` to the shared `Field` so Badge-captioned fields keep an accessible name. Domain model gained `node.monster` (`MonsterConfig`) + `RollOutcome`; `NodePatch` carries `monster` (text-only guard covers it, KR-055/090, regression-tested). 97 tests passing (3 new). Stats / loot / outcome targets / real library deferred to iterations.

## 0.1.5 — action-pnj walking skeleton (MVP slice)

- New **`action-pnj`** feature — second `action-*`: self-registers a « PNJ » editor with the brain **ActionRegistry** (node-editor offers « Décor » + « PNJ » with zero changes, KR-050/051). `PnjEditor` is a VIEW over `BookService` (KR-020): a NAME + player-facing DIALOGUE, persisted on `node.pnj`.
- The « Le PNJ donne un objet » switch reveals the **shared `brain/components/ObjectEditor`** — the very primitive action-decor introduced — imported from brain with **no cross-feature import** (validates KR-052/109). The gift carries a stable id (KR-003); toggling off drops it.
- Domain model gained `node.pnj` (`PnjConfig`); `NodePatch` carries `pnj` so the text-only guard keeps it off structural screens (KR-055/090, now regression-tested for `pnj` too). 94 tests passing (3 new). Gift effects / « mène à » / reusable-PNJ catalog deferred to iterations.

## 0.1.4 — action-decor walking skeleton (MVP slice)

- New **`action-decor`** feature — the first real `action-*` feature: it **self-registers** a « Décor » editor with the brain **ActionRegistry** (Open/Closed seam, KR-050/051), so node-editor offers and mounts it with zero changes. `DecorEditor` is a VIEW over `BookService` (KR-020): a Prendre / Écouter / Fouiller `SegmentedControl` persisted on the node.
- New shared **`brain/components/ObjectEditor`** (KR-052/109) — internal NAME + player-facing DESCRIPTION — owned/introduced by action-decor's « prendre » and reusable by future PNJ/monster editors without a cross-feature import. The takeable object gets a stable id minted via `createId` (KR-003, now exported from brain).
- Domain model gained `node.decor` (`DecorConfig`) + `GameObject`; `NodePatch` carries `decor` so the text-only guard keeps it off structural screens (KR-055). New **KR-090**. 91 tests passing (4 new). Écouter/Fouiller + multi-object + skill rolls deferred to iterations 1–2; shared ObjectCatalogService to iteration 3.

## 0.1.3 — outline-view walking skeleton (MVP slice)

- New **`outline-view`** feature: the open book as an indented « plan » (`OutlineView`), a DFS from the sommaire that nests `choice` edges and renders `relink`/`flee`/convergence/cycle back-edges as `↪` reference rows (cycle-safe, **KR-080**); unreachable nodes (isolated `mort`) listed flat; dangling targets flagged `⚠ cible supprimée`.
- Hoisted the shared editor chrome to **`brain/components/EditorTopBar`** (KR-109) with a canvas ↔ outline **view-mode switch**; a new **`src/EditorScreen`** shell owns the (non-synced, KR-022) view-mode and swaps `TreeCanvas` ↔ `OutlineView` while keeping the node-editor panel mounted. `tree-canvas` is now the canvas body only; `CanvasTopBar` removed.
- Selection is shared via the brain `SelectionService` (KR-024): picking an outline row reflects on the canvas and the panel. `buildOutline` is pure + tested. 87 tests passing (9 new).

## Unreleased — unknown-kind boundary guard (KR-116)

- Hardened the persistence trust boundary: `PersistenceService.get` casts JSON unchecked, so a corrupted store / schema drift could carry a kind outside the registry and crash a `NODE_KINDS[kind]` lookup. New `isNodeKind` / `isEdgeKind` guards (derived from the registry keys) + a single `BookService.loadBook` validation: a book with an unknown node/edge kind is surfaced (`console.warn`) and treated as **unreadable** (`getBook`/`openBook` → null, omitted from `listBooks`, mutations refused) rather than throwing — but stays **deletable** so it can be cleaned up. New **KR-116**. 78 tests passing (5 new).
- Removed the three `book!` non-null assertions in `TreeCanvas` (captured a narrowed `activeBookId` after the guard, matching the `NodeEditorPanel` pattern) — no `!` assertions remain in source. Recorded the defensive-boundary + view-tolerance rules (KR-021/116) in the `livre-jeu-design` skill.

## Unreleased — magic numbers, plural & kind single-source (P3 of the code-health sweep)

- **`NodeKind` / `EdgeKind` are now derived from the kind registry** via a `defineKinds` factory + `keyof typeof` (KR-068): the registry is the single source for the kind _set_ as well as its behaviour — no parallel union to keep in sync. (Answers "a builder to add a kind without duplicating the union".)
- Killed the remaining geometry/dimension magic numbers as **named constants**: canvas bounds → `resolveBounds` + `CANVAS_MIN_W/H` + `CANVAS_MARGIN` (geometry); `DOT_GRID_SIZE`, `HINT_INSET`, `HINT_GAP` (TreeCanvas); `LAYOUT_ORIGIN` (BookService autoSlot); `CARD_MIN_HEIGHT`, `PAGE_MAX_WIDTH`, `GRID_MIN_COL` (book-library); `MODAL_MAX_WIDTH`, `CLOSE_BUTTON_SIZE` (Modal); `PICKER_MAX_HEIGHT` (choice-linking).
- New shared **`plural()`** helper (FR: 0 & 1 singular) replaces the inline `n > 1 ? …` ternaries (CanvasTopBar, BookCard).
- Extracted the large inline `style={{…}}` objects in `LibraryScreen` and `BookCard` to named `React.CSSProperties` consts (readability, matching the `panelShell`/`monoControl` pattern). 71 tests passing (3 new plural tests). No bump.

## Unreleased — hit-target token (P2 of the code-health sweep)

- New **`--hit-target: 44px`** token + mirrored **`HIT_TARGET_MIN`** brain constant for the WCAG ≥44px interactive minimum. Replaced the `44` literal repeated across 9 files (NodeEditorPanel, CanvasTopBar, ZoomControls, NewBookButton, OutgoingChoices ×5, Modal ×2, Toggle, SegmentedControl, BookCard) — CSS strings use the token, the one numeric `size` prop uses the constant. No behaviour change; 68 tests passing.

## Unreleased — kind registry refactor (P1 of the code-health sweep)

- **New `brain/kinds.ts`** — one data-driven registry (`NODE_KINDS` / `EDGE_KINDS`) holding each kind's label, default title, badge mark and domain flags (`structural` / `canHaveOutgoing` / `canBeTarget`). New **KR-068**.
- Removed the scattered `if (kind === …)` tests and the silent `Partial<Record<NodeKind>>` badge map: `NodeBadge`, `nodeView`/`nodeTitle`, `effectiveKind`, `NodeEditorPanel`, `BookService` (text-only / outgoing / target guards), `EdgeLayer`, `OutgoingChoices` now read the registry. Three duplicate per-kind tables collapsed into one.
- Pure refactor, behaviour preserved exactly; 68 tests passing (5 new registry tests). No version bump. Remaining magic-number / style TODO markers are tracked in `docs/ROADMAP.md` (code-health sweep P2/P3), not shipped as inline comments.

## 0.1.2 — book-library walking skeleton (MVP slice)

- The home screen is now `book-library`'s **`LibraryScreen`**: a grid of book cards listing every persisted book (live VIEW via the new brain **`useBooks()`** hook), newest first, each with a title + screen count.
- Click a card → `openBook` + navigate to its editor. Each card has a delete ✕ gated behind a **confirmation dialog** (dangerous action, error-toned confirm); confirming calls the new **`BookService.deleteBook`** (persist-remove → `book:deleted`, KR-004) and the card drops from the live list.
- `book-creation` refactored: the create affordance is now **`CreateBookEntry`** (button + dialog); `App` composes it into `LibraryScreen` as a prop so the two features never import each other (KR-072). `HomeScreen` removed (chrome moved to the library).
- Shared `Modal` gains `confirmTone='error'` for dangerous-action confirms. New KRs KR-070/071/072. 61 tests passing.
- **Refinement (choice-linking domain):** structural screens are never authored choice targets — the `sommaire` root and `mort` leaf are excluded from the « Relier… » candidates and rejected by `BookService.addEdge` (`mort` is reached only automatically in combat). New **KR-067**. 63 tests passing.

## 0.1.1 — choice-linking walking skeleton (MVP slice)

- `choice-linking` mounts in node-editor's choices slot via a new brain **`SlotRegistry`** (OCP seam, KR-066) — neither feature imports the other.
- Outgoing-choice rows (live VIEW over `BookService`); « + branche » creates a child + `choice` edge and selects it; « Relier… » adds a `relink` edge to an existing node (cycles/convergence); remove deletes only the edge, never the target node.
- `BookService` gains `addChoiceBranch` / `addEdge` / `removeEdge` (SSOT, KR-060); `edge:created` payload now carries `from`/`to`/typed `EdgeKind`. Mort's no-outgoing rule enforced at the SSOT (KR-055/060).
- Hidden-prerequisite + countdown (iters 3–4) deferred — they need `ObjectCatalogService` (lands with action-decor). 52 tests passing.

## 0.1.0 — re-baseline + roadmap (no app code change)

- Adopted the breadth-first slice roadmap (`docs/ROADMAP.md`); rewrote `WORKFLOW.md` build-steps + versioning accordingly.
- Added the `tech-lead` review subagent and the per-feature stop-and-review gate.

## 0.3.1 — node-editor: structural screens (Sommaire / Mort)

- Sommaire (root) and Mort (death leaf) are structural: the panel hides « libellé du choix », « action requise » and the Fin victoire/échec toggles for both, and hides « choix sortants » for Mort. Only their text is editable.
- Enforced at the SSOT too: `BookService.updateNode` accepts a text-only patch for `sommaire`/`mort` (generalises the locked-Mort rule, KR-002 → KR-055), so the invariant holds even if a caller sends end flags/action.
- Docs updated (CLAUDE.md domain rules, node-editor spec, code-knowledge KR-055). 43 tests passing.

## 0.3.0 — node-editor (walking skeleton + iteration 1)

- `node-editor` side panel (§ 02): mounted beside the canvas by the app shell. Sticky header (NodeBadge + ref + title + ✕), editable Description `Field`, Fin victoire/échec `Toggle`s, the « Action requise » `SegmentedControl`, and deferred slots (libellé, illustration, inventory, choix sortants).
- **Selection promoted to a brain `SelectionService`** (single source of truth, KR-024): tree-canvas and node-editor both read via `useSelectedNode` and write via `selection.select`; the service is the sole emitter of `node:selected` and clears on `book:opened`. The panel's ✕ deselects without desyncing the canvas highlight.
- **`ActionRegistry`** (brain): the Open/Closed seam (KR-051) — action-\* features self-register editors; node-editor mounts them with zero action-specific code. SegmentedControl emits `action:changed`.
- `BookService.updateNode` commits Description + end flags + action type, emitting `node:updated`; a locked node accepts only text edits (KR-002). End flags drive the FIN badge everywhere via `effectiveKind`/`endLabel` (KR-054).
- Shared view logic (`useOpenBook`, `nodeTitle`) and new DS primitives (`Toggle`, `SegmentedControl`) promoted to brain (KR-109/110). Libellé du choix decided to live on the incoming edge (deferred to choice-linking). 41 tests passing.

## 0.2.0 — tree-canvas (walking skeleton + iterations 1–2)

- `tree-canvas` is now the editor surface, rebuilding wireframe § 02 from design-system tokens/primitives: top bar (back · title · node-count badge · disabled « Aperçu du jeu » · « + Nœud »), dot-grid canvas, node cards (`NodeBadge` + ref + title + 1-line snippet), SVG connectors (solid `choice`, dashed `relink`/`flee`, arrowheads, mono label chips), bottom-right zoom controls.
- Live data binding: the canvas is a pure VIEW over `BookService` (KR-020), kept current via a `useSyncExternalStore` subscription to `node:*` / `edge:*` / `book:opened` (no `useEffect` mirror, KR-013).
- `BookService.addNode(bookId, kind)` adds a free-floating node with a deterministic auto-layout slot (KR-023) and emits `node:created` (payload now carries `kind`).
- Single-select owned by the canvas and broadcast as `node:selected{nodeId|null}` (KR-024); clears on empty-canvas click. Orphaned edges are dropped, never drawn to nowhere (KR-021).
- Local pan/zoom shipped (not synced, KR-022); persisting view-state + dragged positions via `UIPreferencesService` deferred to iteration 3. Retired `EditorStub`. 29 tests passing.
- BUG-001 (minor): drag listeners now cancel on unmount mid-gesture.

## 0.1.0 — book-creation walking skeleton

- Initialized the Vite + React 18 + TypeScript app (ESLint, Prettier, Jest + RTL).
- Stood up the design system: tokens (`styles/`) + cross-feature primitives in `brain/components` (NodeBadge, Modal, Field, Card, Badge, IconButton).
- Built the `brain/` core: domain types, EventBus, Router, PersistenceService + persistenceKeys, BookService (single source of truth + atomic seed factory), DI via BrainContext.
- `book-creation` walking skeleton: home → « Nouveau livre » dialog (focus, inline validation, Enter-to-submit, Esc/scrim dismiss) → `BookService.createBook` seeds exactly a Sommaire + an isolated, locked Mort node → emits `book:created` then `book:opened` → navigates to the editor. 16 tests passing.
