# TOUR 1 — UX Designer · `dossier-fiches` it2

**RISQUE.** Deux dérapages guettent le bloc « Identité ». (1) Recopier le libellé « DESCRIPTION » de `FicheLieu` collisionnerait avec son homonyme — même mot, audience opposée : « interne, jamais lu » chez `Lieu`, « lue par le joueur » chez `description_joueur`. (2) Construire un bandeau de refus **visible mais inatteignable** — aucun enum/référence/budget ne pèse sur `fonction`/`apparence`/`description_joueur`, et rien ne référence encore un `pnj` — reproduirait l'erreur qu'it1 s'est explicitement interdite (§2 ligne 30 de son plan : « ne pas construire un bandeau qui ne peut jamais s'allumer »).

**OBJECTION.** Le point (b) du cadrage (« dès que la prose libre exposera un vrai chemin de refus ») **n'est pas rempli par ce lot**. Aucun des 3 champs n'est contraint ; même si le retrait sortait (il ne sort pas), rien ne référence `pnj`. Bâtir le bandeau comme s'il pouvait s'afficher cette itération serait décoratif — exactement ce que le veto de langue/décoration interdit par ailleurs.

**PROPOSITION.** Séparer (a) de (b). (a) est un vrai bug **indépendant du champ déclencheur** : `commit()` doit rendre `EcritureDossier`, jamais `void` — sinon tout commit (y compris camp/plan d'it1) peut échouer en silence sur un dossier déjà corrompu. (b) : construire `RefusEnCours{personnageId, issues}` + le bandeau, anatomie identique à `FicheLieu`/`ObjectifsCanon`, mais documenté comme **filet défensif**, pas comme état démontrable cette itération.

**VERDICT.** Pas de veto. Objection sur (b) : accepter uniquement couplé à (a), jamais un bandeau seul sans le fix `void`.

---

## ANNEXE — Contrat de design exécutable

### 1. Bloc 2 « Identité » — trois champs, ordre fixé

Tous trois sont des `Field` **multiline** — pas de `Field` mono-ligne. Committés au blur, brouillon local indexé par `personnage.id`, même idiome que `nom`/`BrouillonLieu`.

| Ordre | `label` | `hint` | `rows` | Placeholder exact |
|---|---|---|---|---|
| 1 | `FONCTION` | `interne — jamais lu par le joueur` | 2 | `Ermite retiré du monde, gardien de la mémoire de Val-Cendre.` |
| 2 | `APPARENCE` | `interne — jamais lu par le joueur` | 3 | `Un vieil homme voûté à la barbe blanche tressée de perles d'os, les mains tachées d'encre et de cendre.` |
| 3 | `DESCRIPTION JOUEUR` | `lue par le joueur` | 3 | `Une silhouette voûtée émerge de la pénombre du sanctuaire, capuche rabattue sur un visage qu'on devine plus vieux que la voix ne le laisse entendre.` |

**Justification des `hint`** (registre) : `FONCTION`/`APPARENCE` reprennent mot pour mot le hint déjà posé sur les trois proses `ia` de `Lieu` (`description`/`ambiance`/`dangers`) — donnée injectée au modèle, jamais restituée verbatim. `DESCRIPTION JOUEUR` reprend le hint de `canon.partage.accroche_joueur` (`ia` + prose que le joueur peut entendre via le narrateur) — **jamais** « lue par le joueur, mot pour mot », réservé aux champs `moteur` émis verbatim (`texte_ouverture_joueur`). Le libellé `DESCRIPTION JOUEUR` (pas `DESCRIPTION`) désambiguïse visuellement de son homonyme de `FicheLieu` sans dépendre du seul `hint`.

**Placeholders** : registre fiction (3e personne, présent, immersif) pour `APPARENCE`/`DESCRIPTION JOUEUR` — même voix que `Lieu.description`/`accroche_joueur`. `FONCTION` reste une note factuelle courte, présent, sans effet de style.

Aucun composant neuf : trois `Field` de plus dans le même `champsStyle` (`gap: var(--space-6)`) que `FicheLieu`/`FichePersonnage` actuel.

### 2. Recalage des 6 placeholders restants (`BLOCS_VIDES`)

Texte inchangé (`placeholderDe`), seuls les nombres bougent — et le **compte** passe de 7 à **6** (Identité quitte l'état placeholder) :

| id | titre | itération recalée |
|---|---|---|
| `caracteristiques` | `Caractéristiques` | 3 |
| `objectif-plan-actions` | `Objectif & plan d'actions` | 4 |
| `savoirs` | `Savoirs` | 5 |
| `relations` | `Relations` | 5 |
| `presence` | `Présence` | 5 |
| `caractere-exploitable` | `Caractère exploitable` | 6 |

Le test d'it1 qui épingle « 7 placeholders » doit être réécrit à **6**, plus une assertion positive sur les 3 champs réels du bloc 2 (KR-189 : la table `BLOCS_VIDES` reste la seule source).

### 3. `commit()` ne rend plus `void`

`PanneauPersonnages.commit(personnages): EcritureDossier` (signature alignée sur `ObjectifsCanon`/`PanneauLieux`). Aucun changement visuel pour les écritures fermées d'it1 (`camp`/`portee`/`objectif_id`) — elles committent toujours immédiatement — mais leur résultat alimente désormais le même état `refus` que les 3 nouveaux champs de prose : un seul point d'écriture, une seule garde.

### 4. Bandeau de refus — anatomie (filet défensif)

Composant réutilisé, **aucun composant neuf** : `<div role="status">` + `IssueList`, motif identique à `FicheLieu.tsx` / `ObjectifsCanon.tsx`.

```
const EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"
```

- `role="status"`, `display:flex; flex-direction:column; gap: var(--space-3)`
- Eyebrow : `font-family: var(--font-mono); font-size: var(--fs-eyebrow); color: var(--bad); letter-spacing: var(--track-eyebrow)`
- Corps : `<IssueList issues={refus.issues} />`
- **Position** : dans `FichePersonnage`, `champsStyle`, directement sous `<Accordion>` — dernier enfant de la `Card`.

**Indexation double (KR-197)** :

- **Affichage** : `refus !== null && refus.personnageId === personnageAffiche.id ? refus : null`.
- **Extinction** : uniquement un commit **réussi** dont le `personnageId` **égale** celui du refus en cours ; un succès sur un autre personnage laisse le refus intact (BUG-056/061/063).

Pas de bandeau « avertissement » cette itération (aucun `BUDGETS_DE_MOTS` proposé sur les trois champs) — si une future itération en ajoute un, réutiliser le même ton `--bad` (aucun troisième token sémantique n'existe, précédent `EYEBROW_AVERTISSEMENT_OBJECTIFS`).

### 5. Test à deux personnages (BUG-064 / point c)

Le test de montage doit semer **deux personnages** aux 3 champs distincts + valeurs opposées sur camp/portée/objectif_id, monter sans cliquer, lire la fiche du premier, cliquer la ligne du second, relire — sur les **7 champs** de la fiche (nom, camp, portée, objectif_id, fonction, apparence, description_joueur), pas seulement les 4 hérités d'it1.

### 6. Clavier

Aucune modale. Ordre `Tab` dans la fiche : `Field NOM` (en-tête) → en-tête bloc 1 → (déplié) CAMP → PLAN → OBJECTIF → en-tête bloc 2 → (déplié) `FONCTION` → `APPARENCE` → `DESCRIPTION JOUEUR` → en-têtes blocs 3-8. `Entrée` dans un `Field multiline` insère un saut de ligne (jamais de commit-on-Enter — idiome déjà en place sur `SYNOPSIS MJ`/`DESCRIPTION` de `Lieu`) ; commit au `blur` uniquement. Bloc 1 reste ouvert par défaut à la sélection ; le bloc 2 ne s'ouvre pas automatiquement.
