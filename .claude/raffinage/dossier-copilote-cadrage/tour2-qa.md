# Tour 2 — QA (contre-lecture)

> ⚠ **Note de l'orchestrateur** : cette note a été écrite **en parallèle** de la note tour 2 de `narratif-ia`. Sa section C2 raisonne donc sur la position **tour 1** du narratif (« `camp`, `objectifs[].nom`, `reussi_si_texte` sont nécessaires »), que le narratif a **retirée au tour 2**. KR-240 et le REJETÉ n° 6 sont **sans objet** — enregistré comme tel au tour 3, pas supprimé en silence. Le reste de la note est indépendant de cette prémisse et tient intégralement.

## C2 — vu de l'instrument
**MESURÉ** (lecture) : `'canon.objectifs[].camp'` → `moteur` (l. 131), `'…nom'` → `auteur` (l. 127), `'…reussi_si_texte'` → `auteur` (l. 140).
**Les deux positions ne sont pas deux gardes de rigueur différente sur le même contrat — elles sont incompatibles.** *(Prémisse périmée au tour 2 : le narratif a retiré le besoin.)*
**Laquelle est discriminante ? Ni l'une ni l'autre telle qu'écrite** :
- celle du Tech Lead est discriminante mais **rougirait sur du code conforme au besoin déclaré** — « une garde qui rougit sur du sain n'est pas un instrument utilisable, elle sera désactivée au premier conflit » (même mécanisme que l'avertissement de `WORKFLOW.md` sur `exhaustive-deps`) ;
- celle du Narratif, telle que décrite (« le test **rend** l'audience »), est **un test qui affiche, pas un test qui échoue. Un test qui rend sans assertion ne rougit sur rien — c'est un journal, pas une garde.**

**Le seuil de 12 caractères — pouvoir séparateur.** L'implémentation fautive à attraper, écrite nommément : `assemblerContexte` copie par erreur `charpente.depart.texte_ouverture_joueur` (`moteur`, prose longue). **Serait-elle attrapée ? Oui, plausiblement.**
**Mais le faux positif n'est écrit nulle part** : un `lieu.nom` (`auteur`) et l'`apparence` d'un personnage (`ia`, légitime) mentionnent le même nom de lieu ≥ 12 caractères — *parce que c'est normal qu'un personnage décrive où il vit*. Si le test compare par **sous-chaîne**, la collision fait rougir un contexte **sain** ; s'il compare par **égalité stricte**, il perd le pouvoir de détecter une fuite partielle. **Le comité n'a pas choisi entre ces deux sémantiques, et c'est précisément ce choix qui détermine si le test a un pouvoir séparateur.** Classe BUG-084/BUG-087 tant qu'il n'a pas été confronté aux **deux** cas.

## C3 — **MESURÉ par exécution**
```
FORME_IDENTIFIANT.test(JSON.stringify({personnages:[…]}))  → false
```
`FORME_IDENTIFIANT` est **ancrée** `^…$` (`identifiers.ts` l. 75 — c'est son usage correct : valider un identifiant **isolé**). Testée contre une **sortie sérialisée entière**, ce que le REJETÉ n° 0 décrit littéralement, **elle ne peut structurellement jamais matcher. Le balayage anti-identifiant, écrit comme décrit, est un instrument INERTE : toujours vert, quoi que le modèle produise.**
Version non ancrée :
```
'Il dit: « Enfin.tout est pret. » Elle range son objet.favori.'.match(SCAN)
  → [ 'fin.tout', 'objet.favori' ]
```
`fin`, `lieu`, `objet`, `indice`, `climat`, `jalon`, `objectif` sont des **mots français courants** ; un point sans espace produit un faux positif sur de la prose saine.
**Verdict : ni l'ancrée (inerte) ni une non ancrée non spécifiée (faux positifs mesurés) ne sont un instrument recevable.** `ChampPropose.entiteId`, lui, **est testable correctement** par `estIdentifiantBienForme` sur une valeur isolée — l'usage pour lequel la regex a été écrite.

## C-mesure
Les deux plafonds sont **NON MESURABLES avant que le code de l'it1 existe**. Mesuré à titre **strictement illustratif, pas substitutif** : `dossier-minimal.json` = 8 955 caractères bruts, `dossier-reference.json` = 15 732. **KR-241 : cette mesure brute ne doit JAMAIS remplacer la vraie** (objet assemblé, filtré, plafonné) — ce serait « on a mesuré quelque chose, on a mesuré la mauvaise chose ».
Deux doctrines d'arrondi différentes : **pas un problème** — deux grandeurs de nature différente (corps HTTP en octets, incluant l'enveloppe et l'invite / contexte de données seul en caractères). **Mais mesurées dans le MÊME lot**, puisqu'elles bornent le même appel : une revue doit pouvoir voir si l'une contredit l'autre.

## C-instrument — worker : **VÉRIFIÉ, exécuté deux fois**
```
npx jest src/__probe_worker_env__.test.ts          → PASS 2/2
npx jest --testMatch "<rootDir>/worker/**/*.test.ts" → PASS 1/1
```
`@jest-environment node` expose `Request`/`Response`/`fetch` nativement (Node 24.15.0, jest 29.7.0) ; le `testMatch` étendu découvre bien un fichier posé dans `worker/`. **La proposition du Tech Lead fonctionne telle que décrite.** Aucune dépendance supplémentaire. Probes supprimés, `git status` vérifié propre.

## C-critères — ajoutés
« Six curseurs ou aucun » et le filtre `MARQUEUR_A_ECRIRE` étaient **absents** de mes AC : ajoutés en AC11 / AC12a / AC12b, un critère par propriété.

## C7 — je penche pour **(a)**
La compaction est une **édition d'entrées existantes sans rapport avec la feature**. La fondre dans le lot `1-A` met dans le **même diff** deux objets de revue disjoints, et « un reviewer qui doit juger les deux en même temps est plus susceptible de laisser passer une compaction bâclée » — exactement le risque que la discipline existe pour éviter. **Un reviewer qui regarde 15 lignes de `code-knowledge.json` seules peut confronter chaque ligne réduite à la règle ESLint qu'elle cite ; il ne peut pas le faire noyé dans un lot qui touche `worker/ia.ts`, `CopiloteService.ts`, `DossierEditorScreen.tsx`.** Si (b) est retenu : **diff cité nommément et séparément** dans le résumé de la PR (KR-242).

## Réponse nommée à l'UX
Échap → focus au « Lancer » est **testable tel quel** avec `user-event`, aucun instrument neuf. Ajouté en **AC4bis**.

## Statut de mes positions du tour 1
- **RISQUE** (le `fetch` mocké jamais éprouvé) — **MAINTENU et opérationnalisé** en AC13.
- **OBJECTION** (§ 2.8 jeu vs rédaction) — **RETIRÉE** : résolue de façon convergente par Tech Lead § 6.4 et Narratif Q4.
- **PROPOSITION** — **MAINTENUE sur le fond, terminologie retirée** : mon terme `degrade` est remplacé par le contrat plus précis du Narratif (`{ok:false, motif}` fermé) — « c'est strictement mieux, je l'adopte ».
- **VERDICT : recevable sous réserve**, 4 réserves : (1) C2 résolu avant que « Éclater » entre en raffinage ; (2) les canaris d'AC15/AC16 sont des **livrables**, pas une option ; (3) compaction en tranche séparée recommandée ; (4) les deux plafonds mesurés **dans le même lot**.

## Critères consolidés
AC1 conforme ⇒ 1 appel · AC2 rejeu **exactement** une fois · AC3 deux échecs ⇒ refus terminal, rien de partiel · AC4 message en région annoncée, distinct de « aucune proposition demandée » · **AC4bis** Échap annule et rend le focus · AC5 passe par `DossierService.update`, ordre persist→emit · AC6 refus `validateDossier` = **nominal** · AC7 `id` frappé par le code, `entiteId` testé **isolément** · **AC8 un test par champ interdit NOMMÉ** (`stats`, `jet.{carac,tc}`, `confiance_min`, `intensite`, `secret`, `duree`, `delai`, tout `…_expr`) · AC9 worker injoignable, pas de repli local · AC10 désignation par RANG, rang hors intervalle ⇒ refus · **AC11** six curseurs ou aucun, jamais complété par `CURSEURS_INITIAUX` · **AC12a** champ au marqueur absent de l'objet assemblé · **AC12b** retrait vidant un requis ⇒ `contexte-insuffisant` nommant le champ, **aucun `fetch` émis** · **AC13** chaque valeur du `MotifEchec` déclenchée par un test nommé · **AC14** garde de complétude : tout chemin non-`ia` porte une justification non vide sous assertion · **AC15** scanner anti-identifiant DÉDIÉ + **deux canaris** (fuite rougit / prose bénigne ne rougit pas) · **AC16** balayage à seuil + **deux canaris** (fuite plantée / collision fortuite).

## KR consolidés
KR-229 forme ≠ prose · KR-230 deux propriétés, deux tests · KR-231 refus `validateDossier` nominal · KR-232 le modèle ne frappe jamais un identifiant · KR-233 § 2.8 jeu ≠ rédaction · KR-234 allow-list étendue · KR-235 worker sans test, **mécanique vérifiée** · KR-236 non-régression `update` · **KR-237** deux portes de refus distinctes (`validerProposition` / `validateDossier`), un témoin pour l'une ne couvre pas l'autre · **KR-238** `FORME_IDENTIFIANT` est ancrée, tout balayage exige un scanner dédié dont le faux positif sur mots français courants est mesuré avant d'être fait critère · **KR-239** le seuil de 12 n'a pas de sémantique choisie ni de pouvoir séparateur mesuré · **KR-240** *(sans objet au tour 2)* · **KR-241** la taille brute d'une fixture n'est pas la borne de contexte · **KR-242** compaction fondue dans un lot de code ⇒ citée séparément en revue.

## REJETÉS
1. « Cohérente avec le canon » comme critère · 2. Score de mutation · 3. Table dorée (`curseurs.ts` hors doctrine KR-193 ; la feature **lit** `CURSEUR_VALUES`, ne l'étend jamais) · 4. Critère glisser/zoom (sans objet ; clavier exigible via `user-event`) · 5. Routeur multi-modèle comme critère fonctionnel · **6. NOUVEAU** — l'assertion `destination === 'ia'` **telle qu'écrite** *(sans objet au tour 2)* · **7. NOUVEAU** — le REJETÉ n° 0 **tel que littéralement décrit** : mesuré **inerte** · **8. NOUVEAU** — le seuil de 12 **sans canaris** · **9. NOUVEAU** — la taille brute d'une fixture comme mesure de la borne.
