## UX Designer — moteur-fins it4 — Tour 1

**RISQUE** — « Rejouer » se lit comme un rejeu vidéo. L'auteur s'attend à revoir sa partie, or le moteur repart de zéro avec la même graine : mêmes tirages seulement s'il refait les mêmes choix (KR-306). Un libellé sans cette promesse précise produit un « bug » perçu. Deuxième risque : un second bouton plein bleu dilue l'accent.

**OBJECTION**
1. « Un seul verbe » est acté, mais deux verbes arrivent. Il faut les distinguer par le texte (« même graine ») et par la hiérarchie : un seul bouton accent.
2. La graine est invisible, donc « même graine » est invérifiable. Elle doit s'afficher.
3. Après rechargement, `AiguillagePartie` saute l'écran de fin et tire une graine neuve. « Relancer sa partie terminée » ne tient donc que dans la session de navigateur en cours.
4. Dette de tokens : `maxWidth: 480` en dur dans EcranMort et `border: '1px solid'` dans `boutonPrimaire`. EcranFin n'a pas de maxWidth, ce qui rend les deux écrans incohérents.
5. Il n'existe pas de bouton secondaire, ni de `boutonSecondaire`.

**PROPOSITION**
- Ajouter `boutonSecondaire` à côté de `boutonPrimaire` (≈10 lignes). Ne pas créer de composant.
- Afficher `GRAINE · {n}` en mono.
- Mettre `autoFocus` sur Nouvelle partie dans EcranFin aussi. Il manque aujourd'hui, c'est un trou clavier.
- Extraire une barre d'actions commune aux deux écrans. Deux appelants, donc ce n'est pas une abstraction prématurée.
- Remplacer 480 par un token ou le retirer.

**VERDICT** — recevable sous réserve : le texte d'aide et la graine affichée sont obligatoires. Je n'ai pas de veto tant que `boutonSecondaire` n'utilise que des tokens.

---

## ANNEXE — contrat de design

**Composants.** `OutcomeBlock` et `Badge` (déjà en place) et `boutonPrimaire`, plus `boutonSecondaire` (nouveau, même fichier). Pas de nouveau composant. Pas de Modal : Rejouer et Nouvelle partie depuis un écran terminal ne détruisent rien, donc aucune confirmation.

**Barre d'actions** (EcranFin et EcranMort), sous le bloc verbatim ou le journal :
- Conteneur : `display:flex; flexWrap:wrap; gap:var(--space-5); alignItems:center`.
- Bouton 1, primaire accent (`boutonPrimaire`) : `↻ Nouvelle partie`. Il porte `autoFocus` sur les deux écrans.
- Bouton 2, `boutonSecondaire` : `↪ Rejouer — même graine`.
- Valeurs du secondaire : `fontFamily var(--font-mono)`, `fontSize var(--fs-meta)`, `padding var(--space-3) var(--space-5)`, `borderRadius var(--r-md)`, `border var(--bw-hair) solid var(--border-field)`, `background var(--surface-card)`, `color var(--text-strong)`, `fontWeight var(--fw-semibold)`, `minHeight var(--hit-target)`, `cursor pointer`.
- Les deux boutons ont `type="button"`. Le `marginTop` de boutonPrimaire passe au conteneur.

**Méta graine** (sous la barre) :
- `GRAINE · {session.graine_alea}`.
- `fontFamily var(--font-mono)`, `fontSize var(--fs-eyebrow)`, `letterSpacing var(--track-eyebrow)`, `color var(--text-label)`, `margin 0`.

**Aide**, `fontSize var(--fs-body)`, `color var(--text-muted)`, `lineHeight var(--lh-body)` :
- Mort : « La partie est terminée. Le dossier n'est pas modifié. » (inchangé), puis « Rejouer garde la graine : mêmes choix, mêmes tirages. Nouvelle partie en tire une autre. »
- Fin : seule la deuxième phrase, ajoutée sous la graine.

**États**
- Défaut : bouton secondaire sur `--surface-card`.
- Survol : le secondaire passe à `--surface-sunken`. Pas d'ombre, pas de bleu.
- Focus : `:focus-visible` natif conservé, il n'est pas supprimé.
- Fin sans texte : le repli pointillé existant, inchangé.
- Pas de graine ou de callback `onRejouer` : le bouton et la ligne de méta ne sont pas rendus. Pas de bouton mort. En pratique `graine_alea` est un nombre requis.
- Erreur ou chargement : sans objet, l'action est synchrone.

**Registre de langue.** Interface terse, libellés mono. Ici « graine » est le mot de l'interface. Aucune fiction n'est ajoutée : le texte de fin reste verbatim et celui de mort reste le texte moteur constant. Aucun nom interne n'est confondu avec la description joueur. KR-308 s'applique : aucune couleur `--good` ou `--bad`, ni `Badge tone` good/bad, sur ces écrans.

**Clavier.**
- Au montage, le focus est sur Nouvelle partie. Entrée l'active.
- Tab : Nouvelle partie, puis Rejouer, puis le lien de sortie du Cadre. L'ordre du DOM est l'ordre visuel.
- Shift+Tab remonte vers l'en-tête.
- Échap : sans effet, il n'y a pas de modale.
- Après Rejouer, `EcranCreationHeros` prend déjà le focus sur le champ nom (`nomRef.focus`), donc le focus ne se perd pas.
- Sur EcranMort, le journal `role="log"` garde `overflowY:auto`. Ajouter `tabIndex={0}` pour qu'il défile au clavier.

**Branchement UX.** `PartieEnCours` passe `session.graine_alea` à `onRejouer`. `AiguillagePartie` ajoute un état `graineImposee`, et `PartieDemarree` l'utilise à la place de `tirerGraine()`.

**Règles ESLint proposées** (portée `src/features/**/components/*.tsx`, hors tests)
1. `no-restricted-syntax` sur `Literal[value=/\b\d+(\.\d+)?px\b/]` hors `var(`, et sur `Property[key.name=/^(maxWidth|width|height|padding|margin|gap|fontSize|borderRadius)$/] > Literal[type=number]`. Cela attrape `maxWidth: 480` et `border: '1px solid'`.
2. `no-restricted-syntax` sur `fontFamily` et `border` en chaîne littérale non issue de `var(--font-*)` et `var(--bw-*)`.
3. Lint sur `<button` brut sans `style={bouton…}` : forcer `boutonPrimaire` ou `boutonSecondaire`.
4. Interdire `--good`, `--bad` et `tone="good"|"bad"` dans `EcranFin.tsx`, `EcranMort.tsx` et `EcranReprise.tsx` (KR-308).
5. Regex d'emoji : tout `\p{Extended_Pictographic}` hors de l'allowlist `✎✕⠿▾→↪↻⏱⊘⚔🗝⬚+` échoue.
6. Test Jest dans le style `lintIsolation` : chaque `var(--x)` des sources doit être défini dans `src/styles/tokens`. ESLint ne sait pas faire cette vérification.
7. Sur ces écrans, interdire `box-shadow` et `--shadow-*`.

**Dette notée, hors itération.** `Badge` (brain/components) porte `fontSize:'10px'`, `padding:'3px 9px'` et `gap:6` en dur. À traiter quand le fichier est rouvert.

---

## Décisions prises en autonomie

- Rejouer relance la partie avec la même graine, sans rejouer automatiquement les commandes → je n'ai pas implémenté de rejeu des commandes → si l'inverse, il faut persister la liste des commandes joueur (KR-306), une itération entière, et le libellé « même graine » devient « Revoir ».
- Hiérarchie : Nouvelle partie reste le seul bouton accent et garde le focus, Rejouer est neutre → je garde l'autoFocus existant que les tests épinglent → si l'inverse, EcranMort.test.tsx et mortDuHeros.test.tsx sont à réécrire, et l'accent passe sur une action moins fréquente.
- Rejouer sans confirmation, car l'écran est terminal → si l'inverse, un Modal `color="error"` de trop sur une action non destructive, qui casse la cadence du clavier.
- Glyphe `↪` pour Rejouer, `↻` réservé à Nouvelle partie, les deux dans la liste autorisée → si l'inverse, deux boutons au même glyphe, donc indiscernables d'un coup d'œil.
- La graine est affichée en clair, en mono → si l'inverse, « même graine » reste invérifiable.
- Rechargement : l'écran de fin reste sauté, comme en it2/it3 (décision #20), donc Rejouer n'existe que dans la session de navigateur en cours → à signaler au PM comme limite assumée → si l'inverse, `AiguillagePartie` doit réafficher EcranFin/EcranMort à la reprise, et il faut rouvrir la décision #20.
- Les cas limites navigateur (retour arrière, hors ligne, crash) sont déjà traités sans copie nouvelle : aucun message neuf n'est ajouté → si l'inverse, trois écrans et textes à écrire, qui relèvent du PM.
- `boutonSecondaire` est ajouté dans `boutonPrimaire.ts`, sans renommer le fichier → si l'inverse, un renommage touche les 3 importeurs sans aucun gain visuel.

Fichiers lus : `C:\Users\pierr\Desktop\genliv\src\features\play-mode\components\EcranFin.tsx`, `EcranMort.tsx`, `EcranReprise.tsx`, `AiguillagePartie.tsx`, `PartieEnCours.tsx`, `boutonPrimaire.ts`, `C:\Users\pierr\Desktop\genliv\design_handoff_gamebook_editor\tokens\*.css`, `C:\Users\pierr\Desktop\genliv\src\brain\components\Badge.tsx`, `C:\Users\pierr\Desktop\genliv\src\features\moteur-fins\specification.json`. Je n'ai écrit aucun fichier.
