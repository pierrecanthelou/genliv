# Tour 2 — `ux-designer` · `dossier-copilote` it3b

**Réponse nommée — tech-lead (REJETÉ n° 11).** **J'endosse le renommage `LigneReplique` → `LigneDecision`**, deux appelants. Sous la contrainte « `si_bloque` rejeté », mon `LigneEtape` est devenu **structurellement IDENTIQUE** à `LigneReplique` (un seul bloc de lecture, mêmes actions +/×) — l'écrire serait dupliquer 110 lignes pour rien. **Je retire `LigneEtape.tsx` de mon plan.**

**Mes objections, statuées :**
- **Vocabulaire à deux domiciles** (INTENTION / SI LE JOUEUR BLOQUE) — **RETIRÉE**. `si_bloque` sort, et pour `action` je choisis de ne **PLUS écrire « INTENTION » nulle part à l'écran** : comme `LigneReplique`, `LigneDecision` ne porte **aucun eyebrow de nom de champ**, seulement un eyebrow **positionnel** (« ÉTAPE PROPOSÉE n »). **Le risque disparaît par construction, pas par chance.**
- **« Une seule étape par lancer »** — **RETIRÉE**. narratif-ia (invite figée « trois au plus »), tech-lead (`*_PROPOSEES_MAX = 3`) et QA (gabarit-liste) convergent **avec preuves écrites**. Mon argument « zéro BUG-109 » ne survit **qu'en partie** : la boucle de décision à N lignes revient, **mais SANS le sous-cas plafond** — aucun plafond de document sur `plan_actions[]` —, donc jamais de `focusRejeter` de repli ni de résidu « aucune cible ». **C'est la moitié de BUG-106 qui reste évitée, pas sa totalité.**
- **Ma mise en garde sur `MENTION_RELANCE_SANS_MEMOIRE_PLAN` se réalise** : réécrite, **renommée pour ne plus mentir**.
- **`cible-a-ecrire`** : je retiens la formulation « objectif », alignée sur l'eyebrow réel `OBJECTIF PERSONNEL` de `BlocPlanActions.tsx`.

---

# ANNEXE (hors quota)

## 1. Textes exacts, définitifs

```ts
export const CARD5_TITRE = "Compléter le plan d'actions"
export const CARD5_CORPS =
	"Propose la suite du plan d'actions de ce personnage — ce qu'il entreprend, dans l'ordre, pour obtenir ce qu'il veut — jusqu'à trois étapes par lancer."
export function eyebrowEtape(n: number): string { return `ÉTAPE ${n}` }
export function eyebrowEtapeProposee(n: number): string { return `ÉTAPE PROPOSÉE ${n}` }
export const MENTION_AUCUNE_ETAPE =
	"Ce personnage n'a encore aucune étape dans son plan d'actions — la première proposée s'ajoute en tête."
export const MENTION_AUCUNE_ETAPE_AU_LANCER =
	"Ce personnage n'avait aucune étape dans son plan d'actions au lancement de cet assistant."
export const TEXTE_REFUS_TROP_LONG_PLAN =
	"Le contexte est trop long pour proposer des étapes — raccourcissez d'abord la fiche de ce personnage."
export const TEXTE_REFUS_CIBLE_A_ECRIRE_PLAN =
	"Ce personnage n'a pas encore d'objectif écrit — complétez d'abord sa fiche, dans Personnages."
export const MENTION_RELANCE_AVEC_MEMOIRE_PLAN =
	"Le copilote voit les étapes déjà écrites de ce personnage et ne doit pas les répéter — une proposition identique à une étape existante est refusée automatiquement ; une simple reformulation reste à votre jugement."
```

**Renommage volontaire** `MENTION_RELANCE_SANS_MEMOIRE_PLAN` → **`MENTION_RELANCE_AVEC_MEMOIRE_PLAN`** : **le nom lui-même mentait** dès lors que l'injection est actée. Contenu réécrit : le copilote **VOIT** les étapes déjà écrites (contrairement aux répliques), la parade au doublon n'est plus seulement visuelle mais aussi validée (prédicat n° 11) — **et le texte ne sur-promet pas** : seule la recopie EXACTE est bloquée, une paraphrase reste au jugement de l'auteur.

**`TEXTE_REFUS_TROP_LONG_PLAN` corrigé** au pluriel (« proposer des étapes ») : conséquence directe du retrait de « une seule étape par lancer », sinon le texte **contredirait** le gabarit-liste.

**`TEXTE_REFUS_CIBLE_A_ECRIRE_PLAN` tranché** : prérequis = `but.libelle`, **vérifié contre le code réel** (`BlocPlanActions.tsx:151/154` porte l'eyebrow `OBJECTIF PERSONNEL` et le `Field label="CE QU'IL VEUT"`). Le texte reprend le **patron exact** de `TEXTE_REFUS_CIBLE_A_ECRIRE` (indices) : nommer le concept manquant (« un objectif écrit », miroir de « une vérité écrite ») puis renvoyer génériquement à « sa fiche, dans Personnages » — **pas de citation du libellé de champ**.

**SUPPRIMÉS de mon tour 1** (le fait qui les fondait a disparu) : `EYEBROW_SI_BLOQUE`, `TEXTE_SI_BLOQUE_NON_PROPOSE`, `EYEBROW_INTENTION`.

**Réemployés SANS MODIFICATION** : `EYEBROW_ASSISTANT`, `EYEBROW_DEJA_ECRIT`, `LABEL_PERSONNAGE`, `OPTION_AUCUN_PERSONNAGE`, `TITRE_AUCUN_PERSONNAGE`, `TITRE_COPILOTE_NON_CONFIGURE`, `LABEL_LANCER`, `LABEL_ANNULER`, `TEXTE_CHARGEMENT`, `LABEL_ACCEPTER`, `LABEL_REJETER`, `BADGE_ACCEPTE`, `BADGE_REJETE`, `LIEN_OUVRIR_FICHE`, `TEXTE_INDISPONIBLE`, `TEXTE_ILLISIBLE`, `texteRefusAEcrire`.

## 2. Anatomie révisée

`CartePlanActions.tsx` (nom aligné sur le lot 2 du tech-lead ; le titre affiché reste `CARD5_TITRE`, précédent `CarteFaireParler.tsx` / « Écrire des répliques ») — coquille identique à `CarteFaireParler` :

`Select(LABEL_PERSONNAGE)` → bloc DÉJÀ ÉCRIT (eyebrow `EYEBROW_DEJA_ECRIT` ; vide → `MENTION_AUCUNE_ETAPE`/`_AU_LANCER` ; sinon une entrée par étape gelée, eyebrow `eyebrowEtape(n)` — **déviation motivée du précédent répliques** : la liste est ORDONNÉE, l'ordinal est une information réelle qu'une réplique, ensemble non ordonné, n'a pas ; n'affiche que le texte de l'étape) → `BarreLancer` (désactivée par `indisponible`/`aucunPersonnage` **SEULEMENT** — jamais de plafond, aucun n'existe) → `MENTION_RELANCE_AVEC_MEMOIRE_PLAN` (permanente) → échec (`⊘`) OU **jusqu'à 3** `LigneDecision`, chacune précédée de `eyebrowEtapeProposee(i+1)`, séparées par `separateurLigneStyle` — **copie exacte du bloc `ajouts.map` de `CarteFaireParler`, zéro divergence de structure**.

`texteEchec` (catch-all) : `illisible`→`TEXTE_ILLISIBLE` · `indisponible`→`TEXTE_INDISPONIBLE` · `a-ecrire`→`texteRefusAEcrire(…)` · `cible-a-ecrire`→`TEXTE_REFUS_CIBLE_A_ECRIRE_PLAN` · sinon→`TEXTE_REFUS_TROP_LONG_PLAN`.

`LigneDecision.tsx` — ex-`LigneReplique.tsx`, renommage endossé, **deux appelants**, **zéro changement de props ni de style** : `texte: string` porte indifféremment une réplique ou une étape. Côté `CartePlanActions`, `accepterDesactive`/`titreAccepterDesactive` restent `undefined` — **aucun plafond à exprimer**.

Liste vide en sortie = **refus `'vide'`**, jamais un état « proposition vide » à rendre — **le vide n'atteint jamais l'écran**, il est intercepté en amont par `texteEchec`.

## 3. Ordre clavier (révisé)

`Select` → `Lancer` (bloc DÉJÀ ÉCRIT **jamais focusable**) → en cours : focus `Annuler`, Échap = `Annuler` → proposition : jusqu'à 3 `LigneDecision`, chacune `+` puis `×` → après décision : ligne suivante **NON DÉCIDÉE** → `focusAccepter` (**jamais** de branche `focusRejeter` de repli — aucun plafond n'existe pour ce rôle) → si aucune ne reste → focus **toujours** `Lancer` (**jamais de résidu « aucune cible »** : `Lancer` n'est jamais désactivé par la boucle de décision elle-même).

## 4. Jetons

Inchangés — **zéro jeton neuf**, tous réemployés de `LigneReplique`/`CarteFaireParler`.

## 5. REJETÉ — à recopier au registre

| # | REJETÉ | Motif |
|---|---|---|
| 1 | `EYEBROW_SI_BLOQUE`, `TEXTE_SI_BLOQUE_NON_PROPOSE` | `si_bloque` sort du périmètre — convergence narratif-ia/tech-lead : chaque acceptation fabriquerait l'avertissement qu'elle prétend épargner. |
| 2 | `EYEBROW_INTENTION` | Plus de second champ à distinguer ; par précédent `LigneReplique`, une ligne de décision ne porte **aucun eyebrow de nom de champ**, seulement un eyebrow positionnel. |
| 3 | Composant local `LigneEtape.tsx` | Devenu structurellement identique à `LigneReplique` ; renommage `LigneDecision` + second appelant préféré à un doublon. |
| 4 | **RETIRÉ** (annule mon REJETÉ tour 1 n° 3, « proposer plusieurs étapes par lancer ») | Convergence à preuves écrites des trois autres rôles : le geste redevient une décision indépendante par ligne — **la lecture « en séquence » voulue par l'invite ne contraint pas l'écran à un tout-ou-rien.** |

## Points hors de mon terrain, désormais résolus

- **Plafond de `plan_actions[]` : aucun** — ma carte n'a donc **aucune logique de plafond** à coder, contrairement à `CarteFaireParler`.
- **Injection des étapes déjà écrites : oui** — traité au § 1.
- **Prérequis `cible-a-ecrire` : `but.libelle`** — traité au § 1.
