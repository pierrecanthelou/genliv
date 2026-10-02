# Revue — `moteur-acteurs` itération 1

## En une ligne

L'auteur peut maintenant faire parler le joueur à un PNJ présent dans son aventure : le PNJ répond dans sa propre voix, projetée depuis sa fiche (fonction/apparence/registre de parole), sans qu'aucun savoir, confiance ou jet n'entre en jeu — ce qui n'existait pas avant cette itération.

## Critères d'acceptation (§ 6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | R4 appelé, contexte scopé au PNJ, réplique affichée (entête = nom du PNJ) | **VÉRIFIÉ** | `acteur.test.ts` (isolation), `PlayerInputBar.test.tsx` (« entete = nom du PNJ pour une réplique »), `useTourDeJeu.test.ts` |
| 2 | PNJ absent/sans identité → refus avant tout appel R4 | **VÉRIFIÉ** | `commandes.test.ts` (`cible_inconnue`/`cible_indisponible`), `acteur.test.ts` (`cible-a-ecrire`) |
| 3 | Plusieurs PNJ → rangs `I<n>` distincts, jamais par nom | **VÉRIFIÉ** | `interprete.test.ts`, `schemaSortie.test.ts` (résolution par position) |
| 4 | Aucune `relations[]`/`cede_si` dans le contexte R4 en it1 | **VÉRIFIÉ** | `acteur.test.ts` — Corvin (pire cas de la fixture : relations + cede_si + stats), 5 assertions d'absence |
| 5 | Sortie R4 invalide → rejeu une fois puis silence, jamais de texte de repli | **VÉRIFIÉ** | `useTourDeJeu.test.ts` (« échec silencieux »), `CopiloteService.test.ts` (rejeu-un-coup) |
| 6 | Verrou de tour pendant l'attente de R4 | **VÉRIFIÉ** | `useTourDeJeu.test.ts` (KR-265, double soumission) |
| 7 | Mémoire K=4 répliques propre à chaque PNJ (`interlocuteur`) | **VÉRIFIÉ** | `acteur.test.ts` — séquence A×3/B×2/A×3 avec échec sur A, rejoué en mode B par la QA |
| 8 | Périmètre `moteurSansIA.test.ts` inchangé (exclusion nommée) | **VÉRIFIÉ** | `lintIsolation.test.ts` |

## Diff par lot (comparé au plan § 5)

**Lot 1 — `contrat-acteur-squelette`** : conforme à la liste du plan (23 fichiers), plus trois ripples de schéma justifiées (budget narrateur re-mesuré, table d'audience `sessionCouverture` étendue à 11 feuilles, fixture de test `session-saturee.ts`).

**Lot 2 — `cablage-tour-de-jeu`** : conforme (`useTourDeJeu.ts` + test).

**Hors-lot, trouvé en revue tech-lead PR (pas par l'essaim)** : `PlayerInputBar.tsx` + `EcranPartie.tsx` — trou du *découpage du plan*, aucun des deux lots ne listait le composant d'affichage de la réplique. Corrigé avant présentation à l'utilisateur (voir « Ce qui a été refusé »).

## Ce qui a été refusé

- **Bloc « PRESENTS »** (narration enrichie des PNJ présents pour `aller`/`agir`) — proposé par Narratif-IA au tour 1 du raffinage, retiré par elle-même au tour 2 après objection du PM : aurait fait démontrer à it1 une seconde capacité (la narration de scène), indépendante du but de l'itération, en cassant un invariant écrit de `narrateur.ts` (les « onze chemins `ia` fermés »). Reporté, hors séquence 2/3/4.
- **Garde moteur sur deux PNJ homonymes** — proposée par QA au tour 1, retirée au tour 2 : exigerait de comparer des `nom`, jamais vus par R1 (décision sur nom libre, interdite). Remplacée par la résolution par rang déjà en place ; l'homonymie stricte (identités textuellement identiques) reste un défaut d'auteur, non géré par le code.
- **Garde testant un état « PNJ mort »** — descopée par le Tech Lead : aucun état de ce type n'existe avant la n°13 (combat), l'implémenter aurait été du code mort.
- **Compteur de rang partagé `P` pour les PNJ** (proposition initiale du Tech Lead) — retirée au tour 2 au profit du préfixe séparé `I<n>` de Narratif-IA : plus de code, moins lisible, fragile si l'invite n'était pas réécrite en conséquence.
- **Changement d'audience de `Personnage.nom`** (`auteur`→`ia`) — proposé puis retiré par Narratif-IA elle-même au tour 2 du raffinage de la feature : le même résultat (joueur peut nommer un PNJ) s'obtient par projection `fonction`/`apparence`, précédent déjà vérifié sur `Lieu.nom`, sans toucher au schéma du dossier.

## Ce qui a été reporté

- Bloc « PRESENTS » → ligne candidate hors séquence 2/3/4 de la feature, déclencheur : besoin produit mesuré.
- Budget client R1 (refus `trop-long` actif avant envoi) → seule la mesure du pire cas est due en it1 (pinnée dans `frontiere.test.ts`) ; le garde-fou actif attend un déclencheur nommé (mesure proche du plafond, ou un dossier réel qui le heurte).
- Règle `dossier-controles.ts` sur un PNJ sans identité ou deux PNJ homonymes → `controles.ts` porte sa propre dette à déclencheur, non rouverte par cette feature.
- Prérequis d'it2 : enrichir encore la fixture d'un PNJ avec un savoir révélable (aucun aujourd'hui).

## Écarts assumés et défauts trouvés

- **BUG-142 (critique)** — trouvé en revue tech-lead PR, pas par l'essaim ni la QA mode B : le trou de découpage du plan (ci-dessus) laissait la réplique d'un PNJ s'afficher sous l'entête « RÉCIT », indistincte d'une narration. Corrigé avant toute présentation utilisateur.
- Deux incidents de reformatage non scopé (`npx prettier --write` sans portée), même classe que BUG-139 déjà connu : revertis avant mise en index, sans conséquence sur le code livré.
- Un passage de revue tech-lead sur deux a nécessité un correctif (statut de la feature en tête de spec, `"planned"` au lieu de `"in-progress"`) — corrigé, jugé trop trivial et trop précisément spécifié pour justifier un troisième cycle complet de revue.

Aucun blocage non résolu.

## Porte qualité

| Outil | Résultat |
|---|---|
| Prettier | vert |
| `tsc --noEmit` | 0 erreur |
| ESLint | 0 erreur (1 warning pré-existant, hors périmètre) |
| Jest | **132 suites / 2286 tests**, verts |
| Mutation `src/brain/` | non dû (aucun des 4 fichiers de règles touché) |

## RETOUR-COMITÉ

Pour le raffinage de l'itération 2 (carnet d'indices) : **le plan doit nommer explicitement le composant d'affichage de toute nouvelle sortie IA**, pas seulement le service/hook qui l'appelle — un rôle IA neuf qui écrit dans un champ déjà affiché ailleurs (`EntreeJournal.recit`) n'hérite pas automatiquement d'un affichage correct, seulement d'un affichage qui *compile*. C'est le trou exact qui a produit BUG-142 : les deux lots étaient chacun corrects sur leur propre liste de fichiers, et le défaut vivait entre les deux. Le carnet d'indices (it2) introduit sa propre surface d'affichage neuve (`CarnetIndices.tsx`) — à vérifier qu'elle est bien dans la liste d'un lot, pas seulement mentionnée dans le contrat de design.
