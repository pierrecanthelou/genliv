# moteur-horloge · it1 · tour 1 · Narratif & IA

**RISQUE** — Le but fait avancer le PNJ « quand le déclencheur devient vrai **ou** la durée s'écoule ». Le contrat déjà livré à l'auteur dit autre chose : une durée écoulée **sans** déclencheur suivant rend l'étape **bloquée**, et le PNJ joue alors `si_bloque` (`types.ts:437-446`, aide `BlocPlanActions.tsx:58`, avertissement `validate.ts:732`). Un tick qui avance à l'échéance rend `si_bloque` inatteignable pour toujours et fait mentir l'éditeur.

**OBJECTION**
1. La règle de passage n'est écrite nulle part, donc le développeur du tick l'inventerait. Elle doit vivre dans `REGLES-PLAY.md` § J2, puis dans `horloge.ts`, et seulement là.
2. La ligne de journal est un relevé d'état : des identifiants et `rang`, rien d'autre. Elle ne contient ni `action`/`si_bloque` (audience `ia`), ni `nom`/`declencheur_texte` (audience `auteur`), ni `plan_actions[].etape` (qui se désynchronise). Elle ne porte pas non plus d'`origine` : `consignerNarration` accroche le récit à la première entrée à `origine` du pas (`recit.ts:100`).
3. `rang` est un index, pas un identifiant stable. Ce qui se passe quand il sort des bornes n'est pas défini.

**PROPOSITION**
- J2 en premier lot, avec une table à trois cas (annexe C) :
  - l'étape k+1 a un déclencheur : le PNJ avance seulement s'il est vrai ; l'échéance sans lui rend l'étape bloquée (dérivé, consommé en it2) ;
  - l'étape k+1 n'a pas de déclencheur : la durée de k sert de minuterie ;
  - ni l'un ni l'autre : le plan s'arrête.
  Cette table réconcilie le plan de cible (§ 2.7 : « échue ou déclencheur ») et le contrat auteur. `depuis` a ainsi son lecteur dès it1 (KR-249).
- Un cran au maximum par PNJ et par pas.
- `etape_plan.rang` et `.depuis` passent en audience `'moteur'`, sans exception.
- `evaluate.ts` reste le seul lecteur de `.declencheur_expr` (garde `evaluate.test.ts:706` inchangée) : c'est lui qui exporte le sélecteur.

**VERDICT** — recevable sous réserve : J2 écrit et signé avant toute ligne de `horloge.ts`.

---

## ANNEXE — frontière code/IA (hors quota)

### A. Contrat de sortie IA de l'itération
- **Entrée injectée : aucune.** Aucun assembleur (`src/brain/copilote/contexte/*.ts`) ne lit `etape_plan` ni `plan_actions[]`. Vérifié dans le code : R4 les exclut nommément (`contexte/acteur.ts:76`) et R3 (`narrateur.ts`) ne les lit pas. Avancer un PNJ en it1 ne peut donc contredire aucune fiction déjà racontée.
- **Schéma de sortie : aucun.** Aucun appel modèle.
- **Comportement en cas d'échec de validation : sans objet.** Ce qui en tient lieu : le tick est pur et total sur un dossier `jouable`, sans tirage ni horloge système. Rejouer les commandes rejoue les avancements à l'identique.
- **Preuve exigée :**
  - `moteurSansIA.test.ts` reste vert ;
  - la fixture saturée de session instancie `monde.pnj.<id>.etape_plan.rang` et `.depuis` (sinon ces lignes sont mortes) ;
  - aucune ligne `'ia'` n'est ajoutée à `sessionDestinations.ts`.
- **Motif de l'audience `'moteur'`** : c'est le même que pour `plan_actions[].duree` (`destinations.ts:210-215`) et `confiance`. Un modèle qui lirait `rang` ou `depuis` connaîtrait l'étape suivante et l'échéance, et jouerait une urgence que le moteur n'a pas encore constatée.

### B. Qui décide, qui raconte, qui persiste

| Capacité | Décide | Raconte | Persiste |
|---|---|---|---|
| Entrée au rang 0 | `tickHorloge` (via un sélecteur de `evaluate.ts`) | personne en it1 | `monde.pnj.<id>.etape_plan` |
| Passage de k à k+1 | `tickHorloge` | personne en it1 ; R3 en it2, par projection d'état | idem + une ligne de journal `moteur` |
| Étape bloquée | dérivée de `tour − depuis ≥ duree[k]`, jamais stockée | R3 en it2 (`si_bloque`) | rien |
| Constat | le code | journal `role: 'moteur'`, identifiants seuls | `journal` |

### C. Table proposée pour J2 (k = rang courant ; ordre = ordre du tableau, jamais un tri sur `.etape`)

| Situation | Le PNJ… |
|---|---|
| `etape_plan` absent, plan non vide | entre au rang 0 au premier pas où `declencheur_expr[0]` est absent ou vrai ; `depuis` = ce pas |
| k+1 existe et porte un `declencheur_expr` | passe à k+1 seulement s'il est vrai, évalué sur les faits après les jalons. Si `duree[k]` est posée, échue, et le déclencheur toujours faux : étape bloquée (dérivée), le PNJ reste à k |
| k+1 existe sans déclencheur, `duree[k]` posée | passe à k+1 quand `tour − depuis ≥ duree[k]` (minuterie), jamais bloqué |
| k+1 existe, ni déclencheur ni durée | ne bouge plus (plan arrêté) ; état calme, candidat pour le lint n° 7 |
| k est le dernier rang | ne bouge plus ; bloqué si `duree[k]` est échue (même formule) |
| `rang ≥ plan_actions.length` | aucune avance, aucune ligne, aucune levée d'exception |

Règles transverses :
- un cran au maximum par PNJ et par pas ; l'entrée au rang 0 compte comme le cran de ce pas ;
- `DUREE_MIN = 1` : un PNJ entré au pas t avec `duree` 1 est échu au pas t+1 ;
- les lignes suivent l'ordre de `monde.personnages[]`, sans effet sur le résultat : aucun prédicat ne lit `etape_plan`, donc le tick ne peut ni déclencher un jalon ni faire avancer un autre PNJ ;
- pas de tick pendant un combat (KR-295, déjà garanti par la garde d'`executerCommande`).

**Scénario séparateur pour la QA** (il distingue « la durée fait avancer » de J2) : plan à 2 étapes, déclencheur de l'étape 1 = `indice_connu(indice.sceau-brise)`, `duree[0] = 2`, entrée au pas 1.
- Pas 3, sans l'indice : la bonne implémentation laisse le PNJ au rang 0, bloqué ; la fautive le place au rang 1.
- Pas 4, indice révélé : rang 1, `depuis = 4`.

### D. Contrat de la ligne de journal du tick
- `role: 'moteur'`, `tour` = le pas courant (jamais +1, J1).
- Une ligne par changement de rang. Aucune pour un tick sans effet, ni pour l'entrée en blocage, qui ne change aucun état.
- `texte` suit la convention `champ : avant → après` de `lieu_courant` (`commandes.ts:356`), par exemple `etape_plan : pnj.aldur 0 → 1` (`avant` = `—` à l'entrée). Le format exact revient à UX/TL. Le chiffre affiché dérive de `rang`, jamais de `plan_actions[].etape`. UX tranche entre une numérotation à partir de 0 ou de 1, en cohérence avec « ÉTAPE N » de l'éditeur, calculé depuis la position.
- La ligne ne porte **aucun** des champs `origine`, `interlocuteur`, `recit`, `jet` ou `deltas`.
- Borne : au plus Σ |plan_actions| lignes par session. Aucune n'entre dans un contexte de modèle : `journal[].texte` est en audience `'moteur'`, et la fenêtre de R3 ne réinjecte que `recit`, que ces lignes ne peuvent pas porter.

### E. REJETÉ — à recopier au § 8 du plan (BUG-082)
- **R-1** Avancer à l'échéance quel que soit le déclencheur suivant : cela rend `si_bloque` inatteignable et contredit le contrat livré à l'auteur.
- **R-2** Stocker `bloque: boolean`, ou écrire une ligne « bloquée » au journal en it1 : c'est dérivable (KR-013) et sans consommateur avant it2 (KR-249).
- **R-3** Mettre une `origine` (ou une nouvelle clé de `CommandeId`) sur la ligne du tick : cela casse l'invariant `recit ⇒ origine` au pas où R3 narre. Le registre des commandes ne contient que ce qu'un joueur tape.
- **R-4** Recopier `plan_actions[].action` dans le `texte` du journal : ce serait une troisième prose `ia` émise verbatim.
- **R-5** Lire `.declencheur_expr` dans `horloge.ts`, ou desserrer la garde `evaluate.test.ts:706` : la sémantique d'une condition aurait deux lecteurs.
- **R-6** Avancer de plusieurs crans par pas : `duree` deviendrait imprévisible pour l'auteur (même motif que J1).
- **R-7** Injecter quoi que ce soit dans R3 ou R4 en it1 (rang, action courante) : le bloc PENDANT CE TEMPS appartient à it2, l'enrichissement de R4 est reporté.

### F. REPORTÉ vers it2
- **Consommateur de `si_bloque`** : R3 (PENDANT CE TEMPS, filtré à ce qui est perceptible) est le seul candidat, puisque l'enrichissement de R4 est reporté indéfiniment. Si it2 ne l'injecte pas, le critère « bloqué » n'a aucun lecteur dans toute la n° 14.
- **`changementsDe(avant, après)`** lit l'état, jamais le `texte` du journal : du texte parsé par du code serait un veto.
