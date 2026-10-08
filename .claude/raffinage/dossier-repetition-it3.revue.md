# Revue — `dossier-repetition` · itération 3

> **Ce que l'auteur peut faire maintenant** : lire quels lieux et quels personnages son joueur synthétique n'a pas atteints sur ce parcours.

## Critères d'acceptation

| # | Critère | Statut | Preuve |
|---|---------|--------|--------|
| 1 | `rapport.lieux_visites` contient au minimum le lieu de départ | VÉRIFIÉ | repeter.test.ts « rapport porte lieux_visites lu de session.monde » + « lieux_visites inclut le départ » |
| 2 | Section « NON ATTEINT SUR CE PARCOURS » liste les lieux absents | VÉRIFIÉ | panneauRepetition.test.tsx « lieux non visités affichés » ; PanneauRepetition.tsx:291-310 |
| 3 | PNJ avec presence non atteints affichés | VÉRIFIÉ | panneauRepetition.test.tsx « PNJ non atteints par co-présence » ; PanneauRepetition.tsx:266-271 |
| 4 | PNJ sans presence exclus | VÉRIFIÉ | panneauRepetition.test.tsx « PNJ sans presence exclus du constat » ; filtre ligne 268 |
| 5 | État vide lieux | VÉRIFIÉ | panneauRepetition.test.tsx « état vide lieux — tous visités » ; texte ligne 308 |
| 6 | État vide PNJ | VÉRIFIÉ | panneauRepetition.test.tsx « état vide PNJ — tous placés croisés » + « aucun dans le dossier » ; lignes 316, 329 |
| 7 | Déterminisme (KR-304) | VÉRIFIÉ | repeter.test.ts « même graine même lieux_visites » |

## Diff par lot

### Lot 1 — `couverture-parcours`

| Fichier | Plan | Réel | Delta |
|---------|------|------|-------|
| repeter.ts | (R) | (R) | +7 lignes (lieux_visites aux 7 sorties) |
| repeter.test.ts | (R) | (R) | +4 tests unitaires |
| repeterCombat.integration.test.ts | (R) | non modifié | tests existants passent |
| PanneauRepetition.tsx | (R) | (R) | 261 → 346 lignes (+85), sous 400 (KR-112) |
| panneauRepetition.test.tsx | (R) | (R) | +6 tests composant |

Aucun fichier hors périmètre touché. Aucun fichier brain/ modifié.

## Ce qui a été refusé (registre § 8)

| # | Désaccord | Statut | Motif |
|---|-----------|--------|-------|
| 4 | ListeConstats composant local | REJETÉ | ~310 l. estimées (réel : 346), sous 400 (KR-112). Extraction si it4 pousse la taille. |
| 5 | Libellé « EN {n} PAS · PARCOURS N°{graine} » dans l'eyebrow | REJETÉ partiellement | Eyebrow = « NON ATTEINT SUR CE PARCOURS ». Badges graine/pas/combats de l'it2 portent ces informations. |
| 9 | Fermeture `rapporter` pour les 7 sorties | REJETÉ | Hors périmètre. Le champ `lieux_visites` requis fait échouer tsc sur un site oublié. |
| 10 | `trace` dans le rapport | REJETÉ partiellement | `lieux_visites` retenu (SSOT moteur). `trace` reportée avec le dépliable. |

## Ce qui a été reporté

| Quoi | Destination |
|------|-------------|
| Dépliable des pas + trace par pas | it4 sacrifiable (veto PM) |
| `parcours: readonly string[]` (chemin ordonné) | it4, suit le dépliable |
| ListeConstats composant | it4 si la taille le justifie |
| Héros étalon | dette à déclencheur |

## Écarts assumés

Aucun.

## Porte qualité

- Prettier : vert
- tsc --noEmit : vert
- ESLint : vert
- jest : vert — 3044 tests, 163 suites, 0 échec
- Score de mutation : non applicable (brain/ non touché, KR-313)

## RETOUR-COMITÉ

- Le TL a fait la découverte clé au tour 2 : `session.monde.lieux_visites` est le SSOT du moteur. Trois rôles avaient adopté `parcours` du tour 1 TL, que le TL a retiré au tour 2 après vérification du code. L'arbitrage qui suit le tour 2 le plus récent, pas le vote majoritaire sur une position périmée, a évité un champ redondant.
- PNJ sans `presence[]` exclus (3 vs 2 au vote) : l'argument sémantique (Contrôles le signale, l'état vide « tous croisés » devient inatteignable si on les liste) l'emporte sur l'argument de simplicité du code. Le filtre coûte une ligne.
- Taille panneau : 346 lignes, 54 de marge avant KR-112. It4 (dépliable) devra probablement extraire un composant.
