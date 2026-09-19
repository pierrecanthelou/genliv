# Tour 1 — `ux-designer` · `dossier-copilote` it4

**RISQUE** — ⚠ **Le point de rupture n'est pas le NOM mais la DÉSIGNATION d'une entrée de la liste AVANT TOUT ID.** Les cinq lignes livrées appellent toutes `localiserEntite(espace, entite, index)` sur une entité **déjà dans `dossier.monde.*`**. Ici l'entité **n'existe nulle part** avant l'acceptation. Coder « vite » reviendrait à bricoler `localiserEntite('pnj', {}, i)` sur un **objet fantôme** — hors contrat de la fonction, qui suppose une **position stable au tableau**.

**OBJECTION** — Le cadrage pose « qui nomme le brouillon » comme le nœud de l'itération, mais **le dépôt a DÉJÀ tranché ce nœud ailleurs, DEUX FOIS** :
1. La création manuelle sème un personnage **sans nom** (mesure 2), et `PanneauPersonnages`/`ListRow` l'affichent déjà via le repli `localiserEntite` → « PNJ n°N (sans nom) ».
2. ⚠ **`PanneauJalonsFins.tsx` porte le PRÉCÉDENT EXACT d'un brouillon PAS ENCORE PERSISTÉ** : `libelleLigneAjoutJalon` rend un **LITTÉRAL** (« Nouveau jalon ») tant que `nom` est vide, **jamais le repli indexé de `localiserEntite`**, qui est **réservé aux entités déjà persistées**.

**Rouvrir la question comme neuve ignore ces deux précédents.**

**PROPOSITION** — Ligne de proposition : eyebrow `PERSONNAGE PROPOSÉ {n}` (`eyebrowPersonnagePropose(n)`, même moule que `eyebrowRepliqueProposee`/`eyebrowRelationProposee` — deux précédents, **zéro jeton neuf**). Après acceptation : même désignation inchangée + `Badge` + lien, comme les cinq sœurs. Dans `PanneauPersonnages`, le personnage accepté apparaît « PNJ n°N (sans nom) » — **comportement déjà livré et testé pour la création manuelle, donc acceptable PAR CONSTRUCTION, pas par tolérance**. **AUCUN geste de saisie du nom à l'acceptation** : `BlocIdentite.tsx` possède déjà `nom` en écriture, « → Ouvrir la fiche » y mène.

**VERDICT** — **recevable sous réserve** : `LIBELLE_DES_CHAMPS` et le refus « à écrire » du contexte synopsis posent un vrai **problème de registre**, à trancher côté tech-lead/narratif avant code.

---

## ANNEXE

### Nommage
- **Carte : `CarteEclaterSynopsis.tsx`.** ⚠ **Réutilise le SLOT `CARD3_*` de `textes.ts`** — ces constantes existent **déjà** comme placeholder « Bientôt — itération 4 » (`CARD3_TITRE = 'Éclater le synopsis'`, `CARD3_BADGE`, `CARD3_CORPS`). **`CARD3_BADGE` est SUPPRIMÉ**, `CARD3_CORPS` réécrit. **Ne PAS créer de `CARD7`** : le slot 3 était réservé pour exactement cette carte.
- **Ligne : `LigneFichePersonnage.tsx`**, **sœur** des quatre livrées, jamais une variante paramétrée : **aucune des quatre ne peut porter PLUSIEURS champs de prose sous une seule paire d'actions** sans qu'on lui ajoute un membre propre à ce seul appelant — le veto de 3a/3b, et le motif exact qui a fait `LigneRelation` sœur.

### Textes exacts
```ts
export const CARD3_TITRE = 'Éclater le synopsis'   // INCHANGÉ
export const CARD3_CORPS =
	"Propose une distribution de personnages à partir du synopsis, de l'accroche et du ton."
// CARD3_BADGE SUPPRIMÉ — la carte n'est plus « Bientôt ».

export function eyebrowPersonnagePropose(n: number): string {
	return `PERSONNAGE PROPOSÉ ${n}`
}

export const MENTION_PERSONNAGE_SANS_NOM =
	"Un personnage accepté n'a pas encore de nom — donnez-lui-en un dans sa fiche (Personnages → Identité)."
// Mention PERMANENTE (famille de MENTION_RELATION_CREEE), sous la liste : dit
// D'AVANCE ce que l'auteur va voir dans Personnages, jamais une surprise après coup.

export const TEXTE_REFUS_SYNOPSIS_A_ECRIRE =
	"Ce dossier n'a pas encore de synopsis — écrivez-le d'abord, dans Canon."
```
**Réutilisés SANS reformulation** : `LIBELLE_DES_CHAMPS['fonction'|'apparence'|'description_joueur']`, `LABEL_ACCEPTER`, `LABEL_REJETER`, `BADGE_ACCEPTE`, `BADGE_REJETE`, `LIEN_OUVRIR_FICHE`, `TEXTE_INDISPONIBLE`, `TEXTE_ILLISIBLE`, `TITRE_COPILOTE_NON_CONFIGURE`.

### Anatomie de `CarteEclaterSynopsis`
⚠ **Pas de `Select` de ciblage** — cette carte **ne cible aucune entité existante**, sa source est `canon.*` seul. `BarreLancer` désactivée **uniquement** sur `indisponible`. Corps : `BarreLancer` → état d'échec → liste de `LigneFichePersonnage` (séparateur `separateurLigneStyle`) → `MENTION_PERSONNAGE_SANS_NOM` **en mention permanente**, jamais conditionnelle à une acceptation (*l'auteur doit le savoir AVANT d'accepter*).

### Anatomie de `LigneFichePersonnage`
```ts
interface LignePersonnageProposeProps {
	eyebrow: string                                      // calculé par la CARTE
	champs: { chemin: CheminLibelle; valeur: string }[]  // 1..3 Field, JAMAIS 'nom'
	decision?: 'acceptee' | 'rejetee'
	onAccepter: () => void; onRejeter: () => void; onOuvrirFiche: () => void
}
```
Rendu : eyebrow → pour chaque champ un `Field` **en lecture seule** (`label`/`hint` = `LIBELLE_DES_CHAMPS[chemin]`, `onChange={() => {}}`, doctrine de `LigneProposition` — **PAS `blocLectureRepliqueStyle`**, réservé à la prose sans label propre) → ⚠ **UNE SEULE paire d'actions sous l'ensemble** (bloc indivisible, **doctrine GROUPE du plan it1 § 3, jamais construite jusqu'ici faute de rôle candidat — celui-ci l'est**). Après décision : `Badge` + `LIEN_OUVRIR_FICHE` sur acceptée seule → `onSelectSection('personnages')`, **jamais un id ciblé** (rouvrirait BUG-082, veto acté). **Aucune désactivation du `+`** : pas de plafond de document sur une liste de personnages.

### États
- **Vide-mais-refus** : même chemin que `personnage-relations` — échoue **en FORME**, rejeu unique, `TEXTE_ILLISIBLE`. **Aucun texte neuf** : ce rôle écrit du neuf (RÉDACTION), donc **vide = refus**.
- ⚠ **Contexte insuffisant — RÉSERVE** : `canon.synopsis_mj` **n'a AUCUNE entrée dans `LIBELLE_DES_CHAMPS`** (verrouillé à 4). Le générique `texteRefusAEcrire(libelle)` **ne peut donc pas nommer ce champ sans un 5ᵉ registre**, refusé par ce même veto. Sortie : **un littéral dédié au rôle**, hors registre partagé, sur le modèle des `TEXTE_REFUS_CIBLE_A_ECRIRE_XXX` déjà écrits par rôle.

### Parcours clavier
Identique aux cinq cartes livrées. Échap pendant le chargement rend le focus à `Lancer` ; après décision, focus vers le `+` de la ligne non décidée suivante, sinon `Lancer` — **même `focoApresDecision` que `CarteCompleterRelations`, aucun motif neuf**.

### Jetons
**Aucun jeton neuf.** `eyebrowStyle`, `separateurLigneStyle`, `listeDetenteursStyle`/`listeDejaEcritStyle`, `actionsDetenteurStyle` — tous déjà dans `components/styles.ts`. `Field`, `Badge`, `IconButton` inchangés.

## REJETÉ — pour le registre (BUG-082)
- **Un champ de saisie du NOM à l'acceptation** — casserait le contrat « accepter/refuser, jamais saisir » commun aux cinq cartes livrées, **sur la dernière itération, sans filet**. `nom` appartient à `BlocIdentite.tsx` ; le dupliquer ici en ferait un **second domicile** (anti-patron du rejet de `LIBELLES_CERTITUDE` à l'it2).
- ⚠ **Appeler `localiserEntite` sur un brouillon (`{}` ou `{fonction}`)** — **hors contrat de la fonction**, qui suppose un index STABLE dans une collection **persistée** ; `PanneauJalonsFins` tranche explicitement dans l'autre sens.
- **Étendre `LIBELLE_DES_CHAMPS` à 5 entrées pour `canon.synopsis_mj`** — veto tech-lead reconduit à 3a/3b/3c, non rouvrable sans motif neuf qu'aucune mesure ne fournit.
- **Un badge ou un ton alarmiste sur « sans nom »** — ce n'est **pas une erreur, c'est l'état normal d'un personnage neuf** : `mentionStyle`, jamais `refusSyncStyle`.
- **Résoudre le trou « porteur disparu » pour cette carte** — **sans objet** : rien n'est disparu, l'entité **n'existe pas encore** avant acceptation.
