RISQUE      — Le SegmentedControl est déjà réservé par cette même feature pour it4 (Événements) comme FILTRE d'une liste UNIQUE (lie_a_histoire). Réutilisé ici pour BASCULER entre deux tableaux distincts (charpente.jalons[]/charpente.fins[]), le même composant porte deux sémantiques opposées. Sans les séparer clairement (sélection, compteur, vide), l'onglet actif peut être lu comme un filtre et faire fusionner par erreur les deux collections en un seul total — que le goal L2 interdit explicitement (« DEUX collections, jamais fondues »).

OBJECTION   — Le design_contract.textes actuel écrit des placeholders pour Quêtes/Indices/Événements/Climat mais AUCUN pour Jalons/Fins, alors que c'est précisément cette itération et que Fin.texte est le seul ajout de schéma annoncé (L3). Le cadrage ne tranche pas non plus où vit l'avertissement D1 : au niveau du PANNEAU (motif ObjectifsCanon, carte plate) ou de la FICHE sélectionnée (motif FicheIndice, indexé par id) — ambiguïté qui touche directement KR-211(b), et sans arbitrage un dev pourrait rendre le bandeau D1 aussi sous Jalon (alerteSansExpr:false — interdit, L4).

PROPOSITION — SegmentedControl (JALONS/FINS) en tête de panneau, au-dessus du motif liste-à-gauche/fiche-à-droite existant (réutilisé sans modification). Deux états de sélection strictement séparés (un par collection). D1 rendu PER-FICHE, uniquement côté Fin, role="status" distinct du bandeau de refus. Zéro nouveau token, zéro composant maison — 3 fichiers (`PanneauJalonsFins.tsx`, `FicheJalon.tsx`, `FicheFin.tsx`), styles recopiés de `styles.ts` existant. Textes exacts en annexe.

VERDICT     — recevable sous réserve (arbitrer la place du D1 et acter les placeholders de l'annexe).

---

## ANNEXE — proposition de layout et textes exacts

### Structure, section par section

**`PanneauJalonsFins.tsx`** (orchestrateur, remplace la section « jalons-fins » index 10)
1. Eyebrow panneau (token `eyebrowStyle`, mono, existant) : **`JALONS & FINS`**
2. `SegmentedControl` (`role="tablist"`, pleine largeur, au-dessus du corps à deux colonnes) :
   - `{ value: 'jalons', label: 'JALONS' }`
   - `{ value: 'fins', label: 'FINS' }`
   - état local `onglet: 'jalons' | 'fins'`, défaut `'jalons'`
3. Corps — **réutilise `pageStyle`/`colonneListeStyle`/`colonneFicheStyle` tels quels** :
   - `onglet === 'jalons'` → liste `charpente.jalons` (ListRow + 2 IconButton Monter/Descendre frères, précédent `PanneauIndices.tsx`) + `FicheJalon` du jalon sélectionné
   - `onglet === 'fins'` → même motif sur `charpente.fins` + `FicheFin`
   - **Deux états de sélection indépendants** (`selectionJalon`, `selectionFin`), calculés en ligne (`jalons.find(...) ?? jalons[0]`), jamais partagés ni réinitialisés au changement d'onglet — changer d'onglet et revenir doit retrouver la même fiche.
   - **Deux compteurs distincts**, jamais fusionnés (reflète `compte()` de `sections.ts` : `${jalons} jalon(s) · ${fins} fin(s)`).

**État vide** (par collection, même gabarit que `PanneauIndices` — glyphe `❏` réutilisé, aucun nouveau glyphe) :
- Jalons : `Aucun jalon — cliquez « + Ajouter un jalon… » pour commencer.`
- Fins : `Aucune fin — cliquez « + Ajouter une fin… » pour commencer.`
- Boutons pointillé accent : `+ Ajouter un jalon…` / `+ Ajouter une fin…`

**`FicheJalon.tsx`** (`Card`, ordre des champs) :
1. `Field label="NOM DU JALON" hint="interne" placeholder="Le pacte avec l'Archiviste"`
2. `Field label="DÉCLENCHEUR" hint="auteur — jamais injecté au modèle" multiline rows=2 placeholder="Le joueur montre le sceau brisé à l'Archiviste."`
3. `Field label="ÉNONCÉ" hint="IA — injecté au modèle une fois ce jalon atteint" multiline rows=2 placeholder="L'Archiviste sait désormais que le sceau a été brisé."`
4. **Aucune région D1** (`alerteSansExpr: false` — silencieux par design, L4).
5. Bandeau de refus (`role="status"`, motif `FicheIndice.tsx` inchangé, `EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"`).

**`FicheFin.tsx`** (`Card`, ordre des champs) :
1. `Field label="NOM DE LA FIN" hint="interne" placeholder="Le Gouffre refermé"`
2. `Field label="CONDITION" hint="phrase factuelle pour le moteur, jamais de fiction" multiline rows=2 placeholder="Le héros porte la Clé d'Aldûr et a vaincu le Gardien."`
3. `Field label="TEXTE DE FIN" hint="lu par le joueur, à l'arrivée sur cette fin" multiline rows=3 placeholder="Le sceau se referme derrière toi ; Val-Cendre s'efface dans la brume, pour toujours."` — registre fiction, présent, deuxième personne (règle 7).
4. **Région D1** (`role="status"`, distincte du bandeau de refus, visible seulement si `condition_texte` non vide et `condition_expr` absent) : eyebrow identique à `ObjectifsCanon.tsx` — `ENREGISTRÉ, AVEC AVERTISSEMENT` — corps rendu par `IssueList` sur `validateDossier(dossier).warnings` filtré `charpente.fins`.
5. Bandeau de refus (`role="status"`, motif inchangé, indexé par id de la fin affichée — même garde que `RefusEnCours` de `PanneauIndices.tsx`).

### Clavier
Tab suit l'ordre visuel : eyebrow → `SegmentedControl` (flèches gauche/droite natives du composant pour changer d'onglet) → liste (ListRow + IconButton Monter/Descendre) → bouton `+ Ajouter…` → champs de la fiche → bandeaux de statut (non focusables). `Entrée` dans un champ mono-ligne (NOM) blur-committe (précédent `handleKeyDownNom`) ; dans les `Field multiline`, elle insère un saut de ligne. À la création, le focus revient au champ NOM de la nouvelle fiche (précédent `intentionFocus`).
