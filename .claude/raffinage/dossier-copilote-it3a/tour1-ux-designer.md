# Tour 1 — `ux-designer` · `dossier-copilote` it3a

**RISQUE** — Le vrai risque n'est pas visuel, il est de **rejouer une anatomie déjà tranchée pour de mauvaises raisons**. `parler[]` ressemble à une liste (comme les détenteurs) mais porte de la **prose acceptée par valeur** (comme la carte 1) — le réflexe « réutiliser l'un des deux » produira soit un `chemin` optionnel sur `LigneProposition` qui recrée le mur `LIBELLE_DES_CHAMPS` à 4 entrées une **3ᵉ fois**, soit une `designation` détournée sur `LigneDetenteur` qui fait porter une prose là où on attend un nom localisé.

**OBJECTION** — Le cadrage laisse trois champs candidats mais **sa propre phrase de démo** en tranche déjà un seul : `parler[]`. Traiter `jamais`/`cede_si` dans 3a romprait la règle « pas de "et" » — ce sont des scalaires REMPLACEMENT déjà couverts par l'anatomie de carte 1 existante, une tranche verticale à part.

**PROPOSITION** — (1) Un **3ᵉ composant**, `LigneReplique` — sœur des deux autres, ni l'un ni l'autre. (2) **AJOUT**, jamais remplacement — avec un état « déjà écrit » visible AVANT le clic Lancer. (3) **Étendre la carte 1**, pas une 4ᵉ carte. (4) Réutiliser le motif it2 (refus sans charge, nom du champ en prose) pour ne PAS toucher `LIBELLE_DES_CHAMPS`. (5) `BUG-106` se reproduit une 3ᵉ fois sur le plafond des 2 répliques — même dette assumée, pas une nouvelle enquête.

**VERDICT** — recevable sous réserve que le comité confirme (a) le périmètre = `parler[]` seul et (b) qu'un rôle/contrat `brain/` distinct porte la liste (hors de mon terrain).

---

# ANNEXE — Contrat de design

## A. Périmètre tranché

**3a couvre `monde.personnages[].caractere.parler[]` seul.** `jamais` et `cede_si` sont des scalaires REMPLACEMENT, anatomie déjà résolue par la carte 1 telle qu'elle existe — donc un « et » caché s'ils entrent ici. `cede_si` porte en outre une question narrative (injection conditionnée par rôle) qui n'a **rien à voir avec l'écran** : même si `narratif-ia` le déclare proposable, l'écran serait identique à FONCTION/APPARENCE/DESCRIPTION JOUEUR — **zéro contrat de design neuf**.

## B. Anatomie — troisième composant, sœur des deux autres

**`LigneReplique`, jamais une variante.** Motif, dans la continuité du désaccord n° 24 de l'it2 :
- `LigneProposition` porte un **diff scalaire** : `chemin` (→ `LIBELLE_DES_CHAMPS[chemin]`), `valeurAvant`/`valeurApres`. `parler[]` n'a pas de chemin exploitable sans **rouvrir le mur des 4 entrées** (veto TL-8, payé deux fois) ; rendre `chemin` optionnel casse la garantie de forme que `LigneProposition` porte pour la carte 1, pour un gain nul.
- `LigneDetenteur` porte un **nom + deux boutons**, où `designation` est un libellé **localisé** calculé par la carte, jamais une prose acceptée par valeur.
- `parler[]` demande : **du texte de prose, lu tel quel, accepté un par un, sans diff avant/après** (il n'y a rien à remplacer). Troisième forme, minimale.

```ts
export interface LigneRepliqueProps {
	/** Le texte candidat, rendu TEL QUEL — aucun `Field`, aucun `chemin`, aucune
	 *  dépendance à `LIBELLE_DES_CHAMPS` (mur des 4 entrées, veto TL-8, non rouvert). */
	texte: string
	decision?: 'acceptee' | 'rejetee'
	/** Vrai quand `PARLER_REPLIQUES` est déjà atteint côté dossier — cette ligne ne
	 *  peut plus être acceptée, mais reste REJETABLE. */
	accepterDesactive?: boolean
	titreAccepterDesactive?: string
	onAccepter: () => void
	onRejeter: () => void
	onOuvrirFiche: () => void
}
export interface LigneRepliqueHandle { focusAccepter: () => void }
```

Rendu (jetons **vérifiés** dans `src/styles/tokens/{colors,spacing,typography}.css`) : bloc de lecture aux mêmes jetons que `blocAvantStyle` — `1px solid var(--border-field)`, `var(--r-md)`, `var(--surface-inset)`, `var(--text-body)`, `var(--font-ui)`, `var(--fs-body)`, `white-space: pre-wrap` — un `<div>`, pas un `Field`. Eyebrow `eyebrowRepliqueProposee(n)`. Actions identiques à `LigneDetenteur` (`IconButton +/×`, puis `Badge` + `LIEN_OUVRIR_FICHE`). Filet `1px solid var(--border-rule)`.

## C. AJOUT, jamais remplacement, visible AVANT le clic

**Accepter AJOUTE au tableau existant.** Il n'y a pas de « case » à remplacer : `parler[]` est une **collection**.

Trois états exclusifs, dérivés de `personnage.caractere?.parler?.length ?? 0` **en ligne au rendu** (KR-013/113) : `0` → `MENTION_ZERO_REPLIQUE` · `1` → `MENTION_UNE_REPLIQUE` · `PARLER_REPLIQUES` (= 2, `curseurs.ts:151`) → **« Lancer » désactivé**, `title = TITRE_REPLIQUES_AU_PLAFOND`.

Ce plafond **n'est pas** validé par le schéma (« borne d'interface, non validée ») mais **est** appliqué par l'éditeur manuel (`BlocCaractere.tsx` cache « + Ajouter » au-delà de deux). Le copilote doit respecter la même borne, sinon il produit un dossier que l'éditeur manuel affiche dans un état que son propre message plafond dément.

## D. Carte — extension de la carte 1, pas une 4ᵉ

Le titre (« Compléter une fiche ») et le corps couvrent déjà `parler[]` **littéralement** : même fiche, même cible sélectionnée. Une 4ᵉ carte dupliquerait `CarteAssistant`/`BarreLancer`/le `Select` pour zéro gain et ajouterait un **3ᵉ bouton « Lancer »** sans segmentation réelle — contrairement à la carte 3 « Éclater le synopsis », qui change de **cible**.

`SegmentedControl` CHAMP gagne une **4ᵉ option**, `LABEL_CHAMP_PARLER = 'MANIÈRE DE PARLER'`, **littéral local** et non dérivé de `LIBELLE_DES_CHAMPS`. La sélectionner change l'anatomie de la zone de résultat : `LigneProposition` unique → `N × LigneReplique`.

⚠ **Hors de mon terrain, signalé** : `champChoisi` ne peut plus être un simple `ChampProseChemin`, et l'appel service change probablement de forme (nouveau rôle ou schéma étendu). Le contrat visuel tient quel que soit ce choix.

## E. Le piège — 3ᵉ occurrence, même parade

`LIBELLE_DES_CHAMPS` **reste à quatre entrées.** `parler[]` n'y entre pas. L'option de `SegmentedControl` est un **littéral** ; tout refus qui nomme le champ le fait **en prose française minuscule**, jamais via `label="…"`.

## F. Textes visibles — 8 constantes neuves

```ts
export const LABEL_CHAMP_PARLER = 'MANIÈRE DE PARLER'
export const MENTION_ZERO_REPLIQUE =
	"Ce personnage n'a encore aucune réplique type — une proposition acceptée s'ajoute, jusqu'à deux au total."
export const MENTION_UNE_REPLIQUE =
	"Ce personnage a déjà une réplique type écrite — une seule proposition de plus pourra s'ajouter."
export const TITRE_REPLIQUES_AU_PLAFOND =
	'Ce personnage a déjà ses deux répliques type — retirez-en une dans Personnages pour en proposer une autre.'
export const TITRE_REPLIQUE_PLAFOND_LIGNE = 'Plafond de deux répliques atteint.'
export function eyebrowRepliqueProposee(n: number): string {
	return `RÉPLIQUE PROPOSÉE ${n}`
}
export const TEXTE_AUCUNE_REPLIQUE_PROPOSEE =
	"Le copilote n'a rien proposé qui sonne juste pour ce personnage."
export const TEXTE_REFUS_TROP_LONG_REPLIQUES =
	"Le contexte est trop long pour proposer des répliques — raccourcissez d'abord la fiche de ce personnage."
export const MENTION_RELANCE_SANS_MEMOIRE_REPLIQUES =
	'Chaque lancer repart de zéro — une réplique refusée peut revenir, une réplique acceptée jamais.'
```

Deux à deux distinctes entre elles et des **20** déjà présentes dans `textes.ts` (relu en entier).

**Réutilisés tels quels** : `TITRE_COPILOTE_NON_CONFIGURE`, `TITRE_AUCUN_PERSONNAGE`, `TEXTE_ILLISIBLE`, `TEXTE_INDISPONIBLE`, `texteRefusAEcrire`, `LABEL_ACCEPTER`, `LABEL_REJETER`, `BADGE_ACCEPTE`, `BADGE_REJETE`, `LIEN_OUVRIR_FICHE`, `LABEL_LANCER`, `LABEL_ANNULER`, `TEXTE_CHARGEMENT`.
**NE PAS réutiliser** : `MENTION_RELANCE_SANS_MEMOIRE` (nomme « détenteur », faux ici) · `TEXTE_REFUS_TROP_LONG`/`_DETENTEURS` (chaque rôle porte le sien, règle it2 § 3.3).

## G. États — inventaire complet

| État | Rendu |
|---|---|
| 0 réplique écrite | `MENTION_ZERO_REPLIQUE` |
| 1 réplique écrite | `MENTION_UNE_REPLIQUE` |
| 2 écrites (plafond) | Lancer désactivé, `title = TITRE_REPLIQUES_AU_PLAFOND` |
| refus `canon.ton` absent | `⊘ ` + `texteRefusAEcrire('ton')` |
| refus contexte trop long | `⊘ TEXTE_REFUS_TROP_LONG_REPLIQUES` |
| échec réseau/config | `⊘ TEXTE_INDISPONIBLE` / `⊘ TEXTE_ILLISIBLE` |
| succès, liste vide | `TEXTE_AUCUNE_REPLIQUE_PROPOSEE`, **sans `⊘`** |
| succès, N candidats | `N × LigneReplique`, plafond dynamique par ligne |
| pendant l'appel | `role="status"`, `TEXTE_CHARGEMENT`, `LABEL_ANNULER` (inchangé) |

## H. Clavier

`Select PERSONNAGE` → `SegmentedControl CHAMP` (4 options) → mention (non focalisable) → `BarreLancer` → pour chaque `LigneReplique` : `+` puis `×`. Entrée = clic natif. Échap en vol = Annuler. **Focus post-décision : la prochaine ligne non décidée ET non `accepterDesactive`** — une ligne au plafond est **sautée**, jamais ciblée, précisément pour ne pas viser un bouton désactivé. À défaut, retour sur « Lancer ».

## I. `BUG-106` — troisième occurrence, pas une nouvelle enquête

Reproductible : accepter la **dernière** réplique qui atteint `PARLER_REPLIQUES` désactive « Lancer » dans le même rendu (même mécanisme que `constatVivant`). La vraie correction viserait la **même primitive bloquée**. Même parade déjà actée : le témoin de fin de flux choisit un scénario où la dernière décision est un **rejet**, et le cas « acceptation au plafond » est documenté en commentaire, non prouvé faux par un test. Cette tranche **n'aggrave pas** la dette et **ne la ferme pas**.

## J. `REJETÉ` — recopiables tels quels au § 8

1. **Étendre `LigneProposition` avec un `chemin` optionnel.** REJETÉ — `chemin` pilote `LIBELLE_DES_CHAMPS[chemin]` ; `parler[]` n'y a pas d'entrée et ne doit pas la gagner (mur des 4, veto TL-8, 3ᵉ occurrence). Rendre `chemin` optionnel casse la garantie de forme portée pour la carte 1, pour un gain nul.
2. **Détourner `LigneDetenteur.designation` pour porter le texte d'une réplique.** REJETÉ — `designation` est un libellé localisé calculé par la carte, pas une prose acceptée par valeur ; les confondre romprait le contrat que l'it2 a posé pour distinguer les deux composants.
3. **Une 4ᵉ carte « Manière de parler ».** REJETÉ — même cible, même sélecteur, duplication de coquille pour zéro segmentation réelle.
