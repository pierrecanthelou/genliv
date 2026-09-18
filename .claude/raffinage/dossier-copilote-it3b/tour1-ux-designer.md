# Tour 1 — `ux-designer` · `dossier-copilote` it3b

**RISQUE** — `plan_actions` est une liste **ORDONNÉE et séquentielle**, ni un sac (répliques) ni un rang (détenteurs) : reproduire par réflexe la chorégraphie de 3a (liste de 3, plafond, décision ligne par ligne) sur une sous-entité multi-champs importerait un **motif inadapté**, et pourrait pousser à dupliquer `Field` + `LIBELLE_DES_CHAMPS` pour `action`/`si_bloque` — chose vétoée.

**OBJECTION** — Le cadrage ne tranche ni le **nombre d'étapes proposées par lancer**, ni **bloc-vs-champ-par-champ**. Or « INTENTION » et « SI LE JOUEUR BLOQUE » sont déjà les libellés **VIVANTS** de ces deux champs dans `BlocPlanActions.tsx` (`dossier-fiches`) : les recopier en dur ici — **même en texte simple, hors `label=`** — reconstitue exactement le défaut (**une chaîne, deux domiciles**) que `LIBELLE_DES_CHAMPS` a été créé pour supprimer, **sans qu'aucun test actuel ne le voie** puisque `libelles.test.ts` ne scanne que ses quatre entrées existantes.

**PROPOSITION** — Une étape = **UNE seule décision**, bloc GROUPE (précédent exact : « les six curseurs, indivisibles, une seule paire d'actions »). **Un lancer propose UNE SEULE étape** (jamais une liste), sans plafond documenté. Nouveau composant local `LigneEtape` (sœur de `LigneReplique`) : deux blocs `blocLectureRepliqueStyle` empilés, eyebrows en texte simple réemployant **verbatim** « INTENTION »/« SI LE JOUEUR BLOQUE » — réemploi **ASSUMÉ et documenté en commentaire**, pas une promotion de registre. Carte `CarteCompleterPlan`, 5ᵉ position avant « Bientôt ». DÉJÀ ÉCRIT gelé au lancer, comme 3a. **Aucun plafond ⇒ focus revient toujours à Lancer après décision : zéro cas BUG-109 à gérer ici.**

**VERDICT** — **recevable sous réserve** (verrouiller le bloc unique et le réemploi assumé de vocabulaire).

---

## ANNEXE (hors quota)

### 1. Réponses aux questions du cadrage

**Q1 — bloc unique ou champ par champ ?** L'étape s'accepte **ENTIÈRE**. `etape` n'est de toute façon jamais rendu par le modèle et sera posé par le CODE ; `declencheur_texte`/`declencheur_expr`/`duree` ne sont pas proposables et restent `undefined`, à compléter ensuite dans `BlocPlanActions.tsx`. Seuls `action` (requis) et `si_bloque` (optionnel) sont `ia` : deux champs de la MÊME étape, **sémantiquement indissociables** (une porte de sortie n'a pas de sens sans l'intention qu'elle referme), donc **UNE paire d'actions (+/×) pour les deux, jamais deux**.

**Q2 — la 5ᵉ carte.** `CarteCompleterPlan.tsx`, titre `CARD5_TITRE`. Position : **4ᵉ carte active**, juste avant `CarteAssistant` (« Éclater le synopsis », Bientôt — itération 4, **INCHANGÉ** : ce badge nomme bien l'itération 4 du roadmap, pas 3b). Ordre : `CarteCompleterFiche`, `CarteTisserIndices`, `CarteFaireParler`, `CarteCompleterPlan`, puis le placeholder.

**Q3 — le « déjà écrit ».** Oui, identique dans le principe à 3a. Forme adaptée à une liste **ORDONNÉE** : une entrée par étape, eyebrow `` `ÉTAPE ${n}` ``, n'affichant **QUE `action`** (pas `si_bloque`, pour tenir la liste courte). **GELÉ au clic Lancer**, même mécanique que `CarteFaireParler` : sans gel, une étape acceptée réapparaîtrait **en double**.

### 2. Textes exacts proposés

```ts
export const CARD5_TITRE = "Compléter le plan d'actions"
export const CARD5_CORPS =
	"Propose la prochaine étape du plan d'actions de ce personnage — son intention, et sa porte de sortie si le joueur le bloque."
export const EYEBROW_INTENTION = 'INTENTION'
export const EYEBROW_SI_BLOQUE = 'SI LE JOUEUR BLOQUE'
export const TEXTE_SI_BLOQUE_NON_PROPOSE = 'Non proposé.'
export function eyebrowEtape(n: number): string { return `ÉTAPE ${n}` }
export function eyebrowEtapeProposee(n: number): string { return `ÉTAPE ${n} — PROPOSÉE` }
export const MENTION_AUCUNE_ETAPE =
	"Ce personnage n'a encore aucune étape dans son plan d'actions — la première proposée s'ajoute en tête."
export const MENTION_AUCUNE_ETAPE_AU_LANCER =
	"Ce personnage n'avait aucune étape dans son plan d'actions au lancement de cet assistant."
export const TEXTE_REFUS_TROP_LONG_PLAN =
	"Le contexte est trop long pour proposer une étape — raccourcissez d'abord la fiche de ce personnage."
export const MENTION_RELANCE_SANS_MEMOIRE_PLAN =
	'Chaque lancer repart de zéro : le copilote ne garde aucune mémoire des étapes déjà refusées.'
```

`TEXTE_REFUS_CIBLE_A_ECRIRE_PLAN` — **NON TRANCHÉ, dépend d'une décision de contenu qui n'est pas la mienne.** Deux formulations prêtes : si le prérequis est le but → `"Ce personnage n'a pas encore d'objectif écrit — complétez d'abord son but, dans Personnages."` ; si c'est le même que pour les répliques → **réemployer VERBATIM** `TEXTE_REFUS_CIBLE_A_ECRIRE_REPLIQUES` (ne pas créer un troisième texte identique sous un nom différent).

⚠ **`MENTION_RELANCE_SANS_MEMOIRE_PLAN` est PROVISOIRE** : si `CHAMPS_INJECTES` injecte les étapes déjà écrites (probable ici, contrairement aux répliques), **cette phrase devient FAUSSE** et doit être réécrite. Signalé pour éviter qu'un texte parte au commit sans être revérifié contre le contrat de contexte réel.

**Réemployés SANS MODIFICATION** : `EYEBROW_ASSISTANT`, `EYEBROW_DEJA_ECRIT`, `LABEL_PERSONNAGE`, `OPTION_AUCUN_PERSONNAGE`, `TITRE_AUCUN_PERSONNAGE`, `TITRE_COPILOTE_NON_CONFIGURE`, `LABEL_LANCER`, `LABEL_ANNULER`, `TEXTE_CHARGEMENT`, `LABEL_ACCEPTER`, `LABEL_REJETER`, `BADGE_ACCEPTE`, `BADGE_REJETE`, `LIEN_OUVRIR_FICHE`, `TEXTE_INDISPONIBLE`, `TEXTE_ILLISIBLE`, `texteRefusAEcrire`.

### 3. Anatomie

`CarteCompleterPlan.tsx` — coquille identique à `CarteFaireParler` : `Select` → bloc DÉJÀ ÉCRIT → `BarreLancer` → mention permanente → échec (⊘) OU **UN SEUL** `LigneEtape` précédé de `eyebrowEtapeProposee(dejaEcritesGelees.length + 1)`.

`LigneEtape.tsx` (**LOCAL**, pas de promotion `brain/components/`, un seul appelant, KR-109) :
```ts
interface LigneEtapeProps {
	action: string
	siBloque?: string
	decision?: 'acceptee' | 'rejetee'
	onAccepter: () => void; onRejeter: () => void; onOuvrirFiche: () => void
}
```
Deux blocs empilés ; `siBloque` absent → `<p style={mentionStyle}>{TEXTE_SI_BLOQUE_NON_PROPOSE}</p>`, **jamais une boîte bordée vide**. Actions identiques à `LigneReplique`. **Aucun style neuf.**

### 4. Jetons — TOUS vérifiés existants, ZÉRO neuf

`--border-field` · `--r-md` · `--surface-inset`/`--surface-sunken`/`--surface-card` · `--text-body`/`--text-muted`/`--text-label`/`--text-disabled` · `--border-rule` · `--font-ui`/`--font-mono` · `--fs-body`/`--fs-eyebrow` · `--track-eyebrow` · `--space-3`/`--space-4` · `--hit-target` (`src/styles/tokens/spacing.css:21` — **absent** du dossier de handoff, ce qui est normal : le handoff est la référence de wireframe, `src/styles/tokens/` est la source pour le code).

### 5. Ordre clavier

`Select` → `Lancer` (bloc DÉJÀ ÉCRIT **jamais focusable**) → en cours : focus sur Annuler, Échap = Annuler → proposition : `+` puis `×` de l'unique `LigneEtape` → après décision : focus **TOUJOURS** à `Lancer`.
**Simplification notable vs `CarteFaireParler`** : aucun plafond documenté ⇒ NI ligne « suivante » à chercher, NI cas résiduel « aucune cible » — **une seule branche suffit, zéro occurrence de la famille BUG-097/101/106/109 à instrumenter sur cette carte**.

### 6. REJETÉ (explicite et motivé)

- **REJETÉ** — ajouter `action`/`si_bloque` à `LIBELLE_DES_CHAMPS` : romprait « quatre entrées, pas une de plus » (`libelles.test.ts:39`), veto tenu à 3a, non renégociable.
- **REJETÉ** — `Field label="INTENTION"` / `label="SI LE JOUEUR BLOQUE"` : même si ces libellés ne sont pas dans les 4 entrées scannées, utiliser la prop `label=` **recrée le mécanisme de risque que ce test surveille**. Motif de fond, pas seulement mécanique de test.
- **REJETÉ** — **proposer plusieurs étapes par lancer** : une liste ordonnée où chaque étape dépend de la précédente rend **incohérent** de proposer 3 étapes à la fois sans savoir lesquelles seront acceptées.
- **REJETÉ (option envisagée)** — nommer la carte `CarteAjouterEtape` / `CarteTracerLePlan` : conservé `CarteCompleterPlan` par cohérence avec le verbe du `goal` et avec `CarteCompleterFiche` — mais le choix reste ouvert au comité si la réutilisation de « compléter » entre deux cartes gêne la lisibilité.
- **REJETÉ** — afficher `si_bloque` absent comme une **boîte bordée vide** : remplacé par une mention discrète, pour ne jamais faire croire à un champ vide éditable dans un écran en lecture seule.

### 7. Points hors de mon terrain, signalés

- **Existence ou non d'un plafond de `plan_actions[]`** (aucune constante `ETAPES_MAX`-like trouvée) : si un plafond est posé, réutiliser le motif gel+plafond de `CarteFaireParler` **à la lettre**, pas une variante.
- **Le prérequis exact de `cible-a-ecrire`** et **l'inclusion ou non des étapes déjà écrites dans `CHAMPS_INJECTES`** conditionnent deux textes ci-dessus — **à me re-router si le contrat de contexte diverge de mes hypothèses** avant que ces chaînes ne partent au commit.
