# Tour 2 — `ux-designer` · `dossier-copilote` it3a

**RISQUE** — Mon § G portait la faute que trois collègues ont nommée : « succès, liste vide, sans `⊘` » recopiait la règle de l'it2 sur un rôle de **RÉDACTION** plutôt que de **DÉSIGNATION**. Une carte qui demande « comment parle-t-il ? » n'a pas de « personne » à répondre honnêtement — le silence n'est pas une réponse.

**OBJECTION** — **Je retire `TEXTE_AUCUNE_REPLIQUE_PROPOSEE`.** Le discriminant de `narratif-ia` (§ C4) et `TL3a-9` est le bon. Le silence du modèle est un défaut de FORME, motif `'vide'`, jamais un succès.

**PROPOSITION** — Le cas ne crée **aucun texte neuf** : il rentre dans la branche `echec.statut === 'illisible'` déjà rendue par la carte 1, où `validerSortie` confond déjà schema/vide/marqueur/identifiant sous `TEXTE_ILLISIBLE` — même convention, aucune exception. Ma table d'états perd une ligne ; le contrat devient plus simple, pas moins.
En prime, un **second correctif** : ma `MENTION_RELANCE_SANS_MEMOIRE_REPLIQUES` du tour 1 recopiait « une réplique acceptée jamais » de la carte 2 — **faux ici** (narratif-ia § F : une réplique acceptée n'est **pas** injectée, elle **peut** revenir). Réécrite en annexe.

**VERDICT** — RETIRÉ sur le vide ; corrigé sur la relance. Les deux **resserrent** le contrat.

---

# ANNEXE

## 0. Verdicts sur les conflits

### C1 — LE VIDE → **RETIRÉ** *(corps principal)*

### C2 — AJOUT → **MAINTENU**, réponse nommée au PM
L'AJOUT n'est pas une variante que j'invente : c'est la **seule** anatomie compatible avec le contrat que le tech-lead a posé en TL3a-1 (« `parler[]` est une LISTE : accepter k écrit k, par AJOUT ») et avec l'invariant de `narratif-ia` § C5.1 (le plafond se vérifie **par ligne**). Traiter la liste « comme une unité » romprait les deux : il faudrait que le modèle rende un tableau complet remplaçant l'existant, ce qui contredit « accepter k écrit k » et **supprime la possibilité de n'accepter qu'une des N propositions**. Ce n'est pas une 3ᵉ variante décorative : c'est la **même** anatomie que `LigneDetenteur`, déjà livrée à l'it2. Le report coûterait **plus** : un 4ᵉ validateur « liste complète », distinct de celui sur lequel tout le monde s'est aligné.

### C6 — Carte neuve → **CONCÉDÉ à TL3a-13**
Correct, et je ne le savais pas au tour 1 : `OPTIONS_CHAMP` est un `.map()` sur `CHAMPS_PROPOSABLES` (plafonné à 3) et son `label` est lu de `LIBELLE_DES_CHAMPS` (veto, fichier interdit). Étendre le `SegmentedControl` n'est pas seulement indésirable, c'est **fermé au compilateur**.
**Lisibilité à quatre cartes** : je ne propose **aucune** réorganisation. `pageStyle` est déjà une pile verticale scrollable (`overflowY: auto`, `gap: var(--space-8)`) conçue pour un nombre de cartes non borné. Proposer un accordéon ou des onglets ici serait le **biais de fidélité** que mon mandat m'interdit sur une itération qui n'est pas visuelle.

### C7 — Ciblage → **NON**, je maintiens le `Select` non filtré. Réponse nommée à `narratif-ia`.
Ton argument vaut **pour la carte 2** : là, la cible **est** le constat. Ici c'est faux : mon état « 1 réplique déjà écrite » est un cas **légitime et atteignable** où l'auteur veut en proposer une 2ᵉ. Ton constat `personnage-sans-voix` est basé sur une **présence** (`length > 0`), pas sur le **plafond** (`PARLER_REPLIQUES = 2`) — filtrer rendrait Corvin (1 réplique, **sous** plafond) **définitivement inatteignable**, exactement le trou que tu as toi-même mesuré.
Argument technique, vérifié par lecture de `Select.tsx` : c'est un `<select>` **natif**, `options: {value,label}[]` — **aucun emplacement** pour un badge. Filtrer silencieusement serait un vide non motivé ; un badge demanderait un composant maison. Le `Select` liste **tous** les personnages, même algorithme que la carte 1.

### `BUG-106` → **confirmé, et ma règle du tour 1 ne suffisait PAS — je corrige mon propre tour 1**
Ma phrase (« la ligne au plafond est sautée ») était correcte d'intention mais **sous-spécifiée** : si le calcul du plafond relit `…caractere.parler.length` **en LIVE** au moment du focus post-décision, elle retombe dans la course de BUG-097/106 — la fonction s'exécute **avant** que l'abonnement ait vu sa propre écriture. Précision obligatoire (§ 2.4) : le compteur est dérivé d'un **gel** + des décisions **de la session**, jamais du dossier vivant. **Avec cette précision la parade tient ; sans elle, non.**

### Nom du composant → **je tranche `LigneReplique`**
Le dépôt suit **deux** conventions selon l'anatomie : `LigneProposition` nomme le **mécanisme** (une proposition-diff), `LigneDetenteur` nomme l'**entité** affichée. La carte 4 copie l'anatomie de `LigneDetenteur` — donc le nom suit l'entité. `LigneValeurProposee` gommerait cette distinction actée à l'it2 (n° 24). Fichier : `LigneReplique.tsx`.
*Non bloquant* : `CarteVoixPersonnage.tsx` ne fait écho ni au rôle ni au titre visible ; `CarteRepliquesPersonnage.tsx` éviterait une divergence de vocabulaire. Pas mon terrain de veto.

## 1. Statut de mes points du tour 1

| § | Point | Statut |
|---|---|---|
| A | `parler[]` seul | **MAINTENU** |
| B | 3ᵉ composant sœur | **MAINTENU**, nom tranché `LigneReplique` |
| C | AJOUT jamais remplacement | **MAINTENU, DURCI** — appuyé sur TL3a-1 + narratif § C5.1 |
| D | Extension carte 1 | **RETIRÉ** — TL3a-13 ferme la route au compilateur |
| E | `LIBELLE_DES_CHAMPS` à 4 | **MAINTENU**, encore plus vrai : plus de `SegmentedControl` |
| F | 8 constantes | **RÉVISÉ** (§ 2.3) |
| G | États | **RÉVISÉ** (§ 2.4) — ligne « succès vide » retirée |
| H | Clavier | **RÉVISÉ** — mécanisme de focus précisé |
| I | `BUG-106` | **MAINTENU, précisé** |
| J.1/J.2 | Les deux `REJETÉ` | **MAINTENUS** |
| J.3 | 4ᵉ carte | **RETIRÉ** — c'est désormais ma propre proposition |

**§ J final, recopiable tel quel** :
1. **Étendre `LigneProposition` avec un `chemin` optionnel.** REJETÉ — `chemin` pilote `LIBELLE_DES_CHAMPS[chemin]` ; `parler[]` n'y a pas d'entrée et ne doit pas la gagner (3ᵉ occurrence).
2. **Détourner `LigneDetenteur.designation`.** REJETÉ — libellé localisé calculé par la carte, pas une prose acceptée par valeur.
3. **Traiter `parler[]` en REMPLISSAGE/REMPLACEMENT.** REJETÉ — contredit TL3a-1 et l'invariant narratif § C5.1 (plafond vérifié par ligne).
4. **Filtrer le `Select` sur les signalés.** REJETÉ — rend inatteignable tout personnage à 1 réplique (sous plafond) ; `Select` natif sans emplacement pour un indicateur.
5. **Nommer le composant `LigneValeurProposee`.** REJETÉ — l'anatomie copie `LigneDetenteur` (nommage par entité).
6. **Calculer `accepterDesactive`/le focus depuis le dossier LIVE.** REJETÉ — course avec l'abonnement réveillé par sa propre écriture, 4ᵉ occurrence de BUG-106.
7. **Étendre le panneau (accordéon/onglets).** REJETÉ — refonte visuelle hors cadre ; `pageStyle` est déjà une pile scrollable sans plafond.

## 2. Contrat de design final

### 2.1 Anatomie
Carte 4 `CarteVoixPersonnage.tsx`, quatrième `<CarteAssistant>`, **après** `CarteTisserIndices`, **avant** le placeholder « Bientôt ».

```ts
export interface LigneRepliqueProps {
	texte: string
	decision?: 'acceptee' | 'rejetee'
	/** Plafond atteint compte tenu des répliques gelées + des acceptations DE CETTE
	 *  SESSION — jamais lu du dossier vivant (§ 2.4). */
	accepterDesactive?: boolean
	titreAccepterDesactive?: string
	onAccepter: () => void; onRejeter: () => void; onOuvrirFiche: () => void
}
export interface LigneRepliqueHandle { focusAccepter: () => void }
```
Jetons **vérifiés par lecture directe** : `1px solid var(--border-field)`, `var(--r-md)`, `var(--surface-inset)`, `var(--text-body)`, `var(--font-ui)`, `var(--fs-body)`, `white-space: pre-wrap`. Actions identiques à `LigneDetenteur`. Filet : `separateurLigneStyle` **existant**.

Bloc « déjà écrit » **inline** (pas un composant — statut du badge+message de `CarteTisserIndices`), styles ajoutés à `styles.ts` avec les jetons de `blocAvantStyle`/`legendeAvantStyle`, **aucune valeur neuve**.

### 2.2 Ordre de rendu
`Select PERSONNAGE` (non filtré) → bloc DÉJÀ ÉCRIT (0-2, non focalisable) + mention → `BarreLancer` (3ᵉ consommateur de `BarreLancerHandle`) → `MENTION_RELANCE_SANS_MEMOIRE_REPLIQUES` → échec (`⊘`) → `N × LigneReplique` → `IssueList` si refus.
**Changer de personnage abandonne la proposition et le gel** — même geste que `handleChangerConstat`.

### 2.3 Textes exacts
```ts
export const CARD4_TITRE = 'Écrire des répliques'
export const CARD4_CORPS =
	"Propose des répliques types, dans la voix de ce personnage — jusqu'à deux par personnage."
export const EYEBROW_DEJA_ECRIT = 'DÉJÀ ÉCRIT'
export const MENTION_ZERO_REPLIQUE =
	"Ce personnage n'a encore aucune réplique type — une proposition acceptée s'ajoute, jusqu'à deux au total."
export const MENTION_UNE_REPLIQUE =
	"Ce personnage a déjà une réplique type écrite — une seule proposition de plus pourra s'ajouter."
export const TITRE_REPLIQUES_AU_PLAFOND =
	'Ce personnage a déjà ses deux répliques type — retirez-en une dans Personnages pour en proposer une autre.'
export const TITRE_REPLIQUE_PLAFOND_LIGNE = 'Plafond de deux répliques atteint.'
export function eyebrowRepliqueProposee(n: number): string { return `RÉPLIQUE PROPOSÉE ${n}` }
export const TEXTE_REFUS_CIBLE_A_ECRIRE_REPLIQUES =
	"Ce personnage n'a encore aucune identité écrite — complétez d'abord sa fiche, dans Personnages."
export const TEXTE_REFUS_TROP_LONG_REPLIQUES =
	"Le contexte est trop long pour proposer des répliques — raccourcissez d'abord la fiche de ce personnage."
// CORRIGÉ au tour 2 : l'asymétrie de la carte 2 est FAUSSE ici — une réplique acceptée
// N'EST PAS injectée, elle PEUT revenir. Le texte nomme l'eyebrow où repérer le doublon.
export const MENTION_RELANCE_SANS_MEMOIRE_REPLIQUES =
	"Chaque lancer repart de zéro, sans mémoire des répliques déjà proposées ou acceptées — un doublon reste possible, comparez avec DÉJÀ ÉCRIT avant d'accepter."
```
**RETIRÉS du tour 1** : `LABEL_CHAMP_PARLER` (plus de `SegmentedControl`), `TEXTE_AUCUNE_REPLIQUE_PROPOSEE` (concédé C1).
**NE PAS réutiliser** : `MENTION_SAVOIR_CREE` · `TEXTE_REFUS_TROP_LONG`/`_DETENTEURS`/`TEXTE_REFUS_CIBLE_A_ECRIRE` (chaque rôle porte le sien) · `MENTION_RELANCE_SANS_MEMOIRE` (asymétrie fausse ici).

### 2.4 États + la dérivation qui ferme BUG-106

| État | Rendu |
|---|---|
| 0 réplique | pas de bloc · `MENTION_ZERO_REPLIQUE` |
| 1 déjà écrite | `EYEBROW_DEJA_ECRIT` + 1 bloc · `MENTION_UNE_REPLIQUE` |
| 2 déjà écrites | 2 blocs · Lancer désactivé, `title = TITRE_REPLIQUES_AU_PLAFOND` |
| refus `canon.ton` | `⊘ ` + `texteRefusAEcrire('ton')` |
| refus cible sans identité | `⊘ TEXTE_REFUS_CIBLE_A_ECRIRE_REPLIQUES` |
| refus trop long | `⊘ TEXTE_REFUS_TROP_LONG_REPLIQUES` |
| sortie illisible — **aucune distinction de sous-motif** | `⊘ TEXTE_ILLISIBLE` |
| échec réseau/config | `⊘ TEXTE_INDISPONIBLE` |
| succès, N candidats | `N × LigneReplique` |
| pendant l'appel | `role="status"`, `TEXTE_CHARGEMENT`, `LABEL_ANNULER` |
| changement de personnage | abandonne proposition + gel |
| écriture refusée | `IssueList`, proposition et décisions conservées |

```ts
// figé au clic Lancer, jamais relu du dossier vivant :
const dejaEcritesGelees = personnageParId(personnageId)?.caractere?.parler ?? []
// dérivé EN LIGNE à chaque rendu (KR-013/113), jamais un state dupliqué :
const compteurAccepte = dejaEcritesGelees.length + Object.values(decisions).filter((d) => d === 'acceptee').length
const accepterDesactive = compteurAccepte >= PARLER_REPLIQUES  // importée, jamais retapée
```
Focus post-décision : la prochaine ligne où `decisionsApres[i] === undefined` **ET** `compteurApres(decisionsApres) < PARLER_REPLIQUES` — sinon retour sur Lancer. Compteur recalculé sur `decisionsApres` **passé en paramètre**, jamais relu d'un state pas encore commité.

⚠ **Hors de mon terrain, signalé** : l'écriture crée `caractere` **sans semer `CURSEURS_INITIAUX`** — `{...p, caractere: {...(p.caractere ?? {}), parler: [...(p.caractere?.parler ?? []), texte]}}` (narratif § C5.2, KR-221).

### 2.5 Clavier
`Select` → (bloc DÉJÀ ÉCRIT, non focalisable) → `BarreLancer` (Entrée = clic natif, Échap en vol = Annuler) → pour chaque ligne non décidée : `+` puis `×`. Une ligne au plafond est **sautée**, jamais ciblée.
