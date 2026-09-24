# Mesures de l'orchestrateur, entre le tour 1 et le tour 2

Ces relevés **font foi** sur les notes du tour 1. Trois itérations de suite, ce geste a changé la forme de l'itération avant le tour 2.

## M-1 — **KR-238 est FAUX tel qu'il est écrit.** Le narratif a raison, mesuré.

Les **trois** `condition_expr` de `fins[]` des deux fixtures, relevées :

| Fixture *(départ)* | Fin | `condition_expr` |
|---|---|---|
| `dossier-minimal` *(`lieu.val-cendre`)* | `fin.sceau-referme` | `et[ possede_objet(objet.clef-de-basalte), non(lieu_courant_est(lieu.val-cendre)) ]` |
| `dossier-reference` *(`lieu.foyer-du-guet`)* | `fin.vigie-sauvee` | `et[ possede_objet(objet.sceau-de-cendre), jalon_atteint(jalon.second-guet) ]` |
| idem | `fin.vigie-abandonnee` | `et[ evenement_consomme(evenement.embuscade-a-la-tour), non(lieu_visite(lieu.vigie-du-nord)) ]` |

**Les trois sont des `et` dont le PREMIER conjoint est faux par le réel** (inventaire vide, jalon non atteint, événement non consommé à l'ouverture). Donc sous le mutant `default: return false`, même si un `non(<nœud inconnu>)` rendait `true`, **l'`et` reste faux et AUCUNE fin ne se déclenche au tour 1** — le mutant survit **VERT**.

**Ce qui est faux est l'ILLUSTRATION, pas la CONCLUSION.** KR-238 dit vrai sur le fond — la direction d'erreur ne survit pas à `non`, un repli `false` produit `true` sous une négation, et c'est un faux positif sur une **condition de fin**. Mais sa phrase « *sous ce mutant, une `fins[].condition_expr` se déclenche au tour 1* » **n'est reproductible sur aucune fixture du dépôt**.

C'est **exactement la famille BUG-080/087** : une conclusion juste appuyée sur un motif faux — et un refus juste pour un motif faux cède au premier contradicteur sérieux. **Conséquence pour le plan** : le témoin de KR-238 se construit sur un **nœud fabriqué** (un `op` hors registre, casté), sous un `non` au sommet, **jamais sur une fixture**. Et le texte de KR-238 doit être **amendé** dans la spec, sinon il continue de promettre une démonstration qui n'existe pas.

## M-2 — Le tech-lead a raison sur la forme de la cellule `lieu_visite`, et le narratif le contredit.

**Confirmé par relevé** : `dossier-reference.json` a pour départ `lieu.foyer-du-guet`, et sa `fin.vigie-abandonnee` porte `non(lieu_visite(lieu.vigie-du-nord))` — **un lieu ≠ départ**.

- **narratif (§ E)** : `lieu_visite` devient trivalente comme `lieu_courant_est` — cible = départ ⇒ `'vrai'`, cible ≠ départ ⇒ **`'faux'`**, départ non posé ⇒ `indecidable`. Motif : le `'faux'` est **déterminé** (aucun delta n'écrit `lieux_visites`, seule la transition `aller` l'écrit).
- **tech-lead (§ E.5)** : `'indecidable'` hors départ. Motif : sous `'faux'`, le sous-arbre `non(lieu_visite(vigie-du-nord))` devient **certain-VRAI**, ce qui déplace le sens d'erreur du module vers le **faux positif** et **traîne `controles.test.ts` dans le lot**.

**Les deux ont raison sur un point différent** : le `'faux'` est factuellement déterminé (narratif), ET il change la sortie du linter et le sens d'erreur (tech-lead). **Ils partagent pourtant la même prémisse** — le narratif écrit lui-même, au même § E, que « le sens d'erreur de la correction est la sur-prudence : `indecidable` ne tire pas, la correction ne peut que **sous-tirer** — faux négatif, la direction permise ». Et KR-252 promet déjà, mot pour mot, « *son sens d'erreur est la sur-prudence (faux négatif seul)* ».

**À trancher au tour 2 sur cette prémisse commune, pas sur la justesse factuelle du `'faux'`.**

## M-3 — La troisième cellule, que le cadrage ne nommait pas

Le narratif relève que `Jalon.effet: Delta[]` admet les **quatre** deltas, `donner_objet` compris. Un jalon vrai à l'ouverture dont l'`effet[]` donne un objet rend `possede_objet` **vrai au tour zéro** : la cellule `possede_objet: () => 'faux'` devient fausse **par le même canal** qu'`indice_connu`, dans la **même direction interdite**. **Aucune fixture n'exerce ce cas**, donc rien ne le montrerait.

Et `pnj_a_revele: () => 'faux'` **survit par MESURE** : `reveler_indice` est d'arité 1 sans opérande `pnj`, donc aucun `effet[]` de jalon ne peut écrire `monde.pnj.<id>.a_dit`.

**Conséquence : la décision (i) porte sur DEUX cellules à passer en `indecidable` (`indice_connu`, `possede_objet`), pas une** — plus la (ii) sur `lieu_visite`. Le `goal` et D-2 bis n'en nommaient que deux au total.

## M-4 — Le fait du PM, confirmé : aucun auteur ne peut écrire ce que l'itération fait jouer

`grep` sur `src/features/**` : **zéro** écrivain de `declencheur_expr`. Toutes les occurrences vivent dans `brain/dossier/` (types, table d'audience, linter). `EditeurEffets.tsx` existe dans `dossier-registres` mais sert `Quete.recompense`, **pas** `Jalon.effet`. Les deux fixtures portent des jalons complets — **écrits à la main**.

**La phrase de démo est donc démontrable par une fixture, pas par un auteur.** C'est une seconde occurrence de BUG-090, pas son armement. **À trancher au tour 2** : soit l'itération l'assume et la phrase de démo change de sujet, soit la surface d'édition entre au périmètre — et elle traverserait alors une seconde feature, ce qui rouvrirait le contrôle de taille.

## M-5 — Fausse alerte de l'orchestrateur, écrite pour mémoire

J'ai lu `session.ts:293-294` portant des identifiants de fixture **en dur** (`'indice.sceau-brise'`, `'jalon.premiere-nuit'`) et j'ai cru à un défaut livré. C'était l'**état transitoire d'une sonde de la QA**, qui patchait `ouvrirSession` pour mesurer l'oubli (sa mesure n° 4) et l'a restauré derrière elle. `HEAD` et l'arbre de travail sont propres, vérifié.
**Règle** : pendant qu'un comité mesure, on vérifie contre `HEAD`, jamais contre le disque.

## Les désaccords ouverts que le tour 2 doit traiter nommément

| # | Désaccord | Positions |
|---|---|---|
| **X-1** | **La forme de la cellule `lieu_visite`** hors départ | narratif : `'faux'` (déterminé) · tech-lead : `'indecidable'` (mesuré : `'faux'` traîne `controles.test.ts` et inverse le sens d'erreur) — **M-2** |
| **X-2** | **La projection des jalons en it3** | narratif : **REJETÉE**, reportée n° 10 (aucun lecteur non-test ; un écran la réciterait) · tech-lead : exposée au baril et rendue par `JalonsAtteints.tsx` · UX : la décrit sans la nommer · QA : critère C |
| **X-3** | **Le rendu** : un composant `JalonsAtteints.tsx` ou rien ? | tech-lead : lot 2 avec 2 fichiers neufs · UX : **zéro composant, zéro fichier ouvert dans `play-mode`** — les lignes de journal suffisent · PM : exige un critère de rendu |
| **X-4** | **Ce que le journal porte** | UX : deux lignes (`jalon_atteint : …` + `indices_connus : …`), propose d'admettre les `PredicatId` au vocabulaire · narratif : **une seule** entrée `jalons_atteints : jalon.<id>`, effets en `deltas[]` rendus en pastilles, **pas de ligne par delta** |
| **X-5** | **KR-238 et son témoin** | M-1 : l'illustration du KR est **fausse au dépôt**. Le témoin doit se construire sur un **nœud fabriqué**, et le texte du KR être amendé |
| **X-6** | **Le périmètre auteur** (M-4) | La phrase de démo doit-elle changer, ou la surface d'édition entrer ? |

**Convergences déjà acquises, à écrire et non à rejouer** : lot `contrat` **non scindé** (tech-lead chiffre les deux frontières ; PM ne demande aucune découpe) · **point fixe borné**, pas une passe unique · `origine` **absent** de l'entrée de jalon · `enonce_texte` et `jalons[].nom` **jamais** dans le journal · **aucun `catch`** autour de l'évaluateur · `types.ts`/`destinations.ts`/`validate.ts` **hors périmètre** · KR-247 prouvé par **deux jalons portant le même delta**, jamais par un jalon rejoué.
