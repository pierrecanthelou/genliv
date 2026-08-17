RISQUE — **La section 09.** `Climat.effets_regles` est un `Delta[]`, or le plan-cible y veut des « effets chiffrés sur les règles (PE, malus de jet) » : les quatre entrées de `DELTAS` sont à cible unique, sans opérande entier — `destinations.ts` (l. 434-441) le constate déjà noir sur blanc. L'écran Climat oblige donc soit à **ouvrir la grammaire des deltas** (rayon : `deltas.ts`, `validate.ts`, `destinations.ts`, deux fixtures, `couverture.test.ts`), soit à écrire d'abord la règle dans `docs/REGLES-DU-JEU.md`, qui n'en porte aucune (KR-130). C'est un lot contrat lourd déguisé en « une section de plus ».

OBJECTION — **Le périmètre écrit est incomplet.** Le roadmap (§ 2 l. 162 et § 5) assigne *aussi* à n° 6 l'écran d'édition des **jalons & fins**, motif « engage le registre `DELTAS` ». Cinq sections, donc, plus `tree-canvas`, plus `acces`. À 4 itérations c'est faux ; à 6+ la feature ne se démontre plus en une phrase. On coupe **avant** de cadrer.

PROPOSITION — **(a) `tree-canvas` hors périmètre** : 1 703 lignes câblées sur `BookNode`/`Edge`/`NODE_KINDS`/`nodeTitle`, le « repointage » est une réécriture, et pan/zoom/glisser n'ont **aucun instrument** (skill § Instruments : specs navigateur, « différé »). n° 6 livre la *donnée* du graphe (`indices[].mene_a`) ; le canevas est une feature à lui seul. **(b) `acces`** : je maintiens KR-200 — aucun lot de n° 6 ne nomme un fichier de `dossier-canon`. Porteur propre : une **itération 5 de `dossier-canon`**, qui possède déjà tous les fichiers. Ce n'est pas un veto d'isolation (aucun import croisé), c'est une propriété de fichier revendiquée par deux specs. **(c) Ordre** : une racine par itération, un seul lot contrat chacune (KR-190) — Indices, Quêtes, Événements, Climat, le plus cher en dernier.

VERDICT — **recevable sous réserve** (périmètre à couper, ordre imposé).

---

## Annexe technique

### Contrats `brain/` envisagés — un seul lot `contrat` par itération, jamais deux (KR-190)

Rayon constant du lot contrat, à ne pas redécouvrir : `src/brain/dossier/types.ts`, `tables.ts`, `destinations.ts`, `validate.ts`, `__fixtures__/dossier-minimal.json`, `__fixtures__/dossier-reference.json`, `couverture.test.ts`, `src/brain/index.ts`.

| Itér. | Racine | Contrat de schéma | Note |
|---|---|---|---|
| 1 | `monde.indices[]` | `Indice extends Entite { verite?, formulation_joueur?, mene_a?: string[] }` | Ferme le trou nommé en `open_questions` de `dossier-fiches` (l. 348). `mene_a` = la **donnée** du graphe. |
| 2 | `monde.quetes[]` | `donneur_id` (→ `REFERENCES_SIMPLES`, espace `pnj`), `objectif?`, `etapes?`, `echeance?`, `lie_au_canon?` | `recompense: Delta[]` **inchangé** — `DELTAS` suffit (confirmé par `dossier-objets`, `open_questions` l. 142). |
| 3 | `monde.evenements[]` | `lie_a_histoire?: boolean`, `nature?` (registre fermé `NATURES_EVENEMENT` + ligne `ENUMERES_FERMES`) | `monstre_ref`, `declencheur_*`, `resolutions` **déjà livrés et câblés** — la plus petite tranche de schéma des quatre. |
| 4 | `monde.conditions` | `Climat.duree?` + `declencheur_{texte,expr}` ⇒ **7ᵉ famille** dans `FAMILLES_DE_CONDITIONS` ; arbitrage `effets_regles` | Je recommande de **refuser `conditions.contraintes`** : aucun consommateur nommé, et le `.dc.html` n'est pas liant (CLAUDE.md). |

### Trois découvertes à porter au cadrage

1. **`REFERENCES_SIMPLES` accepte déjà un chemin suffixé `[]`.** `sitesDe` (`validate.ts` l. 167-196) produit un site par élément, y compris sur une liste de primitives : `{ path: 'monde.indices[].mene_a[]', espace: 'indice' }` résout **sans nouvelle table** — idem pour `acces`. Deux trous à fermer **dans le même lot** : (i) `validate.ts` l. 386 `if (typeof site.valeur !== 'string' … ) continue` → un `mene_a: [42]` passe **en silence**, c'est BUG-050 un étage plus bas ; (ii) `feuilleDe('monde.indices[].mene_a[]')` rend « mene_a[] » dans le message (la regex ne retire que `[\d+]`) → fournir un `sujet` sur la ligne.
2. **Récompense en XP** (plan-cible l. 218) : aucun delta ne porte d'opérande entier, et l'XP appartient à n° 11 (roadmap § 5, `ΔT`). À **reporter explicitement**, jamais à improviser dans `DELTAS`.
3. **Fichiers partagés entre itérations** : `src/App.tsx` gagne **quatre** entrées `panneaux` (`indices`, `quetes`, `evenements`, `conditions`, KR-184) — une par itération ; légal entre itérations, **interdit entre deux lots d'une même itération**. `src/brain/dossier/sections.ts` l. 122-130 change si `contraintes` arrive (son commentaire l'annonce déjà).

### Deux corrections de roadmap à demander dans le même geste

- § 5 l. 245 range `quetes[].etapes` en « n° 1 · n° 9 » : périmé par la Décision A, doit lire **n° 6**.
- § 2 l. 162 / § 5 l. 234 assignent l'écran **jalons & fins** à n° 6. S'il y reste, c'est une 5ᵉ itération et le plafond de la skill (6) est atteint sans marge ; je recommande de le réassigner nommément (n° 7 `dossier-controles`, qui lit déjà `condition_texte`/`condition_expr`, ou une feature dédiée avec le graphe).