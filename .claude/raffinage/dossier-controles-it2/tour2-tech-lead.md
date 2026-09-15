# Tour 2 — `tech-lead`

**VERDICT** : recevable sous réserve (D1 arbitré élision et écrit au § 8 ; prop requise jamais optionnelle ; V4 instrumenté dans L1 ; sonde l. 203 réécrite).

**RETRAIT — trois, tous les miens.**
1. **La substitution tombe** : KR-218 dit « TOUJOURS fusionné avec le compte existant » ; ma forme efface une information vraie aux états 4 et 6, exactement ceux qu'it3 produit. J'adopte l'**élision** de l'UX.
2. **`PastilleNiveau` tombe** : ce que les deux surfaces partagent est la **décision** (mot + ton), pas le **balisage** — `ListeControles` rend un `<li>` à trois étages, la nav un `trailing`. Un composant commun aurait exigé une prop `compte`, c'est-à-dire mon propre veto V5. C'était mon biais d'abstraction précoce, attrapé par l'UX.
3. **« `SectionNavProps` ne change pas d'une ligne » tombe.** Retiré aussi mon durcissement « interdire `tone={` en bloc » : il interdisait la seule forme correcte.

**MAINTIEN — contre la QA, « teinte seule » refusé.** Sa mesure ne m'ébranle pas, elle m'arme : choisir la variante dont l'unique témoin reste à inventer, et dont ce témoin est le plus faible que jsdom sache produire, pour porter le **seul** signal du badge — c'est adosser tout le sens d'it2 à l'instrument le plus fragile. Le mot est lu par `getByText`. Et `info → muted` reste invisible dès it3. V1, V2, V3 maintenus ; **V4 durci** en instrument plutôt qu'en promesse de revue.

**RÉPONSE — à la QA sur D3 : elle a raison, je cède la prop, et mon précédent d'it1 ne s'y oppose pas.** `onReorder` était une capacité ajoutée à une primitive **`brain/` partagée** pour un seul appelant ; `SectionNavProps` **n'est pas une surface `brain/`**, c'est l'interne de `bascule-editeur`, où *chacune* des trois props existantes n'a déjà qu'un appelant. La barre n'est pas la même. Ce qui tranche : `parSection` est **total par contrat** — n'importe quelle section peut porter n'importe quel niveau — alors qu'aucune règle vivante ne peut allumer une section à compte réel. **Tester contre le contrat plutôt que contre le jeu de règles du jour** est précisément ce qui évitera de rouvrir ce fichier à it3. **Prix payé, nommé** : `DossierEditorScreen` revient dans le lot (3 fichiers `bascule-editeur`). **Prix refusé** : une prop *optionnelle* — deux chemins dont le testé n'est pas le livré, c'est pire que pas de prop du tout. Elle est **requise**.

## La discriminance sur dossier RÉEL — que la QA croyait hors d'atteinte

Réécrire `charpente.depart.texte_ouverture_joueur` (patron l. 238-249 : spread + `persistence.set` + `dossier:updated`) rend `depart` **calme tout en gardant son `—`**, pendant que `canon` reste en alerte. **Deux sections au compte identique, deux badges différents** ⇒ l'hypothèse « le badge colore les sections `SANS_COMPTE` » est tuée, et la propagation live est prouvée par le même test.

## Lots révisés — 2, séquentiels

| LOT | TYPE | FICHIERS |
|---|---|---|
| **L1** | `contrat`, seul et en premier, **migration de son premier consommateur incluse** | (N) `brain/dossier/pastillesControles.ts` + son test · (R) `brain/dossier/sections.ts` (1 ligne : `export const SANS_COMPTE`) · (R) `brain/index.ts` (1 ligne) · (R) `brain/dossier/controles.ts` (JSDoc seul) · (R) `dossier-controles/components/ListeControles.tsx` (perd `PASTILLES`) · (R) `dossier-controles/tests/panneauControles.test.tsx` (diff nul attendu) |
| **L2** | feature | (R) `bascule-editeur/components/SectionNav.tsx` · (R) `DossierEditorScreen.tsx` · (R) `tests/dossierEditorScreen.test.tsx` |

**Pourquoi L1 emporte `ListeControles.tsx`** : la sonde de **porteur unique** ne peut pas être verte à la porte de L1 tant que `PASTILLES` survit. Trois issues existaient — la mettre dans L2 (fichier partagé : interdit), l'écrire en allow-list sur-ensemble (garde desserrée à jamais), ou migrer le consommateur dans le lot contrat. La troisième est la seule qui rende l'assertion **d'égalité** tenable.

## Instruments

- **Porteur unique (V4 instrumenté)** — balayage de `src/`, tests exclus, commentaires retirés : `expect(porteurs).toEqual([...pastillesControles.ts])`. Mesuré : les seules occurrences de `\bBLOQUANT\b` hors tests sont `ListeControles.tsx:59` (que L1 supprime) et des commentaires. L'égalité est tenable **parce que L1 la rend vraie**.
- **Sonde l. 203 réécrite** : aucune teinte en dur, aucune table locale (`BadgeTone` interdit dans le fichier), et l'appel à la fonction `brain/` exigé.
- **`COMPTES_DOSSIER_NEUF` remplacée**, jamais dérivée de l'ancienne par un `map` qui rejouerait la règle d'élision — un test qui recalcule la règle de production ne prouve rien.
