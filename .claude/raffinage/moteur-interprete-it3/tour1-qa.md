## Tour 1 de raffinage — Feature `moteur-interprete`, itération 3

**RISQUE** — AC#7 est libellée comme entrée en it3 sans clarifier explicitement qu'elle porte sur `faits_etablis[]`, un champ sans lecteur en it2 (KR-268 l'a reporté au tour 2 d'it2). La rédaction « Étant donné `faits_etablis[]` rendu par R3 » semble s'appliquer à it2 où R3 rend `{recit, suggestions}` seulement. Un lot it3 qui lirait AC#7 brute penserait à tort que le refus du fait sans rang est déjà couvert. Risque d'absence de test en it3.

AC#8 souffre de trois ambiguïtés mécaniques : (1) fenêtre « entre 5 et 14 pas » — pas de spécification pour une session de 1–4 pas (début de partie jamais spécifié), (2) résumé qui « absorbe les 10 plus anciens exactement quand la fenêtre atteint 15 » — pas de détail sur compaction unique ou réitérée, (3) « sans aucun trou » — pas de précision sur le critère (tour moteur seul vs tous les rôles). Deux implémentations fautives différentes peuvent passer le même test selon l'interprétation choisie.

**OBJECTION** — AC#8 énumère une formule (`FENETRE_MAX` dérivée) mais omet le cas séparateur immédiat : fenêtre de 14 vs 15 pas teste le max, mais c'est un arrondi. Le mutant « Math.max(fenetre.length, 5) » ne sera pas tué si le test ne force pas une session de 4 pas. De plus, AC#7 demande un « mutant écrit et vérifié ROUGE » ; AC#8 énumère zéro mutant obligatoire. Asymétrie de rigueur sur deux critères de même complexité.

**PROPOSITION** — Amender AC#7 et AC#8 pour it3 :

1. Récrire AC#7 : « Étant donné que `memoire` existe en it3 avec ses lecteurs, quand R3 rend un fait dans `faits_etablis[]` sans aucun rang d'ancrage valide (sur:[] ou rang hors table), alors la sortie est REFUSÉE au validateur. Le lot contrat de it3 écrit `validerMemoire` avec ce prédicat, et le mutant 'accepter tout fait' est vérifié ROUGE. »

2. Préciser AC#8 sur trois points : (a) fenêtre « entre 5 et 14 pas moteur intégrals sans trou » — passer 'pas moteur' comme critère explicite, (b) résumé « lors du premier pas qui dépasse 14, capture tours 1-10 en un résumé immuable jusqu'au tour 11 » — ou spécifier la compaction réitérée, (c) cas limite : « session de 4 pas = fenêtre de 4 (pas de forçage à 5), session de 14 pas = fenêtre de 14 (pas de résumé), session de 15 pas = fenêtre 14 (tours 2-15) + 1 résumé (tours 1-10). »

3. Ajouter mutants obligatoires à AC#8 écrits et vérifiés ROUGES : fenêtre non-glissante (fixe), résumé groupant 5 pas (au lieu de 10), trou dans la fenêtre (découpage qui saute un tour).

**VERDICT** — Recevable sous réserve. Les deux critères sont observables par jest (validation + état d'horloge). Mais AC#7 doit être clairement versionnée pour it3, et AC#8 doit éliminer ses trois ambiguïtés mécaniques + énumérer les mutants séparateurs. Sans ces amendements, aucun test ne peut être écrit avec la certitude qu'il tue les implémentations fautives plausibles.

---

## ANNEXE — Instrument de test et scénarios séparateurs

**AC#7 — Refus d'un fait sans rang d'ancrage (amendée)**

- **Test** : `validerMemoire.test.ts` (unitaire)
- **Scénario 1** : Fait avec `sur:[]`. Doit être REFUSÉ. Mutant 1 « accepter sur:[] » rougirait.
- **Scénario 2** : Fait avec `sur:['X99']` (rang inexistant). Doit être REFUSÉ. Mutant 2 « vérifier forme seulement » laisserait passer.
- **Mutant écrit ROUGE** : `const passeToutFait = (f: Fait[]) => f` (pas de validation).

**AC#8 — Fenêtre glissante 5-14 pas, résumé tous les 10 (amendée)**

- **Test** : `memoireGlissante.test.ts` sur `EtatSession.memoire` après N pas
- **Séparateur 1 — Fenêtre exactement 14** : 14 pas joués → `fenetre.length === 14`, `resumes.length === 0`. Mutant « fenêtre fixe » : passe ici, rougit sur 15 pas.
- **Séparateur 2 — Bascule résumé** : 15 pas → `fenetre.length === 14` (tours 2–15), `resumes.length === 1` (tours 1–10 en texte). Mutant « résumé de 5 pas » → 3 résumés (rougit).
- **Séparateur 3 — Pas trou** : 25 pas avec pas 12 portant deux entrées (moteur + jalon) ; fenêtre n'a aucun tour sauté. Mutant « index au lieu de tour » → trou (rougit).
- **Cas limite 4 — Début** : 4 pas → `fenetre.length === 4` (pas forçage à 5). Mutant « max(length, 5) » → fenetre.length=5 (rougit).
- **Mutants obligatoires écrits et ROUGES** : fenêtre non-glissante, résumé 5-pas, trou.

Pas de score mutation (hors `src/brain/{challenge,combat,xp,characteristics}.ts`), mais mutants écrits = prise de conscience de la complexité.

---

**Fichiers pertinents** :
- `C:\Users\pierr\Desktop\genliv\src\features\moteur-interprete\specification.json` (l. 16–29, AC source)
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\recit.test.ts` (patron de test)
- `C:\Users\pierr\Desktop\genliv\src\brain\copilote\schemaSortie.test.ts` (mutants et validateurs de référence, ~2500 l.)
