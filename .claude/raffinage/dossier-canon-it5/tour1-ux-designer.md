# Tour 1 — ux-designer — `dossier-canon` it5 (tranche B1, `lieux[].acces`)

**RISQUE** — Le risque UX central est exactement celui que le roadmap nomme : une arête orientée rendue avec l'anatomie « MÈNE À » de `FicheIndice.tsx` peut se lire comme bidirectionnelle si le texte d'accompagnement est coupé ou reformulé par l'agent qui code. Sans légende explicite, l'auteur croira avoir relié deux lieux dans les deux sens, le découvrira au Temps 2, et ce sera un bug de compréhension du modèle, pas du code. Second risque, mineur : réutiliser l'anatomie « MÈNE À » verbatim (même libellé de colonne, même densité) sans distinguer le vocabulaire peut brouiller le registre domaine — un accès entre lieux n'est pas un indice qui en débloque un autre.

**OBJECTION** — Le cadrage tranche le schéma (arête orientée) mais ne fixe ni l'intitulé de section ni le texte qui porte ce fait à l'écran, alors que CLAUDE.md m'en rend explicitement responsable (« fait d'interface, pas seulement de schéma »). Laissé à un agent sans moi, « ACCÈS » seul en intitulé est ambigu — accès POUR entrer, ou accès QUI PART d'ici ? Je fixe le libellé et la légende en annexe : ne pas les réécrire.

**PROPOSITION** — Intitulé « ACCÈS DEPUIS CE LIEU » + légende qui énonce le sens unique en une phrase (texte exact en annexe) + auto-exclusion du lieu courant dans le sélecteur d'ajout (précédent KR-213/`FicheIndice`, applicable ici par KR-194).

**VERDICT** — recevable sous réserve : le contrat en annexe doit être suivi mot pour mot, sinon veto au tour 2 sur la formulation.

---

## ANNEXE — Contrat de design

### Périmètre écran

Une seule section nouvelle, ajoutée dans `FicheLieu.tsx`, insérée **après** le champ « DANGERS » et **avant** le pied de fiche (bouton « Retirer le lieu »). Ordre final de la fiche : NOM DU LIEU → DESCRIPTION → AMBIANCE → DANGERS → **ACCÈS DEPUIS CE LIEU** → [retirer] → [bandeau de refus]. Aucune modale, aucune visualisation de graphe (hors périmètre posé).

### Composants — tous existants, zéro composant maison

- `Card`, `Field` (×4, inchangés)
- `Select` (typé `SelectOption<string>`) — une instance par ligne d'accès déjà écrite + une instance dédiée pour la ligne d'ajout, précédent exact `FicheIndice.tsx` § « MÈNE À »
- `IconButton` (`tone="danger"`, `size={HIT_TARGET_MIN}`, glyphe `✕`) — retrait d'une ligne d'accès
- Wrapper de section : `<span>`/`<p>`/`<div>` bruts avec les styles ci-dessous (pas de primitive dédiée — même patron que la section « MÈNE À »)

### Textes exacts (à ne pas reformuler)

```
EYEBROW_ACCES          = 'ACCÈS DEPUIS CE LIEU'
LEGENDE_ACCES          = 'Les lieux que l'on peut rejoindre depuis celui-ci — un passage dans l'autre sens ne se déduit pas : ajoutez-le depuis l'autre lieu.'
TEXTE_AUCUN_AUTRE_LIEU = 'Aucun autre lieu à relier — ajoutez-en un second avec « + Ajouter un lieu… ».'
TEXTE_AJOUTER_ACCES    = '+ Ajouter un accès vers un autre lieu…'
```

- Libellé du `Select` par ligne déjà écrite : `label="LIEU CIBLE"` (mono, majuscules — registre interface, précédent `INDICE CIBLE`)
- `ariaLabel` du `Select` d'ajout : `"Ajouter un accès vers un autre lieu"`
- Libellé du bouton de retrait par ligne : `` `Retirer l'accès vers ${designation}` `` où `designation = localiserEntite('lieu', lieuCible, index)` (ou repli `avecOrpheline` : `` `Lieu introuvable — ${valeur}` ``)

### États

| État | Rendu |
|---|---|
| **Moins de 2 lieux au total, aucun accès écrit** | `<p>` seul avec `TEXTE_AUCUN_AUTRE_LIEU` — pas de `Select`, rien à choisir. Miroir exact de `indices.length < 2 && meneA.length === 0` dans `FicheIndice.tsx`. |
| **≥ 2 lieux, liste d'accès vide (cas normal au démarrage)** | Légende visible + `Select` d'ajout seul, valeur `''`, option 0 = `TEXTE_AJOUTER_ACCES`. Jamais de vide nu. |
| **N accès écrits** | N lignes (`Select` « LIEU CIBLE » + `IconButton` ✕), puis le `Select` d'ajout, valeur toujours remise à `''` après ajout (jamais sélectionnée). |
| **Accès vers un lieu retiré ailleurs (orphelin)** | `avecOrpheline(optionsTousLieux, cibleId, 'lieu')` — option de repli `Lieu introuvable — <id>`, jamais filtrée en silence (KR-021). |
| **Auto-référence déjà persistée** (KR-194) | Résout normalement dans la liste des lignes déjà écrites (liste complète, self compris) — **jamais** marquée orpheline. |
| **Auto-référence à l'ajout** | Exclue des options du `Select` d'ajout uniquement (`optionsTousLieux.filter(o => o.value !== lieu.id)`) — même self-exclusion que `FicheIndice.tsx:198`. |
| **Refus d'écriture** (`resultat.statut === 'refuse' \| 'absent'`) | Bandeau existant `EYEBROW_REFUS`/`TEXTE_ABSENT` de `refusMessages.ts`, inchangé, sous la section accès. |

### Tokens (annoncés vérifiés dans `src/styles/tokens/*.css` — à recontrôler à l'arbitrage)

```
eyebrowAccesStyle:  fontFamily: var(--font-mono); fontSize: var(--fs-eyebrow);
                    color: var(--text-label); letterSpacing: var(--track-eyebrow)
legendeAccesStyle:  fontFamily: var(--font-mono); fontSize: var(--fs-meta);
                    color: var(--text-faint); marginTop: var(--space-2)
listeAccesStyle:    display:flex; flexDirection:column; gap: var(--space-3);
                    marginTop: var(--space-3)
ligneAccesStyle:    display:flex; alignItems:center; justifyContent:space-between;
                    gap: var(--space-3)
```

Annoncés identiques à `legendeStyle`/`listeLignesStyle`/`enTeteLigneStyle` de `dossier-registres/components/styles.ts`. Aucun usage de `--accent` hors du `Select`/`IconButton` déjà porteurs de la sélection native. Le bouton « + Ajouter un lieu… » en bas de colonne liste n'est pas touché.

### Clavier (ergonomie de rédaction)

- Chaque `Select` est un `<select>` natif : flèches, Entrée/Espace, Échap — acquis gratuitement, aucun gestionnaire à écrire.
- Tab traverse : DANGERS → [lignes ACCÈS existantes, Select puis ✕, dans l'ordre du tableau] → Select d'ajout → bouton Retirer le lieu. Ordre visuel = ordre DOM, aucun `tabIndex` manuel.
- Le retrait d'une ligne d'accès est immédiat (pas de modale, même doctrine que le retrait de lieu).

### Registre de langue

Tout le texte de cette section est **interface pure** — aucune prose destinée au joueur n'est introduite par ce champ, au même titre que `mene_a[]` : `acces` reste une référence structurelle par id. **Ne pas ajouter de champ de prose « comment on y accède »** dans cette itération — hors périmètre posé.

### Fichiers concernés

- `src/features/dossier-canon/components/FicheLieu.tsx` (181 l.) — section à ajouter ; props `lieux: Lieu[]`, `onAjouterAcces`, `onChangerAcces`, `onRetirerAcces` à charge de l'architecte
- `src/features/dossier-canon/components/PanneauLieux.tsx` (364 l., KR-112 : à 36 lignes du signal de scission)
- `src/brain/dossier/types.ts` — la section ci-dessus suppose `acces?: string[]` ; si l'archi choisit une forme objet, le contrat de texte reste valable, seule la lecture de `cibleId` change.
