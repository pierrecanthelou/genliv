# Tour 2 — `qa` · `dossier-copilote` it4

**RÉPONSE NOMMÉE — à la mesure du tech-lead absente du cadrage** (`schemaSortie.ts` 638 l., projection ~750 « à mesurer, pas supposer ») : **c'est mon terrain** (définition de fini). Je la formalise en **critère non négociable, indépendant du choix de forme** :
> « **Lignes de `schemaSortie.ts` MESURÉES après le lot 1** ; si **> 800**, la scission se fait **DANS ce lot**. »

## Réserve 1 — l'espion sur `frapperIdentifiant` : **ORTHOGONALE, PAS REMPLACÉE. DURCIE.**

⚠ `tsc` tient **la FORME** (`FicheBrouillon` non assignable à `Personnage`) — **mais rien n'empêche de PRÉCALCULER les N identifiants À LA RÉCEPTION** (`useMemo`, ou juste après `demander()`) puis de les poser dans le gestionnaire d'acceptation : **ça compile toujours**, `FicheBrouillon` reste inchangée à deux clés.

**MUTANT SÉPARATEUR NOMMÉ : ce précalcul.** Seul un **espion** le tue — *zéro appel avant tout clic, un appel synchrone par acceptation*. **Un `@ts-expect-error` prouve qu'on ne peut pas écrire le brouillon tel quel ; il ne prouve pas QUAND l'identifiant est frappé.**

**DURCIE** : test **nommé, écrit avant le code**, sinon veto KR-231/232 reconduit.

## Réserve 2 — forme et exclusions nommées : **RETIRÉE**
Les deux postes livrent des exclusions nommées et une forme fermée.

1. **Prédicats prouvables SEULS** (un fixture minimal suffit) : **tech-lead 14/14** (split par champ, chaque prédicat = un témoin) · **narratif 7/11 en direct** — les 4 composés (chaîne/vide/marqueur/identifiant « sur les deux ») exigent **2 témoins chacun**, et (9) l'unicité-couple en exige **3** (couple identique ⇒ rejet ; même `place` ≠ `poursuite` ⇒ accepté ; inverse ⇒ accepté).
⚠ **Le tech-lead gagne en granularité brute — MAIS c'est un ARTEFACT DU DÉCOUPAGE, pas une preuve de meilleure couverture.**
2. **Le prédicat de couple : assertable, cas négatif fabricable** (les trois témoins ci-dessus). ⚠ **Vrai gain, absent chez le tech-lead** — son rejet de l'unicité sur `charge` seule était **motivé mais incomplet**.
3. ⚠ **`but.libelle` contre `description_joueur` : la fuite reste HORS FRONTIÈRE TESTABLE DANS LES DEUX CAS** (comparaison de prose, KR-229) — **le nom du champ ne change rien à l'instrumentable**. Déjà écrit noir sur blanc par le narratif (§ 7), donc conforme à ma règle sans changer mon verdict. **Trancher le canal n'est pas mon domaine.**

**VERDICT** — **recevable sous réserve DURCIE** (espion, test nommé avant code) **+ critère de mesure de lignes acté en définition de fini**.

---

## ANNEXE — ce que je n'ai PAS vérifié
**Aucune commande exécutée** (raffinage, avant code). Je n'ai **pas relu** `useSocleEcriturePersonnages.ts` ni `schemaSortie.ts` dans cette passe. Je n'ai **pas vérifié** la borne à laquelle `TAILLE_MAX_CORPS_IA` doit être re-dérivée sur les six rôles. Je n'ai **pas re-dérivé** moi-même que `Personnage` n'a que quatre requis (confirmé par le tech-lead à la ligne). **Le choix final entre les deux formes reste un arbitrage narratif/tech-lead — mon rôle se limite à la testabilité comparée, pas au vocabulaire du domaine.**
