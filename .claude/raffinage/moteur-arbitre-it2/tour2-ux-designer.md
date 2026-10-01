# Tour 2 — `ux-designer` · `moteur-arbitre` it2

**1. Narratif-ia a raison, ma carte était fausse — corrigée.** J'ai confondu TC et seuil. Vérifié dans `src/brain/challenge.ts:81-89` et `docs/REGLES-DU-JEU.md:54-64` : `resolveChallenge(tier, characteristicValue, rng)` retourne `{roll, success, margin}` où `roll` est le TOTAL pré-sommé des dés (jamais `d1`/`d2` séparés — la décomposition casse de toute façon dès TC3/TC4, 3 et 4 dés), et la réussite compare `roll` à `characteristicValue`, jamais à `tc`. `tc` ne fait QUE choisir `CHALLENGE_TIERS[tc].{notation,difficulty}` — « 2D5 », « Dur » — ce n'est pas un seuil. Mon titre `` `Seuil ${tc}` `` et ma ligne `` `${d1} + ${d2} vs ${tc}` `` (état 7) sont tous deux rejetés et réécrits ci-dessous.

**2. Exposer ou non la valeur chiffrée avant le lancer — tranché par un précédent que j'avais raté.** `BandeauHeros.tsx:10` dit explicitement : « N'affiche jamais les caractéristiques (seul `EcranCreationHeros` les montre). » C'est un choix de design déjà posé pour tout le mode jeu, pas une question ouverte que j'ai à trancher seul. Faire apparaître le chiffre sur `CarteJet` serait le SEUL endroit du mode jeu à re-surfacer une valeur de caractéristique brute en cours de partie — en rupture avec ce précédent, pas une extension cohérente de celui-ci. Je retiens donc : **avant lancer, la carte montre le NOM de la caractéristique (eyebrow) et la difficulté/notation du TC (title), jamais le chiffre** ; le chiffre n'apparaît qu'APRÈS lancer, dans la comparaison `roll vs characteristicValue` — c'est l'écran qui réintroduit alors sa seule et unique fois une caractéristique chiffrée en jeu, pour EXPLIQUER une issue déjà connue, pas pour l'anticiper. Ça répond aussi au PM (§I de narratif-ia) : la phrase du goal reste défendable comme « le joueur ne voit jamais le seuil s'afficher avant le jet », même s'il le connaît en théorie depuis la création.

**3. `pourquoi` n'a jamais été dans mon rendu.** Relecture de mon annexe tour 1 (état 5) : le rendu listé est eyebrow + title + `SI RÉUSSITE`/`SI ÉCHEC` + bouton — `pourquoi` n'apparaît que dans la liste des clés DÉCLENCHEUSES, jamais dans ce qui s'affiche. Je confirme : zéro lecteur côté carte. La proposition de narratif-ia (le retirer du schéma réseau) ne casse rien côté UX — à retirer aussi du payload que `useTourDeJeu` expose à `CarteJet`, c'est un champ mort qu'il ne faut pas faire porter à l'essaim.

**4. `Card.shadow` — confirmé après relecture de `Card.tsx`, précisé.** Le tech-lead n'a pas rouvert ce point dans sa note (silence = pas de contradiction), je le maintiens tel quel et je précise la valeur manquante : `padding` reste au défaut du composant (`padding={18}`, aucune raison de CarteJet de s'en écarter) ; seul `shadow={false}` change. `boxShadow` devient `selected ? 'var(--ring-selected)' : shadow ? 'var(--shadow-card)' : 'none'` — `CarteJet` n'utilise jamais `selected` (ce n'est pas une carte sélectionnable), donc `boxShadow: 'none'` en pratique. Zéro régression : tous les appelants existants gardent `shadow` au défaut `true`.

**Gap nouveau, signalé pour le lot `contrat`/`feature` (pas un veto, une dépendance technique que mon état 7 révèle) :** l'interface `UseTourDeJeuResult.carteJet` du tech-lead (`{carac, tc, pourquoi, enjeuReussite, enjeuEchec} | null`) ne porte que les champs PRÉ-lancer. Mon état 7 a besoin, après `lancerLeDe()`, de `roll`, `success` et `characteristicValue` (= `heros.caracs[carac]`, disponible dans le hook via `session.heros`) pour rendre `${roll} vs ${characteristicValue}` + le `Badge`. Je ne réécris pas la signature du hook (hors de mon domaine), mais le contrat doit prévoir un champ supplémentaire du type `resultat?: { roll: number; success: boolean; characteristicValue: number }` posé sur `carteJet` au moment où `lancerLeDe()` résout — sinon `CarteJet.tsx` n'a tout simplement pas les données pour son état 7, et un dev-lot va soit recalculer `characteristicValue` lui-même (violation Déméter — il n'a pas accès à `heros` depuis un composant de présentation pur) soit improviser.

---

## ANNEXE — Corrections à l'état 5 et l'état 7 (remplace l'annexe tour 1)

### État 5 — Avant lancer (CORRIGÉ)

| Élément | Rendu | Texte/source |
|---|---|---|
| Trigger | proposition reçue, `pourquoi` **retiré** du payload consommé par la carte (mort, § 3 ci-dessus) | `carteJet = {carac, tc, enjeuReussite, enjeuEchec}` |
| `Card` | `shadow={false}` (padding défaut) | — |
| eyebrow | mono, majuscules, `--text-label` | `CHARACTERISTICS[carac].label` (ex. « FORCE ») |
| title | mono, `--text-strong` | `` `${CHALLENGE_TIERS[tc].notation} — ${CHALLENGE_TIERS[tc].difficulty}` `` (ex. « 2D5 — Dur ») — **jamais** la valeur de caractéristique |
| 2 lignes mono | `--text-label`, `font-fs-meta` | `SI RÉUSSITE` / `SI ÉCHEC` |
| prose (registre fiction) | `--text-strong`, `white-space: pre-wrap` | `enjeuReussite` / `enjeuEchec` verbatim |
| bouton | patron `boutonTenter` accent plein | `Lancer le dé →` |

### État 7 — Après résolution (CORRIGÉ, remplace ma ligne fausse)

| Élément | Rendu | Texte |
|---|---|---|
| Trigger | `lancerLeDe()` résolu, `carteJet.resultat` présent | `{roll, success, characteristicValue}` — **jamais `d1+d2`, jamais `tc` comme comparant** |
| ligne mono | `--text-body`, `fs-meta` | `` `${roll} vs ${characteristicValue}` `` (ex. « 7 vs 9 ») |
| `Badge` | `tone={success ? 'good' : 'bad'}` | `RÉUSSITE` / `ÉCHEC` |
| | Pas de marge affichée en it2 (inchangé, réservé it3) | — |

Le `title` posé à l'état 5 (notation + difficulté) reste affiché, inchangé, pendant les états 6 et 7 — seule la ligne de résultat + le badge s'ajoutent dessous.

### Registre de langue — inchangé
Eyebrow/title/`SI RÉUSSITE`/`SI ÉCHEC`/ligne de résultat/Badge : INTERFACE, mono, majuscules pour les libellés fixes. `enjeuReussite`/`enjeuEchec` : FICTION, verbatim. Aucune confusion nom-interne / description-joueur ici (pas d'objet en jeu sur cette carte).

## Statut de mes objections de tour 1
- États manquants (1-4) : **maintenu**, personne ne les a contredits, ils tiennent tels quels.
- `Card.shadow` : **maintenu et précisé** (padding défaut, calcul exact du `boxShadow`).
- Textes « Seuil {tc} » et « d1+d2 vs tc » : **retirés**, remplacés ci-dessus — erreur reconnue, merci à narratif-ia de l'avoir vérifiée contre `challenge.ts`.

## Décisions prises en autonomie faute de spécification
- Afficher ou non la valeur chiffrée de la caractéristique avant le lancer → **jamais avant, seulement après** → si c'est l'inverse, `CarteJet` devient le seul écran du mode jeu à re-surfacer une caractéristique chiffrée en cours de partie, en rupture avec le précédent déjà posé et commenté dans `BandeauHeros.tsx:10`.
- Format de la ligne de résultat → `roll vs characteristicValue` (deux nombres, pas de décomposition par dé) → si on décompose (`d1+d2+...`), le format casse structurellement sur TC3 (3 dés) et TC4 (4 dés), et `resolveChallenge` ne renvoie de toute façon que le total — il faudrait changer sa signature pour rien.
- Le `title` de la carte reste visible et inchangé à travers les états 5→7 (pas de remplacement de contenu) → sinon le joueur perd le rappel du TC/notation pile au moment où il en a le plus besoin pour lire le résultat.

Fichiers lus pour ce tour : `.claude/skills/raffinage-iteration/SKILL.md` ; les cinq notes tour 1 (`tour1-{pm-produit,tech-lead,ux-designer,qa,narratif-ia}.md`) ; `src/brain/challenge.ts` ; `docs/REGLES-DU-JEU.md` (§2, lignes 52-65) ; `src/brain/components/Card.tsx` ; `src/features/play-mode/components/BandeauHeros.tsx` ; `src/features/play-mode/components/EcranCreationHeros.tsx` (grep import `CHARACTERISTICS`).
