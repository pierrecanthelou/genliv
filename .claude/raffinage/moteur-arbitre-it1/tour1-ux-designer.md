# Raffinage `moteur-arbitre` it1 — Tour 1 — UX

## RISQUE
Mon propre contrat de cadrage (repris mot pour mot dans `design_contract` de la spec) colore PV par `--good`/`--bad` dès le bandeau permanent — mais l'it1 ne contient AUCUN jet. Appliquer les deux couleurs sémantiques à une barre de vie avant tout jet dilue leur sens au tout premier écran livré par cette feature.

## OBJECTION
CLAUDE.md restreint explicitement : « Les jets se résolvent en réussite/échec (seules couleurs sémantiques) ». Un PV bas n'est pas un échec de jet, c'est une ressource continue. Je me corrige moi-même : mon esquisse de cadrage (tour1-ux-designer §1) violait cette règle précisément au moment où elle devient visible pour la première fois — it1, zéro jet, zéro excuse de « précédent de jet ». `--bad` n'a de sens légitime qu'à it2, sur le `Badge` d'issue de `CarteJet`.

## PROPOSITION
`BandeauHeros` en it1 affiche PV/PE/XP en `--text-strong` (valeur courante) / `--text-body` (« / max »), AUCUNE couleur sémantique. Écran de création : gate inline `session.heros === undefined` dans `PartieEnCours` (`EcranPartie.tsx`), après les hooks déjà appelés, avant le retour `CadrePartie` — jamais une route séparée ni un flag persisté. `BandeauHeros` se place en bande pleine largeur entre le `<header>` de `CadrePartie` et la zone défilante `corps` — pas dans `colonneLecture` (640px) — pour rester visible pendant le défilement du journal.

## VERDICT
Pas de veto sur l'existence des deux écrans. Objection ferme (négociable, pas veto) sur `--good`/`--bad` en it1 : à retirer du bandeau, réservé à it2. Contrat détaillé en annexe.

---

## ANNEXE — CONTRAT DE DESIGN PRÉCIS, IT1

### 0. Où ça s'insère
Dans `src/features/play-mode/components/EcranPartie.tsx`, fonction `PartieEnCours` (après `useSessionPersistee`, `useTourDeJeu`, avant le `return <CadrePartie>`), ajouter une GARDE 7 (même patron que les gardes 1-6 déjà documentées en tête de fichier) :
```
// GARDE 7 (it1, moteur-arbitre) — EN LIGNE, jamais un useEffect : session.heros
// est soit présent soit absent, jamais un flag séparé à synchroniser (KR-013).
if (session.heros === undefined) {
    return (
        <CadrePartie titre={dossier.titre} sortie={{ name: 'dossier', dossierId }}>
            <EcranCreationHeros onValider={(heros) => setSession({ ...session, heros })} />
        </CadrePartie>
    )
}
```
Reste à l'intérieur de `CadrePartie` (header + Échap inchangés). Une fois `session.heros` écrit, le rendu suivant tombe dans la branche normale où `BandeauHeros` apparaît. KR-249 satisfait dans le même composant, le même lot.

### 1. `EcranCreationHeros` — registre joueur, VOUVOIEMENT
Réutilise `heroGen.ts`/`charCreation.ts` par import direct — jamais `CharacterCreationScreen.tsx` verbatim.

Libellés exacts : Titre « Créez votre héros » ; Label NOM (mono), placeholder « Aldric le Téméraire » ; Instruction « Choisissez un lancer, puis cliquez une caractéristique pour l'assigner. » ; Compteur « Bonus 1D4 : {n} point(s) restant(s) » / « ✓ tout distribué » (`--text-strong`, PAS `--good`) ; Bouton relance « ⟳ Relancer » / épuisée « ⟳ Relancer (utilisée) » ; Bouton validation (accent) « Valider → », `disabled` tant que `!complete`.

Dés du pool : `--hit-target` (44px), sélectionné = accent+accent-bg, assigné = surface-sunken+text-disabled.

États : pas de vide (pool toujours complet au montage), pas de chargement (fonctions pures synchrones), pas d'erreur (pas d'entrée serveur). Focus initial sur NOM.

Clavier : Tab NOM→dés→caracs→relance→valider. Entrée sur un dé = clic. Entrée ailleurs tant que `!complete` : aucun effet visible, pas de bannière répétée. Entrée si `complete` : équivalent clic Valider. Échap : non intercepté, remonte à `CadrePartie`.

### 2. `BandeauHeros` — registre joueur, lecture seule
Rendu en bande pleine largeur entre `<header>` et `corps` de `CadrePartie` (prop neuve `bandeau?: ReactNode` sur `CadrePartieProps`, insérée après `<header>`, changement minimal, zéro régression pour `EcranRefus`).

Anatomie : conteneur `border-bottom: var(--bw-hair) solid var(--border-subtle)`, `background: var(--surface-card)`, mono, `--fs-meta`, padding aligné sur `entete` de `CadrePartie`. Nom : `--text-strong`, semibold. `PV {actuel}/{max}`, `PE`, `XP` : NEUTRES (`--text-strong`/`--text-body`), PAS de `--good`/`--bad`. Séparateurs 1px entre blocs.

États : pas de vide (n'existe qu'après la garde 7), pas de survol, pas de focus (zéro élément focusable, hors ordre Tab).

### 3. Règle A4 — effet visuel
Aucune animation/flash : le nombre change silencieusement au rendu suivant. Aucun token de motion dans le design system ; en inventer un serait un composant maison déguisé.

### 4. Règles ESLint proposées
Interdire l'import des composants TSX `HeroStatusBar`/`CharacterCreationScreen` depuis `src/features/**`. La règle couleurs-en-dur existante couvre déjà le cas (vérifier au PR qu'aucun `var(--good, #hex)` en repli masqué n'apparaît). Aucune règle ne peut vérifier le registre ni l'usage sémantique des tokens — heuristique de revue humaine.

## DÉCISIONS PRISES EN AUTONOMIE
- Couleur PV/PE en it1 → neutre, aucune couleur sémantique → sinon le bandeau userait les deux couleurs sémantiques du projet sur une ressource qui n'est pas un jet, affaiblissant leur lecture au moment où `CarteJet` (it2) en a réellement besoin.
- Emplacement de l'écran de création → garde inline dans `PartieEnCours`, pas une route séparée → sinon un état de navigation supplémentaire sans contrat `brain` et un header/Échap à redéfinir pour rien.
- Position du bandeau (hors `colonneLecture`) → sinon il défilerait avec le journal et cesserait d'être « permanent ».
- Effet visuel du +5 PE → aucune animation → sinon un composant/motif maison hors charte.
- Entrée prématurée sur le formulaire → aucun effet visible → sinon un bruit répété dégradant la cadence de frappe.

## Pour le comité
Mon objection sur `--good`/`--bad` n'est PAS un veto — elle contredit mon propre texte déjà inscrit dans `design_contract` de la spec, donc auto-correction publique plutôt qu'imposition sans débat. Si PM/tech-lead jugent qu'un signal visuel de PV bas a une valeur produit réelle avant it2, à trancher explicitement (en citant la règle CLAUDE.md qu'on choisit d'étendre).

## Fichiers consultés
`.claude/raffinage/moteur-arbitre-cadrage/{tour1,tour2}-ux-designer.md`, `src/features/moteur-arbitre/specification.json`, `src/features/play-mode/components/{EcranPartie,CadrePartie,PlayerInputBar}.tsx`, `src/player/types.ts`, `design_handoff_gamebook_editor/tokens/{colors,spacing,typography}.css`.
