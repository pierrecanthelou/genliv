# Raffinage `moteur-acteurs` it2 — Tour 1 — Tech Lead

## RISQUE
Rouvrir `CibleActeur`/`ReponseActeur`/`CLES_SORTIE_ACTEUR`/le gabarit worker pour porter `indices_reveles` comme un RANG désigné par le modèle — lecture littérale du goal cadré — romprait l'invariant shipé d'it1 : `validerActeur` dit explicitement « R4 ne désigne jamais rien, il ne fait QUE parler » (ZÉRO rang, zéro `Map.get`). Et ce serait dupliquer un mécanisme déjà vivant : `EntreeJournal.deltas?` existe déjà, déjà exporté, déjà rendu en pastilles par `JournalRow` pour les jalons (`avecJalonsResolus`, `commandes.ts`).

## OBJECTION
KR-280 dit « le moteur évalue, jamais l'IA ». La révélation d'un savoir est donc une conséquence STRUCTURELLE de `TRANSITIONS.parler`, orthogonale à la réplique R4 — exactement le patron déjà utilisé pour les jalons, zéro type nouveau. Je rejette donc la lecture « `ReponseActeur` gagne un champ » : aucune ligne de `brain/copilote/` ne bouge. Second point : `Revelation.contrepartie.consomme` n'a aucun AC cette itération — à nommer explicitement hors-périmètre (rien ne retire l'objet), sinon fuite silencieuse d'une promesse de schéma.

## PROPOSITION
2 lots, annexe ci-dessous — contrat (`brain/dossier/` seul, isolé des trois fichiers interdits `types.ts`/`destinations.ts`/`validate.ts`) puis feature (carnet, zéro import brain/ nouveau).

## VERDICT
Recevable sous réserve : le comité doit trancher explicitement que `indices_reveles` n'existe PAS sur `ReponseActeur` — la révélation vit dans `EntreeJournal.deltas`. Sans cet arbitrage je passe en veto sur tout lot qui rouvre le contrat R4.

---

## Annexe — vérifications de code réelles

- `DELTAS.reveler_indice` existe déjà (`src/brain/dossier/deltas.ts:124-128`) — `refKinds:['indice']`, `ecrit: (faits,cibles) => avecAjout(faits,'indices_connus',cibles[0])`. Seul appelant actuel : `resoudreJalons`/`evaluate.ts`, via `appliquerDelta` déjà exporté.
- `PREDICATES.possede_objet`/`PREDICATES.indice_connu` existent déjà (`predicates.ts:64-75`), lisant exactement `objets_possedes`/`indices_connus` de `FaitsDeSession` — l'évaluateur de `contrepartie`/`apres_indice_id` n'a donc RIEN à réimplémenter, il délègue au registre.
- `Revelation` (`types.ts:546-563`) a EXACTEMENT la forme supposée au cadrage : `confiance_min?: number`, `jet?: {carac, tc}`, `contrepartie?: {objet_id, consomme}`, `apres_indice_id?: string` — ce n'est PAS un `ExprNode`, c'est un struct à 4 portes nommées. `evaluate.ts` ne la lit pas aujourd'hui.
- `EntreeJournal.deltas?: readonly DeltaJournalise[]` existe déjà (`session.ts:117`), optionnel à vie, EXPORTÉ via `brain/index.ts:628` (`DeltaJournalise` seul type exporté d'`evaluate.ts`), déjà consommé par `JournalRow` — exactement le mécanisme que KR-286 appelle « déjà existant ».
- `TRANSITIONS.parler` (`commandes.ts:411-445`) connaît déjà `personnage`/`session.monde` au moment où il construit la session de retour — c'est le point d'insertion naturel, symétrique à `avecJalonsResolus` (texte reconstruit `jalons_atteints : <id>`, jamais un écho de prose).
- `EcranPartie.tsx` monte déjà `JournalRow`/`PlayerInputBar`/`BandeauHeros` avec `session` en scope — candidat de montage du bouton carnet ; `CarnetIndices.tsx` n'a besoin d'AUCUN nouvel export brain/ (`EtatSession`, `EntreeJournal`, `DeltaJournalise` sont déjà dans le baril).

## Lots

### Lot A — `contrat-revelation` (`contrat`, seul, en premier)
Fichiers :
- N `src/brain/dossier/revelation.ts` — `evaluerRevelation(faits: FaitsDeSession, revelation: Revelation): boolean` pure, conjonctive, fail-closed (`confiance_min !== undefined` ou `jet !== undefined` ⇒ `false` immédiat, porte posée mais non câblée KR-280) ; délègue `contrepartie`/`apres_indice_id` à `PREDICATES.possede_objet`/`PREDICATES.indice_connu` (zéro logique dupliquée). `savoirsRevelables(personnage: Personnage, faits: FaitsDeSession): readonly string[]` — ids des savoirs dont `revele_si` passe ET pas déjà dans `indices_connus` (un seul passage, pas de point-fixe).
- N `src/brain/dossier/revelation.test.ts` — table 2×2 de l'AC#4, cas confiance_min-seul/jet-seul fermés, cas déjà-connu non ré-émis.
- R `src/brain/dossier/commandes.ts` — `TRANSITIONS.parler`, succès : appelle `savoirsRevelables`, pour chaque id `appliquerDelta(faits,{delta:'reveler_indice',cibles:[id]})`, une entrée `role:'moteur'` par id révélé, `texte:'indices_connus : <id>'`, `deltas:[journalise]`, même `tour`.
- R `src/brain/dossier/commandes.test.ts`
- R `src/brain/dossier/__fixtures__/dossier-reference.json` — un PNJ déjà présent/décrit gagne un `savoirs[]` gardé par `contrepartie`+`apres_indice_id`.

Expose : `evaluerRevelation`, `savoirsRevelables` — NON sorties par `brain/index.ts` (même doctrine que `PREDICATES`/`DELTAS`). Zéro changement à `types.ts`/`destinations.ts`/`validate.ts`/`copilote/*`/`worker/*`.
Consomme : `PREDICATES`, `appliquerDelta`, `DELTAS` (inchangé), `Revelation`/`Savoir`/`Personnage` (lecture seule).
Critères couverts : #3, #4, #5 (moitié moteur).

### Lot B — `carnet-indices` (`feature`, après gel du lot A)
Fichiers :
- N `src/features/play-mode/components/CarnetIndices.tsx` — vue dérivée : pour chaque id de `session.monde.indices_connus`, jointure sur l'entrée de `session.journal[]` dont `deltas` contient `{delta:'reveler_indice', cibles:[id], effet:'applique'}` ; libellé = tour+verbe de la commande d'origine (jamais `monde.indices[].nom`) ; corps = `recit` de l'entrée ; `IconButton` 🗝, tiroir/`Modal` (Échap ferme, focus revient) ; état vide dédié.
- N `src/features/play-mode/components/CarnetIndices.test.tsx`
- R `src/features/play-mode/components/EcranPartie.tsx` — monte le déclencheur + le carnet (nommé explicitement pour ne pas rejouer BUG-142).
- R `src/features/play-mode/components/BandeauHeros.tsx` — candidat alternatif de montage si l'UX préfère le HUD ; listé dans le MÊME lot, donc zéro conflit de propriété quel que soit le choix d'exécution.
- R `src/features/play-mode/components/EcranPartie.test.tsx` (et/ou `BandeauHeros.test.tsx`)

Expose : rien (feuille UI). Consomme : `EtatSession`/`EntreeJournal`/`DeltaJournalise` (déjà exportés, inchangés par le lot A).
Critères couverts : #5 (moitié affichage), contrat de design `carnet_indices`.

## Décisions prises en autonomie faute de spécification
- Domicile de l'évaluateur (`evaluate.ts` vs « module voisin ») → nouveau fichier `revelation.ts` → si posé dans `evaluate.ts` : mélange deux sémantiques distinctes (arbre générique `ExprNode` vs struct à portes nommées), et un futur lecteur croirait `Revelation` traversable par `evaluerExpr`, qui ne le sera jamais.
- Forme de `ReponseActeur.indices_reveles` (rang / identifiant résolu / absent) → absent : la révélation est portée par `EntreeJournal.deltas`, jamais par la réponse R4 → si le comité impose quand même le champ sur `ReponseActeur` : il faut rouvrir `CibleActeur`/`validerActeur`/`worker/index.ts` pour une capacité que personne ne lit — contredit KR-268/285 que cette feature s'impose à elle-même.
- Chaînage multi-passes des savoirs d'un même PNJ au même tour → un seul passage → si un dossier réel enchaîne deux savoirs du même PNJ en un tour, le second reste fermé jusqu'au `parler` suivant (dette mineure).
- Point de montage du bouton carnet (EcranPartie vs BandeauHeros) → les deux fichiers listés sous le lot B → si un seul avait été nommé et que l'exécution choisit l'autre, on rejoue exactement BUG-142.
- Idempotence de la révélation → filtrée en amont dans `savoirsRevelables` (exclut les indices déjà connus) plutôt que laissée à `avecAjout` → sinon chaque `parler` ultérieur au même PNJ réécrirait une entrée `role:'moteur', effet:'sans_effet'` dans le journal, bruit visible dans `JournalRow`.
