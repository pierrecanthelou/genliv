## Note — NARRATIF & IA · `dossier-fiches` it6/8 · tour 1

**RISQUE** — it6 capture la *condition* d'une révélation et sa *manière*, jamais son **contenu**. `monde.indices` est `Entite[]` = `{id, nom?}` : il n'existe aucun champ `verite`, il n'est qu'au plan de cible (l. 221 et 550, lot I4 → n° 6). L'auteur quittera le bloc convaincu d'avoir écrit ce que son PNJ sait ; en n° 12 le modèle comblera le trou et inventera le savoir.

**OBJECTION** — `indice_id: 'ia'` repose sur un commentaire (`destinations.ts` l. 209-211) dont le 3ᵉ membre n'existe pas. Vérifié : `frapperIdentifiant` frappe `indice.<randomToken>` — opaque, zéro contenu narratif ; et les identifiants manuscrits de la fixture (`indice.lettre-de-la-vigie`) slugifient le `nom`, destination `auteur` (KR-195) — injecter la clé fait passer le nom par-dessus le mur, et l'en-tête de la table déclare lui-même ne rien prouver là-dessus. Partout ailleurs un `.id` est `moteur` (règle écrite trois fois dans ce fichier). Deux lignes plus bas, `contrepartie.objet_id` promet d'injecter le `nom` de l'objet, `auteur` lui aussi : seconde fuite déclarée dans le même bloc de dix lignes. Enfin `revele_comment` est le 3ᵉ champ à injection conditionnelle et le seul sans prédicat écrit : « quand la porte est ouverte » ne dit rien d'un savoir sans porte — l'état que l'écran produira par défaut — ni de deux portes posées ; la composition ET/OU n'existe dans aucun fichier, et quatre portes empilées disent « ET » sans décision.

**PROPOSITION** — **P1** : lot 0 « contrat, commentaires seuls », ≤ 20 lignes, 0 chemin terminal, 0 ligne de table, 0 fixture, 0 test (veto tech-lead respecté) — corrige les deux commentaires vers l'open_question n° 10, nomme n° 6 propriétaire de `verite`, écrit le prédicat de `revele_comment` aux deux sites (précédent `secret`, it5). **P2** : critère neuf — le bloc affiche `revelation-sans-porte`, produit depuis n° 1 et affiché par personne ; lecture dérivée comme 7a, preuve contrastée (KR-199). **P3** : aucune copie d'écran n'énonce ET/OU ; `revele_si: {}` jamais écrit — geste explicite, sinon absence de clé (it1/it3).

**VERDICT** — recevable sous réserve (P1 + P2).

---

## Annexe (hors quota)

### A · Contrat de sortie IA concerné — R4 · acteur (n° 12)

Ne va pas dans le plan d'it6, même motif qu'it5 : l'écrire dans un plan de la n° 4 créerait un second site pour un contrat que n° 12 possède. Reproduit ici comme note de comité, pour que P1 sache vers quoi pointer.

- **Entrée injectée** : canon (toujours) + fiche du PNJ (`fonction`, `apparence`, `description_joueur`, `but.libelle/pourquoi`, `plan_actions[].action`, `relations[]` du porteur filtrées par `secret`) + savoirs recomposés par le code sous la forme `{ rang: 1..n, contenu, certitude }` — `contenu` venant de `indices[].verite` (n° 6, inexistant aujourd'hui), jamais de `indice_id`, jamais du `nom`. Portes absentes du contexte : le moteur n'injecte un savoir que si ses portes sont déjà ouvertes, sinon il l'omet ; `revele_comment` accompagne le savoir injecté, jamais avant.
- **Schéma de sortie** : `{ replique: string ≤ N mots, indices_reveles: number[] (rangs de la liste injectée, ensemble fermé 1..n), delta_confiance: -1 | 0 | 1 }`. `indices_reveles` en RANGS, pas en identifiants : une chaîne libre est une référence par nom libre déguisée — le modèle peut rendre `indice.sceau-brise` qu'on ne lui a jamais donné, et un rang hors bornes se rejette sans ambiguïté. `delta_confiance` est un énuméré fermé proposé, jamais appliqué par le modèle : le code borne à `CONFIANCE_MIN`/`CONFIANCE_MAX` et écrit la session.
- **Échec de validation** : 1 rejeu avec le schéma rappelé ; second échec → repli déterministe = la réplique est écartée, `indices_reveles = []`, `delta_confiance = 0`, le moteur émet une phrase de repli et ne révèle rien. Un rang hors bornes invalide la sortie entière, il n'est pas « ignoré ».

### B · Ce que le lot 0 doit écrire, pour ne pas rouvrir le débat

1. `src/brain/dossier/destinations.ts` l. 209-211 — remplacer « injecte le savoir sous la forme `{indice_id, certitude, vérité}` » par : « `vérité` N'EXISTE PAS dans le schéma 1 — `monde.indices` est `Entite[]`. Le champ est au plan de cible (l. 221, 550), propriété de la n° 6 (section 06 Indices, lot I4). Tant qu'il n'existe pas, un savoir injecté ne porte AUCUN contenu : le rôle acteur ne peut que l'inventer. `indice_id` reste `ia` par ce protocole-là et par aucun autre ; à la n° 12, si l'assembleur rend le savoir par un RANG de la liste injectée, cette ligne redevient `moteur` comme tous les autres `.id`. »
2. Même fichier, l. 224-225 — le commentaire de `contrepartie.objet_id` promet le `nom` de l'objet ; ajouter : « `monde.objets[].nom` est `auteur` (KR-195). Le prix dit au joueur passe donc par l'appellation re-projetée par le CODE de l'open_question n° 10, jamais par une lecture directe de `nom`. »
3. `src/brain/dossier/types.ts`, JSDoc `Savoir.revele_comment` et ligne 216-217 de `destinations.ts`, mot pour mot aux deux sites (précédent `Relation.secret`) : « `revele_comment` n'entre dans le contexte du rôle acteur QUE dans le même bloc que le savoir dont il dépend, c'est-à-dire seulement quand le moteur a constaté les portes posées comme ouvertes. Un savoir sans aucune porte n'est jamais injecté avec sa didascalie : `revelation-sans-porte` est l'avertissement qui le dit à l'auteur. La COMPOSITION de deux portes posées (conjonction ou disjonction) n'est arbitrée nulle part à ce jour — n° 12 propriétaire ; aucune copie d'écran ni aucun prompt ne doit la présumer. »
4. `specification.json` → `open_questions` : une entrée, propriétaire n° 6, « `indices[].verite` / formulation joueur — sans elle, un savoir injecté n'a pas de contenu » ; et une correction de cadrage à porter au roadmap : la Décision A (l. 156) range `indices` en n° 5, le § 2 (l. 170) et le plan (I4) les rangent en n° 6. Un dev-contrat qui lit la première ira coder au mauvais endroit.

### C · Fuites recensées (moteur/auteur → ia, et l'inverse)

| # | Site | Sens | Nature |
|---|---|---|---|
| 1 | `savoirs[].indice_id` (`ia`) | auteur → ia | Deux populations d'identifiants : slug manuscrit = le `nom` (auteur) passe le mur ; token frappé = bruit facturé en jetons. Aucun test ne peut le voir (table déclarative). |
| 2 | `savoirs[].revele_si.contrepartie.objet_id` (`moteur`) | auteur → ia | Le commentaire promet d'injecter `objets[].nom`, `auteur`. Fuite d'intention, à l'assemblage. |
| 3 | `revele_comment` (`ia`), voisin immédiat des 4 portes `moteur` | moteur → ia | La fuite propre à it6, et la seule que l'écran peut prévenir : l'auteur écrira spontanément « si vous réussissez à la mettre en confiance », « contre la fiole ». La règle repart alors en clair dans le contexte, dupliquée code/prompt et périmée au premier changement. Parade : placeholder et aide de saisie qui disent la manière, jamais la condition — « Elle hésite, puis chuchote » et non « elle parle si… ». Zéro coût de contrat. |
| 4 | `revele_si.jet.carac/tc`, `confiance_min` (`moteur`) | — | Sains. Corollaire de l'open_question « libellés dérivés » : aucun seuil, aucune paraphrase (« il faut être très en confiance ») avant que n° 10 n'ait livré le libellé et sa ligne d'audience. |
| 5 | `certitude` (`ia`) | — | Sain et nécessaire : sans lui, une rumeur est énoncée comme un fait. |

**Piège de rendu à ne pas manquer (KR-021/KR-194)** : un `indice_id` orphelin (indice retiré en n° 6) est exposé par `validateDossier`, jamais filtré. Le `Select` du bloc ne doit donc pas retomber sur sa première option — il réécrirait en silence le savoir vers un autre indice au prochain commit, c'est-à-dire changerait ce qu'un personnage sait sans que personne l'ait demandé. Il rend la valeur non résolue telle quelle, avec son anomalie.
