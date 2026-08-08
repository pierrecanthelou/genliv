## TOUR 2 — Directeur narratif & IA · `dossier-format` it5

**RÉPONSE NOMMÉE — au Tech Lead, sur la « scène figée ».** Objection reçue, **je retire ma reformulation**. `texte_ouverture_joueur` est requis (`types.ts:284`) et déjà rempli par `dossier-minimal.json:121` : « non vide » passe sur les deux dossiers et ne discrimine rien. Pire pour mon propre poste : le champ est `'moteur'` (`destinations.ts:160`) et sa propriété définissante est l'**émission verbatim** — un chemin de code, pas une valeur. Mon assertion aurait déguisé une frontière code/IA en propriété de donnée : exactement ce que je passe mon temps à refuser aux autres. **Report n° 10 confirmé.** Correction à porter dans le même lot : `open_questions` (spec l. 398) écrit « le format porte un texte **et un drapeau** » — le drapeau n'existe nulle part dans `types.ts`. C'est cette phrase-là qui fera créer le champ.

**Statut de mes objections du tour 1**

1. *Branches sans ancrage* — **maintenue, élargie** : le grep de la QA en trouve cinq, le mien trois. J'adopte le sien.
2. *« scène figée » reformulée* — **retirée**, motif ci-dessus.
3. *Branche « budget-injectable »* — **retirée**. Je bornais la mauvaise grandeur : la somme des feuilles `ia` borne **l'auteur**, alors que ce qui doit être borné est l'**injection par tour**, propriété de l'assembleur n° 10 — qui n'existe pas. Table sans lecteur, motif exact de `BUDGET_CONTEXTE` en it2. La couche toujours chargée est déjà bornée (`BUDGET_MOTS_CANON = 600`). Il reste une ligne de revue, **sans code** : les mots de `canon.mj` + `canon.partage` du dossier de référence.
4. *Dossier sans avertissement* — **maintenue et durcie en veto** : `warnings: []` (KR-162) est désormais ma **seule** garantie de contexte en it5, puisque c'est elle qui prouve le canon sous 600 mots. Affaiblie en `warnings.length >= 0` ou retirée, je bloque.

**Antagoniste** : requalification du Tech Lead **acceptée** — un `echoue_si_expr` pointe un identifiant, jamais un nom libre ; mon objection tombe. Réserve : renommer la branche d'après son prédicat (« personnage cible d'une condition d'échec d'objectif »), sinon le nom ment sur ce qui est prouvé. **Relation secrète → n° 4** et **téléchargement → n° 2** : confirmés, sans objection de ma part. Un durcissement en annexe sur les jalons.

**VERDICT — recevable.**

---

### Annexe (hors quota) — le contrat concerné

**Contrat de sortie IA : il n'y en a toujours aucun en it5, et je ne l'invente pas.** Aucun appel modèle : pas de schéma de sortie, pas de rejeu, pas de repli à écrire. Ce que l'itération fixe est l'**entrée injectée**, parce que le dossier de référence en devient le premier exemplaire complet. Le relevé des dix chemins `ia` de mon tour 1 est inchangé et reste valable.

**Durcissement (binding) sur la branche « jalon sans `declencheur_expr` » proposée par la QA.** Le champ est bien optionnel et sa doc l'explique (`types.ts:298-303` : « un jalon peut rester coché à la main par le moteur d'un événement »). Mais un jalon sans `declencheur_expr` **et** sans personne pour le cocher est un `enonce_texte` qui n'entrera **jamais** dans le contexte : du lore mort dans le document que tout le monde va recopier. Exigence : dans le dossier de référence, ce jalon doit être la `cible` d'un delta `atteindre_jalon` (`deltas.ts:69`) porté par un `effet[]`, une `consequence[]` ou une `recompense[]`. Mécanique, vérifiable sur les champs existants, aucun champ neuf, aucun walker : la branche devient « jalon sans `declencheur_expr` **atteignable par un delta** ». Sans ce second membre, la branche passerait au vert en modélisant un défaut.

**Ligne de revue à porter (pas de test, pas de constante).** Nombre de mots mesuré de `canon.mj.synopsis_mj` et de `canon.partage.accroche_joueur` du dossier de référence, cité tel quel dans la revue d'itération. Doctrine « mesure d'abord, plafond ensuite » : le plafond agrégé se pose en n° 10, **sur le contexte assemblé par tour**, jamais sur le dossier.

**Comportement d'échec disponible aujourd'hui**, à citer tel quel : `validateDossier` refuse la forme ; `couverture.test.ts` fait rougir par **nom de champ** tout champ sans ligne de destination. Ce qui n'existe pas et doit rester écrit : **aucun instrument ne prouve qu'un champ `moteur` ou `auteur` n'atteint pas un contexte de modèle** — il n'y a pas d'assembleur avant la n° 10.

**Condition inchangée sur le téléchargement (n° 2)** : on télécharge **le dossier**, jamais une projection « pour l'IA » ou « pour le moteur ». `brain/utils/playExport.ts` est le précédent à ne pas rejouer.
