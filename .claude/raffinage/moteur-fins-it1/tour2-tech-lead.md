## TECH LEAD — moteur-fins it1 — TOUR 2

RÉPONSES CROISÉES
- [PM] obj. 1, 2, 4 : acceptées, vérifié au code. `hero-mort` laisse `combat` ouvert (`sessionCombat.ts:68,159`) et `combat_en_cours` répond déjà : it1 = fin seule, mort en it2, Rejouer plus tard. Ses 4 lots : refusés. Extraction, aiguillage et garde réécrivent tous `EcranPartie`/`PartieEnCours` (règle 1). Deux lots, extraction en première étape du lot 2.
- [Narratif-IA] R5 : faux au code. `projeterAssaut` ne teste pas `phase`, il transmet `issue: 'hero-mort'`, et `commentateur.ts:136` le formule exprès. Couper R5 renverse du livré n°13 (risque déjà noté, spec moteur-combat l.194) : arbitrage nominal en it2.
- [QA] 1 : console (`EcranPartie.tsx:263`) et saisie libre (`interprete.ts:182`) convergent sur `executerCommande`. Un balayage de `COMMANDES` couvre les deux ; un test de feature prouve qu'après fin ni `ConsoleCommandes` ni `PlayerInputBar` ne sont montés. 2 : séparateur sans fixture neuve, un monde où les deux fins de la référence sont vraies, puis `fins` inversé.
- [UX] `Fin.nom` est audience `auteur` (`destinations.ts:620`) : EcranFin le résout par `fin_id` (précédent `climatNom`), le contrat reste `{fin_id, texte?}`. Copie locale du style tolérée.

STATUT DE MES OBJECTIONS
1. maintenue, corrigée : j'écrivais « import profond par la feature ». Faux : `brain/index.ts:574-578` réserve ces décisions au runtime `player/engine`. Pont `player/engine/fin.ts`, réexport seul.
2. maintenue : critère 4 = fin seule.
3. maintenue : une garde coupe R2/R3/R4 ; R5 sort d'it1.
4. maintenue, resserrée : coupe `PartieEnCours.tsx` seule (~300 l.), `ActionsCarnet.tsx` retiré.
5. maintenue, vérifiée (`dossier-reference.json:433`, embuscade consommée + vigie non visitée).
Mon « Rejouer » de tour 1 : retirée.

VERDICT FINAL — recevable sous réserve (spec réécrite en fin seule : critères 4, 5, 6, lecteurs de `finAtteinte`, squelette)

---

## ANNEXE — LOTS RÉVISÉS (hors quota)

Racine = `C:\Users\pierr\Desktop\genliv`. Exécution séquentielle, sans worktree. Aucun fichier n'est nommé par deux lots.

### Lot 1 — `contrat` (seul, en premier)
| N/R | Fichier |
|---|---|
| R | `src/brain/dossier/evaluate.ts` (`finAtteinte`, `FinAtteinte`) |
| R | `src/brain/dossier/commandes.ts` (garde après `combat_en_cours`, message constant, docstring de totalité) |
| R | `src/brain/dossier/interprete.ts` (commentaire l.150-152 seul) |
| R | `src/brain/dossier/evaluate.test.ts` (séparateur KR-302, param structurel, `garde-baril-fin`) |
| R | `src/brain/dossier/commandes.test.ts` (balayage `partie_terminee` ; reprise des l.1067-1074) |
| R | `src/brain/dossier/session.test.ts` (seulement si rouge) |

Expose :
```ts
export interface FinAtteinte { readonly fin_id: string; readonly texte?: string }
export function finAtteinte(
  dossier: Dossier,
  session: { readonly monde: FaitsDeSession; readonly combat?: unknown },
): FinAtteinte | undefined
export type RefusCommande = /* existants */ | 'combat_en_cours' | 'partie_terminee'
```

Test KR-302 (`evaluate.test.ts`) : monde de `dossier-reference` avec `objets_possedes: ['objet.sceau-de-cendre']`, `jalons_atteints: ['jalon.second-guet']`, `evenements_consommes: ['evenement.embuscade-a-la-tour']`, `lieux_visites: []`. Les deux fins sont vraies, résultat `fin.vigie-sauvee`. Même monde, `fins` inversé : `fin.vigie-abandonnee`.

### Lot 2 — `feature` (démarre contrat figé)
| N/R | Fichier |
|---|---|
| R | `src/features/play-mode/components/EcranPartie.tsx` (shell, gardes 1-3, `PartieDemarree`, `tirerGraine` ; ~100 l.) |
| N | `src/features/play-mode/components/PartieEnCours.tsx` (~300 l.) |
| N | `src/features/play-mode/components/EcranFin.tsx` |
| N | `src/features/play-mode/components/EcranFin.test.tsx` |
| N | `src/player/engine/fin.ts` (réexport seul) |
| R | `src/features/play-mode/hooks/useTourDeJeu.ts` (garde entre ÉTAPE 5 et R2) |
| R | `src/features/play-mode/hooks/useTourDeJeu.test.ts` |
| N | `src/features/play-mode/tests/finDePartie.test.tsx` |
| R | `src/features/play-mode/tests/combatParConsole.test.tsx` (l.115 : la fin devient vraie à la clôture) |
| R | `src/features/play-mode/components/EcranPartie.test.tsx` (seulement si rouge) |

Retirés du lot par rapport au tour 1 : `CombatEnCours.tsx`, `CombatEnCours.test.tsx`, `ActionsCarnet.tsx`.

Consomme / expose :
```ts
// src/player/engine/fin.ts
export { finAtteinte, type FinAtteinte } from '../../brain/dossier/evaluate'

// EcranFin.tsx
export interface EcranFinProps { readonly fin: FinAtteinte; readonly nom: string }

// useTourDeJeu : signature INCHANGÉE
// garde : après setAvis(nouvelAvis), avant R2 → if (pasAccepte && finAtteinte(dossier, nouvelleSession)) return true
```

Contraintes :
- L'aiguillage reste DANS `PartieEnCours`, après tous les hooks.
- Aucun import de `brain/dossier/evaluate` côté feature : seul `player/engine/fin` est lisible.

---

## Décisions prises en autonomie faute de spécification

- Accès de la feature à `finAtteinte` → pont `src/player/engine/fin.ts` (réexport), pas d'import profond.
- `nom` de la fin résolu par `fin_id` côté écran, `FinAtteinte` reste `{fin_id, texte?}`.
- Mort hors it1 (vérifié au code).
- Deux lots, pas quatre (extraction en première étape du lot 2).
- `ActionsCarnet.tsx` retiré (coupe `PartieEnCours.tsx` suffit pour KR-112).
- Bouton Rejouer retiré d'it1.
