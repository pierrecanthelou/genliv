# Tour 1 — QA (`/cadrer dossier-copilote`)

RISQUE — Toute la testabilité de la feature repose sur UN instrument neuf jamais éprouvé sur un contrat aussi riche (3 rôles, budget de rejeu, dégradation) : le `fetch` mocké. S'il n'est pas cadré dès maintenant par des schémas TYPÉS par rôle, la revue confondra « l'appel a été fait » avec « la sortie est correcte ».

OBJECTION — Le garde-fou § 2.8 « Aucune création d'entité » est écrit pour le moteur-interprète (n°10, JOUEUR), pas pour ce copilote de RÉDACTION qui doit justement créer des personnages. Le cadrage pose la contradiction sans la trancher : sans distinguer ces deux garde-fous au tour 3, aucun critère « respecte § 2.8 » n'est observable.

PROPOSITION — Un schéma typé PAR RÔLE (3), validé côté service avant tout affichage ; un budget de rejeu fixé à EXACTEMENT 1 (jamais « quelques essais ») ; un état terminal `degrade` distinct, testé par `mockResolvedValueOnce` enchaîné sur `fetch` — précédent **mesuré ce jour** : `CloudflareKVTransport.test.ts`, **8/8 verts** (`npx jest src/brain/CloudflareKVTransport.test.ts`).

VERDICT — **recevable sous réserve** : la frontière § 2.8 par rôle doit être écrite avant le premier lot codé ; et une tranche de compaction de `code-knowledge.json` (+656 o) doit précéder ou accompagner l'écriture des KR-229+, faute de quoi l'arbitrage humain déjà écrit est rompu en silence.

## Réponses aux questions nommées

**1. Ligne de partage testable.** Recevable : la FORME de la sortie — conformité au schéma typé par rôle, bornes (KR-165), audience des champs ciblés (`destinations.ts`), nombre d'appels, état terminal du chemin d'échec. Tout cela se simule par `fetch` mocké. Irrecevable : la QUALITÉ de la prose — aucun instrument du dépôt ne la constate.

**2. Chemin d'échec — deux critères, jamais un** (précédent KR-171/`dossier-format` : une propriété à deux moitiés s'écrit en deux critères, sinon un test vert masque l'absence de l'autre). Un budget « par tour » façon § 2.8 est HORS PÉRIMÈTRE : le copilote de rédaction n'a pas de tour.

**3. Proposition refusée par `validateDossier` — NOMINAL, pas cas limite.** Une sortie non déterministe qui viole une borne ou une référence est un mode attendu de ce type d'entrée. La classer « cas limite » sous-outille le risque le plus probable de la feature — même défaut de forme que BUG-040/KR-171.

**4. Budget de contexte — constat, pas veto.** Deux issues seulement : (a) une tranche `outillage` de compaction s'intercale avant le premier lot codé ; (b) le premier lot `contrat` de n°8 EMPORTE la compaction dans le même geste (`WORKFLOW.md` l'autorise). Refusé : franchir en silence une troisième fois sans choisir explicitement au tour 3.

## Critères d'acceptation proposés
- **AC1** (contrat) — réponse conforme ⇒ acceptée sans second appel (`fetchMock` appelé 1 fois).
- **AC2** (contrat) — 1ʳᵉ non conforme puis 2ᵉ conforme ⇒ rejeu EXACTEMENT une fois (2 appels, jamais 3).
- **AC3** (contrat) — deux non conformes ⇒ état `degrade` distinct et discriminant (jamais un champ vide, jamais une exception non gérée).
- **AC4** (RTL) — état `degrade` ⇒ message explicite en région annoncée, **distinct** de « aucune proposition demandée » (discriminance à deux états, KR-197/199).
- **AC5** (contrat) — proposition acceptée ⇒ passe PAR `DossierService.update`, ordre persist→emit (KR-004).
- **AC6** (contrat) — candidat recomposé REFUSÉ par `validateDossier` ⇒ rien persisté, `errors` rendues. **Cas nominal.**
- **AC7** (unitaire) — personnage neuf accepté ⇒ `id` frappé par `frapperIdentifiant`, jamais une valeur reçue du modèle.
- **AC8** (contrat) — `stats` et `Revelation.jet{carac,tc}` **jamais** dans l'ensemble proposable ; seuls `curseurs`, `plan_actions[]`, `relations[]` et les chemins d'audience `ia`.
- **AC9** (contrat) — worker injoignable ⇒ message explicite, SANS dégradation vers un modèle local (D2).
- **AC10** (contrat) — « Tisser les indices » ne référence QUE des entités DÉJÀ existantes dans `monde` — cette moitié RELIE, ne CRÉE pas.

## KR-229 à KR-236
- **KR-229** — la frontière testable d'une sortie de modèle est sa FORME, jamais sa PROSE.
- **KR-230** — le chemin d'échec porte deux propriétés distinctes (rejeu / dégradation) et se prouve par deux tests.
- **KR-231** — une proposition refusée par `validateDossier` est le cas NOMINAL, pas un cas limite.
- **KR-232** — le modèle ne frappe jamais un identifiant, même quand un assistant CRÉE une entité.
- **KR-233** — le garde-fou § 2.8 « aucune création d'entité » vaut pour le moteur (n°10, runtime joueur) ; le copilote (n°8, design-time) peut créer des entités mais jamais en inventer les identifiants. **Les deux garde-fous ne sont pas le même** et doivent être nommés séparément.
- **KR-234** — « Compléter une fiche » ne touche jamais `stats` ni `Revelation.jet` ; allow-list de chemins (précédent KR-215), pas une convention.
- **KR-235** — `worker/index.ts` n'a AUJOURD'HUI AUCUN TEST (vérifié ce jour) alors qu'il va recevoir sa première route hors `/kv/:key`. Toute route `/ia/...` entre dans le MÊME lot que son appelant ET reçoit un test.
- **KR-236** — non-régression : le contrat en cinq temps de `DossierService.update` reste inchangé ; le copilote CONSOMME `update`.

## Cas limites
vide (synopsis encore au marqueur) ; très long (sortie dépassant une borne, KR-165) ; doublon (relance avant résolution — verrou, pas de double appel concurrent) ; hors ligne (AC9) ; référence orpheline ; annulation en cours (précédent `AbortController` 45 s de `CloudflareKVTransport`, aucun `setState` après abandon) ; double soumission (double clic « Accepter ») ; retour arrière du navigateur (l'état de proposition ne doit pas survivre en silence, KR-013).

## REJETÉS
1. **« La proposition est cohérente avec le canon » comme critère** — aucun instrument ne constate une cohérence narrative.
2. **Toute exigence de score de mutation** — la feature ne touche aucun des quatre fichiers mutés (KR-161).
3. **Toute exigence de table dorée** — ni `BESTIARY`, ni `CHALLENGE_TIERS`, ni `CHARACTERISTICS`, ni `POSTURES` ; `curseurs.ts` est hors doctrine (KR-193).
4. **Un critère « le panneau fonctionne au glisser/zoom »** — aucun instrument navigateur ; l'opérabilité clavier simple reste exigible via `user-event`.
5. **Un critère fonctionnel « routeur multi-modèle »** — décision n°2 : un seul modèle en v1, seul un point d'extension NOMMÉ est exigible.
