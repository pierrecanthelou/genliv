# Tour 1 — QA — `dossier-canon` it1

RISQUE — le KR-183 exige un warning « affiché à l'écran », mais le BUT BRUT ne nomme pas l'emplacement (bandeau global ? sous le champ fautif ?). Sans cet arbitrage, aucun sélecteur RTL n'est stable — un test qui vise un texte non arbitré est un test qui devine. Second risque, instrumental : le cas-limite « 601 mots » ne doit jamais être tapé caractère par caractère via `user-event` (lent, fragile) — il doit peupler le champ par une valeur contrôlée puis déclencher la sauvegarde (blur), exactement comme le patron debounce de KR-053.

OBJECTION — le cadrage ne dit pas non plus QUAND une sauvegarde se déclenche (par champ au blur, ou un bouton global « Enregistrer » pour tout le panneau) : le test « vider le synopsis en cours d'édition » n'est observable que si ce déclencheur est nommé — sinon on ne sait pas si le champ vide atteint jamais `update()`.

PROPOSITION — le lot 2 fixe, avant code : (a) sauvegarde au blur par champ, patron KR-053 (brouillon local seedé une fois, commit à l'idle/blur) ; (b) warning rendu **sous le champ concerné**, `role="status"`, texte dérivé de `dossierIssueRemediation`. Tests nommés ci-dessous. Confirmation point 5 : aucune ligne `npm run test:mutation` dans la définition de fini de ce plan — `brain/dossier/` reste hors des 4 fichiers mutés (KR-161).

VERDICT — recevable sous réserve : (a) et (b) ci-dessus doivent être écrits dans le §3 du plan avant signature.

## Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `DossierService.test.ts` — « update: dossier absent → statut absent, rien persisté » | `update('inconnu', recette)` ⇒ `{statut:'absent'}` ; `persistence.set` non rappelé ; `recette` jamais invoquée (spy) | unitaire | KR-183 | 1 |
| `DossierService.test.ts` — « update: candidat invalide → refuse, rien persisté » | recette posant `canon.mj.synopsis_mj=''` ⇒ `{statut:'refuse', errors:[{code:'champ-requis-vide',…}]}` ; `get(id)` après l'appel égale l'ancien dossier (deep-equal), `dossier:updated` jamais émis | unitaire | KR-183 | 1 |
| `DossierService.test.ts` — « update: écriture propre → ecrit, warnings vides, dossier:updated émis » | recette posant `ton` valide ⇒ `{statut:'ecrit', warnings:[]}` ; `get(id).canon.ton` reflète le nouveau texte ; `events.emit` appelé avec `('dossier:updated',{dossierId})` APRÈS `persistence.set` | unitaire+contrat | KR-183/KR-004 | 1 |
| `DossierService.test.ts` — « update: écriture avec avertissement → ecrit, warnings non vide, PERSISTE quand même » | `canon.mj.synopsis_mj` à 601 mots ⇒ `{statut:'ecrit', warnings:[{code:'texte-trop-long',severity:'warning',…}]}` ; `get(id)` reflète le nouveau texte (le dépassement n'empêche jamais, KR-165) | unitaire | KR-183/KR-165 | 1 |
| `DossierService.test.ts` — « update: titre/id/createdAt hors CorpsDossier, updatedAt jamais fixé par l'appelant » | recette qui retourne `{...corps, titre:'hack', updatedAt:'2000-01-01'} as any` ⇒ dossier écrit garde l'ancien `titre`, `updatedAt` = horloge du service (mockée) | unitaire | KR-183 | 1 |
| `DossierService.test.ts` — « update: deepFreeze reste à site d'appel unique » | grep source `DossierService.ts` : aucune occurrence de `Object.freeze`/`deepFreeze` en dehors de l'import déjà utilisé par `validateDossier` | contrat (grep) | KR-166 | 1 |
| `dossier-canon` panneau — « rendu initial: les 4 champs de prose portent MARQUEUR_A_ECRIRE comme valeur réelle » | textbox synopsis MJ/accroche/ton ont pour `value` un texte commençant par MARQUEUR_A_ECRIRE (pas un placeholder grisé) | composant | KR-178 | 2 |
| `dossier-canon` panneau — « sauvegarde d'un champ persiste et survit à une relecture » | saisir puis blur le champ ton → `DossierService.get(id).canon.ton` = nouvelle valeur ; remonter l'écran sur le même dossierId → le champ affiche la valeur persistée | composant+contrat | KR-183 | 2 |
| `dossier-canon` panneau — « ajouter un interdit de ton l'ajoute à la liste persistée » | affordance « + Ajouter » dashed (liste vide au départ, empty-state) → canon.interdits_ton gagne l'entrée après confirmation | composant | — | 2 |
| `dossier-canon` panneau — « supprimer un interdit de ton le retire de la liste persistée » | clic suppression sur une ligne existante → canon.interdits_ton perd l'entrée | composant | — | 2 |
| `dossier-canon` panneau — « synopsis à 600 mots pile: aucun warning affiché » | valeur exactement BUDGET_MOTS_CANON mots, blur → queryByRole('status') nul | composant (borne) | KR-165 | 2 |
| `dossier-canon` panneau — « synopsis à 601 mots: warning rendu sous le champ » | 601 mots, blur → getByRole('status') contient le message dérivé de dossierIssueRemediation('texte-trop-long') ; le champ reste écrit (non bloqué) | composant (borne) | KR-183/KR-165 | 2 |
| `dossier-canon` panneau — « synopsis vidé puis blur: update refuse, ancien texte reste persisté, erreur affichée » | effacer le champ, blur → DossierService.get(id).canon.mj.synopsis_mj INCHANGÉ (ancien texte, pas '') ; message d'erreur champ-requis-vide visible au même endroit que le warning | composant | KR-183 | 2 |
| `dossierEditorScreen.test.tsx` — « rendu de base: état vide de la première section » réécrit | remplace texteEtatVide(0) par une assertion du panneau Canon réel (ex. getByRole('textbox',{name:/synopsis/i}) avec valeur MARQUEUR_A_ECRIRE) ; queryByText(texteEtatVide(0)) devient null | composant | — | 2 (fichier hors-feature, listé nommément) |
| `dossierEditorScreen.test.tsx` — « selection d'une section: index 0 rend le panneau Canon, indices 1-9 inchangés » | boucle corrigée : index===0 ⇒ assertion panneau réel ; index!==0 ⇒ texteEtatVide(index) conservé tel quel | composant | — | 2 (idem) |

**Cas limites explicitement couverts** : liste `interdits_ton` vide (empty-state nommé, jamais un vide muet) · synopsis à 600 mots (borne, pas de warning) · 601 mots (warning affiché, pas bloquant) · synopsis vidé en cours d'édition (refus explicite au blur, ancien texte préservé, jamais un no-op muet).

**Non vérifiable en l'état** : aucune, sous réserve que le lot 2 nomme l'emplacement du warning/de l'erreur (`role="status"` proposé) avant code — sinon les 4 derniers tests composant restent NON VÉRIFIABLES faute de sélecteur stable.
