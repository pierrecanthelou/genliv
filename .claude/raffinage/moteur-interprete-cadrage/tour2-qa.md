# Tour 2 — Cadrage QA — moteur-interprete (n° 10)

## Réponses aux tensions

**Tension 1 (KR-260 — moteurSansIA.test.ts réécrit par fichier)**

Proposition `tech-lead` CONFIRMÉE ET SATISFAISANTE.
- `src/player/` : intégralement interdit (aucun appel IA prévu). ✓
- `src/brain/dossier/` : interdiction totale sans exclusion (assembleurs vivent dans `brain/copilote/contexte/`). ✓
- `src/features/play-mode/` : liste nommée de fichiers exemptés (probablement `useTourDeJeu.ts` ou équivalent). ✓

KR-260 RESSERRI : Balayage par fichier, trois périmètres explicites, garde d'exhaustivité `never` sur `CopiloteService.demander()` (force le lot contrat à être mécaniquement indivisible). Mutant obligatoire : « importer `CopiloteService` hors liste, vérifier rouge, retirer ». La réécriture du garde (lignes 30-35 actuelles) passe d'une inversion de forme « racine entière interdite » à « racine interdite SAUF liste » — tout survivant au-delà de cette liste change le codage du périmètre et rougit en veto, pas en anomalie de seuil.

**Tension 4 (Critère « anti-complaisance » observable)**

Proposition `narratif-ia`, section B prédicat 3, CONFIRMÉE ET OBSERVABLE.
- Formulation : « un fait sans ancre n'est pas représentable, donc une entité inventée n'atteint jamais la mémoire durable ».
- Traduction testable : vérifier que `faits_etablis[].sur` est jamais vide. Schéma JSON → validation déterministe.
- Mutants obligatoires : fait accepté sans `sur`, fait avec `sur: []`.

Je LÈVE MON OBJECTION. La preuve est la suivante : si R3 invente une entité (ex. « un forgeron »), elle ne peut entrer en `faits_etablis` que via le champ `sur`, qui énumère les rangs du monde. Aucun rang de la table (lieux, objets, PNJ) ne correspond à une entité inventée → `sur` doit rester vide → refus prédicat 3 → entité bloquée. C'est le seul levier testable en l'absence de rejeu. Aucune autre forme de garde-fou (« ne crée rien ») n'est observable par jest.

## Statuts des autres tensions

**Tension 2 (KR-261)** — Clarifier que les constantes de budget (section D : `FAITS_INJECTES_MAX`, `RESUME_MAX`, etc.) forment l'implémentation *unique* des « onze chemins de prose IA ». Un seul instrument, deux formulations. À préciser dans la revue d'itération 1 (tour tech-lead) avec les valeurs mesurées.

**Tension 3 (KR-262)** — KR-262 PARTIELLEMENT CLOS pour R1 (description, jamais nom, décision `narratif-ia` valide). R3 reste ouvert : narrateur doit bien nommer des lieux/PNJ — à trancher lors des itérations qui touchent R3 ou l'injection de `journal[].recit`. Pas de veto ; détail de planning.

## Verdict

**RECEVABLE.** Tous les garde-fous disposent d'un instrument observable ou d'un test nommé. KR-260 resserri, KR-261 unifié, KR-262 planifié. Aucun rejet.

---

**280 mots.**
