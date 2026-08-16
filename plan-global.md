# Plan global — convergence outils/méthodes entre projetx, chrono-sabine, genliv

_2026-08-12. Répond à la question : y a-t-il un intérêt à uniformiser les trois projets ? Oui, mais
ciblé — pas une uniformisation totale. Ce document ne touche à aucun fichier de chrono-sabine ou
genliv : il est écrit depuis la session projetx, qui n'a pas mandat pour éditer les deux autres
dépôts. Il sert de plan de référence + de prompts de reprise à coller dans une session dédiée à
chacun des deux autres projets (Session Hygiene, `dev` SKILL.md : un chantier indépendant démarre
plus net dans une session fraîche, propre au dépôt qu'il modifie)._

---

## 1. La question posée, et pourquoi la réponse est oui — mais ciblée

Les trois projets ne sont pas 3 apps indépendantes qui se ressemblent par hasard : ce sont 3
implémentations de la **même méthodologie CLAUDE.md-driven**, par le même développeur, à des dates
différentes. Trois faits, tous vérifiés par le panel du 12 août, le confirment :

1. **Le schéma `bug_history.json` est identique aux champs près** dans les trois projets
   (`id/date/feature/discovered_at/symptom/root_cause/fix/mitigation/regression_test/severity`) —
   sans coordination récente, juste parce qu'ils partagent la même origine.
2. **Évolution convergente sur les mêmes problèmes** : les trois ont indépendamment affronté la
   croissance des journaux, la portée du mutation testing, la détection des couleurs littérales, et
   la traçabilité des décisions — et ont trouvé des réponses différentes, chacune partiellement
   meilleure que les deux autres (voir §3). Quand 3 projets inventent 3 solutions au même problème,
   c'est le signal que le problème est réel et récurrent, pas un besoin isolé.
3. **Coût mesuré de la non-convergence** : BUG-062 (collision d'ID entre shards, genliv) n'était
   connu de personne avant cet audit ; le design du gate A1 de projetx (marqueur haché en cache +
   échappatoire `CLAUDE_GATE_BYPASS`) est strictement plus robuste que le script identique partagé
   par chrono-sabine et genliv, sans que ceux-ci en bénéficient. Sans convergence périodique, chaque
   futur audit redécouvre les mêmes écarts à partir de zéro — exactement ce que ce panel vient de
   faire une seconde fois sur le même terrain que le plan config-uplift (0.90.0) avait déjà partiellement
   couvert côté `.claude/`.

**Mais pas une uniformisation totale — pour l'instant.** chrono-sabine (4 features, PWA locale) et
genliv (éditeur mono-utilisateur) n'ont ni CI, ni Playwright/E2E, ni audit mensuel — et ce n'est pas
une lacune : c'est un investissement en outillage proportionné à leur taille et à leur risque réels
*aujourd'hui*. Forcer le niveau d'outillage de projetx (le plus gros des trois, avec un backend
Cloudflare Worker et une synchro cloud — donc un risque de perte de données que les deux autres
n'ont pas dans la même mesure) sur chrono-sabine ou genliv serait de la sur-ingénierie, exactement
ce que le Feature Health Audit de projetx existe pour repérer et éviter.

**Mise à jour 2026-08-13 — cette proportionnalité a une date de péremption.** chrono-sabine et
genliv vont prochainement synchroniser leurs données dans Cloudflare, et leurs push sur le dépôt
distant déclencheront des builds Cloudflare (ces apps y sont hébergées). À ce moment-là, l'écart de
risque qui justifie aujourd'hui l'écart d'outillage (§4) disparaît largement : les deux frères
auront eux aussi un risque de perte/divergence de données cloud, et un push cassé cassera
désormais un build distant, pas juste un poste local. Deux conséquences concrètes, capturées dans
le nouveau skill `sibling-convergence` (§6) comme déclencheur explicite de ré-audit :
1. Le portage du design du gate A1 (§3, actuellement « différé ») devient plus urgent — un
   pre-commit gate qui bloque avant un push cassé vaut plus cher à ne pas avoir une fois que ce push
   casse un build distant, pas seulement le poste local.
2. La question CI/Playwright/audit mensuel (§4) doit être rouverte, pas reconduite par défaut —
   sans present préjuger de la réponse (peut-être une CI légère suffit, peut-être pas), seulement
   noter qu'elle n'est plus tranchée par « ils sont plus petits ».

**Principe retenu : converger le socle partagé (schémas, conventions, patterns prouvés sûrs à
l'échelle solo) ; laisser diverger la profondeur d'outillage (CI, E2E, mutation testing étendu),
qui doit rester proportionnée à la taille et au risque de chaque projet.**

---

## 2. Socle commun — à rendre identique dans les trois projets

| Élément | État actuel | Cible |
|---|---|---|
| Schéma `bug_history.json` | Déjà identique (champs) | Ajouter partout la convention chrono-sabine : `regression_test: null` toujours accompagné d'une raison en `mitigation`. |
| Schéma `specification.json` | `resolved_decisions` = chrono-sabine seul ; `open_questions` structuré = genliv seul ; projetx a ni l'un ni l'autre | Les trois adoptent les deux : `resolved_decisions` (options rejetées + arbitrage motivé) ET `open_questions` structuré (statut/propriétaire/condition de réouverture). Chacun des trois converge vers l'union des deux patterns, pas juste projetx vers les deux. |
| Plafond de taille des journaux | chrono-sabine et genliv : `arrondi_sup(taille/5 Kio) × 5 Kio`, scission au franchissement, sans script. projetx : aucun plafond. | projetx adopte la même formule. Aucun changement requis côté chrono-sabine/genliv, déjà en place. |
| Statut d'itération `"later"` | projetx seul | À évaluer par chrono-sabine et genliv : c'est un acquis réel (bloquer proprement une itération gatée sur un signal pas encore là), pas juste une fioriture — mais decision à prendre dans leur propre session, pas ici. |
| Process File Discipline (ne pas laisser un fichier de process grossir sans retirer l'équivalent) | Présent dans les trois CLAUDE.md, formulé différemment | Vérifier que la formulation reste la même intention dans les trois — pas de changement de fond attendu, juste un contrôle de dérive. |

---

## 3. Convergence par sujet — qui a la meilleure implémentation, qui doit l'adopter

| Sujet | Meilleure implémentation actuelle | Doit adopter | Effort |
|---|---|---|---|
| Lint cross-feature bidirectionnel (`features→features` ET `brain→features`) | chrono-sabine (`isolation-modules.js`) | **projetx** (item #1, `plan-v4.md`) et **genliv** (dont la règle actuelle utilise un tableau `FEATURE_DIRS` codé en dur — fragile, à remplacer par la détection dérivée du chemin déjà utilisée par projetx/chrono-sabine) | Faible |
| Détection des couleurs littérales (logique) | **projetx** (masque les `var(...)`, attrape les couleurs nommées) | chrono-sabine (son sélecteur `color-mix()` ne masque pas `var()`, faux positifs potentiels) et genliv (bug documenté BUG-027 : ne détecte qu'en tête de template literal) | Moyen (porter la logique, pas juste la sévérité) |
| Sévérité de cette même règle | chrono-sabine et genliv (`error`) | **projetx** (item #2, `plan-v4.md`) | Trivial |
| Rigueur du mutation testing (seuil réel, rationale par fichier, cadence à l'itération) | chrono-sabine | **projetx** (item #3, `plan-v4.md`) et **genliv** (a déjà un seuil réel et un script npm, mais pas la rationale par fichier ni la cadence à l'itération) | Moyen |
| Design du gate de pre-commit (marqueur haché en cache, échappatoire tracée) | **projetx** (A1) | chrono-sabine et genliv (script identique entre eux, plus simple : re-exécute tsc+jest à chaque fois, pas d'échappatoire) — **à ne porter qu'une fois A1 gradué en mode bloquant et éprouvé**, pas avant | Moyen, différé |
| Vérification de la fidélité au design au moment du plan | genliv (contrat de noms stable, low-cost) | **projetx** (item #6, `plan-v4.md`) ; chrono-sabine pourrait aussi simplifier son comité à 4 rôles vers ce pattern moins coûteux, mais c'est une décision qui lui appartient — le comité a peut-être une justification propre à son propre historique de dérive design que cette recherche n'a pas vérifiée | Faible pour projetx, à évaluer ailleurs |
| Règle d'encapsulation entre composants/hooks (Loi de Déméter — ne jamais manipuler à distance un détail d'implémentation d'un composant voisin ; l'exposer via une abstraction, ex. `forwardRef`/`useImperativeHandle`) | **genliv** (trouvée en revue humaine, `dossier-fiches` it8, 2026-08-16 — un panneau cherchait le bouton de retrait d'une fiche voisine par `querySelector('[aria-label^="..."]')`) | **chrono-sabine** (`raffinage-iteration/SKILL.md`, § Encapsulation, veto Tech Lead) et **projetx** (`dev/SKILL.md`, § Architecture Principles + What to Avoid, `KR-561` dans `code-knowledge.json`) — **FAIT le 2026-08-16**, propagé directement dans la même session (genliv), sans prompt de reprise différé | Fait |

---

## 4. Ce qui ne doit PAS converger

- **CI / Playwright / audit mensuel** — restent proportionnés à la taille et au risque de chaque
  projet. projetx les justifie par son backend Worker + sa synchro cloud ; rien n'indique que
  chrono-sabine ou genliv ont le même risque aujourd'hui. **Mais voir la mise à jour du 2026-08-13
  au §1** : cette exception est proportionnée à un état de risque actuel, pas garantie à vie — la
  synchro cloud + build Cloudflare à venir pour les deux frères est le déclencheur explicite (encodé
  dans le skill `sibling-convergence`) pour rouvrir cette ligne, pas pour la reconduire par défaut.
- **Portée du mutation testing** (quels fichiers precisement) — dépend du calcul métier propre à
  chaque projet, pas un sujet de convergence en soi (seule la *rigueur* — seuil réel, rationale — l'est).
- **Sémantique du versioning MINOR/PATCH** — genliv la lie à des jalons de roadmap, chrono-sabine à
  des jalons fixes, projetx à la distinction user-facing/refactor. Trois choix valides, non
  transposables sans repenser tout le modèle de version de chaque projet.
- **Toute fonctionnalité produit** — hors sujet par construction (cf. cadrage initial de ce panel).

---

## 5. Exécution — ce qui se passe où

**Dans cette session (projetx)** : les 10 items de `plan-v4.md` couvrent déjà tout ce qui relève de
projetx dans ce plan global (le socle §2 et les colonnes « projetx » du §3 y sont inclus). Rien de
plus à faire ici pour la partie projetx.

**Pour chrono-sabine** — prompt de reprise à coller dans une session ouverte sur ce dépôt :
> Lis `plan-global.md` de projetx (C:\dev\projetx, section 3, colonnes chrono-sabine) et applique : porter la
> détection couleur littérale de projetx dans `eslint.config.js` (garder ta sévérité `error`,
> améliorer juste la logique de masquage `var()`) ; adopter `open_questions` structuré (statut/
> propriétaire/condition de réouverture) en plus de ton `resolved_decisions` déjà existant ; ajouter
> partout la justification de `regression_test: null` si ce n'est pas déjà systématique.

**Pour genliv** — prompt de reprise à coller dans une session ouverte sur ce dépôt :
> Lis `plan-global.md` de projetx (C:\dev\projetx, section 3, colonnes genliv) et applique : remplacer le tableau
> `FEATURE_DIRS` codé en dur de ta règle cross-feature par une détection dérivée du chemin (voir
> `eslint-local-rules.js` de projetx) ; corriger BUG-027 (détection couleur littérale uniquement en
> tête de template literal) avec la logique de masquage `var()` de projetx ; adopter
> `resolved_decisions` (options rejetées + arbitrage motivé) en plus de ton `open_questions`
> structuré déjà existant ; ajouter la rationale d'inclusion/exclusion par fichier à ton
> `stryker.config.json` et gater le mutation testing à l'itération, pas juste en continu.

**Plus tard, différé — mais reconsidérer dès la synchro Cloudflare des frères (voir §1 mise à jour
2026-08-13)** : porter le design du gate A1 (marqueur haché + échappatoire) vers chrono-sabine et
genliv. Condition initiale inchangée pour l'instant : une fois A1 gradué en mode bloquant côté
projetx et éprouvé sur la durée (critère déjà écrit dans `dev` SKILL.md : 7 jours, 20 commits, zéro
faux blocage). Mais une fois que les push de chrono-sabine/genliv déclenchent des builds Cloudflare
distants, le coût d'un push cassé change de nature (build distant gâché, pas juste un poste local) —
à ce moment, réévaluer si l'attente de la graduation complète d'A1 reste justifiée, ou si une
version plus simple du gate (sans le cache haché, juste le blocage tsc+jest que les deux frères ont
déjà) mérite d'être avancée indépendamment de la timeline projetx.

---

## 6. Gouvernance — éviter que ça re-diverge silencieusement

Pas de nouvel **outillage** cross-repo automatisé (ça créerait une 4ᵉ chose à maintenir, contraire
au principe de gouvernance de coût déjà en place dans projetx — G1/G3/G5). Mais un **skill**
manuellement invoqué n'est pas de l'automatisation : c'est une procédure, pas un processus qui
tourne tout seul. `sibling-convergence` (2026-08-13, posé aux trois racines de dépôt — voir
`.claude/skills/sibling-convergence/SKILL.md` dans chacun) formalise cette section : traiter la
comparaison comme un point de contrôle **périodique et déclenché**, pas un mécanisme permanent —
à l'occasion d'un futur Feature Health Audit mensuel, ou dès qu'un déclencheur nommé dans le skill
survient (le plus concret à ce jour : la synchro Cloudflare des deux frères, §1). Le coût d'un audit
complet comme celui du 12 août (4 agents, ~400k tokens mesurés) doit rester rare et délibéré, pas
régulier — le skill documente ce coût explicitement pour que la décision de le relancer reste
consciente à chaque fois.
