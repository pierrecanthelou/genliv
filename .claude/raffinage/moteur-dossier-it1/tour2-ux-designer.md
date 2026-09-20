# Tour 2 — UX Designer — `moteur-dossier` it1

**OBJECTION 1 — MAINTENUE, DURCIE EN VETO.** Non contestée, et le fil de déclenchement est nommable : dans `OutcomeBlock.tsx`, tout `8.5px`, tout `--good-*`/`--bad-*`, toute prop `variant` sans appelant est un défaut d'intégration. J'amende la signature C.6 du tech-lead : `label?: string` → **`entete: string`, requis**. Optionnel, il laisse la seule prose joueur de l'écran sans rien qui la désigne — un en-tête absent est un vide muet dans le composant qui rend de la fiction.

**D4 rate ma proposition, et m'atteint quand même.** D4 vise le pilotage de `disabled` par `previewDisabledReason` : je n'ai jamais proposé ça. Mon § A bis laisse `disabled={!onPreview}` intact et n'ajoute qu'un `<span title>` enveloppant — zéro prop, zéro signature. Mais son motif « pour un seul appelant » tient, et je n'ai **aucun instrument** : jsdom ne voit pas d'infobulle, pas de Playwright. Je n'entre pas dans du chrome partagé sur une prémisse que je ne peux pas mesurer. **OBJECTION 2 — MAINTENUE sur le fond, REPORTÉE.** Dommage borné : le panneau « Contrôles » porte déjà le constat entier et sa remédiation.

**PM, objection 2 : je retire mon cadrage « deux registres » pour la règle.** C'est **une** règle à **deux** gardiens, et D5 la rend inévitable — `src/player/` ne peut pas appeler `controlerDossier`. La porte de l'éditeur est une courtoisie ; `ouvrirSession` est la garantie, seule survivante de l'extraction. Les deux registres restent vrais pour les **textes**, pas pour la règle. À l'écran, mesuré : `ouverture_a_ecrire` est **inatteignable** en it1 — je coupe le critère, pas la branche.

**C-4** — `objets_possedes` (relevé de `predicates.ts`, et `inventaire` est le mot de `SessionEquipmentState.inventory` qui survit). **C-1** — dérogation : « testable » n'est pas « démontrable ».

**VERDICT** — recevable sous réserve (veto d'objection 1 levé par le § D ci-dessous).

---

# ANNEXE — uniquement ce qui CHANGE

## § C révisé — la table des codes de refus de l'écran

L'ordre des gardes de C.6 en produit **trois**, pas deux : ma table de tour 1 avait manqué `dossier === null` (garde 2).

| Code écran | Garde C.6 | Atteignable en it1 ? | Texte exact, mot pour mot | Action visible |
|---|---|---|---|---|
| `dossier_introuvable` | 2 | **OUI** — `dossierId` inconnu dans l'URL | `Dossier introuvable.` | `← Mes dossiers` → `{ name: 'home' }` |
| `dossier_non_jouable` | 3 | **OUI** — accès direct sur dossier bloqué (KR-239) | `Ce dossier porte encore un contrôle bloquant. Ouvrez « Contrôles » dans l'éditeur pour voir lequel.` | `← Revenir à l'éditeur` → `{ name: 'dossier', dossierId }` |
| `ouverture_a_ecrire` | 5 | **NON — mesuré** (`controles.ts:170`, `niveau: 'bloquant'` ⟹ garde 3 a déjà refusé) | `Le texte d'ouverture porte encore le marqueur {MARQUEUR_A_ECRIRE} — le moteur le lirait au joueur mot pour mot. Rédigez-le dans DÉPART · TEXTE D'OUVERTURE.` | idem ci-dessus |

`Dossier introuvable.` est **repris tel quel** de `DossierEditorScreen.tsx:121` — le même fait, deux écrans, un seul texte.

**Trois règles attachées à la troisième ligne** — c'est elle que le PM conteste :

1. **La branche reste, le critère part.** `ResultatOuverture` est une union discriminée : le shell doit la rétrécir totalement. Un bras sans texte rend un écran blanc exactement dans l'état que personne n'avait prévu — et KR-239 écrit noir sur blanc qu'un chemin futur (reprise d'une session persistée, lien direct) **rouvre** ce cas. Aucun critère d'acceptation n'asserte son rendu en it1 ; la règle se prouve là où elle vit, par le test d'opposition KR-244 sur `ouvrirSession`.
2. **La distinction avec mon propre veto** : je refuse une **variante que rien ne produit** (l'axe `reussite`/`echec` d'`OutcomeBlock`) ; je rends un texte pour **tout état que le type peut produire**. Le premier est une décoration anticipée, le second une totalité imposée par la signature.
3. **Le marqueur se compose, jamais ne se recopie** : `import { MARQUEUR_A_ECRIRE }`, comme `ouvrirSession` le fait déjà (C.5).

**Clavier, invariant** : `Échap` fait exactement ce que fait le bouton visible de l'écran affiché — donc `{ name: 'home' }` sur `dossier_introuvable`, `{ name: 'dossier', dossierId }` partout ailleurs. Jetons du bloc, du glyphe `⊘`, du titre `La partie ne peut pas s'ouvrir` et du bouton : inchangés (§ C du tour 1).

## § A bis — devenu `REPORTÉ`

> **REPORTÉ** — « `title` natif invisible sur un `<button disabled>` (Chrome/Safari) : l'enveloppe `<span title>` dans `EditorTopBar.tsx` ». **Propriétaire : le raffinage d'it2 de `moteur-dossier`.** **Déclencheur : un relevé navigateur consigné (Chrome + Firefox, dossier non jouable, survol du CTA)** — aucun instrument du dépôt ne le mesure. Tant que ce relevé n'existe pas, **`EditorTopBar.tsx` n'est pas touché** : `disabled={!onPreview}` et `title` sur le bouton restent tels quels, conformément à D4. Si le relevé montre la bulle, le report meurt sans coût.

À inscrire au § 8 du plan (registre des désaccords), pas seulement ici.

## § D — amendement de la signature `OutcomeBlock` (C.6)

```ts
export interface OutcomeBlockProps {
	/** Libellé mono MAJUSCULES — REGISTRE AUTEUR. REQUIS : il désigne la prose sans en faire partie. */
	entete: string
	/** La prose du dossier, rendue VERBATIM (`whiteSpace: 'pre-wrap'`). */
	children: ReactNode
}
```

Trois écarts au fichier de référence `design_handoff_gamebook_editor/components/surfaces/OutcomeBlock.jsx`, à porter en docstring : **pas d'axe de variante** en it1 (il entre avec son premier appelant de jet, n°11) ; **`--surface-card` / `--border-card`**, jamais `--good-bg` / `--bad-bg` ; **`--fs-eyebrow`**, jamais le `8.5px` du fichier de référence. Tous les autres jetons : § D du tour 1, inchangés.

## § H — une ligne

Le test qui vérifie le lieu de départ lit **`session.monde.lieu_courant`** et, s'il touche l'inventaire, **`session.monde.objets_possedes`** (C-4). Aucun de ces identifiants n'est rendu à l'écran en it1.

## Inchangé, pour mémoire

§ A (formule KR-245, identique à C.4 du tech-lead au caractère près), § B (anatomie du shell), § E (zone journal + état vide, C-10 retenu, texte `Aucun évènement pour l'instant — vos actions y apparaîtront.` inchangé en it2), § F (clavier), § G (7(a) : dérogation), § I (ce que l'écran ne rend pas).
