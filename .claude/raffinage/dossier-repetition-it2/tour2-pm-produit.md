# dossier-repetition it2 — PM — Tour 2

RÉPONSE À UX — objection 2 (badge « n combats gagnés »)
Refusée pour it2. La démo se lit déjà à l'écran : le parcours ne s'arrête plus sur un combat ouvert, il atteint une fin, une mort ou le pas affiché. Le compteur coûte un champ de rapport, un Badge, un pluriel : un 9e critère. Je le reporte au dépliable des pas d'it3, où le type grossit de toute façon. J'appuie le TL (type minimal). J'accepte l'usure de NIA (objection 2) : la boucle du TL appelle déjà `cloreCombat`, coût nul.

STATUT DE MES OBJECTIONS
1. Étalon → it4 : **retirée**. `resolved_decisions` le place en it2, et c'est moi qui le rouvrais. Une it4 « étalon seul » serait invisible à l'écran, donc pas une tranche verticale. Le TL montre 2 lots sans fichier commun, zéro lot `contrat`, et l'étalon remplace le héros seedé. Plafond de 8 critères : **maintenue** (annexe).
2. Motifs faux : **retirée**. Cinq motifs avec `pas_max`, `combat_ouvert` supprimé : TL, UX et moi alignés.
3. « Borné » sans chiffre : **retirée**. Constante nommée, exportée, témoin exact (TL). Mon 20 n'avait aucun fondement, et le doc ne plafonne aucune durée de combat. Je prends 30, paramètre de simulation hors REGLES-DU-JEU.md (NIA).
4. SACRIFIABLE : **maintenue**, resserrée à L1 (étalon). L2 (boucle) est requise par it3, sinon « NON ATTEINT EN 20 PAS » ment.

VERDICT TOUR 2 — **recevable sous réserve** : la spec est réécrite aux 8 critères de l'annexe avant tout lot. `plan.n` reste 3 (l'it4 disparaît).

## ANNEXE — périmètre it2 (hors quota)

Phrase de démo : « À la fin de cette itération, l'auteur peut voir son joueur synthétique, un héros étalon, affronter les combats de son aventure au lieu de s'y arrêter. » (aucun « et »)

Dedans, 8 critères :
1. Section « Héros étalon » dans REGLES-DU-JEU.md, puis table dorée (L1). Ordre doc → golden → code. La revue cite la section.
2. `repeter` joue l'étalon. `creerHerosSynthetique` est supprimé.
3. Combat : posture normale jusqu'à l'issue. Un combat = un seul pas (KR-295). Toute issue autre que la mort du héros appelle `cloreCombat` et le parcours continue. `rejouerCombat` refusé = throw.
4. `mort` : arrêt avec `monstre_ref`, sans `cloreCombat`.
5. `combat_sans_issue` : `ROUNDS_MAX` = 30 rounds en posture normale sans issue au bilan. Témoin exact, qui tue les mutants ±1. Cette définition lève l'objection 2 de QA.
6. Union `fin | impasse | pas_max | mort | combat_sans_issue`. `combat_ouvert` est supprimé et ses tests d'it1 sont réécrits.
7. Panneau : un rendu par motif, nom du monstre du bestiaire (jamais l'identifiant), `switch` exhaustif.
8. Un test non mocké (moteur réel) pour `mort` et pour la survie. Déterminisme conservé (KR-304).

Hors périmètre :
- compteur `combats_gagnes` et trace des combats (→ dépliable des pas d'it3)
- fuite et autres postures
- butin et repos
- affichage des stats de l'étalon à l'écran, et étalon paramétrable par l'auteur
- lieux et PNJ non atteints (it3)
- restructuration des critères par itération (proposition 1 de QA : édition de spec seule, hors lots)

## Décisions prises en autonomie faute de spécification

- Étalon en it2 ou it4 → je reviens à it2, par `resolved_decisions` → si c'est l'inverse : une it4 invisible, non démontrable, et le déclencheur de la dette « Difficulté non calibrée » part une itération plus tard.
- `ROUNDS_MAX` : 20, 30 ou 50 → 30 (valeur du TL ; je n'ai aucun argument produit pour 20 ni pour 50) → trop bas : faux `combat_sans_issue` sur un combat long légitime. Trop haut : rejeu en O(n²), négligeable.
- Issue du combat autre que la mort (victoire, fuite du monstre) → `cloreCombat` puis le parcours continue → si la fuite du monstre devait être un arrêt : un 6e motif et une branche de panneau de plus.
- Profil de l'étalon (5 partout selon NIA) → je ne tranche pas la valeur, j'exige qu'elle soit écrite dans le doc avant le code (KR-130) → si c'est 6 partout : les combats Tier 1 deviennent triviaux et le rapport détecte mal les aventures sous-dimensionnées. Si l'étalon est trop faible : l'auteur lit « combat injuste » à tort.
- Badge `combats_gagnes` → refusé en it2, reporté à it3 → si accepté en it2 : un 9e critère, et les `toEqual` stricts de `repeter.test.ts` (l.113, 144, 180…) à réécrire dès maintenant.
- SACRIFIABLE limité à L1 → si c'est toute it2 : it3 hérite de parcours coupés au premier combat, et sa liste « non atteints » est faussée.
