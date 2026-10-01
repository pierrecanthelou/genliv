# Tour 2 — `qa` · `moteur-arbitre` it2

## Verdict

**RECEVABLE SOUS RÉSERVE** — Tech-lead et narratif-ia ont fourni les scénarios, tests nommés et cas limites que tour 1 exigeait. Trois risques subsistent, détaillés ci-dessous.

## Analyse des objections de tour 1

### Critère 4 (routage R2) ✅ LEVÉE
Narratif-ia (§A) énumère trois cas divergents clairs :
- `aller` n'appelle jamais R2
- `agir` sans héros n'appelle jamais R2
- `agir` sur lieu sans dangers **appelle** R2

Test nommé (tech-lead) : `useTourDeJeu.test.ts : R2 appelé ssi geste agir + heros présent`. Cas limite : danger vide → R2 quand même. Scénario mesurable.

### Critère 5 (audience KR-232/262) ✅ LEVÉE
Narratif-ia (§B) : `CibleArbitre` sans `session` rend le héros inatteignable **par compilation**. Tech-lead confirme l'interface (`role`, `lieuId` seuls). Test d'invariance (`copilote/contexte.test.ts`) plus fort qu'une assertion ponctuelle : elle capture toute tentative de glisser `heros.*` via le contexte.

### Critère 9 (rejeu unique) ✅ LEVÉE
Narratif-ia (§D) restreint le rejeu aux **malformations de schéma** seulement, jamais à une union valide `{sans_jet:true}` qui est nominale. Tech-lead aligne. Le pattern n'y a donc aucun rôle, exactement comme je l'objectais.

## Trois risques subsistent

**1. Plan flou sur l'arité de l'amorce (CRITIQUE)**
- Feature `acceptance_criteria` cite une amorce à 4 valeurs (réussit/réussit de justesse/réussit nettement/échoue).
- Goal d'it2 dit explicitement binaire (réussit/échoue).
- PM (tour1-pm-produit) l'a soulevé : ambiguïté de scope.
- **Réserve** : PM demande verdict en tour 3 — c'est un report de décision, pas une fermeture. Le verdict DOIT arriver **avant l'essaim**, sinon l'essaim invente.

**2. Critères non réécrits dans le plan**
- Mes huit critères d'annexe (tour1-qa.md tableau) nomment chacun un scénario + test + cas limité.
- Aucun n'est recopié dans `plan.acceptance_criteria` de la spec.
- Essaim lira ma note directement, pas la spec — risque de divergence.
- **Réserve** : avant l'essaim, réécrire les 8 critères avec scénario + test + cas limité explicites dans le plan.

**3. Découpage en lots — respect strict requis**
- Tech-lead fournit deux lots figés (contrat seul d'abord, puis feature) avec signatures d'interface nommées.
- Narratif-ia fournit l'invariance d'audience et restreint rejeu à malformations.
- Essaim DOIT respecter le découpage (pas de parallélisme, lot 1 avant lot 2, pas de débordement).
- Risque : un ouvrier « améliore » CarteJet en anticipant le classement à 4 valeurs ou l'XP d'it3 — casse propriété exclusive d'it3 sur les règles (KR-261).

## Recommandations pour tour 3

1. **Trancher binaire-only** : PM demande verdict sur arité amorce — figer 2 valeurs (it2), 4 valeurs (it3), dans plan avant essaim.
2. **Réécrire critères dans spec** : recopier tableau d'annexe de tour1-qa.md dans `plan.acceptance_criteria` avec format « Scénario X : Quand Y, alors Z ; test : nommé ; cas limité : cas ».
3. **Figer découpage en lots** : tech-lead a fourni liste de fichiers + tests — figurer dans spec `implementation.iterations_log[1].architecture_choices` pour que l'essaim la relise.


---

## ANNEXE — Tableau de critères mis à jour

Chaque ligne correspond à un critère d'acceptance. Tour 2 valide ou soulève les éléments manquants de tour 1.

| Critère | Scénario divergent | Test nommé | Cas limité | Statut tour 2 |
|---------|-------------------|-----------|-----------|---------------|
| 1 (écran création) | création complète + bandeau recharge | `components/EcranPartie.test.tsx : BandeauHeros affiche heros courant` | abandon midway (pas compté) | ✅ Maintenu |
| 3 (A4 PE+5) | déplacement réel (lieu différent) vs retour (même lieu) | `dossier/commandes.test.ts : TRANSITIONS.aller n'ajoute +5 PE si même lieu` | plafonnement à peMax | ✅ Maintenu |
| 4 (geste agir R2) | aller ne déclenche pas R2 / agir sans héros ne déclenche pas R2 / agir sur lieu sans dangers déclenche R2 | `useTourDeJeu.test.ts : R2 appelé ssi geste agir + heros présent` | danger vide → R2 quand même | ✅ LEVÉE (narratif-ia §A détaille les 3 cas) |
| 5 (R2 audience KR-232) | aucun accès au héros (compilé inatteignable) | `copilote/contexte.test.ts : heros jamais injecté dans contexte arbitre, quelle que soit la session` | corps sans danger si absent | ✅ LEVÉE (type CibleArbitre sans session) |
| 6 (resolveChallenge + rng) | même graine reproduit même tirage | `session.test.ts : resolveChallenge(creerRng(g,'jet',idx)) réplique` | graine 'jet' jamais Math.random | ✅ Maintenu (narratif-ia §E précise domaine 'jet') |
| 7 (R3 amorce binaire) | issue classée (réussit/échoue) avant d'être donnée à R3 | `useTourDeJeu.test.ts : narrative reçoit amorce binaire, jamais chiffres` | R3 dégradé ne change pas amorce | ⚠️ EN RISQUE (voir risque 1 : 4 valeurs vs 2) |
| 8 (journal {lieu_id,carac,tc}) | EntreeJournal.jet posé après jet résolu | `session.test.ts : consignerJet écrit {lieu_id,carac,tc}, pas prose/marge/issue` | {sans_jet:true} nominal, jamais marge | ✅ LEVÉE (narratif-ia §D élucide le cas nominal) |
| 9 (rejeu unique + dégradation) | rejeu **uniquement** si malformation schéma, jamais sur union valide {sans_jet:true} | `worker/index.test.ts : rejeu exactement une fois puis sans_jet ; `session.test.ts : rejeu zéro fois si {sans_jet:true}` | {sans_jet:true} n'enclenche pas rejeu | ✅ LEVÉE (narratif-ia §D restreint rejeu aux malformations) |

## Notes par critère

**Critère 4** — Les trois cas divergents sont explicites chez narratif-ia (§A) et testables indépendamment.

**Critère 5** — L'invariance testée (`copilote/contexte.test.ts`) est plus forte qu'une assertion ponctuelle. Garantie par le TYPE (`interface CibleArbitre` sans `session`).

**Critère 7** — Sous réserve du verdict PM / tour 3 sur amorce binaire vs 4 valeurs. Test nommé dépend du choix (binaire seul en it2, ou 4 valeurs dès it2).

**Critère 8** — Cas {sans_jet:true} maintenant explicite dans narratif-ia §D tableau. Rejet silencieux (cas 3 : dégradation) confirmé : pas de bannière, pas d'erreur visible, branchement interne.

**Critère 9** — Le pattern « rejeu unique » ne concerne **que** les malformations de schéma détectées par `validerArbitre`. Une union valide nominale {sans_jet:true} passe directement à R3 sans rejeu. Distinction clarifiée.

