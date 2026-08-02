# Plan d'itération — `<feature>` · itération `<n>`

> Statut : `porte 1 verte, en attente de validation` | `validé` | `escalade`
> Produit par : pm-produit · tech-lead · ux-designer · qa `[· narratif-ia]` — le `<date>`
> Composition : `4 rôles` | `5 rôles` — motif : …
> Exécution : `séquentielle` (1–2 lots) | `essaim` (3–4 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut ___ » *(une phrase, sans « et »)* |
| **Tranche** | ce qu'elle traverse : écran → service `brain/` → persistance |
| **Lots** | n lots · dont `contrat` : oui/non |
| **Hors périmètre** | … |
| **Reporté** | … |

---

## 0 — Escalade *(uniquement si un veto tient après le tour 2 ; sinon supprimer)*

| | Option A | Option B |
|---|---|---|
| Description | | |
| Coût | | |
| PM / Tech Lead / UX / QA / Narratif | | |

**Recommandation du comité :** —

---

## 1 — But raffiné

Une phrase : « À la fin de cette itération, l'auteur peut ___. »

## 2 — Hors périmètre

- …
- …

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

Composants utilisés · tokens nommés · textes exacts (libellés, placeholders) · états (défaut / survol / sélectionné / vide / erreur) · comportement clavier.

*(Écrit par l'UX. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| | service / événement / registre | consomme / émet | |

## 4 bis — Contrat de sortie IA *(si l'itération touche le moteur ; sinon supprimer)*

| | |
|---|---|
| Contexte injecté | canon + entités par identifiant |
| Schéma de sortie | |
| Échec de validation | rejeu / repli / message |
| Ce que l'IA **ne** fait **pas** | dés, stats, inventaire, XP — résolus par le moteur |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot 1 — `<id>` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : …
- **Fichiers** : `src/…` (N) · `src/…` (R)
- **Expose / consomme** : signature exacte
- **Critères couverts** : #1, #3

### Lot 2 — `<id>`
- **Ouvrier** : `dev-lot`
- …

*(1 à 4 lots. Au-delà, l'itération est trop grosse : elle se coupe en deux, elle ne se regroupe pas.)*

## 6 — Critères d'acceptation

*(8 au maximum. Au-delà, l'itération n'est pas une tranche.)*

1. **Étant donné** … **quand** … **alors** … — *niveau : unitaire | contrat | composant | bout-en-bout* — *lot 2*
2. …

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| | | jest / contrat / mutation `brain/` | KR-0xx | |

Cas limites à couvrir : vide · très long · doublon · hors ligne · référence orpheline · annulation · double soumission.

**Non vérifiable en l'état** — critères qu'aucun instrument existant ne couvre (à recopier dans la revue) : …

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | | | `RETENU` / `REJETÉ` / `REPORTÉ` | |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation *(au plus une, sinon supprimer)*

`INNOVATION` — proposition · règle existante infléchie · coût · ce qu'on perd sans elle.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` au-dessus de `thresholds.break` *(si l'itération a touché `challenge`, `combat`, `xp` ou `characteristics`)* — hors porte de commit, en fin d'itération ; les 4 scores par fichier recopiés dans la revue, aucun en recul (à ±1 mutant près)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/<feature>-it<n>.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | | |
| Tech Lead | | |
| UX | | |
| QA | | |
| Narratif & IA *(si convoqué)* | | |
