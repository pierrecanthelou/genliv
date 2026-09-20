# Tour 1 — PM Produit — `moteur-dossier` it1

**RISQUE** — it1 fait de `jouable` une **porte** pour la première fois. Tout contrôle bloquant en faux positif devient un refus d'ouverture que l'auteur ne peut pas diagnostiquer (saut au champ fautif hors périmètre). L'amendement de `tourzero.ts` tombe exactement dans ce rayon.

**OBJECTION 1 (point 7b)** — « `tourzero.ts` amendé » est inexécutable tel qu'écrit. Le cadrage **a tranché** (i) et (ii) (arbitrages 10 et 11) ; it2/it3 les *exercent* côté moteur, elles ne les décident pas. L'amendement d'it1 est donc borné à **deux cellules**, à écrire noir sur blanc : `lieu_visite` en forme à trois bras (départ → `'vrai'`, autre lieu → `indecidable`, départ non posé → `indecidable`), et en **une passe sans point fixe** le repli de `indice_connu` en `indecidable` quand un jalon certain-vrai au tour zéro l'écrit. `jalon_atteint` et `evenement_consomme` restent `indecidable`. Rien d'autre.

**OBJECTION 2** — le « refus nommé sur `MARQUEUR_A_ECRIRE` » double une règle livrée : `controles.ts` classe déjà ce marqueur `niveau: 'bloquant'`, donc `jouable` est faux et la porte a déjà refusé. Deux règles pour un refus = seconde source de vérité, valeur auteur nulle.

**PROPOSITION** — le refus du moteur **dérive** de `controlerDossier().jouable` et nomme le code du premier contrôle bloquant ; KR-244 garde son test d'opposition. En échange de ce retrait, **un** critère ajouté : `__fixtures__/dossier-minimal.json` ouvre une partie (témoin du faux positif de l'objection 1).

**Point 7(a) — dérogation nommée, pas découpe.** Un CTA qui n'ouvre rien et un shell inatteignable valent **zéro** tous les deux : la découpe produirait deux itérations sans phrase de démo, ce que je refuserais moi-même. Le rendez-vous est un contrat `brain/` (variante de `Route`), zéro import croisé. Dérogation **bornée à it1**, ≤ 4 lots, côté `play-mode` limité à : shell + porte re-vérifiée + `OutcomeBlock` verbatim + journal vide. it2–it4 : une feature chacune.

**Phrase de démo** — « À la fin, l'auteur lit le texte d'ouverture de son dossier dans une partie lancée depuis l'éditeur. » Elle **tient** : pas de « et », elle traverse écran → `brain/` → persistance. C'est la plus fine : retirer le CTA supprime le chemin auteur, retirer le verbatim supprime ce qu'il y a à lire.

**HORS PÉRIMÈTRE d'it1 (livrable PM)** — évaluateur bivalent, `appliquerDelta`, `faits.ts`, `evaluate.ts` ; console et verbe `aller` ; `JournalRow` et toute ligne de journal ; déplacement par `lieux[].acces` ; jalons et leur projection ; démolition des consommateurs d'arbre ; saut au champ fautif ; **tout bouton « reprendre » une session persistée** (la session s'écrit — arbitrage 14 — mais rien ne la relit) ; `quetes[].etapes` ; forme interne de `memoire` ; variantes d'`attente` ; `depart.inventaire_initial` ; toute cellule de `tourzero.ts` autre que les deux nommées ; scission de `controles.ts`.

**VERDICT** — **recevable sous réserve** (objections 1 et 2 à trancher au tour 3 ; dérogation 7(a) à inscrire au plan, pas contrebandée).

---
Mesure load-bearing de l'objection 2, dans `src/brain/dossier/controles.ts` :
```ts
texte_ouverture_joueur: {
	niveau: 'bloquant',
	path: 'charpente.depart.texte_ouverture_joueur',
	message: `Ce texte porte encore le marqueur ${MARQUEUR_A_ECRIRE} : …`,
```
