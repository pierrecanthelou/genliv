## RISQUE / OBJECTION / PROPOSITION / VERDICT (Tour 1)

**RISQUE** — L'agrégation fait cohabiter, dans UNE liste à l'anatomie unique (`ListeControles`), deux façons d'obtenir `Controle.section` : les règles natives la DÉCLARENT (KR-219), celles importées de `validateDossier` devront la DÉRIVER de `DossierIssue.path` — exactement ce que KR-219 interdit, et exactement ce sur quoi D-1/D-7 (it4) ont fondé la promesse que le trailing « → {section} » est « le seul élément mécaniquement garanti juste et complet » de chaque ligne.

**OBJECTION** — Si cette dérivation se fait par un parseur de chemin, même restreint aux dix sites du cadrage §7, elle crée deux classes de lignes indiscernables sous une anatomie identique : celles dont le trailing est une garantie, celles dont il est une inférence. Le lecteur ne peut pas voir la différence. Ce n'est pas une faute de décoration, mais une rupture silencieuse d'une garantie que ce comité a lui-même posée à it4.

**PROPOSITION** — La section de chaque code importé se DÉCLARE, dans un registre littéral fermé et privé à la fonction de mapping de `controles.ts`, une entrée par code (ou par site, si un même code touche plusieurs sites) — les dix sites du cadrage §7 en donnent déjà la table complète, aucun n'y est ambigu. Un code de `DossierIssue` atteint hors de cette table doit faire échouer la compilation ou un test — jamais retomber sur une section devinée à l'exécution.

**VERDICT** — Pas un veto : le terrain est architectural (mapping brain/), donc au tech-lead. Objection ferme cependant : sans cette table fermée et déclarative, je poserais un veto sur le trailing des lignes importées — la garantie posée à it4 serait rompue précisément sur les lignes que cette itération ajoute.

---

## ANNEXE — Contrat de design (it5) et réponse nommée aux quatre points

### 1. Deux composants pour la même anomalie — l'arbitrage d'it1 ne rouvre PAS

Je ne rouvre pas `RETENU (cadrage) — ListeControles CALQUE l'anatomie d'IssueList… l'extraction attend le DEUXIÈME appelant réel`.

Les deux surfaces restent fonctionnellement distinctes, pas seulement visuellement semblables :
- `IssueList` (import) rend des lignes **inertes** (`<p>`, pas de bouton, pas de section — l'écran d'import n'a pas de concept de section de l'éditeur).
- `ListeControles` (rapport) rend des lignes **actionnables** (`<button>`, clic → `onSelectSection`, trailing `→ {section}`).

Cette différence n'est pas cosmétique : `IssueList` ne pourra JAMAIS porter un trailing de section ni un `onClick`, parce que l'écran d'import n'a rien à quoi naviguer. Un composant partagé devrait donc exposer une prop `onSelectSection?` optionnelle et un trailing conditionnel côté `IssueList` — c'est exactement le genre de branchement conditionnel que KR-109 vise à éviter tant qu'il n'a qu'un vrai second appelant *au même usage*. Ici, ce n'est pas le même usage : c'est le même TYPE de fait, rendu dans deux RÔLES d'écran différents. Je ne vote pas l'extraction sur ce motif.

En revanche, je signale — hors de mon terrain de veto, pour le tech-lead — une duplication réelle mais non-visuelle : `dossierIssueRemediation(issue)` et `controleRemediation(constat)` font le même travail (résoudre `{racine}`/`{champ}` dans un `Record` fermé) sur deux registres distincts. Si it5 fait passer des `DossierIssue` par le mapping vers `Controle`, la remédiation résolue doit rester CELLE DE `DOSSIER_ISSUE_LABELS` (texte déjà vétté, voir point 2) — jamais retranscrite dans `CONTROLES`. Ça, ce n'est pas mon terrain, mais je le nomme pour qu'aucun agent ne réécrive ces trois lignes par erreur de bonne foi.

### 2. Les textes — REPRENDRE tels quels, vérifié mot pour mot

Position : **reprendre**, ne pas réécrire. Vérification faite sur les trois codes que le cadrage §4 dit atteignables (`texte-trop-long`, `revelation-sans-porte`, `condition-sans-expr`) — aucun ne dit « réimportez-le » :

- `texte-trop-long` → *« ↪ Resserrez le texte si possible ; ce n'est pas bloquant. »*
- `revelation-sans-porte` → *« ↪ Ajoutez au moins une porte, ou laissez tel quel si ce savoir ne doit jamais se révéler de lui-même. »*
- `condition-sans-expr` → *« ↪ Ajoutez la condition structurée correspondante si le moteur doit la vérifier, ou laissez tel quel si elle reste une intention d'auteur. »*

Ce n'est pas une coïncidence : le commentaire de `texte-trop-long` dans `issues.ts` documente explicitement qu'il a déjà été corrigé pour être rendu « hors de tout import » (BUG-042/BUG-075/KR-171, `FichePersonnage.tsx` le rend déjà pendant une édition). Le registre « semeur devant un champ » vs « lecteur d'un rapport » que le comité a tranché à it1 concernait le marqueur `⟨à écrire⟩` d'`amorce.ts`, pas `DOSSIER_ISSUE_LABELS` — ces trois-là sont déjà écrits pour une audience qui édite, pas qui vient de cliquer « importer ». Rien à réécrire.

Garde à poser (proposition, pas un veto) : un test-grep interdisant à quiconque de router vers le rapport un code de `DOSSIER_ISSUE_LABELS` dont la chaîne contient « réimportez » — filet pour l'avenir, puisque `severity` n'est pas statiquement lié à un `code` dans le type (KR-225 l'exclut en pratique aujourd'hui, mais rien ne l'empêche au type).

### 3. La section du trailing — voir OBJECTION ci-dessus. Rappel du matériau (cadrage §7), à recopier tel quel dans la table fermée de mapping : `canon.mj`/`canon.partage` → `canon` · `charpente.jalons[].enonce_texte` → `jalons-fins` · `monde.conditions.climat[].manifestation` → `conditions` · `canon.objectifs[].reussi_si_texte`/`echoue_si_texte` → `canon` · `charpente.fins[].condition_texte` → `jalons-fins` · `monde.personnages[].contre_mesures[].declencheur_texte` → `personnages` · `…savoirs[].revele_si` → `personnages` · `…plan_actions[].si_bloque` → `personnages`.

### 4. L'état calme — le texte reste vrai et suffisant, aucune modification

`TEXTE_ETAT_CALME` = *« Aucun contrôle à signaler — le dossier passe tous les contrôles connus. »* n'a pas besoin de changer. Le mot « connus » a été retenu à it1 nommément pour cette raison (`resolved_decisions` : « L'honnêteté est portée par le mot « connus » de l'état calme, qui ne se retire pas »). Il ne fait aucune promesse de SOURCE (« zéro anomalie détectable ») mais une promesse de PÉRIMÈTRE (« zéro anomalie parmi ce que ce rapport sait chercher ») — agréger une seconde source de constats élargit ce périmètre sans rendre la phrase fausse. Aucune réécriture requise, condition : `rapport.controles.length === 0` doit continuer de compter les DEUX sources dans le même tableau (pas deux compteurs qu'on additionnerait au rendu — ce serait une seconde vérité, KR-013).

### Contrat de design — ce qui NE change PAS

- **Anatomie** : inchangée. `ListeControles` garde son `<button>` à trois étages + pastille + trailing ; `pastilleNiveau`/`badgeSection` (`brain/dossier/pastilles.ts`) inchangés — un `Controle` mappé depuis un `DossierIssue` porte un `niveau` (`bloquant`/`alerte`/`info`) comme tout autre, rendu identiquement.
- **Jetons** : aucun nouveau. Tout passe par les `--*` déjà cités dans `ListeControles.tsx` (`--border-divider`, `--text-label`, `--text-body`, `--text-muted`, `--text-faint`, `--fs-eyebrow`, `--fs-body`, `--fs-meta`, `--track-eyebrow`, `--space-*`, `--r-md`, `--font-ui`, `--font-mono`) et `Badge` (`--bad`, `--ink-2`, `--ink-4`).
- **Couleur** : toujours deux couleurs sémantiques (réussite/échec) hors sujet ici — les trois niveaux restent `bad`/`neutral`/`muted`, séparés par le mot, jamais une teinte neuve, même pour un constat d'origine `validateDossier`.
- **Clavier** : rien à faire — chaque ligne reste un `<button type="button">` natif, Tab/Entrée gratuits, que le constat vienne du registre `CONTROLES` ou du mapping `validateDossier`.
- **État vide** : inchangé (voir point 4).
- **Registre de langue** : les trois textes vérifiés au point 2 sont déjà au registre interface/rédaction (impératif terse, jamais de fiction joueur) — cohérents avec les messages natifs de `CONTROLES` déjà rendus par `ListeControles`.

Fichiers lus : `C:\Users\pierr\Desktop\genliv\.claude\raffinage\dossier-controles-it5\cadrage.md`, `C:\Users\pierr\Desktop\genliv\src\features\dossier-controles\specification.json`, `C:\Users\pierr\Desktop\genliv\.claude\raffinage\dossier-controles-it4.plan.md`, `C:\Users\pierr\Desktop\genliv\src\features\dossier-controles\components\ListeControles.tsx`, `C:\Users\pierr\Desktop\genliv\src\features\dossier-controles\components\PanneauControles.tsx`, `C:\Users\pierr\Desktop\genliv\src\brain\components\IssueList.tsx`, `C:\Users\pierr\Desktop\genliv\src\brain\dossier\issues.ts`, `C:\Users\pierr\Desktop\genliv\src\brain\dossier\pastilles.ts`.