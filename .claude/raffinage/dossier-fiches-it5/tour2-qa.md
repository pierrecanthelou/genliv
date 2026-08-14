# TOUR 2 — QA — `dossier-fiches` it5 (relations + présence)

**Découpage du hook (tech-lead §B) — KR-197 tient.** Les deux tests existants (`panneauPersonnages.test.tsx:448` identité, `:787` caractéristiques) interrogent le hook par son interface publique (`UseEcriturePersonnagesResult`, câblée via `PanneauPersonnages`/`FichePersonnage`), pas par son fichier interne. Tech-lead confirme que cette forme ne change pas — « seules des clés s'y ajoutent » — et que `commit()` reste unique, dans le socle. Gel vérifiable en diff : 0 ligne d'assertion à toucher.

**Un test ou deux ? Tranché : deux**, malgré le sous-hook partagé. `useEcritureRelationsPresence` expose des gestionnaires distincts par champ (`relations[]` vs `presence[]`) ; le défaut KR-197 s'est présenté 4 fois par site d'appel, jamais par fichier. Un test qui ne mute que le champ `relations` ne prouve rien du site `presence`. Les deux tests vivent dans le même fichier `tests/relationsPresence.test.tsx` (liste de tech-lead inchangée) — un fichier, deux `it()` nommés.

**Propositions tour 1 :**
1. Test par famille → tranché ci-dessus (deux, même fichier).
2. Gel des 2 tests existants → confirmé, tient sur le découpage §B.
3. `presence.quand` → tranché au tour 1 (`auteur`), non rouvert.
4. Test KR-194 dédié → maintenu, reformulé en annexe.

Une correction : mon cas limite tour 1 sur `secret` supposait un gating testable en it5. Narratif-ia (§F) l'exclut explicitement de ce lot — pas de code d'assemblage avant n°12. Reformulé en annexe.

---

## ANNEXE — cas limites (hors savoirs), niveau de test nommé

1. **Auto-référence KR-194** (composant, `relationsPresence.test.tsx`) — le `Select` « PERSONNAGE » liste le personnage affiché lui-même parmi les cibles ; le choisir committe sans refus ni bandeau d'avertissement. Assertion négative explicite : `queryByText(EYEBROW_REFUS)` reste `null`.

2. **`intensite` hors bornes** — deux niveaux distincts, ne pas les fusionner :
   - *Unitaire* (`validate.test.ts`) : import avec `intensite: 4` et `-4` → rejeté au SSOT ; `-3`/`3` acceptés. Symétrique de `DUREE_MIN`.
   - *Composant* (`relationsPresence.test.tsx`) : le `Stepper` refuse de décrémenter sous `-3` (clic bloqué) et affiche `-3` — jamais `+-3` — au correctif signe-aware proposé par UX. À vérifier avant de le supposer acquis (tech-lead l'a signalé non vérifié) : un test qui l'exerce est le prix de cette itération, pas une note de bas de page.

3. **`secret` coché/décoché — REFORMULÉ** (unitaire + composant, PAS de test de gating) : SSOT accepte `[true, false]`, `requis: false`, défaut absent traité `false` (déjà couvert par `ENUMERES_FERMES` générique) ; `Toggle` lit/écrit la valeur exacte sans permutation d'index (le volet KR-197 du test #1 ci-dessus). Le mécanisme de filtrage par rôle (§C narratif-ia) n'a **aucun code en it5** (narratif-ia §F, n°12) : **aucun critère d'acceptation dessus ce tour**. Seule preuve possible : lecture — la phrase de §C est présente mot pour mot au JSDoc de `Relation.secret` et au commentaire de la ligne `destinations.ts`, vérifiable par diff, pas par jest.

4. **`cible_id` orpheline** (unitaire, `validate.test.ts`) — réutilise le patron générique `REFERENCES_SIMPLES` déjà exercé pour d'autres champs (`objectif_id` etc.) : un dossier avec `relations[].cible_id` pointant vers un `pnj` supprimé est signalé par `validateDossier`, jamais filtré au rendu (KR-021, tech-lead §D).

5. **Présence sans `lieu_id`** (composant) — le geste d'ajout est un `Select` dont la première option n'est pas une vraie valeur (patron savoirs/relations) : aucune ligne locale incomplète ne peut exister — le test prouve l'**absence** de mécanisme de soumission vide, pas un message de refus.

6. **Deux personnages distincts, un test par sous-écran** (composant, KR-197) — relations ET présence testées séparément malgré le sous-hook commun (tranché plus haut) ; valeurs non fabricables par le widget par défaut : `intensite ≠ 0`, `secret: true`, `lieu_id` renseigné, `quand` non vide.

7. **Double sélection rapide sur le geste d'ajout — REFORMULÉ.** Ni relations ni présence n'ont de bouton pointillé « + Ajouter » (UX §Relations : « même traitement Select-comme-geste-d'ajout que Savoirs ») : sélectionner deux fois rapidement une option réelle sur le même `Select` ne doit pas créer deux lignes identiques ; le `Select` revient au placeholder après commit.

8. **Liste vide au montage** (composant) — `TEXTE_AUCUN_AUTRE_PERSONNAGE` (relations) / `TEXTE_AUCUN_LIEU_CANON` (présence) remplacent tout le corps du bloc, geste d'ajout absent — pas un void.
