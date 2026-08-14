# Plan d'itération — `dossier-fiches` · itération 7

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-08-14
> Composition : `5 rôles` — motif : le retrait touche l'intégrité des identifiants stables (relations[].cible_id, prédicats D1) qui référencent le personnage retiré — frontière code/IA directe, même terrain que le gating de it5/it6.
> Exécution : `séquentielle` (1 lot, marqué `contrat`)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin de cette itération, l'auteur peut retirer un personnage de son aventure — confirmé avant écriture, refusé si une autre entité le référence encore. » |
| **Tranche** | Bouton dans `FichePersonnage.tsx` → modale de confirmation → `useSocleEcriturePersonnages.handleRetirer()` → `commit()` → `DossierService.update()` (revalidation intégrale, refus si `reference-pendante`) → persistance. Le refus au SSOT existe déjà depuis it5 (`REFERENCES_SIMPLES`) ; ce lot le CÂBLE à un geste utilisateur pour la première fois sur `pnj.*`, et corrige au passage 2 messages d'anomalie devenus faux hors du contexte d'import. |
| **Lots** | 1 lot · dont `contrat` : oui (2 fichiers `brain/`, corrections documentaires de messages — zéro ligne de schéma/table/destination) |
| **Hors périmètre** | caractère exploitable (it8) · les ~10 autres libellés `DOSSIER_ISSUE_LABELS` qui disent encore « puis réimportez-le » (hors du chemin observable d'it7) · tout mécanisme qui scannerait la prose `ia` par `nom` pour repérer les mentions résiduelles d'un personnage retiré (rouvrirait la référence par nom libre interdite par CLAUDE.md) · le comportement d'une session de jeu sauvegardée qui indexait ce personnage (n° 9+, hors Temps 1) · le correctif du bug hérité `BlocPresence.tsx` (BUG-074, toujours non touché) |
| **Reporté** | `open_questions` : (a) le nom d'un personnage retiré persiste dans jusqu'à 15 champs de prose `ia`/`auteur` d'autres entités — propriétaire n° 10 (assemblage de contexte), aucun code ne doit le résoudre ; (b) une session de jeu sauvegardée indexant ce personnage par identifiant (`pnj_a_revele` lit `monde.pnj.<id>.a_dit[]`) — propriétaire n° 9+, comportement non spécifié |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut retirer un personnage de son aventure — confirmé avant écriture par une modale, refusé au SSOT (liste et sélection inchangées) si une autre entité du dossier le référence encore, qu'il s'agisse d'une relation d'un autre personnage ou d'une condition D1 imbriquée.

## 2 — Hors périmètre

- Caractère exploitable / curseurs (it8, dernière itération de la feature).
- Les ~10 autres libellés de `DOSSIER_ISSUE_LABELS` portant le même défaut que les 2 corrigés ici (« puis réimportez-le » hors contexte d'import) — hors du chemin observable de ce lot, journalisé pour un futur balayage porté par la feature qui possède la surface d'anomalies concernée.
- Tout mécanisme qui repérerait les mentions résiduelles du nom d'un personnage retiré dans la prose `ia`/`auteur` d'autres champs (ex. `canon.mj.synopsis_mj`, `relations[].lien` d'un autre personnage) — un scan par `nom` rouvrirait la référence par nom libre que CLAUDE.md interdit explicitement. Propriétaire : n° 10.
- Le comportement d'une session de jeu (Temps 2) qui aurait déjà indexé ce personnage.
- Le correctif de `BlocPresence.tsx` (BUG-074) — fichier non touché par ce lot.

*(Écrit par le PM.)*

## 3 — Contrat de design

*(Écrit par l'UX — tour 1 + amendements tour 2 fusionnés ; les textes ci-dessous, issus de la contre-lecture, font foi sur toute variante du tour 1.)*

### Bouton de retrait (`FichePersonnage.tsx`)

- Composant : `IconButton` `tone="danger"` `size={HIT_TARGET_MIN}`, glyphe `✕`.
- Position : fin de `champsStyle`, après `<Accordion .../>`, avant le bandeau de refus (précédent exact `FicheLieu.tsx`).
- Libellé, fonction `libelleRetirer(personnage, index)`, aligné sur `localiserEntite('pnj', …)` :
  - nom renseigné : `Retirer le personnage « Aldûr le Sage »`
  - repli : `Retirer le personnage n°4 (sans nom)`
- **N'appelle jamais `handleRetirer` directement** : ouvre la modale (`onDemanderRetrait`).
- **Toujours actif** : jamais `disabled` en fonction de qui référence le personnage (veto tech-lead/narratif-ia, § 8).

### Modale de confirmation — `RetirerPersonnageDialog.tsx` (nouveau, calqué sur `DeleteDossierDialog.tsx`)

- `Modal` importé de `brain/components/`, aucun style neuf.
- `title` : `Retirer le personnage`
- Corps (texte fixe générique, jamais une énumération dynamique des blocs remplis — tranché contre l'option UX du tour 1) :
  > `Le personnage « Aldûr le Sage » sera retiré de l'aventure, avec tout contenu déjà renseigné parmi l'identité, les caractéristiques, le plan d'actions, les relations, la présence et les savoirs. Cette action est irréversible.`
  Repli sans nom : `Le personnage n°4 (sans nom) sera retiré de l'aventure, avec tout contenu déjà renseigné parmi l'identité, les caractéristiques, le plan d'actions, les relations, la présence et les savoirs. Cette action est irréversible.`
  **N'énumère jamais quels référents existent** (veto tech-lead/narratif-ia).
- `cancelLabel="Annuler"`, `confirmLabel="Retirer"`, `confirmTone="error"`.
- État `enConfirmation: string | null`, possédé par `PanneauPersonnages.tsx`, gardé en ligne par `enConfirmation === personnageAffiche.id` (jamais un `useEffect` de resynchronisation, KR-013/113) — une sélection périmée ferme la modale sans effet miroir.
- `onConfirm` et `onCancel`/`onClose`/Échap dans le MÊME gestionnaire synchrone que la fermeture (invariant § 4, ordre des effets).

### Messages d'anomalie corrigés (`brain/dossier/issues.ts`)

- `reference-pendante` (l. 93) : `↪ Corrigez « {champ} » ou rétablissez l'élément correspondant.` (remplace « puis réimportez-le », impossible dans l'éditeur).
- `texte-trop-long` (l. 103) : `↪ Resserrez le texte si possible ; ce n'est pas bloquant.` (remplace « l'import n'est pas bloqué », déjà rendu par `FichePersonnage.tsx` hors de tout import).
- Les deux passent 3 contrôles : vrais sur TOUTES les surfaces où le registre les rend (import ET édition) ; référence par identifiant résolu par le registre, jamais par nom libre interpolé côté feature ; `{champ}` (vocabulaire de schéma résiduel) assumé hors périmètre — n° 7 `dossier-controles` en est propriétaire.

### Clavier

Entièrement porté par `Modal.tsx` existant, zéro câblage neuf : Échap ferme, Tab bouclé dans la modale, focus restauré au démontage sur l'élément qui l'a ouvert.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `DOSSIER_ISSUE_LABELS['reference-pendante'].remediation` | correction documentaire | provides | `src/brain/dossier/issues.ts:93` — texte exact ci-dessus, zéro changement de `code`/`severity` |
| `DOSSIER_ISSUE_LABELS['texte-trop-long'].remediation` | correction documentaire | provides | `src/brain/dossier/issues.ts:103` — idem |
| `DossierService.update(id, recette): EcritureDossier` | service | consumes | réutilisé sans changement de signature — revalide le document ENTIER, refuse si `errors` non vide |

Aucune ligne de `tables.ts`/`validate.ts`/`destinations.ts`, aucune fixture : le refus SSOT sur `relations[].cible_id` (`REFERENCES_SIMPLES`, espace `pnj`) et sur les 6 chemins `_expr` portant `pnj_a_revele` existe depuis it5 — vérifié exhaustivement par narratif-ia au tour 1 (8 chemins référençant `pnj.*`, tous couverts par un refus bloquant).

## 5 — Lot unique

> Marqué `contrat` parce qu'il touche `brain/dossier/issues.ts` (2 messages) — un second défaut de copie trouvé en tour 2 (`texte-trop-long`) après que le premier (`reference-pendante`) avait déjà été admis au périmètre. Pas de second lot à protéger : `dev-contrat` exécute tout, temps 0 imposé (`brain/` seul, re-vert avant la feature).

### Lot 1 — `retrait-personnage` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul)
- **But** : livrer le retrait d'un personnage avec confirmation et refus SSOT, corriger 2 messages d'anomalie devenus faux hors import.
- **Ordre interne imposé** (temps 0 à 7) :

| # | Fichier | N/R | Temps | Contenu |
|---|---|---|---|---|
| 1 | `src/brain/dossier/issues.ts` | R | 0 · contrat | 2 lignes de remédiation (`reference-pendante`, `texte-trop-long`) |
| 2 | `src/brain/dossier/validate.test.ts` | R | 0 · contrat | réécrit les 2 assertions à chaîne exacte (l. 412-417) sur la nouvelle remédiation + 1 assertion nommée épinglant l'ABSENCE de « réimportez » sur ces 2 codes (garde de récurrence KR-171) |
| — | *re-vert `tsc --noEmit` + `jest` avant d'ouvrir la feature* | | | |
| 3 | `src/features/dossier-fiches/hooks/useSocleEcriturePersonnages.ts` | R | 1 | `handleRetirer: () => EcritureDossier`, retombée `restants[max(index-1,0)] ?? null`, aucune purge de brouillon (commentée : identifiant jamais réutilisé) |
| 4 | `src/features/dossier-fiches/hooks/useEcriturePersonnages.ts` | R | 2 | ré-export de `handleRetirer` (assembleur, précédent `handleAjouter`) |
| 5 | `src/features/dossier-fiches/components/RetirerPersonnageDialog.tsx` | N | 3 | présentation pure, calqué sur `DeleteDossierDialog.tsx` |
| 6 | `src/features/dossier-fiches/components/FichePersonnage.tsx` | R | 4 | props `index`, `onDemanderRetrait` ; bouton en fin de fiche |
| 7 | `src/features/dossier-fiches/components/PanneauPersonnages.tsx` | R | 5 | `enConfirmation` (garde en ligne), `intentionFocus`/`panneauRef`, `handleConfirmerRetrait` |
| 8 | `src/features/dossier-fiches/tests/retraitPersonnage.test.tsx` | N | 6 | les 8 tests du § 7 (fichier neuf — `panneauPersonnages.test.tsx` est à 843 lignes) |
| 9 | `specification.json`, `bug_history.json`, `CHANGELOG.md`, `README.md`, `docs/ROADMAP-BASCULE-IA.md` (Statut → 7/8), `package.json` | R | 7 · docs | bookkeeping de fin d'itération |

**Signature exacte exposée** (point de rendez-vous interne) :

```ts
// useSocleEcriturePersonnages.ts — ajout à UseSocleEcriturePersonnagesResult
/** Retire le personnage AFFICHÉ. Rend le résultat brut : le refus SSOT n'est
 *  jamais avalé, l'appelant sait s'il doit déplacer le focus. Aucun retrait
 *  optimiste. Sans argument — agit sur personnageAffiche, jamais sur un id
 *  passé par l'appelant (une seule source de vérité, § 8 désaccord 3). */
handleRetirer: () => EcritureDossier
```

```tsx
// FichePersonnage.tsx — props ajoutées
index: number
onDemanderRetrait: () => void   // n'écrit RIEN : ouvre la modale, jamais handleRetirer direct

// RetirerPersonnageDialog.tsx
export interface RetirerPersonnageDialogProps {
	nomAffiche: string            // déjà résolu par localiserEntite('pnj', personnage, index)
	onConfirm: () => void
	onCancel: () => void
}
```

Corps de `handleConfirmerRetrait` (`PanneauPersonnages.tsx`, ordre imposé — § 4 invariants) :
```ts
function handleConfirmerRetrait(): void {
	setEnConfirmation(null)                       // même gestionnaire synchrone → même commit React
	const resultat = ecriture.handleRetirer()
	if (resultat.statut === 'ecrit') setIntentionFocus('retirer')
	// statut !== 'ecrit' (refus) : AUCUN setIntentionFocus — le bouton visé est
	// toujours monté, Modal.tsx lui restaure légitimement le focus au démontage.
}
```

- **Critères couverts** : #1 à #8 (tous).

## 6 — Critères d'acceptation

1. **Étant donné** un personnage non référencé ailleurs, **quand** l'auteur clique « Retirer le personnage… » puis confirme dans la modale, **alors** le personnage est retiré (liste N→N-1) par une écriture réelle (`commit()`/`DossierService.update()`), aucun retrait optimiste avant confirmation — *niveau : composant* — *lot 1*
2. **Étant donné** un personnage référencé par `relations[].cible_id` d'un AUTRE personnage, directement ou via un prédicat D1 (`pnj_a_revele`) imbriqué sous `et`/`ou`/`non` à profondeur ≥ 2, **quand** l'auteur confirme le retrait, **alors** il est refusé au SSOT : liste inchangée, bandeau nommant le personnage RÉFÉRENÇANT (jamais le retiré) — *niveau : composant* — *lot 1*
3. **Étant donné** un personnage dont la SEULE relation entrante est auto-référentielle (KR-194), **quand** l'auteur confirme le retrait, **alors** il réussit : le personnage et sa propre relation partent dans le même commit, sans jamais produire `reference-pendante` — *niveau : composant* — *lot 1*
4. **Étant donné** un refus de retrait sur le personnage A, **quand** l'auteur sélectionne puis édite avec succès un AUTRE personnage B, **alors** le refus de A reste actif et invisible sous B (KR-197, deux indexations, deux personnages distincts) — *niveau : composant* — *lot 1*
5. **Étant donné** le dernier personnage du dossier, **quand** l'auteur le retire (confirmé), **alors** l'état vide livré à it1 revient, aucun crash de sélection ni de focus — *niveau : composant* — *lot 1*
6. **Étant donné** un retrait réussi, **quand** la modale se ferme et le document est réécrit, **alors** la sélection retombe sur le personnage précédent et le focus suit sur SON bouton « Retirer » — sonde de discriminance : plusieurs boutons « Retirer le personnage » présents dans le DOM, le bon reçoit le focus — *niveau : composant* — *lot 1*
7. **Étant donné** la modale de confirmation ouverte, **quand** l'auteur clique Annuler ou appuie sur Échap, **alors** rien n'est écrit et ni la sélection ni le focus ne changent — *niveau : composant* — *lot 1*
8. **Étant donné** le nouveau code, **quand** `npm run lint`/`tsc --noEmit` tournent et qu'on relit `FichePersonnage.tsx`/`PanneauPersonnages.tsx`/`RetirerPersonnageDialog.tsx`, **alors** zéro erreur et aucun code feature ne pré-calcule les référents (pas de `disabled` conditionnel, pas de comptage dans la modale) — le bouton de retrait est TOUJOURS actif, la modale TOUJOURS muette sur les référents — *niveau : contrat + revue* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| "retirer un personnage non référencé le supprime immédiatement, liste N→N-1" | écriture réelle via `dossiers.update()`, aucun retrait optimiste (assert après résolution) | jest/composant | — | 1 |
| "refus par relations[].cible_id d'un tiers : liste inchangée, bandeau nomme le référençant" | mirroir du test `charpente.depart.lieu_id` de Lieu, sur `relations[].cible_id` | jest/composant | — (critère #2) | 1 |
| "refus par pnj_a_revele imbriqué sous non/et à profondeur ≥ 2" | `collectRefs` (`expr.ts`) récurse jusqu'à `PROFONDEUR_MAX_EXPR` — un test à profondeur 1 ne le prouve pas | jest/composant | — | 1 |
| "se retirer soi-même supprime l'entité et sa propre relation auto-référentielle dans le même commit, sans reference-pendante" | KR-194 côté écriture, jamais exercé — discriminant anti-pré-vol | jest/composant | KR-194 | 1 |
| "un refus de retrait sur A ne s'affiche pas sous B après changement de sélection" | KR-197, moitié affichage, réplique BUG-061 appliqué au chemin retrait | jest/composant | KR-197 | 1 |
| "une écriture réussie sur A (édition ou retrait) efface le refus sur A ; sur B ne l'efface pas" | KR-197, moitié invalidation, DEUX entités | jest/composant | KR-197 | 1 |
| "retirer le dernier personnage bascule sur l'état vide d'it1, aucun crash de focus" | `setSelection(null)` géré par le socle | jest/composant | — | 1 |
| "focus après retrait réussi sur le bouton Retirer de la fiche retombée, sonde de discriminance" | plusieurs boutons « Retirer le personnage » dans le DOM, le bon reçoit `toHaveFocus()` | jest/composant | KR-199 | 1 |
| "modale : Annuler et Échap ne committent rien, Retirer de la modale committe" | 3 `it`, aucun appel `dossiers.update` avant confirmation | jest/composant | — (critère #7) | 1 |
| "refus AVEC modale : la modale se ferme, le bandeau prend la main, sélection et focus restent sur le personnage visé" | isole le mécanisme (restauration native de `Modal` sur le bouton encore monté) ; assertion explicite qu'`intentionFocus` n'est PAS posé au refus | jest/composant | — | 1 |
| "après retrait, canon/charpente/autres personnages intacts hors la relation orpheline attendue" | `validateDossier` du document rendu ne renvoie aucune `error` | jest/contrat | — (critère racine #8) | 1 |
| "la remédiation de reference-pendante et texte-trop-long ne contient plus réimportez" (validate.test.ts) | assertion nommée sur `dossierIssueRemediation`, garde de récurrence KR-171 | jest/contrat | — | 1 |

Cas limites couverts : vide (dernier personnage) · référence orpheline (impossible à produire via l'UI — bloquée au SSOT, donc pas de test de rendu d'option orpheline ici, contrairement à it6) · auto-référence (doublon volontaire) · annulation (Annuler/Échap) · double geste (clic répété sur Retirer pendant que la modale est déjà ouverte — géré par la garde en ligne, aucun état dupliqué possible).

**Non vérifiable en l'état** — aucun.

**Définition de fini additionnelle (DoD, pas un test jest)** : `grep -rn "réimportez" src/` en revue, zéro résidu hors les 2 lignes corrigées de `issues.ts` — sinon la table verte fige un doublon oublié (précédent KR-171/BUG-042, récidive).

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM, tech-lead, UX | Le retrait d'un Personnage doit-il suivre le précédent Lieu (sans modale) ou ouvrir une modale de confirmation (CLAUDE.md § Dangerous Actions) ? | `RETENU` (modale) | Consensus indépendant des 3 rôles au tour 1 : le motif du précédent Lieu (« le seul cas dangereux est déjà bloqué par le validateur ») protège l'intégrité RÉFÉRENTIELLE, jamais la perte du contenu PROPRE du personnage — 7 blocs remplis contre 3 champs pour un Lieu |
| 2 | Tech-lead (veto), étendu par narratif-ia | Aucun code feature ne doit pré-calculer les référents d'un personnage (ni pour désactiver le bouton, ni pour composer un texte de modale conditionnel) | `RETENU` (veto) | Dupliquerait la règle SSOT et se tromperait sur KR-194 (une relation auto-référentielle serait vue comme un référent externe et refuserait à tort). Le bouton reste toujours actif, la modale toujours muette sur les référents |
| 3 | Narratif-ia | `issues.ts:93` (`reference-pendante`) conseille « puis réimportez-le », impossible dans l'éditeur | `RETENU` | Corrigé, texte figé § 3/§ 4. PM : in-scope car le bandeau de refus fait partie du critère #2 de ce lot, pas un fallout adjacent |
| 4 | Tech-lead | Une SECONDE occurrence du même défaut (`texte-trop-long`, `issues.ts:103`) est déjà rendue par `FichePersonnage.tsx` aujourd'hui | `RETENU` | Corrigée dans la même passe (même classe, même fichier, même comité) ; les ~10 autres libellés restants du registre → `REPORTÉ`, hors du chemin observable de ce lot |
| 5 | Tech-lead | `issues.ts` entrant au lot casse-t-il « zéro fichier brain/ » du cadrage ? | `RETENU` | Oui — le lot devient marqué `contrat`, temps 0 imposé. La dispense de lot contrat séparé (précédent it6) reste valide tant qu'aucun second lot ne coexiste |
| 6 | Tech-lead | Conflit entre la restauration de focus native de `Modal.tsx` (au démontage, sur l'élément qui l'a ouvert) et `intentionFocus` (qui veut déplacer le focus vers la fiche retombée) | `RETENU` — résolu, pas un conflit | Vérifié mécaniquement (React 18, ordre destroy/create dans un même commit) : `intentionFocus` gagne SI fermeture et retrait sont dans le même gestionnaire synchrone. Converti en 2 invariants écrits (§ 3/§ 5) plutôt qu'un composant séparé |
| 7 | Tech-lead (retiré par lui-même) | `PiedFichePersonnage.tsx` neuf pour isoler l'état d'ouverture de la modale | `REJETÉ` | Une garde en ligne (`enConfirmation === personnageAffiche.id`) dans `PanneauPersonnages.tsx` donne la même garantie à coût nul — fichier à un seul appelant évité |
| 8 | Tech-lead | Retombée de sélection au dernier personnage retiré (`setSelection` ne porte pas `null` aujourd'hui) | `RETENU` | Géré dans le socle : `restants.length === 0 ? null : restants[max(index-1,0)].id` |
| 9 | Tech-lead | Purge des brouillons locaux des 4 sous-hooks au retrait | `RETENU` (aucune purge) | Identifiant jamais réutilisé (`frapperIdentifiant`) : aucun risque de collision, purge inutile. Motivé en commentaire, pas en code |
| 10 | UX | Le corps de la modale doit-il énumérer dynamiquement les blocs remplis perdus, ou rester un texte fixe générique ? | `RETENU` (texte fixe) | Coût de dérivation disproportionné pour le gain ; « tout contenu déjà renseigné » couvre le cas sans sur-déclarer sur un personnage à peine amorcé |
| 11 | QA | La DoD sur `issues.ts` doit inclure un grep anti-résidu, pas seulement les 2 assertions réécrites | `RETENU` | Ajouté à la DoD (§ 7) — précédent de récidive KR-171/BUG-042 |
| 12 | Narratif-ia | Faut-il un KR numéroté « la prose ne se scanne jamais par nom » ? | `REJETÉ` comme KR, `RETENU` comme note | Seuil du dépôt = 3e occurrence (précédent KR-197/KR-199) ; ceci est une 1re occurrence. Reconduit en `open_questions`, propriétaire n° 10 |
| 13 | Narratif-ia | Le comportement d'une session de jeu sauvegardée indexant ce personnage doit-il être spécifié ici ? | `REPORTÉ` | Propriétaire n° 9+ (moteur, mémoire de session), hors Temps 1 — nommé en `open_questions` pour ne pas être reperdu |
| 14 | Tech-lead | Lot 2 optionnel groupant le correctif de `BlocPresence.tsx` (BUG-074) en essaim | `REJETÉ` | it7 ne touche pas ce fichier ; lot fallout non causé — précédent veto PM sur `ObjectifsCanon` à it4 |

*(Aucun désaccord n'est resté sans statut ; aucun n'a nécessité d'`ESCALADE`.)*

## 9 — Innovation

*(Aucune proposition `INNOVATION` ce tour — supprimé.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : Prettier → `tsc --noEmit` → `npm run lint` → `jest`
- [ ] `npm run test:mutation` — **non requis** (aucun des 4 fichiers mutés touché)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] `grep -rn "réimportez" src/` : zéro résidu hors les 2 lignes corrigées de `issues.ts` (§ 7 DoD)
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste du lot (§ 5)
- [ ] `BUG-075` (messages d'anomalie faux hors import) journalisé dans `bug_history.json`, mitigation promue le jour même
- [ ] `open_questions` : entrées (a) prose résiduelle par nom et (b) session pendante, ajoutées
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-fiches-it7.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve → **recevable** | modale + correctif `issues.ts` (une ligne) au périmètre |
| Tech Lead | recevable sous réserve → **recevable** | 2 silences tranchés (dernier personnage, brouillons), lot marqué `contrat`, conflit focus résolu en 2 invariants |
| UX | recevable | textes exacts fournis (bouton, modale, 2 messages d'anomalie) |
| QA | recevable sous réserve → **recevable** | 11 tests nommés fusionnés et rattachés aux critères, grep anti-résidu ajouté à la DoD |
| Narratif & IA | recevable sous réserve → **recevable** | veto étendu (bouton jamais désactivé, modale jamais conditionnée) écrit § 3/§ 6 ; note `open_questions` au lieu d'un KR |
