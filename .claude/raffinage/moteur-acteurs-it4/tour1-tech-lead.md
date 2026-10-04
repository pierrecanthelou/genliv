# Tech Lead — moteur-acteurs it4, tour 1

**RISQUE** — La 4e porte ouverte par la fin. Si `jet` est évaluée avant les trois autres, un jet réussi ouvre un savoir que `confiance_min` ou `apres_indice_id` ferment encore. Fuite par la chance, KR-280 à l'envers. L'issue du jet n'a aucun domicile dans `FaitsDeSession`, et la stocker serait un dérivable stocké (KR-013).

**OBJECTION**
1. `portesOuvertes` rend un booléen. Il faut un tri-état `sous_epreuve` : toutes les autres portes ouvertes, seul le jet manque. Sans lui, R4 ne sait pas s'il peut résister, et `resiste` devient un jet que l'IA déclenche à volonté.
2. `{resiste:{enjeu_*}}` ne nomme ni le savoir ni `carac/tc`. C'est le moteur qui choisit : premier savoir en ordre de fiche, par UNE fonction. Jamais R4. Deux dérivations = deux décideurs.
3. Si `ReponseActeur` devient une union, `reponseActeur.replique` ne compile plus dans le hook. Le lot contrat ne passerait pas `tsc` seul.
4. `REGLES-DU-JEU.md` § 6 ne dit rien du jet d'un savoir. KR-130/279 : la doc passe avant le code.

**PROPOSITION**
- Opt-in `peutResister` : seul l'appel 1 peut rendre `resiste`. L'appel 2 est typé « simple » → chaîne R4→jet→R4→jet inexprimable au type.
- L'issue se dérive d'`issueDuJet(session, tour)`, via un helper à deux appelants.
- 2 lots séquentiels.
- Fixture inchangée (Harek prêt).

**VERDICT** — Recevable sous réserve : tri-état avec jet évalué en dernier (1), opt-in (3), doc d'abord (4).

---

## ANNEXE — découpage en lots

| Lot | Type | Fichiers |
|---|---|---|
| **A `brain-acteur-jet`** | `contrat`, seul, en premier | `docs/REGLES-DU-JEU.md` · `revelation.ts` + test · `arbitre.ts` + test · `recit.ts` + test · `types.ts` · `schemaSortie.ts` + test · `contexte/acteur.ts` + test · `CopiloteService.ts` + test · `worker/index.ts` + tests (17 fichiers) |
| **B `cablage-jet-dialogue`** | `feature`, après A | `useTourDeJeu.ts` + test (2 fichiers + conditionnels) |

Listes disjointes. A ne touche ni `useTourDeJeu.ts` ni la fixture.

### Interfaces figées par A

```ts
// revelation.ts
export type EtatSavoir = 'absent' | 'revelable' | 'deja_confie' | 'sous_epreuve'
export function evaluerSavoir(dossier, faits, personnageId, savoir, issue?: IssueEpreuveSavoir): EtatSavoir
export function savoirSousEpreuve(dossier, faits, personnageId): Savoir | undefined

// arbitre.ts
export function issueDeLEpreuveActeur(dossier, session, personnageId): IssueEpreuveSavoir | undefined

// copilote/types.ts
CibleActeurResistible { role: 'acteur'; personnageId; saisie; session; readonly peutResister: true }
ResistanceActeur { readonly resiste: EpreuveProposee }
SortieActeurBrute = forme actuelle | { resiste: { enjeu_reussite; enjeu_echec } }

// CopiloteService.demander (11e surcharge)
(dossier, cible: CibleActeurResistible, signal?) => Promise<ReponseActeur | ResistanceActeur | EchecCopilote>

// schemaSortie.ts
validerActeur(brut, dossier, rangsOuverts, resistePermise: boolean)
validerEnjeux — extraction partagée avec validerArbitre

// contexte/acteur.ts
assemblerActeur(dossier, session, personnageId, saisie, options?: { epreuve?; resistible?: boolean })
```

### Contraintes de A
- Aucun nom de service ni `/ia/` dans `brain/dossier/` (KR-260, `moteurSansIA.test.ts`).
- `arbitre.test.ts` garde l'unicité de `resolveChallenge` (KR-281).
- Mutation non due : aucun des 4 fichiers de règles n'est touché.
- Remesurer `BUDGET_CARACTERES_ACTEUR` et le E du worker.
- `code-knowledge.json` à 4 o du plafond → tout KR neuf impose compaction dans le même lot.

### Portes qualité
A est vert seul (`tsc` passe, hook non modifié). B est vert une fois A en place.
