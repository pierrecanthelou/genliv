# Tour 2 — `ux-designer` · `dossier-copilote` it4

**NOMMÉMENT — `tech-lead`, champ 2. Je tranche pour `but.libelle`, contre `description_joueur`.** ⚠ **Le registre le prouve lui-même** : `LIBELLE_DES_CHAMPS['monde.personnages[].description_joueur'].hint = 'lue par le joueur'` (`brain/dossier/libelles.ts:44`) — **exactement le canal que R1 interdit**. Et `BlocPlanActions.tsx:25` documente déjà `but.libelle` comme *« interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur »*. **Ton § 7 disait ce point « impossible à vérifier » : le narratif l'a vérifié à ta place, avant le code, avec une preuve DÉJÀ ÉCRITE AU DÉPÔT.**

**TL3a-3** — ⚠ **je ne l'abandonne pas, je le BORNE.** Il visait une ligne à **UNE** prose anonyme — rien à distinguer, donc aucun `label`. **Ici deux champs indistinguables sans nom** : **hors de son périmètre, pas une entorse. Le corollaire reste entier ailleurs.**

**`CarteAssistant.badge`** — **confirmé, part en lot 2 avec l'import `Badge`.** La carte garde tout son sens sans lui : **il ne servait qu'aux placeholders « Bientôt », qui n'existent plus une fois les six cartes livrées.**

**Ma réserve registre (synopsis) — RETIRÉE.** Motif neuf du tech-lead accepté ; j'adopte `texteRefusAEcrire(LIBELLE_DES_CHAMPS['canon.mj.synopsis_mj'].libelle)`, **mon littéral dédié disparaît**.

⚠ **CONSÉQUENCE NOUVELLE** — `but.libelle` gagnant, **il lui faut SA PROPRE entrée (la 6ᵉ)**, verbatim de `BlocPlanActions.tsx`, **qui se repointe** — **même motif que ta synopsis, sinon second domicile le jour même où j'en refuse un autre. Coût à chiffrer par toi.**

**Ordre `PARTIES_REQUISES`** — **synopsis d'abord** : le blocage **spécifique à la carte** prime sur le filtre **générique** des six rôles.

---

## ANNEXE

### Anatomie révisée de `LigneFichePersonnage`
```ts
interface LignePersonnageProposeProps {
	eyebrow: string
	champs: { label: string; valeur: string }[]   // 2 éléments — labels RÉSOLUS PAR LA CARTE, jamais un `chemin` porté par la ligne
	decision?: 'acceptee' | 'rejetee'
	onAccepter: () => void; onRejeter: () => void; onOuvrirFiche: () => void
}
```
⚠ **Pourquoi j'abandonne `chemin: CheminLibelle`** : `but.libelle` n'a **aucune** entrée au registre aujourd'hui (nesting à **trois** niveaux), et faire porter un `chemin` par la ligne **la coupleraient à un type qui gagne, la même itération, des entrées de forme différente** (top-level `canon.*` contre `monde.personnages[].*`). **Résoudre le `label` côté carte découple la ligne de cette irrégularité** — cohérent avec « sœur, jamais paramétrée ».

### Registre — ⚠ **DEUX entrées neuves, pas une**
```ts
'canon.mj.synopsis_mj': { libelle: 'SYNOPSIS MJ', hint: 'interne — consigne injectée au modèle' },
	// verbatim de PanneauCanon.tsx — texte exact à vérifier au lot 1
'monde.personnages[].but.libelle': {
	libelle: "CE QU'IL VEUT",
	hint: "interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur",
},  // verbatim de BlocPlanActions.tsx:25 et :154, QUI SE REPOINTE dans le même lot
```

### Textes exacts — mise à jour tour 2
```ts
export const CARD3_TITRE = 'Éclater le synopsis'   // INCHANGÉ
export const CARD3_CORPS =
	"Propose une distribution de personnages à partir du synopsis, de l'accroche et du ton."
// ⚠ INCHANGÉ MALGRÉ le changement de champ 2 : ce corps décrit la SOURCE, pas la forme de sortie.
// CARD3_BADGE SUPPRIMÉ.

export function eyebrowPersonnagePropose(n: number): string { return `PERSONNAGE PROPOSÉ ${n}` }

export const MENTION_PERSONNAGE_SANS_NOM =
	"Un personnage accepté n'a pas encore de nom — donnez-lui-en un dans sa fiche (Personnages → Identité)."

// TEXTE_REFUS_SYNOPSIS_A_ECRIRE SUPPRIMÉ (retiré au tour 2) — remplacé par le générique
// des cinq cartes sœurs : texteRefusAEcrire(LIBELLE_DES_CHAMPS[echec.chemin].libelle)
```

### `PARTIES_REQUISES` — ordre tranché
```ts
['canon.mj.synopsis_mj', 'canon.ton']
```
**Motif** : le premier refus nommé à l'écran doit être **le manque le plus spécifique à CETTE carte** — « pas de synopsis, rien à éclater » — **avant le filtre générique partagé par les six rôles**. *Un auteur qui ouvre cette carte sans synopsis doit lire d'abord ce qui lui manque **pour ce geste-là**.*

### Parcours clavier, jetons — **inchangés** (voir tour 1)

## REJETÉ — mise à jour (tour 2)
- **`TEXTE_REFUS_SYNOPSIS_A_ECRIRE`** *(mon littéral dédié du tour 1)* — **RETIRÉ** : le tech-lead lève lui-même son veto avec un motif neuf ; le générique + registre suffit.
- **`champs: { chemin: CheminLibelle; valeur: string }[]`** *(mon anatomie du tour 1)* — **RETIRÉE** : mélanger les deux formes de chemins dans le typage de la ligne est **plus fragile** que de résoudre les `label` côté carte.
- ⚠ **Dupliquer le libellé de `but.libelle` en littéral local à `dossier-copilote`** *(option évaluée puis écartée CE TOUR)* — **REJETÉE : second domicile pour un fait déjà canonique ailleurs — exactement la faute que je reprochais à un `nom` dupliqué au tour 1, RETOURNÉE CONTRE MOI si je l'acceptais ici.**
- **Reste du REJETÉ du tour 1 inchangé** : saisie du nom à l'acceptation · `localiserEntite` sur un brouillon (**confirmé par l'orchestrateur**) · badge ou ton alarmiste sur « sans nom » · le trou « porteur disparu », **sans objet**.
