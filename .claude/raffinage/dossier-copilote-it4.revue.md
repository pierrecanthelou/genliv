# Revue d'itération — `dossier-copilote` · `4` *(la dernière — la feature passe à `done`)*

> Plan signé : `.claude/raffinage/dossier-copilote-it4.plan.md` · comité à 5 rôles, 2 tours, **54 désaccords statués**, **aucun veto survivant**.
> Exécution : **2 lots séquentiels**, un seul arbre — aucun worktree, aucune fusion.
> État : **non committé**, en attente de la revue tech-lead puis de la validation humaine.

## En une ligne

**L'auteur peut faire éclater le synopsis en une distribution de personnages** — le copilote propose jusqu'à trois fiches, chacune portant **la place** que la personne occupe et **ce qu'elle poursuit** ; l'auteur les accepte une par une, et **chaque acceptation crée un personnage**, le code frappant l'identifiant à cet instant-là et jamais avant.

**C'est le seul assistant qui CRÉE.** Les cinq précédents écrivent dans une entité qui existe déjà. **Et c'est la dernière itération de la feature.**

## Porte qualité

| Instrument | Résultat |
|---|---|
| `tsc --noEmit` | **0 erreur** |
| ESLint | **0 erreur** · 1 warning **préexistant** (`src/player/`), fichier à **zéro diff** |
| `jest` | **102 suites / 1734 tests verts** (départ : 101 / 1658 — **+76 tests, une suite neuve**) |
| `npm run test:mutation` | **non dû**, **constaté** par `git diff --name-only` sur les 4 fichiers mutés — sortie vide |
| Table dorée | **sans objet** — aucun registre couvert, **aucune valeur de règle de jeu posée ni étendue**, donc **aucune section de `docs/REGLES-DU-JEU.md` à citer** |

Porte re-mesurée **trois fois indépendamment** : chaque ouvrier, l'orchestrateur à l'intégration, la QA en mode B.

## Critères d'acceptation

| # | Verdict | Preuve |
|---|---|---|
| **1** — confinement | **VÉRIFIÉ** | Les **cinq** chemins `'ia'`, `DEROGATIONS_AUDIENCE` **vide et assertée**, bloc `DEJA ECRIT` **sans aucun rang**, `description_joueur` et `but.libelle` **absents du TEXTE ASSEMBLÉ**, et bloc **ABSENT (jamais vide)** sur un monde sans personnage. |
| **2** — refus | **VÉRIFIÉ** | `a-ecrire` portant **le chemin du SYNOPSIS** avant celui du ton, **zéro `fetch`** ; un monde vide ne produit **aucun** refus. ⚠ **La QA a rejoué elle-même le mutant d'ordre** : les deux cas simples restent **verts** (ils ne peuvent pas séparer), **seul le cas CUMUL rougit**. |
| **3** — validateur | **VÉRIFIÉ** | Les **12 prédicats** lus verbatim ; prédicat (9) **sur le COUPLE** avec ses **trois** témoins ; `'rang-inconnu'` **absent du type ET asserté absent du code**. Refus du **lot entier** sur doublon. |
| **4** — union étiquetée | **VÉRIFIÉ** | Corps `toEqual({role, contexte})`, dispatch à **six** branches avec garde `never`, et **`const p: Personnage = brouillon` NE COMPILE PAS** — `TS2739` **nomme les quatre requis manquants**. |
| **5** — budget | **VÉRIFIÉ, et re-dérivé indépendamment par la QA** | `M = 2560` ⇒ **8000**, reproduit à l'identique par une sonde jetable ; `TAILLE_MAX_CORPS_IA` **inchangé à 53 248**, et « inchangé » est une **mesure** sur les six (le rôle neuf a la 2ᵉ invite la plus longue mais un budget de 8000, et c'est `3 × budget` qui domine) ; `max_tokens` **1200**, **dépendant du ratio (800 contre 1200), pire pris ET dit**. |
| **6** — registre | **VÉRIFIÉ** | **Six** entrées, extraction **verbatim** confirmée par diff, co-propriété **forcée** testée, **les TROIS fiches lisent** le registre. |
| **7** — création | **VÉRIFIÉ, et rejoué par la QA** | Six clés exactes, `nom` **absent**. ⚠ **Le mutant du précalcul a été posé DEUX FOIS et vu rouge deux fois** — et **il COMPILE**, ce qui établit que `tsc` tient la **forme**, jamais le **moment**. `frapperIdentifiant` mocké **en DÉLÉGATION**, condition nécessaire du pouvoir séparateur. |
| **8** — bout-en-bout | **VÉRIFIÉ** | `validateDossier` vide, **et le vrai `personnage-plan` ne rend pas `'cible-a-ecrire'`** sur le personnage créé. |

**8 / 8.**

## Ce qui a été mesuré plutôt que déduit

Le plan exigeait onze mesures. **Trois ont contredit ce que le comité attendait :**

1. ⚠ **`schemaSortie.ts` : UNE ligne de marge, pas cinq.** Corps à **722** (sous la projection basse de 728), livré à **799** pour un seuil à **800**. Le conditionnel n'est donc **pas** déclenché et `validateurs.ts` **n'existe pas**. ⚠ **Et le diff est de 161 ajouts, ZÉRO suppression** — vérifié par l'orchestrateur : **rien n'a été retiré, donc aucune décision de comité n'a pu se perdre.** **RÉSIDU DÉCLARÉ avec sa condition d'ouverture : la prochaine ligne ajoutée à ce fichier déclenche la scission pré-nommée.**
2. **`CopiloteService.ts` : 668 lignes**, contre **~630 projetées**. La dérogation à la scission `copilote/demandes/**` reste ratifiée (bloqueur à 800), **mais le relevé a été fait — une dérogation mesurée n'est pas une dérogation tacite.**
3. **`P` est une SOMME**, premier rôle dont un élément porte **deux** proses : `P_place = 140` et `P_poursuite = 88`, attestées sur deux fixtures.

**`TAILLE_MAX_CORPS_IA` n'a PAS bougé**, et c'est notable après 3c où il avait bougé pour la première fois — **« inchangé » a été établi par une mesure sur les six rôles, pas supposé.**

## Les instruments, vus rouges

**Onze mutants** au lot contrat, dont **trois sur le seul prédicat de couple** (`place` seule, `poursuite` seule, prédicat retiré) : les deux premiers **refusent les deux lots légitimes que la vraie version accepte** — pouvoir séparateur **établi, pas supposé**.

⚠ **Le témoin cardinal a été posé et vu rouge DEUX FOIS.** Le mutant exigé par la QA au raffinage — `useMemo(() => ajouts.map(() => frapperIdentifiant('pnj')), [ajouts])` — **compile sans erreur**, et fait rougir `expect(frapperIdentifiant).not.toHaveBeenCalled()` (3 appels au lieu de 0). Posé par l'ouvrier, **puis re-posé par la QA en mode B** — parce que c'est exactement le cas où 3c s'était fait avoir avec un garde **inspecté et non exécuté** (BUG-115).

⚠ **Un témoin était CREUX et son mutant l'a montré.** Le test de l'ordre des requis était **vert** côté service : les deux refus simples rendent le même chemin quel que soit l'ordre, donc l'assertion **n'épinglait rien**. Comblé par le cas **cumul** (les deux requis manquants à la fois). **C'est la leçon de BUG-113 appliquée sans qu'on la rappelle** : *une assertion de résultat n'épingle une décision que si le scénario fait diverger les sources.*

## Diff par lot

### Lot 1 — `distribution-contrat` · **17 fichiers** · **+2 734 / −69**
`distribution.ts` **neuf (127 l.)**. Conforme à la liste. ⚠ **Le 18ᵉ fichier annoncé était le conditionnel `validateurs.ts`, non déclenché.**

### Lot 2 — `carte-distribution` · **9 fichiers** · **+794 / −29**
`CarteEclaterSynopsis.tsx` **201 l.** · `LigneFichePersonnage.tsx` **102 l.** · `distribution.test.tsx` **419 l.** ⚠ **`styles.ts` ET `cablage.test.ts` à ZÉRO DIFF**, tous deux anticipés par le plan, **propriété du lot quand même**.

### Contrôle de propriété
**24 fichiers de code**, **aucun hors plan**, vérifié programmatiquement. Les fichiers « zéro diff » relevés par **`git diff --numstat`, jamais par un grep** — leçon n° 3 du `RETOUR-COMITÉ` de 3b. ⚠ **Le témoin « zéro diff sur `dossier/types.ts` » est REVENU** : cette itération n'ajoute **aucun champ au schéma et aucune graine**.

## Ce qui a été refusé — et qu'un diff ne dit pas

Le registre porte **54 désaccords statués**. Les refus qu'un relecteur ne peut pas deviner :

- ⚠ **`description_joueur` en sortie** — **le tech-lead l'avait proposé et l'a RETIRÉ LUI-MÊME**, sur sa propre doctrine : le lectorat joueur n'est **codé nulle part dans `destinations.ts`**, donc la fuite est **hors frontière testable**, et **KR-229 impose alors la parade par la FORME**. Le champ public sort de la sortie : **la fuite n'a plus de canal**.
- **Un `nom` proposé, dérivé, ou saisi à l'acceptation** — `nom` est d'audience `auteur` ; **un nom provisoire survivrait à la relecture parce qu'il a l'air rédigé** ; et une saisie transformerait *accepter/refuser* en *accepter/**éditer**/refuser*, **classe d'interaction neuve sur la dernière itération, sans filet**.
- **Un prédicat d'unicité sur une seule clé** — **deux gardes partagent légitimement une place**. Seul le **couple** est du remplissage.
- **`'cible-a-ecrire'` et `'aucun-candidat'` recopiés « par symétrie »** — ils **refuseraient le CAS NOMINAL** du rôle : un monde vide est le premier geste après l'écriture du synopsis.
- **Une fabrique `creerPersonnageBrouillon()` dans `brain/`** — ⚠ **discriminant écrit pour ne pas être redébattu : une GRAINE DE VALEUR monte dans `brain/`, une FORME D'ÉCRITURE reste au site.** La première diverge en silence, la seconde est tenue par `tsc`.
- **`FicheBrouillon` dérivée de `Personnage`** (`Pick`/`Partial`/`Omit`) — **toute dérivation SUIT le schéma** : le jour où `Personnage` gagne une prose, **le modèle gagne un champ sans qu'une ligne change**.
- **Recopier la ligne de nommage de 3c** — son exemple **« celle qui tient la forge » AUTORISE la périphrase par la charge**, la seule erreur de référence que ce rôle puisse commettre.
- **Un scanner de noms propres** — **instrument inversé** : il rougirait sur une prose juste et resterait vert sur le nom inventé.
- **Des rangs sur les déjà écrits** · **`CANDIDATS_MAX` réutilisée** (*le sens est inverse : désignables contre exclus*) · **`role` comme clé réseau** · **un 3ᵉ champ de prose** · **injecter `canon.objectifs[]`** (zéro clé `'ia'`) · **un 3ᵉ lot worker** · **une promesse d'écran sur les doublons**.

## Ce qui a été reporté

| Report | Vers où | Condition |
|---|---|---|
| **Scission `copilote/demandes/**`** | n° 10 | ⚠ **CONDITION ÉCHUE DES DEUX CÔTÉS** (6ᵉ rôle **et** 668 > 600). **Dérogation ratifiée**, motif écrit, **relevé fait** |
| Scission `schemaSortie.ts` | la prochaine ligne | **799/800** — résidu déclaré, forme pré-nommée |
| `but.pourquoi` | n° 12 / Temps 2 | écrit par aucun rôle |
| `nom` re-projeté · rattachement aux objectifs | n° 10 | question transverse |
| L'unicité au-delà de `DEJA_ECRITS_MAX` | — | **constatée par personne** |

## Écarts assumés

**A. Le § 3.4 du plan avait un TROU.** `TEXTE_REFUS_TROP_LONG_DISTRIBUTION` n'y était pas nommé, alors que `'trop-long'` est un chemin réel. **Vérifié par l'orchestrateur** : les **cinq** rôles livrés ont **chacun** leur texte dédié — précédent sans exception. L'ouvrier a suivi le patron plutôt que de bloquer son lot. **Erreur de plan, pas dérive.**

**B. Deux mesures de cadrage de l'orchestrateur étaient FAUSSES**, et le comité les a corrigées : la création manuelle **frappe l'identifiant immédiatement**, ce n'est donc **pas** un précédent pour « brouillon sans identité » — **ce flux n'a aucun précédent** ; et le contexte est de **CINQ** chemins, sans quoi le second lancer fabrique des jumeaux.

**C. Le filtre précède la troncature** dans `assemblerDistribution`, à l'inverse de `CANDIDATS_MAX` — **`DEJA_ECRITS_MAX` borne les EXCLUS, pas les fiches examinées**. Épinglé par son propre mutant.

**D. BUG-117** — un commentaire de budget citait **9000** au lieu de **8000**, dans **la ligne même que le plan exige « mesurée, jamais déduite »**. Trouvé par la QA en mode B, qui avait re-dérivé `M` par une sonde indépendante. **Le test était et restait vert** : il est dynamique et ne câble aucun chiffre. Corrigé.

**Aucun blocage non résolu.**

## `RETOUR-COMITÉ`

1. ⚠ **Une porte mécanique qui compte des ENTRÉES DE LISTE ne compte pas des FICHIERS RÉELLEMENT DUS.** Mon plan annonçait « 18 fichiers (+1 conditionnel) » alors que les 18 **incluaient déjà** le conditionnel. Ma porte a validé 18 contre 18 sans voir l'ambiguïté. **Correctif : un fichier conditionnel se compte à part, et l'annonce dit les deux nombres.**
2. ⚠ **Un seuil de lignes franchi « à une ligne près » n'est pas franchi, mais il n'est pas non plus tenu.** 799/800 est un résultat, pas une marge. **Et la leçon que j'avais écrite ici était fausse — le tech-lead l'a corrigée par une arithmétique que je n'avais pas faite** : j'avais conclu « la condition d'ouverture doit être écrite AU SITE ». **À 799, une note de trois lignes au site porte le fichier à 802 : elle DÉCLENCHERAIT LE BLOQUEUR QU'ELLE ANNONCE.** La règle juste est donc : **une condition d'ouverture s'écrit là où la LIRA celui qui la déclenchera — au site quand le site peut la porter, dans la spec quand l'écrire au site déclencherait la condition.**
   ⚠ **Et le corollaire, qui a coûté un `REQUEST_CHANGES` (BUG-118)** : les deux reports de fin de feature portaient les chiffres **d'avant la mesure** (638 et « cinq lignes de marge », ~630) dans le **canal prospectif** que lira la n° 10 — alors que les valeurs mesurées n'existaient qu'au **passé**, dans `deviations_from_plan` et dans cette revue. **Un report qui cite un chiffre le cite MESURÉ, jamais PROJETÉ, une fois la livraison faite.** La revue de PR est la seule porte du cycle qui relise le canal prospectif contre les mesures livrées.
3. **Deux de mes six mesures de cadrage étaient fausses, et les deux ont été corrigées par le comité.** C'est le rendement de l'exercice : le cadrage doit **présenter ses mesures comme contestables**, ce qu'il faisait, et le comité doit **les contester**, ce qu'il a fait deux fois sur six.
4. ⚠ **Un veto retiré par son propre porteur vaut mieux qu'un veto imposé.** Le narratif a requalifié le sien en objection — *« l'audience d'un champ de document n'est pas dans mon domaine ; l'y forcer aurait usé l'instrument avant la n° 12 »* — **puis a gagné le point sur le fond**. Le tech-lead a cédé **sur sa propre doctrine**. Aucune escalade n'a été nécessaire, sur l'itération la plus risquée de la feature.
5. **Les deux postes à effort élevé ont échangé leurs positions à trois itérations sur quatre.** Arbitrer **sur l'argument et jamais sur le mouvement** a produit, cette fois, un arbitrage où **un seul des deux mouvements était argumenté** — c'est ce qui a tranché le nom du rôle.
6. ⚠ **SUR UNE ITÉRATION TERMINALE, LA REVUE DE PR DOIT RELIRE LE DOSSIER AVEC LA SÉVÉRITÉ QU'ELLE APPLIQUE AU CODE** — leçon du tech-lead, versée ici sur sa proposition. **Ses trois passes ont produit ZÉRO correctif de code et TROIS correctifs de dossier**, tous de la même famille : *une décision mesurée écrite dans un canal au passé*. Le motif est structurel : **le code d'une feature qui se termine a déjà été relu six fois, son dossier une seule — et c'est lui qui survit.** Les deux `REQUEST_CHANGES` de cette itération n'ont rien trouvé dans 24 fichiers de code et deux choses fausses dans deux fichiers de spec.
7. **Une ligne de famille mal fusionnée ferme l'une en croyant fermer l'autre.** Le mineur accepté (`statut === 'absent'`) ressemble à BUG-114 (« porteur disparu ») au point qu'on les rapprocherait — mais l'un est **un porteur** qui a disparu et l'autre **le dossier** qui ne résout plus : **deux causes, deux portées, deux correctifs** (une garde préalable dans le gestionnaire contre une branche de retour sur `'absent'`). L'entrée les sépare explicitement. **Et elle écrit POURQUOI c'est mineur ET que c'est retenu quand même** — sans quoi un lecteur qui constate que la branche est improbable classerait l'entrée sans objet et la retirerait **avec sa propre justification**.
8. **Le budget de contexte s'est payé à la fin, comme annoncé.** La spec a été **scindée** (plan / implémentation), et `features_history.json` a dû **archiver `dossier-registres`** — les deux sur l'axe écrit dans leur propre `_about`, donc **sans inventer de mécanisme ni toucher `WORKFLOW.md`**, qui est à 154 o de son plafond.
