# Tour 2 — Tech Lead — `dossier-canon` it1

RISQUE — un chiffre sans source (KR-176). `maxLength` est un plafond de **caractères** qui n'existe nulle part : le schéma ne connaît que `BUDGET_MOTS_CANON` (600 **mots**), et sa doctrine est un avertissement, **jamais un refus** (KR-165). Une troncature dure ferait du budget une règle bloquante à l'écran alors que le validateur le déclare non bloquant — deux règles pour une, et c'est l'interface qui gagnerait. Refusé tant qu'aucune constante nommée ne le porte.

OBJECTION — à l'UX, nommément, sur `Field.showCounter` : le compteur a **un** appelant dans cette itération et il embarque une décision de ton (à partir de quand `--bad` ?). `Field` ne gagne rien en it1 — `PanneauCanon` rend son compteur sous son `Field`, avec `compterMots` exporté de `brain/`. Trois répétitions en it2-it4 le promouvront avec trois appelants : c'est exactement la règle qui a promu `ListRow`, et que j'applique à `IssueList` aujourd'hui.

PROPOSITION — (1) **J'accepte `IssueList` et `compterMots` dans le lot 1** ; ils y entrent avec le repointage de leur importeur existant. `Field.tsx` n'y entre pas. **Toujours 2 lots.** (2) **Je retire le revert.** L'UX répond juste : `Field` est **contrôlé** (`value=`), il n'existe aucun chemin non contrôlé — le brouillon n'est pas un choix, il est imposé par la primitive, et le bandeau rend explicite la divergence que je craignais silencieuse. Deux conditions : brouillon **semé une fois**, jamais re-synchronisé par `useEffect` (KR-013/113, patron KR-053) ; un `dossier:updated` cloud arrivant sur un brouillon sale ne l'écrase pas et le bandeau reste.

VERDICT — recevable.

---

## Révision de l'Annexe 2 — Lot 1 · `contrat` (seul, en premier)

| | Fichier |
|---|---|
| R | `src/brain/DossierService.ts` |
| R | `src/brain/DossierService.test.ts` |
| R | `src/brain/EventBus.ts` *(docstring : second émetteur de `dossier:updated`)* |
| R | `src/brain/hooks.ts` *(docstring l. 41-52 seule, zéro code)* |
| R | `src/brain/dossier/validate.ts` — `compterMots` passe de privée à exportée. **Rien d'autre dans ce fichier.** |
| N | `src/brain/components/IssueList.tsx` — déplacement **à l'identique**, zéro changement de rendu |
| D | `src/features/dossier-format/components/IssueList.tsx` |
| R | `src/features/dossier-format/components/ImportDossierDialog.tsx` — **seul importeur** (relevé : 2 fichiers mentionnent `IssueList`, celui-ci et le composant lui-même). Ligne d'import uniquement. |
| R | `src/brain/components/index.ts` (KR-109) |
| R | `src/brain/index.ts` — `CorpsDossier`, `EcritureDossier`, `IssueList`/`IssueListProps`, `compterMots` |

Le lot 1 touche un fichier de `dossier-format` : c'est la contrepartie obligatoire du déplacement, pas une extension de périmètre — un primitif promu sans repointage de son importeur laisse `tsc` rouge. Lot 2 ne touche aucun fichier de `dossier-format` : les propriétés restent disjointes.

**Deux tests à ajouter au lot 1**, en plus des huit déjà nommés : `compterMots('') === 0` et l'accord de définition avec le validateur (même texte → même nombre que celui qui déclenche l'avertissement) ; la suite existante d'`ImportDossierDialog` reste verte **sans modification** — c'est la preuve que le déplacement est à l'identique.

## Caveat à écrire dans le code (lot 2), sinon il se perdra

`BUDGETS_DE_MOTS` porte sur `canon.mj` et `canon.partage`, les **conteneurs**, et `compterMotsDe` y somme toutes les chaînes. Le compteur du panneau compte, lui, **le seul brouillon du champ**. Les deux coïncident aujourd'hui parce que chacun de ces deux objets ne contient qu'une chaîne — par accident, pas par construction. Une ligne de commentaire au site du compteur doit le dire et nommer le propriétaire : la première feature qui ajoute un champ à `canon.mj` ou `canon.partage` fait diverger le compteur de l'avertissement.

## Arbitrage pour la QA — une seule région, un seul rôle

`role="status"` est porté par **le bandeau de refus uniquement** (« CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ » + `IssueList`), qui est un état persistant du panneau, pas une annonce fugace. Le compteur de mots **ne porte aucun rôle** : c'est une valeur affichée en continu, et lui donner `status` produirait deux régions concurrentes dont l'une bavarderait à chaque frappe. Les deux tests de la QA visant le dépassement se reciblent sur le texte du compteur ; ceux visant le refus gardent `getByRole('status')`. Aucune exigence d'accessibilité n'est engagée ici (roadmap § 6), c'est une décision de **testabilité** : un sélecteur stable par état, jamais deux.
