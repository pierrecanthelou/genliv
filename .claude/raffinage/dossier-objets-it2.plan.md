# Plan d'itération — `dossier-objets` · itération `2`

> Statut : `validé` (2026-08-16)
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-08-16
> Composition : `4 rôles` — motif : identique à it1 (`docs/ROADMAP-BASCULE-IA.md` § 2, ligne 149, assignation nommée « 4 rôles »). Le retrait ne touche ni un champ neuf du schéma, ni une destination `ia`/`moteur` nouvelle, ni le moteur, ni les prompts, ni la mémoire de session, ni le mode jeu — `narratif-ia` non convoqué.
> Exécution : `séquentielle` (**1 lot, aucun `contrat`** — première itération de la feature sans lot `brain/`)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur retire un objet de son registre — confirmé par une modale, refusé et motivé par le dossier si un personnage le référence encore. » |
| **Tranche** | `FicheObjet` (bouton + modale de confirmation) → `PanneauObjets` (état `enConfirmation`, `RefusEnCours`) → `DossierService.update()` (refus structurel déjà existant, zéro code neuf) → bandeau de refus (`IssueList`) |
| **Lots** | 1 lot · `contrat` : **non** — aucun fichier `brain/`, y compris aucune fixture neuve sous `brain/dossier/__fixtures__/` |
| **Hors périmètre** | nommer le savoir précis (seul le personnage porteur est nommé — limite du SSOT) · glisser-déposer (déjà écarté, it1) · promotion de `EYEBROW_REFUS`/`TEXTE_ABSENT` vers `brain/` · toute fixture `brain/` neuve pour le test de discriminance |
| **Reporté** | nommage du savoir précis dans le message de refus (limite du SSOT, `sujet` absent de `REFERENCES_SIMPLES`) · suivi des garanties tacites du dossier de référence (ex. protection de `objet.lanterne-de-corvin`) contre une régression silencieuse d'une autre feature |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur retire un objet de son registre depuis un bouton toujours actif dans `FicheObjet` (`✕`, `tone="danger"`), confirmé par une modale (`RetirerObjetDialog`, précédent `RetirerPersonnageDialog.tsx`) qui reste muette sur qui référence l'objet — aucun pré-vol côté feature, le SSOT (`DossierService.update`/`validateDossier`) reste la seule autorité. Si l'objet est encore la cible d'une `Personnage.savoirs[].revele_si.contrepartie.objet_id`, ou de tout autre chemin déjà couvert par `REFERENCES_SIMPLES`/`CHEMINS_DE_DELTAS` (`possede_objet`, `donner_objet`, `retirer_objet`), le dossier refuse (`reference-pendante`, bloquant) et **nomme le personnage porteur** — le savoir précis n'est pas identifié individuellement, limite connue et documentée du SSOT, pas une régression de cette itération. Le focus après un retrait réussi suit l'objet suivant (ou revient à « + Ajouter un objet… » si la liste se vide), via un `FicheObjetHandle` exposé par `FicheObjet.tsx` — jamais une recherche DOM du panneau vers la fiche.

## 2 — Hors périmètre

- Nommer le savoir précis dans le message de refus — le SSOT ne le fait pas aujourd'hui (`REFERENCES_SIMPLES` n'a pas de `sujet` dynamique pour ce chemin) ; l'ouvrir serait un lot `contrat` pour une phrase. Reporté en `open_questions`.
- Glisser-déposer — déjà écarté au raffinage d'it1, sans objet ici.
- Promotion de `EYEBROW_REFUS`/`TEXTE_ABSENT` vers `brain/components/` — 3ᵉ copie du même texte à travers Lieux/Personnages/Objets, mais toucher `dossier-canon`/`dossier-fiches` (déjà `done`) est hors du périmètre de cette feature (KR-200). Reporté en `open_questions`.
- Toute fixture `brain/` neuve pour prouver la discriminance — le test de discriminance sème ses propres objets EN MÉMOIRE dans le test, jamais un fichier sous `brain/dossier/__fixtures__/` (qui requalifierait le lot en `contrat`).
- Toute garde de suivi des garanties tacites de `dossier-reference.json` (ex. « `objet.lanterne-de-corvin` doit rester protégé ») — proposée par le tech-lead, écartée par la QA (précédent du dépôt : aucun test de refus/discriminance des features soeurs ne dépend de la fixture de référence) ; reportée en `open_questions` comme préoccupation transverse, pas un critère de cette itération.
- Retrait en masse, annulation d'un retrait (undo) — aucun besoin exprimé.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**Bouton de retrait** (`FicheObjet.tsx`, pied de fiche, motif `piedFicheStyle` de `FicheLieu.tsx`, `justify-content: flex-end`) : `IconButton`, `tone="danger"`, `size={HIT_TARGET_MIN}`, glyphe `✕`. Libellé — réutilise la convention déjà posée à it1 dans ce même fichier (`libelleMonter`/`libelleDescendre`) :
- `Retirer l'objet « ${nom.trim()} »` si nommé,
- `Retirer l'objet n°${index + 1} (sans nom)` sinon.

TOUJOURS actif, jamais `disabled`, jamais conditionné à qui référence l'objet (même règle que dossier-fiches it7) : le SSOT décide après coup. `onClick` = `onDemanderRetrait` (ouvre la modale, n'écrit rien) — jamais un `handleRetirer` direct depuis la fiche.

**`RetirerObjetDialog.tsx`** (nouveau, précédent exact `RetirerPersonnageDialog.tsx`) :
```ts
export interface RetirerObjetDialogProps {
	/** Désignation déjà résolue par le parent (localiserEntite('objet', ...) ou designationDe). */
	nomAffiche: string
	onConfirm: () => void
	onCancel: () => void
}
export function RetirerObjetDialog({ nomAffiche, onConfirm, onCancel }: RetirerObjetDialogProps): JSX.Element
```
Rendu : `<Modal title="Retirer l'objet" cancelLabel="Annuler" confirmLabel="Retirer" confirmTone="error" onClose={onCancel} onCancel={onCancel} onConfirm={onConfirm}>`. Corps, **un seul nœud de texte** (jamais découpé par `<strong>`, précédent `corpsDe`), texte exact — corrigé au tour 2 (UX) pour rester vrai même sur un objet vide :

> `L'objet ${nomAffiche} sera retiré du registre, avec tout contenu déjà renseigné parmi le nom et la description. Cette action est irréversible.`

Muette sur les référents : ne reçoit ni le dossier, ni la liste des personnages.

**`FicheObjet.tsx` (R)** — `forwardRef<FicheObjetHandle, FicheObjetProps>` :
```ts
/** Ce que PanneauObjets peut DEMANDER — jamais aller chercher dans le DOM (§ Encapsulation, BUG-078 non reproduit). */
export interface FicheObjetHandle {
	/** Focalise le bouton de retrait de LA FICHE ACTUELLEMENT RENDUE. */
	focusRetirer: () => void
}
/** Exportée pour que PanneauObjets ne reconstruise pas la même chaîne (précédent designationDe). */
export function designationDe(objet: Objet, index: number): string

export interface FicheObjetProps {
	objet: Objet
	index: number
	brouillon: BrouillonObjet
	/** DÉJÀ filtré par le parent : la fiche ne reçoit jamais un objetId autre que le sien. */
	refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null
	nomInputRef: Ref<HTMLInputElement>
	onChangeChamp: (champ: keyof BrouillonObjet, valeur: string) => void
	onBlurChamp: (champ: keyof BrouillonObjet, valeur: string) => void
	/** DEMANDE le retrait (ouvre la modale) — ne retire jamais. */
	onDemanderRetrait: () => void
}
```
Implémentation : `const retirerRef = useRef<HTMLButtonElement>(null); useImperativeHandle(ref, () => ({ focusRetirer: () => retirerRef.current?.focus() }), [])`, `ref={retirerRef}` sur l'`IconButton` de retrait.

Bandeau de refus, sous le pied de fiche, précédent exact `FicheLieu.tsx`/`FichePersonnage.tsx` : `role="status"`, eyebrow `EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"` (mono, `--bad`) ; `IssueList` si `statut==='refuse'`, `TEXTE_ABSENT` si `statut==='absent'` — rendu branché sur `statut`, **jamais** sur `issues` (précédent BUG-183-style). Les deux constantes sont **recopiées localement** dans `dossier-objets` (3ᵉ occurrence identique à travers le dépôt) — pas promues (`open_questions`).

**`PanneauObjets.tsx` (R)** :
```ts
interface RefusEnCours { objetId: string; statut: 'absent' | 'refuse'; issues: DossierIssue[] }
const [enConfirmation, setEnConfirmation] = useState<string | null>(null)   // jamais un booléen
const ficheRef = useRef<FicheObjetHandle>(null)
const boutonAjouterRef = useRef<HTMLButtonElement>(null)                    // câblé dans les DEUX branches (état vide + état peuplé)
function commit(objetsSuivants: Objet[], objetId: string, { resout }: { resout: boolean } = { resout: true }): EcritureDossier
```
`commit()` change de signature depuis it1 (qui n'avait ni `objetId` ni `resout`, aucun refus n'étant possible à l'époque) — même discipline que `PanneauLieux.tsx:136-153` : un AJOUT ne résout jamais un refus (`resout: false`), un retrait/une édition le résout s'il touche le même `objetId`. Modale rendue par une garde **en ligne** (`enConfirmation === objetAffiche?.id`), jamais un `useEffect` de resynchronisation. Focus post-retrait : `objetAffiche !== undefined ? ficheRef.current?.focusRetirer() : boutonAjouterRef.current?.focus()`. **Interdit explicitement** : toute recherche `querySelector`/`getElementById` du panneau vers la fiche (BUG-078, dossier-canon, non corrigé — ne pas le reproduire une 3ᵉ fois).

**Extraction `styles.ts` (KR-112)** : les ~99 lignes de `CSSProperties` de `PanneauObjets.tsx` (§ styles, fin de fichier) migrent vers `components/styles.ts`, à l'identique — mêmes tokens, aucune valeur recréée ni changée (condition UX, non négociable). Sans cette extraction, `PanneauObjets.tsx` dépasserait ~420 lignes (signal KR-112, 400) après l'ajout du retrait, sur la dernière itération de la feature (pas d'it3 pour la résorber).

**Clavier** : `Modal.tsx` gère déjà Échap, piège de Tab, restauration du focus au démontage — rien à coder pour l'ouverture/l'annulation. Seul le cas « confirmation réussie » reste dû côté feature (le bouton d'origine est démonté, la restauration native ne suffit plus) : résolu par `intentionFocus`/`useEffect` DOM impératif ciblant `FicheObjetHandle` (usage légitime, KR-013).

*(Écrit par l'UX, révisé par l'arbitrage du §8. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

**Aucun.** Le refus de retrait est déjà géré structurellement par `validateDossier` (`REFERENCES_SIMPLES`, `src/brain/dossier/tables.ts:484` — entrée déjà existante depuis dossier-fiches it6) : retirer un objet encore référencé produit automatiquement `reference-pendante` (bloquant), sans une ligne de code neuve dans `brain/`. `DossierService.update()` est consommé sans changement de signature.

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `DossierService.update(id, recette): EcritureDossier` | service | consomme | inchangé depuis it1 |
| `Objet`, `EcritureDossier`, `DossierIssue` | type | consomme | inchangés depuis it1 |
| `brain/components/{Modal, IssueList, IconButton}` | composant | consomme | inchangés — `Modal` et `IssueList` déjà cités par `design_contract.composants` depuis le cadrage d'it1 |
| `brain/components/ListRow.tsx`, `IconButton.tsx` | composant | consomme (inchangé) | aucune prop neuve, aucun code touché |

## 5 — Lots

> Un seul lot, aucun `contrat` : première itération de cette feature sans fichier `brain/`. Légende : (N) nouveau · (R) modifié.

### Lot 1 — `retrait-objet`
- **Ouvrier** : `dev-lot` (**pas** `dev-contrat` — aucun fichier `brain/`, y compris aucune fixture neuve sous `brain/dossier/__fixtures__/`)
- **But** : l'auteur retire un objet, confirmé par une modale, refusé et motivé par le SSOT si référencé ailleurs.
- **Fichiers** :
  - `src/features/dossier-objets/components/RetirerObjetDialog.tsx` (N)
  - `src/features/dossier-objets/components/FicheObjet.tsx` (R)
  - `src/features/dossier-objets/components/PanneauObjets.tsx` (R)
  - `src/features/dossier-objets/components/styles.ts` (N) — extraction KR-112
  - `src/features/dossier-objets/tests/retraitObjet.test.tsx` (N)
  - `src/features/dossier-objets/tests/panneauObjets.test.tsx` (R, si nécessaire — a priori intact : les sélecteurs existants filtrent par `textContent.startsWith('Objet')` ou par le libellé exact des boutons Monter/Descendre, insensibles à l'ajout du bouton Retirer)
- **Expose / consomme** : signatures du §3 — `FicheObjetHandle`, `designationDe`, `RetirerObjetDialogProps`, `RefusEnCours`, `commit(objets, objetId, { resout })`.
- **Critères couverts** : tous (#1 à #8, ci-dessous).

*(1 lot : `RetirerObjetDialog`, `FicheObjet` et `PanneauObjets` partagent le même geste d'écriture et la même interface de handle — les scinder ferait partager `PanneauObjets.tsx` entre deux lots. Aucun parallélisme à révéler.)*

## 6 — Critères d'acceptation

1. **Étant donné** un objet non référencé ailleurs dans le dossier, **quand** l'auteur clique « Retirer » puis confirme dans la modale, **alors** l'objet disparaît de `monde.objets` (persisté par `DossierService.update()`), la modale se ferme, et le focus suit l'objet suivant (ou « + Ajouter un objet… » si la liste est vide) — *niveau : composant* — *lot 1*
2. **Étant donné** un objet référencé par une `contrepartie.objet_id` de savoir, **et un second objet non référencé, dans le MÊME test** (fixture construite en mémoire par le test, jamais `dossier-reference.json`), **quand** l'auteur tente de retirer chacun, **alors** le premier est refusé (bandeau `role="status"`, `IssueList` nommant le personnage porteur) et le brouillon/la sélection restent intacts, tandis que le second réussit — discriminance à deux entités (KR-197/KR-199/KR-202) — *niveau : composant* — *lot 1*
3. **Étant donné** la modale de retrait ouverte, **quand** l'auteur clique « Annuler » ou appuie sur Échap, **alors** rien n'est écrit, la modale se ferme, le focus revient au bouton « Retirer » (géré nativement par `Modal.tsx`) — *niveau : composant* — *lot 1*
4. **Étant donné** un objet retiré avec succès, **quand** on inspecte l'appel à `dossiers.update`, **alors** aucune recherche DOM (`querySelector`/`getElementById`) n'existe entre `PanneauObjets.tsx` et `FicheObjet.tsx` (test-grep de contrat, § Encapsulation) ; et **étant donné** un objet dont le retrait est refusé, **alors** ni `PanneauObjets.tsx` ni `FicheObjet.tsx` ne contiennent les chaînes `personnages`/`savoirs` (garde structurelle : aucun pré-vol codable) — *niveau : contrat (grep)* — *lot 1*
5. **Étant donné** `objet.lanterne-de-corvin` du dossier de référence réel (`__fixtures__/dossier-reference.json`, déjà référencé par `pnj.tobin-le-gamin.savoirs[0]`), **quand** son retrait est tenté, **alors** il est refusé — une seule assertion, hors du test de discriminance, lue depuis le fichier réel (KR-156) — *niveau : contrat* — *lot 1*
6. **Étant donné** le dossier de référence (3 objets), **quand** ce lot est livré, **alors** les 3 objets restent acceptés par `validateDossier` sans modification de leurs champs (non-régression, KR-156) — *niveau : contrat* — *lot 1*
7. **Étant donné** les 9 sections que cette feature ne livre jamais, **quand** l'écran d'édition se rend, **alors** elles affichent toujours l'état vide honnête de `PanneauSection`, intact (KR-187) — *niveau : composant* — *lot 1*
8. **Étant donné** le nouveau code, **quand** `npm run lint` et `tsc --noEmit` tournent, **alors** zéro erreur ; **et** `git diff` ne contient AUCUN fichier sous `src/brain/` (garde de revue propre à cette itération, renversée par rapport à it1) — *niveau : contrat (lint + grep)* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `retraitObjet.test.tsx` — « retrait sans référence : reussi, focus sur l'objet suivant » | 2 objets locaux, retrait du premier confirmé → `monde.objets` n'a plus l'id ; fiche affichée = second objet, focus via `FicheObjetHandle` | composant | — | 1 |
| `retraitObjet.test.tsx` — « retrait du dernier objet : liste vide, focus sur + Ajouter » | 1 objet local, retrait confirmé → état vide affiché, `boutonAjouterRef` a le focus | composant | — | 1 |
| `retraitObjet.test.tsx` — « discriminance : un objet referme par contrepartie refuse, un objet libre reussit, MEME TEST » | fixture construite en mémoire (2 objets, 1 personnage avec `savoirs[0].revele_si.contrepartie.objet_id` pointant le premier) ; retrait du 1er → refusé, bandeau nomme le personnage ; retrait du 2nd → réussi | composant | KR-197/KR-199/KR-202 | 1 |
| `retraitObjet.test.tsx` — « annuler la modale : rien ecrit, focus revient au bouton Retirer » | clic Annuler / touche Échap → `updateSpy` non appelé, `document.activeElement` = bouton Retirer | composant | — | 1 |
| `retraitObjet.test.tsx` — « aucun pre-vol : bouton toujours actif, tentative refusee au SSOT » | objet référencé → bouton `Retirer` `not.toBeDisabled()` avant clic ; après confirmation, `updateSpy.mock.calls[0][1](dossier).monde.objets` ne contient plus l'id (la feature a tenté) ; message affiché égal au message du SSOT, verbatim | composant | — | 1 |
| `retraitObjet.test.tsx` — « grep anti-pre-vol : aucune connaissance de personnages/savoirs cote feature » | lecture source de `PanneauObjets.tsx`/`FicheObjet.tsx` : aucune occurrence de `personnages`/`savoirs` | contrat (grep) | — | 1 |
| `retraitObjet.test.tsx` — « grep encapsulation : aucun querySelector du panneau vers la fiche » | lecture source de `PanneauObjets.tsx` : aucune occurrence de `querySelector`/`getElementById` (anti-BUG-078) | contrat (grep) | § Encapsulation | 1 |
| `retraitObjet.test.tsx` — « focus post-retrait : sonde a candidats multiples, pas un simple toHaveFocus » | ≥2 objets restants après retrait, `querySelectorAll('button[aria-label^="Retirer"]').length > 1` avant d'asserter le focus — évite qu'un mutant sur l'index survive (KR-199) | composant | KR-199 | 1 |
| `retraitObjet.test.tsx` — « objet.lanterne-de-corvin (reference reelle) refuse » | lu depuis `dossier-reference.json` réel, une seule assertion, hors discriminance | contrat | KR-156 | 1 |
| `panneauObjets.test.tsx` (existant, vérifié sans régression) | ajout, édition, reorder (clic + clavier) restent verts après l'ajout du bouton Retirer dans chaque ligne | composant | — | 1 |
| `dossierEditorScreen.test.tsx` (suite existante `bascule-editeur`, non touchée) | reste vert | composant | KR-187 | 1 (vérifié, non modifié) |
| `npm run lint` + `git diff --name-only \| grep '^src/brain/'` (garde de revue) | zéro erreur lint ; zéro fichier `brain/` dans le diff | contrat (lint + grep) | — | 1 |

**Cas limites couverts** : retrait du dernier objet (liste vide) · retrait avec référence (refus) · retrait sans référence (succès) · annulation de la modale · objet sans nom retiré (texte de modale reste vrai) · référence réelle du dossier de référence (`lanterne-de-corvin`).

**Non vérifiable en l'état** : aucune.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM / Tech Lead (tour 1→2) | Le goal promet que le refus « nomme le personnage/savoir fautif » — le SSOT ne nomme-t-il vraiment que le personnage ? | `RETENU` (reformulation : « nomme le personnage porteur ») | Vérifié par Tech Lead : `REFERENCES_SIMPLES` (tables.ts:484) n'a pas de `sujet` dynamique pour ce chemin — `issue.location` résout le personnage, jamais le savoir. PM accepte la reformulation plutôt qu'un lot contrat pour une phrase (désaccord 1 dans les deux notes tour 1). |
| 2 | Tech Lead / UX (tour 1) | Mécanisme de confirmation : `Modal` (dossier-fiches it7) ou retrait immédiat (`PanneauLieux.tsx`, dossier-canon it4) ? | `RETENU` (`Modal`) | Convergence indépendante des 4 rôles dès le tour 1 : `CLAUDE.md` § Dangerous Actions exige un dialogue pour toute action destructive/irréversible ; `design_contract.composants` d'it1 avait déjà anticipé « Modal (retrait) » ; le retrait immédiat de `PanneauLieux.tsx` porte en plus une dette non corrigée (BUG-078) — pas un modèle à suivre. Aucun veto réel, UX retire sa réserve conditionnelle au tour 2. |
| 3 | Tech Lead vs QA (tour 1→2) | Matériau du test de discriminance : réutiliser `objet.lanterne-de-corvin` (déjà référencé dans le VRAI dossier de référence) + un objet fraîchement semé (Tech Lead, P1) — ou une fixture ENTIÈREMENT locale, construite en mémoire dans le test, sans toucher `dossier-reference.json` (QA) ? | `RETENU` (fixture locale, QA) | QA a vérifié empiriquement : 0/3 tests de refus/discriminance des features soeurs (`retraitPersonnage.test.tsx`, `savoirs.test.tsx`, `panneauPersonnages.test.tsx`) ne dépendent de `dossier-reference.json` — tous sèment des entités locales fraîches. Motif QA retenu : `dossier-reference.json` a plusieurs écrivains non coordonnés à travers les features ; un test de discriminance qui en dépendrait casserait silencieusement, sans rapport avec `dossier-objets`, si un futur lot touchait `pnj.tobin-le-gamin.savoirs[0]` pour SA propre raison. Tech Lead a lui-même concédé au tour 2 : « la discriminance est une question d'indexation du refus, pas de données réelles — une fixture locale isole la variable, la référence la noie ». |
| 4 | Tech Lead (tour 2) | Faut-il quand même garder UNE assertion sur la référence réelle (`objet.lanterne-de-corvin` refusé), hors discriminance, pour ne pas perdre le filet KR-156 sur cette protection tacite ? | `RETENU`, en dehors du test de discriminance | Motif : le critère #6 relit déjà le fichier de référence pour la non-régression structurelle, mais rien ne prouve aujourd'hui que le retrait d'un objet référencé y échoue vraiment. Une seule assertion supplémentaire (§7, test « objet.lanterne-de-corvin refuse ») ferme ce trou sans rouvrir le désaccord 3 : elle ne sert pas de preuve de discriminance, seulement de non-régression sur un fait déjà vrai. |
| 5 | Tech Lead (tour 2) | Faut-il un mécanisme dédié pour surveiller que les garanties tacites de `dossier-reference.json` (ex. « `lanterne-de-corvin` reste protégé ») ne se dégradent pas silencieusement au fil des features futures ? | `REPORTÉ` → `open_questions` | Préoccupation réelle mais transverse à toutes les features qui écrivent dans le dossier de référence partagé, pas spécifique à `dossier-objets` it2 — hors du mandat de cette itération de proposer un mécanisme cross-feature. |
| 6 | UX (tour 1) | Le texte de la modale (« avec son nom et sa description déjà renseignés ») affirme à tort que les deux champs sont toujours remplis | `RETENU` (auto-corrigé par UX au tour 2) | Un objet jamais édité (« Objet n°3 (sans nom) ») peut être retiré ; le texte doit rester vrai à 0 % comme à 100 % de remplissage. Reformulé sur le patron déjà éprouvé de `RetirerPersonnageDialog` (« tout contenu déjà renseigné parmi… »), jamais un texte conditionnel (la modale reste un seul nœud de texte). |
| 7 | Tech Lead (tour 1) | `PanneauObjets.tsx` (339 lignes à l'issue d'it1) dépasserait le signal KR-112 (~420 lignes) une fois le retrait ajouté, sans itération suivante pour le résorber | `RETENU` (extraction de `components/styles.ts`) | UX confirme au tour 2 : aucun impact sur le contrat de design tant que les tokens migrent à l'identique, sans valeur recréée ni changée. |
| 8 | Tech Lead (tour 1) | `EYEBROW_REFUS`/`TEXTE_ABSENT` seraient dupliqués une 3ᵉ fois à l'identique à travers Lieux/Personnages/Objets — faut-il les promouvoir vers `brain/components/` maintenant ? | `REPORTÉ` → `open_questions` | Promouvoir exigerait de toucher `dossier-canon`/`dossier-fiches`, deux features déjà `done` — hors du périmètre de cette feature (même motif que KR-200). À réévaluer si une future feature (n°6+) en a besoin. |
| 9 | QA (tour 2) | Le focus post-retrait doit-il être prouvé par un simple `toHaveFocus()`, ou une sonde à candidats multiples pour ne pas laisser un mutant sur l'index survivre ? | `RETENU` (sonde à candidats multiples) | Précédent KR-199 (un test au nom plus large que ses assertions) : sur un seul objet restant, `toHaveFocus()` ne distingue pas un focus correctement ciblé d'un focus qui atterrirait sur le même élément par accident d'ordre DOM. |

*(Aucun désaccord ne disparaît sans statut. Aucun bloc `ESCALADE` : le seul désaccord réel restant au tour 2 (désaccord 3) est tranché ici, chaque camp ayant déjà convergé aux 4/5 — Tech Lead lui-même concède le test principal à QA.)*

## 9 — Innovation

*(Aucune proposition hors-cadre cette itération.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `tsc --noEmit` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — sans objet (aucun des 4 fichiers de règles touché, aucun fichier `brain/` du tout)
- [ ] Tests du §7 écrits et passants
- [ ] Critères du §6 cochés un par un
- [ ] Aucun fichier touché hors de la liste du lot (§5)
- [ ] **Zéro fichier sous `src/brain/` dans le diff** — garde spécifique à cette itération, à vérifier explicitement (grep, pas seulement lu dans les comptes rendus)
- [ ] `IconButton.tsx` non touché (aucune prop neuve)
- [ ] `panneauObjets.test.tsx` (suite d'it1) reste vert, avec ou sans modification mineure de sélecteurs
- [ ] `dossierEditorScreen.test.tsx` (`bascule-editeur`) non modifié, suite verte
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-objets-it2.revue.md`
- [ ] **La feature `dossier-objets` (n° 5) est terminée à l'issue de ce lot : 2/2.** Statut à répercuter dans `docs/ROADMAP-BASCULE-IA.md` § 2 et dans `features_history.json` (1re entrée de la feature, cf. `docs/WORKFLOW.md` § Budget de contexte)

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable | reformulation du critère #4 (« nomme le personnage », sans « /savoir ») acceptée (désaccord #1) |
| Tech Lead | recevable | P1 amendée en faveur de QA sur le test principal (désaccord #3), garde une ligne sur la référence réelle (désaccord #4) ; P2/P3 retenus tels quels |
| UX | recevable | veto conditionnel levé (Modal confirmé, désaccord #2) ; texte de modale auto-corrigé (désaccord #6) |
| QA | recevable | fixture locale retenue pour la discriminance (désaccord #3) ; armement du « aucun pré-vol » et sonde de focus intégrés (§6/§7) |
