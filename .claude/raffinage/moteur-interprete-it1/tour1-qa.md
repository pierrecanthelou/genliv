# Tour 1 — QA

## RISQUE

**L'observabilité de la liste d'exclusion est cyclique sur les fichiers qu'elle nomme.** `moteurSansIA.test.ts` (KR-260) est réécrit avec une liste d'exclusion nommée par fichier pour le lot FEATURE. Mais cette liste doit nommer le(s) fichier(s) qui appelle(nt) `CopiloteService.demander('interprete', ...)` pour la première fois. Le cadrage propose le fichier probable (`useTourDeJeu.ts`) mais ne le grave pas. Si le fichier exact n'existe pas au moment d'écrire la liste, soit la liste est vide (l'instrument ne mesure rien), soit elle vise un fichier fantôme (elle reste verte même si l'import y entre silencieusement). Coût d'observabilité : entre le lot contrat et le lot feature de cette même itération, il y a une fenêtre où le balayage de code est aveugle. Le mutant obligatoire (ajouter l'import hors liste, vérifier ROUGE) ne peut pas rougir si la liste n'existe pas, et ne peut pas être retiré proprement si elle nomme un fichier qui n'a pas encore atteint la compilation. Cette dépendance sur l'ordre des lots n'est pas gravée.

## OBJECTION 1 — Contrat d'entrée/sortie de R1

Le cadrage nomme `SortieInterprete` comme « entrée = saisie + candidats en rangs + verbes dérivés de COMMANDES + ton/interdits_ton ; sortie = SortieInterprete (Commande en rangs | clarification | sans_commande) ». Aucun schéma JSON ni interface TypeScript n'est gravé en spec ni dans le cadrage des tours. Le test du rôle R1 dépend d'une fixture de retour précise (ex. `{ commande: 'aller', cibles: [...] }`), et aucun contrat n'isole cette forme des contrats voisins (dossier-copilote rend `IntentionRendue` sur un schéma disjoint par KR-231). Sans ce contrat gravé avant le code, deux observateurs (tech-lead et narratif-ia) peuvent écrire deux prompts différents qui rendent deux formes différentes, et les tests unitaires dépassent le code en silence tant que les deux formes rendent des `Commande` valides. **Les trois rôles existants (prose/repliques/intention) portent tous un contrat de schéma dans `schemaSortie.ts` + `GABARIT_SORTIE`** — R1 doit avoir le même niveau de formalisation avant que le code entre.

## OBJECTION 2 — Verrou de tour (KR-265) : pas de test d'orchestration avant le code

Le critère 10 dit « deux soumissions du champ de saisie dans le même tick → EXACTEMENT UN appel modèle ». Mais aucun test n'est nommé qui valide cet invariant en isolation logique. Le test du composant PlayerInputBar peut vérifier que le bouton est `disabled` pendant l'appel, mais c'est une réalisation UI, pas l'invariant logique. L'invariant vrai (deux mises en file d'attente rapides produisent exactement un `fetch`) doit être testé au niveau de l'orchestrateur/hook, pas au niveau du DOM. Le cadrage dit « un verrou logique testable vit dans l'orchestrateur/hook », mais aucune signature de hook ni scénario de test précis n'est proposé. **Observabilité manquante** : avant le code, écrire un test du hook isolé (mock de DossierService, spy de CopiloteService) qui force deux appels `.call()` consécutifs dans la même microtâche ou via deux `.then()` sur la même Promise, puis asserter `expect(copiloteCall).toHaveBeenCalledTimes(1)`.

## PROPOSITION 1 — Deux phases pour moteurSansIA.test.ts

Diviser la réécriture en deux tranches pour rendre l'instrument mesurable avant et après :
- **(Lot contrat)** : récrire le balayage des trois racines (`player`, `play-mode`, `brain/dossier`) avec une liste d'exclusion EXPLICITEMENT VIDE, nommée `FICHIERS_APPELANTS_R1: string[] = []`, avec une assertion de non-vacuité : `expect(FICHIERS_APPELANTS_R1.length).toBeGreaterThan(0)`. Ce test rouge tant que la liste est vide.
- **(Lot feature)** : dès que le fichier qui appelle R1 existe et compile, ajouter son chemin à la liste. Le balayage passe maintenant VERT sur ce fichier + exécute le mutant obligatoire (ajouter un import hors liste, vérifier ROUGE, retirer).
- **Coût** : rédaction du test en deux phases au lieu d'une ; **bénéfice** : l'instrument mesure à chaque phase, zéro fenêtre silencieuse.

## PROPOSITION 2 — Graver le contrat de SortieInterprete en spec

Avant le raffinage d'it1, écrire dans `specification.json.plan.resolved_decisions` ou en ANNEXE :
```json
{
  "type": "interface",
  "nom": "SortieInterprete",
  "definition": "Commande | {clarification: string} | {sans_commande: true}",
  "ou": "type Commande = {commande: 'aller', cibles: string[]}",
  "exemple_aller": "{\"commande\": \"aller\", \"cibles\": [\"lieu.forge\"]}",
  "exemple_clarification": "{\"clarification\": \"Vers la forge ou la ruelle ? Précisez votre destination.\"}",
  "exemple_sans_commande": "{\"sans_commande\": true}",
  "tests": "unitaire : brain/dossier/interprete.test.ts; intégration CopiloteService : voir schemaSortie.test.ts lignes 131-182"
}
```
Et un gabarit de prompt à valider par (PM, Tech Lead, Narratif-IA) tour de raffinage. **Chiffrable** : 30 min au tour 1 de raffinage. **Bénéfice** : zéro surprise entre le rôle et le validateur.

## PROPOSITION 3 — Test du verrou en isolation avant le code

Ajouter en `specification.json.plan.acceptance_criteria[9]` (après le critère 10) :
```
"Étant donné un hook useTourDeJeu exposant une fonction executeAction(saisie), quand deux appels sont lancés immédiatement l'un après l'autre (await Promise.resolve() entre les deux, aucun délai), alors CopiloteService.demander est appelé EXACTEMENT UNE FOIS — vérifiable par jest.spyOn sur le service."
```
Nom de test probable : `tests/play-mode/hooks/useTourDeJeu.test.ts → executeAction: deux appels rapides → un seul copilote`. Coût : 1 test, 15 lignes. Chiffrable : à écrire avant le hook.

## VERDICT

**RECEVABLE SOUS RÉSERVE**

La spec est solide sur le périmètre produit (aller/clarification/sans_commande), les KR sont pertinents (KR-260/264/265), et le précédent du rejeu unique est établi sur 5-6 rôles. Trois réserves QA levées solvables en raffinage sans replan :

1. Observabilité de la liste d'exclusion → PROPOSITION 1 : deux phases, instrument vert puis vert+mutant.
2. Contrat de SortieInterprete → PROPOSITION 2 : interface + gabarit + tour narratif-ia.
3. Test du verrou → PROPOSITION 3 : test en isolation, avant le hook.

Appliquer ces trois propositions et repasser au tour 2 — aucun réblocage attendu.

---

## ANNEXE — Critères d'acceptation it1 : niveau de test et fichier probable

| Critère | Énoncé | S'applique it1 | Niveau de test | Fichier probable | Observation |
|---------|--------|---|---|---|---|
| 1 | Aller → {commande:'aller', cibles} | OUI | Unitaire pur | `brain/dossier/interprete.test.ts` | `analyserSaisie` + fixture candidats + assertion forme |
| 2 | Clarification sur ambiguïté | OUI | Unitaire pur | `brain/dossier/interprete.test.ts` | R1 retourne {clarification}, testable sur mock |
| 3 | Sans_commande sur action hors COMMANDES | OUI | Unitaire pur | `brain/dossier/interprete.test.ts` | Testé par élimination : ni aller, ni clarification |
| 4 | Rejeu exactement une fois puis dégradation | OUI | Composant RTL | `src/features/play-mode/tests/useTourDeJeu.test.ts` | Reprendre le pattern de `CopiloteService.test.ts` (mock fetch, deux bouchons, assertion `toHaveBeenCalledTimes(2)` puis message fixe) |
| 10 | Deux soumissions = un appel (verrou) | OUI | Composant RTL | `src/features/play-mode/tests/useTourDeJeu.test.ts` | PROPOSITION 3 : test avant le hook ; userEvent + spy CopiloteService |
| 11 | moteurSansIA.test.ts réécrit, exclusion nommée | OUI | Balayage de code | `src/features/play-mode/tests/moteurSansIA.test.ts` | PROPOSITION 1 : deux phases ; mutant obligatoire dans lot feature |
| 2 (partiel) | Aucune clarification si clarification pendante (KR-264) | OUI | Unitaire pur | `brain/dossier/interprete.test.ts` | État d'attente : {type:'clarification', question, saisie} bloque la seconde clarification |

**Remarques** :
- **Critère 5 (agir)** : hors it1 (it2), pas testé ici.
- **Critère 4 (rejeu)** : le pattern `jusquAuRejeuUnique` est déjà couvert par les tests de CopiloteService sur 5-6 rôles ; la tranche it1 réutilise ce pattern pour R1, aucune réinvention.
- **KR-260 (moteurSansIA)** : le mutant obligatoire ne peut rougir que si la liste d'exclusion existe ET nomme un fichier réel. PROPOSITION 1 garantit cela en deux phases.
- **Couplage it1 ↔ it2** : agir entre en it2 parce qu'il n'a pas de consommateur narratif en it1 (KR-263) — testable uniquement une fois que R3 existe (it2).
