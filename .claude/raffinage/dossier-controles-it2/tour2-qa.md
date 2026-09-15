# Tour 2 — `qa`

**VERDICT** : recevable sous réserve — (1) discriminance par mock plutôt que par prop fabriquée ; (2) **tout `toHaveStyle` banni des critères, instrument prouvé CASSÉ** ; (3) `COMPTES_DOSSIER_NEUF` ajoutée nommément aux tests réécrits.

**RETRAIT — « teinte seule » retirée**, sur deux motifs, tous deux sur mon terrain (observabilité, jamais goût produit) :
1. **Sémantique-prouvable** — sous la table déjà livrée (`ListeControles.tsx:57-61`), `info → muted`, donc `info` et une section saine partagent **la même teinte**. Un critère « info se distingue d'une section saine par la teinte » n'est pas mal formulé, il est **FAUX** : aucun test ne peut le faire passer.
2. **Instrumental** — voir ci-dessous.

Retirée aussi mon affirmation « seul un `parSection` fabriqué prouve la discriminance » : un mock du contrat la prouve tout autant.

**MAINTIEN** — mon RISQUE du tour 1 (**deux** sondes bougent, pas une), renforcé par la mesure indépendante du tech-lead (`COMPTES_DOSSIER_NEUF`, l. 118/190).

**OBJECTION DURCIE EN VETO** — l'instrument de teinte n'est pas absent, il est **cassé**. Veto sur tout critère s'appuyant sur `toHaveStyle` ou une couleur rendue de `Badge`.

## Le verdict d'instrument, vérifié sur pièce

Sonde jetable écrite, exécutée, puis supprimée :

```
render(<Badge tone="bad">BLOQUANT</Badge>)
expect(getByText('BLOQUANT')).toHaveStyle({ color: 'var(--bad)' })   // PASSE
render(<Badge tone="muted">x</Badge>)
expect(getByText('x')).toHaveStyle({ color: 'var(--bad)' })          // PASSE AUSSI — devrait échouer
el.style.color   // ''  (vide)
el.style.cssText // color / border / background ABSENTS ; font-family: var(--font-mono) présent
```

**`cssstyle`, le moteur CSSOM de jsdom, valide `color`/`border`/`background` contre une grammaire typée et rejette silencieusement un jeton `var(--x)`** — `element.style.color` retombe à `''`. `toHaveStyle` repasse les deux côtés par le même moteur : ils collapsent tous deux à `''` **pour n'importe quelle teinte**, donc le matcher **passe toujours**. Faux positif reproductible, pas une hypothèse. `Badge.tsx` posant ses styles en objet React inline, aucune feuille réelle n'est chargée non plus.

**Corollaire heureux** : puisque le mot entre dans le texte, plus aucun critère n'a besoin de cet instrument — `getByText` / `queryByText` sur `BLOQUANT` / `ALERTE` / `INFO` suffit, et c'est déjà le seul instrument que ce dépôt utilise pour ce composant.

## Critères révisés (8)

1. Dossier neuf → chaque `ListRow` porte exactement un `Badge` ; Départ affiche `BLOQUANT` (tiret remplacé), Canon `ALERTE`, les huit autres leur `compte(dossier)` inchangé (KR-218). *composant, `getByText`*
2. Section saine → **aucun** des trois mots n'apparaît dans la ligne (`queryByText(...)` → `null`), seul `compte(dossier)` est rendu. *composant, texte négatif — remplace toute assertion de teinte*
3. **Discriminance** — `personnages: 'bloquant'`, `canon`/`depart: null`, sur un dossier réel à 2 fiches → Personnages porte `BLOQUANT` **et** conserve `2 fiches` ; Canon et Départ sans mot malgré leur `—`. *composant, test neuf*
4. `COMPTES_DOSSIER_NEUF` (l. 118/190) — **amendement légitime et nommé, pas un défaut**, borné aux index 0 (Canon → `ALERTE`) et 1 (Départ → `BLOQUANT`) ; les huit autres valeurs et le mécanisme d'assertion par index restent inchangés. *non-régression amendée*
5. Sonde l. 203 réécrite **et étendue** : interdiction permanente de `tone="good"` / `tone="accent"` **et des trois mots littéraux** dans `SectionNav.tsx`. *sonde de source*
6. Sonde `KR-013` (l. 194-201) reste verte **sans modification**. *sonde de source*
7. Après `dossiers.update()` + `dossier:updated`, le mot `BLOQUANT` disparaît de la ligne Départ **sans remontage** — même mécanisme que l. 222-256. *composant, bus d'événements*
8. L'entrée « Contrôles » ne porte aucun mot de niveau ; les deux tests existants (l. 396-443, l. 445-455) restent verts sans modification. *non-régression*
