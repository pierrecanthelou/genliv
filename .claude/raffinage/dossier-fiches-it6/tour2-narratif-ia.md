## Note — NARRATIF & IA · `dossier-fiches` it6/8 · tour 2 (contre-lecture)

**RISQUE** — La fusion du lot 0 dans le « temps 0 » du lot unique m'est indifférente sur la forme : je n'ai jamais demandé l'isolement ni une relecture séparée, seulement l'ordre (les commentaires écrits avant la première ligne de `BlocSavoirs.tsx`, sinon l'écran est conçu contre un contrat faux). Mais telle qu'écrite au tour 1, la fusion ampute ma correction : l'annexe C du tech-lead (tour 1) range `destinations.ts` dans « hors lot, à ne pas ouvrir » (l. 67), or deux de mes trois sites y vivent (l. 209-211 et 224-225). Temps 0 réduit à `types.ts` + `index.ts` ⇒ le commentaire qui promet une `vérité` inexistante et celui qui promet d'injecter `objets[].nom` (`auteur`, KR-195) restent en place, et n° 12 les lira comme un contrat.

**OBJECTION** — Au tech-lead, nommément : le fond n'est pas intact au tour 1, il perd deux tiers. Le remède est nul en coût — `destinations.ts` en « ouvert, commentaires seuls, 0 ligne de table ». À UX : le hint amendé n'est pas sur disque au tour 1 ; le texte du tour 1 (« injecté au modèle uniquement quand une porte s'ouvre ») nomme la condition d'injection et invite donc précisément à l'écrire. Non couvert à ce stade.

**PROPOSITION** — P1′ `destinations.ts` dans le temps 0, 3 sites cités fichier:ligne en revue. P2′ la garde E.6 devient critère d'acceptation. P3′ hint exact en annexe.

**VERDICT** — recevable sous réserve (P1′ seul bloquant). `CONFIANCE_INITIALE_PORTE = 1` : approuvé — une porte semée à −3 aurait menti à l'auteur.

---

## Annexe (hors quota)

### 1 · Statut de chacun de mes points du tour 1

| Point | Statut |
|---|---|
| RISQUE (`indices[].verite` inexistant) | maintenu, non bloquant — se règle par l'entrée `open_questions` (propriétaire n° 6) + la correction de cadrage roadmap (Décision A l. 156 vs § 2 l. 170). |
| OBJECTION (`indice_id: 'ia'` adossé à un commentaire faux) | maintenue, absorbée par P1′. Aucune ligne de `destinations.ts` ne change de valeur : `'ia'` reste `'ia'`, seul le motif est rectifié. |
| P1 lot 0 séparé | retirée sur la forme (motif : le lot unique est démontré, un lot de 12 lignes ne passe pas la porte qualité seul — argument recevable). Durcie sur le fond : `destinations.ts` doit sortir de la liste « hors lot ». Sans ça, veto. **NOTE POST-TOUR-2** : le tour 2 du tech-lead a déjà déplacé `destinations.ts` dans le temps 0 (annexe D, ligne 2) — P1′ est donc satisfaite, sans que les deux notes ne se soient vues (rondes parallèles). Le veto tombe. |
| P2 critère d'affichage `revelation-sans-porte` | maintenue, reformulée. Vérifié moi-même : `useSocleEcriturePersonnages.ts` l. 84-85 filtre `validateDossier(dossier).warnings` sur le préfixe `monde.personnages[${index}].`, et `validate.ts` l. 632 pousse l'avertissement en `…savoirs[j].revele_si`. Ça capte, sans wiring. Mais un affichage qui marche par coïncidence de préfixe meurt en silence au premier remaniement du filtre : la garde E.6 (allume / éteint / rallume, même test) doit être critère d'acceptation, formulé sur le texte visible du bandeau, pas sur le tableau retourné par le hook. |
| P3 (aucune copie d'écran n'énonce ET/OU ; jamais `revele_si: {}`) | partiellement retirée : `LEGENDE_PORTES` d'UX ne présume aucune composition, et la garde E.1 du tech-lead couvre `revele_si: {}`. Le volet B.3 (hint) reste maintenu — voir ci-dessous. |

### 2 · Texte exact demandé pour `revele_comment` (P3′)

Hint à remplacer par : `"La manière, jamais la condition : décrivez comment il lâche l'information, pas ce qui la déclenche (les portes s'en chargent)."`

Motif : le hint du tour 1 énonce le prédicat d'injection, qui est une information de moteur ; l'auteur qui le lit écrit « si vous réussissez à la mettre en confiance » ou « contre la fiole », et la règle repart en clair dans le contexte du rôle acteur — dupliquée code/prompt, périmée au premier changement de seuil.

**NOTE POST-TOUR-2** : le hint amendé par UX au tour 2 (« La manière dont il le révèle — jamais la condition : n'écrivez pas « si vous la mettez en confiance » ou « contre la fiole »… ») couvre ce point mot pour mot — converge avec ma propre reformulation, sans que les deux notes ne se soient vues. P3′ est satisfaite.

### 3 · Appui à l'OBJECTION 1 du tech-lead (état vide)

De mon poste : masquer tout le corps du bloc quand `monde.indices` est vide empêche l'auteur de lire ce que son personnage sait sur un dossier importé. Un savoir invisible est un savoir qui dérive. La garde est `savoirs.length === 0`, pas `indices.length === 0` — et sur un savoir orphelin, le `Select` rend l'option non résolue telle quelle (KR-021/KR-194), jamais la première option.

### 4 · Contrat de sortie IA — inchangé depuis le tour 1

R4 · acteur (n° 12) : entrée = canon + fiche + savoirs recomposés en `{ rang, contenu, certitude }` (portes déjà constatées ouvertes par le moteur, jamais injectées) ; sortie = `{ replique, indices_reveles: number[] (rangs, ensemble fermé 1..n), delta_confiance: -1|0|1 }` ; échec = 1 rejeu, puis repli déterministe. Ne va pas dans le plan d'it6 : n° 12 en est propriétaire.
