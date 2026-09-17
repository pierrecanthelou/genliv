# Tour 1 — `narratif-ia` · `dossier-controles` it9

**RISQUE** — L'inversion du sens d'erreur n'est tenable qu'à une condition : **une porte ne se ferme que si sa condition d'ouverture se lit dans un ensemble SUR-COMPTÉ.** `indicesProduits` sur-compte (H1/H2 l'écrivent) — fermer `apres_indice_id` ne peut donc **pas** inventer un faux positif. `objetsDonnes` **SOUS**-compte : `Depart` ne porte aucun inventaire initial, `donner_objet` est le seul écrivain d'inventaire, et le héros n'est pas au dossier. La porte `contrepartie` retire donc des producteurs sur un jugement que le document ne permet pas — sous `objectif-sans-chemin`, le défaut le plus cher du projet.

**OBJECTION 1 (mesurée, lecture de source)** — `dossier-reference.json` : `objet.lanterne-de-corvin` n'est **jamais** `donner_objet`, seulement `retirer_objet` (l. 341) — l'auteur suppose donc que le héros la porte. La porte `contrepartie` (l. 209) tue le savoir producteur d'`indice.trace-du-guet`, qui tombe de 2 à 1 : **silence → ALERTE sur l'aventure de référence, sans aucun défaut**. Sur `dossier-minimal.json` la même porte est ouverte : la tranche ne bouge **aucune** ligne de base — toute la preuve repose sur des témoins fabriqués.

**OBJECTION 2** — it9 casse une équivalence **écrite** (« tableau vide ⟺ toutes les sources sont des arêtes sans racine »). Un savoir à porte morte crée une **troisième** configuration de compte nul, où `MESSAGE_INDICE_SANS_RACINE` est faux : il dit « n'est relié qu'à des enchaînements » alors qu'un personnage le détient.

**PROPOSITION** — (1) Écrire **H4**, la loi du sur-comptage ; elle admet `apres_indice_id` et **exclut `contrepartie` mécaniquement**, pas par goût. (2) it9 = **une** porte. (3) Un **troisième message** sous le même `ControleId`. (4) Point fixe **unique et entrelacé**, deux mutants nommés.

**VERDICT — recevable sous réserve** — réserve n° 1 : **la porte `contrepartie` sort de la tranche**, ou elle ne part qu'avec H4 écrit, une règle « objet sans source » qui porte la cause, et la bascule du dossier de référence assumée par écrit.

---

## ANNEXE

### A — H2 est-il faux sur le jalon ? **CONFIRMÉ.** Et 4 familles sur 5 restent vraies.

`types.ts:1418-1423` + `deltas.ts:73-74`, corroborés par les deux fixtures qui émettent `atteindre_jalon` depuis une conséquence de résolution et une récompense de quête.

| # | Famille H2 | Vraie aujourd'hui ? | Après it9 |
|---|---|---|---|
| 1 | Les quatre portes de `Revelation` | **vraie** | se réduit à `confiance_min` + `jet` (+ `contrepartie` si ma réserve tient) |
| 2 | `apres_indice_id`, seconde arête indice→indice | **vraie** | **part** — objet de la tranche |
| 3 | `jalons[].declencheur_expr` absent → producteur fantôme | **FAUSSE** | **supprimée** |
| 4 | `climat[].effets_regles` | **vraie** (sur-compte, donc sûre) | inchangée |
| 5 | Atteignabilité du **porteur** d'un effet | **vraie** | inchangée, hors périmètre |

**Défaut de symétrie** : la ligne 3 nomme la famille où le schéma **déclare l'absence calme** et **tait** celle où il ne dit rien — `Evenement.declencheur_expr` (« un événement peut rester déclenché par la seule main du narrateur »). **Ne pas remplacer la ligne 3 par la ligne événement** : le résidu vrai de la ligne 3 est déjà la ligne 5.

### B — Réécriture du bloc (livrée rédigée, c'est mon texte)

Le titre de H2 change : « une racine est réputée amorçable » devient faux **sans réserve** dès qu'une porte est évaluée → « **SAUF PAR LES PORTES QUE H4 ÉVALUE** ». Les trois puces mortes sont remplacées ; `jet` et `confiance_min` reçoivent leur motif mesuré (§ D) ; la ligne 3 est **supprimée avec sa correction écrite**, pour que l'erreur ne se refasse pas sur `Evenement`.

**H4 — UNE PORTE NE SE FERME QUE SI SA CONDITION D'OUVERTURE SE LIT DANS UN ENSEMBLE SUR-COMPTÉ.** `apres_indice_id` **satisfait** la clause : sa condition est « cet indice est produit », lue dans l'ensemble que H1/H2 sur-comptent — la seule erreur possible est de laisser la porte **ouverte** à tort. **Le sens d'erreur n'est PAS inversé : il est CONFINÉ par la monotonie.** `contrepartie.objet_id` **ne la satisfait pas**.

⚠ **Cette clause date aussi it7** : `ETABLISSEMENT.possede_objet` lit **DÉJÀ** ce sous-ensemble, et la phrase de H3 « c'est la SEULE hypothèse de ce fichier dont l'erreur irait dans le sens interdit » est **fausse depuis**. H3 et `possede_objet` sont les **DEUX** sites du sens interdit.

Et la dernière phrase de H2 (« Les faux positifs vivent là-bas, jamais ici ») **doit partir** : « là-bas », c'est ici désormais.

### C — La nouvelle hypothèse, et le niveau

Avec H4, **il n'y a pas de faux positif neuf** sous `objectif-sans-chemin`, et c'est **démontrable plutôt que promis**. La décision d'it6 est **superseded dans sa lettre** (une racine `savoir` devient conditionnelle) mais **tenue dans son esprit** (la tranche reste monotone dans le sens sûr). **C'est cette formulation que je demande dans `resolved_decisions`**, pas « it9 inverse le sens d'erreur » — qui serait vrai de `contrepartie` et faux de ce qu'on livre.

### D — `confiance_min` et `jet` : bon arbitrage, **mauvais motif pour `jet`**

- **`confiance_min`** : laissée ouverte, et c'est juste. Rien au dossier n'écrit la confiance (`modifier_confiance` **écarté** du registre), la mécanique est déclarée « à définir (n° 12) ». Trancher reviendrait à **inventer une règle de jeu côté linter** — l'inversion exacte que KR-130 interdit.
- **`jet`** : laissé ouvert, **mais reformule le motif**. « Un dé n'est pas une certitude » est faible et laissera croire qu'un `tc` hors d'atteinte serait décidable. Deux raisons mesurées :
  1. **Le verdict serait CONSTANT** — minimum des dés = 1/2/3/4 pour TC1→TC4 ; une caractéristique à la création vaut 2 à 10. Il existe pour chaque tier un héros qui réussit → **aucune porte `jet` n'est morte**. Un calcul dont le résultat ne varie pas n'est pas une évaluation.
  2. **Le faire coûterait une seconde source de vérité** : importer `challenge.ts` et relire « dés ≤ carac ». Précédent : `curseurs.ts` n'importe RIEN de la couche des règles (KR-193).

  ⚠ **Sens d'écriture** : les valeurs viennent de `docs/REGLES-DU-JEU.md` § 1 et § 2, **pas** de `challenge.ts` (KR-130). Si le plan les recopie, il cite ces sections.

### E — La circularité : ce que l'auteur a écrit, ce que le linter doit dire

Calcul : ni A ni B n'entre dans le lfp → 0 pour les deux → **BLOQUANT ×2**. Juste.

**Narrativement** : deux confidents qui s'attendent l'un l'autre. Chacun accepte de parler « une fois que tu sauras », et personne ne parle en premier. **Ce n'est pas une boucle d'indices : c'est une serrure dont la clé est derrière la porte.** En partie, le joueur posera deux fois la question et repartira deux fois sans rien, sans jamais comprendre pourquoi.

**Et jamais le mot « boucle »** — motif déjà payé à it6 (BUG-088) : en remontant les portes dans un graphe fini on tombe sur un cycle **ou** sur une chaîne que personne n'a racinée, et **la seconde est la configuration courante**. Texte proposé :

> « Les personnages qui connaissent cet indice ne le disent qu'après un autre indice que rien ne permet d'obtenir d'abord : le joueur ne pourra jamais l'obtenir. »

Remédiation : la consigne reste **unique** (arbitrage it6) ; ajouter une phrase courte, **jamais** une seconde consigne — « Une condition de révélation qui attend un indice inaccessible ne s'ouvre pas davantage. »

**Corollaire de rédaction** : le message ne nomme **pas** l'indice attendu — l'« autre membre » n'est calculable que pour un cycle à deux.

### F — Contrat de sortie IA : **rien ne change**, et c'est vérifié

Entrée injectée : **aucune**. Schéma de sortie consommé : **aucun**. Budget de contexte : **inchangé**. Les **six** lignes des portes sont `moteur` dans `destinations.ts` — le modèle ne voit ni `carac`, ni `tc`, ni le seuil.

**Deux garde-fous qu'aucun lot d'it9 ne doit franchir** : (1) **aucun constat de contrôle n'entre jamais dans un contexte de modèle** — un narrateur qui apprend qu'un indice est inatteignable y conduit ; (2) **le libellé de porte reste côté auteur**.

### G — REJETÉ (à recopier au § 8)

1. **REJETÉ — évaluer la porte `jet`, même partiellement.** Verdict constant, et importerait la couche des règles dans le linter (KR-193, KR-130).
2. **REJETÉ — évaluer `confiance_min`.** Aucun modèle de confiance ; ce serait écrire une règle de jeu depuis une itération de lint.
3. **REJETÉ — dériver « l'objet est obtenable » de l'espace de noms `objet` ou d'une mention par `retirer_objet`.** Compterait une **soustraction** comme un don.
4. **REJETÉ — un second `ControleId` pour la porte morte.** Un identifiant code une **cause** (KR-164) : la cause reste « zéro producteur après saturation ».
5. **REJETÉ — deux passes.** Une arête peut produire l'indice qui ouvre une porte, et une porte ouverte peut raciner une arête : **un** point fixe entrelacé.
6. **REJETÉ — muter les fixtures partagées.** Déjà rejeté à it6 (KR-156). Témoins **locaux**.
7. **REJETÉ (réserve principale) — la porte `contrepartie.objet_id` dans cette tranche.** Elle lit un ensemble **sous-compté** (H4), et la mesure montre qu'elle se fermerait sur un dossier **sain**. **REPORTÉ** vers une règle qui porte la **cause** — « cet objet, personne ne le donne » — et non vers un retrait silencieux : **c'est à l'objet que l'auteur doit être renvoyé, pas à l'indice.**

### H — Ce que je demande à la QA de mesurer

- **Le témoin d'entrelacement et ses DEUX mutants** : chaîne `racine` (delta) → `relais` (`mene_a`) → `tardif` (savoir gardé par `apres_indice_id: relais`). Attendu `tardif → 1`. Deux implémentations fautives : portes évaluées **avant** la relaxation, et **après**, une seule fois.
- **Le pairage négatif relié** : le même dossier privé de sa racine → `tardif → 0`, `relais → 0`, **clé présente**.
- **Le témoin du sens de la porte** : un savoir gardé par un indice **produit** doit compter 1.
- **La ligne de base** : `dossier-minimal.json` ne bouge pas — **c'est un risque, pas un soulagement** : la tranche est invisible sur la fixture des preuves, donc aucun test existant ne la surveille.

**Toutes les affirmations de cette note sont des lectures de source. Aucun test exécuté, aucune couleur affirmée.**

---

## Notes de l'orchestrateur

**H4 est la contribution majeure de ce tour.** Elle transforme « it9 inverse le sens d'erreur, attention aux faux positifs » — ma formulation de cadrage — en un **critère décidable** qui trie les portes mécaniquement. Et elle renverse ma propre prémisse : sous H4, `apres_indice_id` **n'inverse pas** le sens d'erreur, il le **confine**.

**Second défaut trouvé dans le bloc d'hypothèses** : H3 affirme être « la SEULE hypothèse dont l'erreur irait dans le sens interdit » — faux depuis it7, puisque `ETABLISSEMENT.possede_objet` lit déjà l'ensemble sous-compté. Deux défauts dans le même bloc, trouvés dans le même tour.

**Le désaccord central du tour 2** : le flip `indice.trace-du-guet`, mesuré par la `qa` **et** par le `narratif-ia`, est lu par l'une comme **un défaut trouvé à épingler** et par l'autre comme **un faux positif sur un dossier sain**. Précédent exact à it7, où le narratif avait cherché la lecture qui sauverait la fixture et conclu qu'elle n'existait pas — ici il conclut l'inverse.
