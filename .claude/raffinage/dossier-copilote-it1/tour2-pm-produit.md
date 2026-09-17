# Tour 2 — PM produit — `dossier-copilote` it1

```
CONTRE-LECTURE

À Narratif (C5) — Ton mécanisme est mal ciblé mais ta conclusion est juste. L'AVANT/APRÈS de
REMPLACEMENT ne peut exister que si la cible porte déjà un texte ; en it1 restreint à REMPLISSAGE,
ce cas ne se produit JAMAIS pour un champ personnage (vérifié, voir ci-dessous), donc le garde
anti-complaisance que tu réclames n'a nulle part où s'accrocher — ce n'est pas un « garde retiré »,
c'est un garde qui ne sert à rien tant que la coupe tient. Ce qui me convainc n'est pas ta mécanique,
c'est le constat : ma coupe. Je retire le report « 1-bis », REMPLACEMENT rentre en it1 (critère 7).

À UX (mesure C5) — Vérifié dans le code, pas seulement lu : `src/features/dossier-fiches/hooks/
useEcritureIdentite.ts` l. 22 sème un personnage neuf avec `{ fonction: '', apparence: '',
description_joueur: '' }` — jamais `MARQUEUR_A_ECRIRE`. Et `src/brain/dossier/amorce.ts` confirme
que l'amorce ne pose la constante que sur 4 champs du dossier (`synopsis_mj`, `accroche_joueur`,
`ton`, `texte_ouverture_joueur`), `monde.personnages: []` à la création. Ta mesure est confirmée et
elle change ma décision : « champ vide ou marqué » pour un personnage se réduit dans les faits à
« champ vide » — exactement le défaut que tu pointais.

À UX (C4, 3 entrées) — Ta promotion est incomplète, pas fausse : le critère 7 (refus nommant
`canon.ton` quand cette partie requise se vide) a besoin du libellé « TON », qui vit dans
`PanneauCanon.tsx`, pas dans `BlocIdentite.tsx`. « Zéro fichier dossier-canon touché » ne tient pas
face à ce que l'it1 exige réellement — je corrige ta proposition, pas ton principe.

À Tech Lead (C4, 8 entrées) — Trop large dans l'autre sens. « SYNOPSIS MJ » n'est consommé par
AUCUN critère d'it1 : `canon.mj.synopsis_mj` est facultatif (N-R12 du Narratif), jamais nommé dans un
message de refus. Le promouvoir est une promotion spéculative sans second consommateur réel à l'it1
— exactement ce que ta propre docstring proscrit (« une ligne sans second consommateur est une
dette »). Je resserre à ce que le panneau copilote consomme réellement : 3 labels personnage + 1
label TON (les hints, seulement s'ils sont effectivement rendus à l'écran — à vérifier à l'essaim,
pas à supposer).

À Tech Lead (C3) — Accepté : le 4ᵉ texte de l'it1 devient le refus de budget (« trop long »), qui a
un producteur réel, et non « vide-mais-réussi », qui n'en a aucun avant l'it2.

À QA (C8) — Ton regroupement à 8 est retenu comme charpente, amendé pour loger REMPLACEMENT
(critère 7) et les deux demandes du Narratif (témoin KR-236 dans le 8, double-clic dans le 1) sans
dépasser 8 — la skill plafonne à 8, un 9ᵉ/10ᵉ critère est un signal de coupe, pas une catégorie.

Confirmation TL-14 (demandée « Narratif + PM ») — Je retiens la version du Narratif : R1 = `canon.ton`
seul est requis (pas `synopsis_mj`, cf. N-R12 — sinon le copilote serait refusé sur tout dossier neuf) ;
R2 = disjonction sur 5 champs, seuil 1/5, message qui nomme la PARTIE, pas les 5 chemins. Ça remplace
le brouillon `{synopsis_mj, ton}` de la signature Tech Lead.

MES OBJECTIONS

1. « Allow-list "famille" prématurée, différer à IT2 » → RETIRÉE. Motif : c'est une assertion
   STATIQUE sur `DESTINATION_DES_CHAMPS` (table déjà présente aujourd'hui), pas une preuve de
   chemin de code atteignable — mon critère de report (« aucun chemin ne peut produire les champs
   interdits ») ne s'applique pas à un test d'appartenance à un ensemble fermé. Coût nul, déjà
   plié dans le critère 6.

2. « Ambiguïté REMPLISSAGE/REMPLACEMENT → coupe en 1-bis » → RETIRÉE. La question posée
   (le goal était silencieux) était légitime ; la réponse que j'ai donnée ne l'est pas. Chiffré :
   la coupe ne retirait pas « un cas sur deux » mais réduisait la promesse « compléter une fiche »
   au seul cas où l'auteur n'a jamais rien écrit dans ce champ — état qui, pour un personnage,
   ne se distingue en rien d'une démo jouet, puisque aucun mécanisme du dépôt ne marque jamais un
   champ personnage. Le contrat de design portait déjà les deux variantes ; le coût de les inclure
   est un prop + un rendu conditionnel dans `LigneProposition.tsx`, fichier déjà prévu N par le
   Tech Lead — pas un lot de plus.

3. « 8 critères + 5 "hors budget" = 13 au total » → RETIRÉE, et c'est la plus embarrassante : j'ai
   moi-même violé la règle que je suis censé faire respecter. J'adopte le regroupement de QA,
   amendé comme ci-dessus.

VERDICT — recevable sous réserve : (i) REMPLACEMENT rentre en it1, formulé au critère 7 ;
(ii) exactement 8 critères, aucun neuvième ; (iii) le critère 8 (ex-n°14) est amendé pour autoriser
UNIQUEMENT la promotion des libellés réellement consommés par le panneau copilote à l'it1 — 3 labels
personnage + TON, PAS « SYNOPSIS MJ » ; (iv) R1/R2 tranchés selon la version du Narratif.
```

## ANNEXE — les 8 critères d'acceptation définitifs

**1. Réponse conforme — un seul appel, et un seul en vol.**
Étant donné une fiche personnage désignée dont le contexte est assemblable, quand l'auteur clique « Lancer » et que le worker renvoie une proposition conforme au schéma, alors `CopiloteService.demander` effectue exactement 1 appel réseau ; et quand deux clics rapprochés sur « Lancer » surviennent pendant qu'un appel est en vol, alors il en résulte toujours exactement 1 appel réseau (bouton désactivé pendant l'attente).

**2. Rejeu exactement une fois puis état terminal.**
Étant donné une sortie de modèle qui échoue un des prédicats de forme, quand le premier essai échoue, alors un second appel est tenté automatiquement ; et quand ce second essai échoue aussi, alors `demander` rend `{statut:'illisible'}`, aucun troisième appel n'a lieu, et rien n'est persisté — les deux propriétés (rejeu = 1 ; terminal après 2) sont prouvées par deux tests distincts.

**3. Quatre textes d'écran distincts et discriminés.**
Étant donné les quatre états — indisponible, illisible-après-rejeu, contexte-à-écrire (refus `MARQUEUR_A_ECRIRE` ou partie requise vide), contexte-trop-long (refus de budget) —, quand chacun est rendu, alors les quatre chaînes sont deux-à-deux différentes (assertion d'inégalité explicite, pas seulement quatre rendus isolés). Le texte « vide-mais-réussi » du contrat de design n'est PAS implémenté à l'it1, faute de producteur avant l'it2.

**4. Écriture exclusivement via `DossierService.update`.**
Étant donné une proposition acceptée par l'auteur, quand l'acceptation déclenche l'écriture, alors elle passe uniquement par `DossierService.update`, dans l'ordre persistance-puis-événement (`dossier:updated`) ; et quand `validateDossier` refuse le document résultant, alors ce refus est le cas NOMINAL (rien n'est persisté, aucun événement), pas une branche d'erreur.

**5. Scanner anti-identifiant, canaris épinglés et rejoués.**
Étant donné le texte rendu par le modèle, quand il contient une sous-chaîne en forme d'identifiant (canari positif épinglé : un champ contenant `pnj.aldur-2`), alors la proposition est rejetée comme illisible ; et quand il s'agit de prose française bénigne (canari épinglé mot pour mot : « Il dit: « Enfin.tout est pret. » Elle range son objet.favori. »), alors elle N'EST PAS rejetée — les deux canaris sont rejoués contre l'implémentation réelle avant la signature du lot, jamais déduits.

**6. Confinement d'audience et allow-list de sortie fermées.**
Étant donné `CHAMPS_INJECTES` et `CHAMPS_PROPOSABLES` du rôle, quand le test de confinement s'exécute, alors `DEROGATIONS_AUDIENCE` est vide (assertée), toute clé de `DESTINATION_DES_CHAMPS` dont la destination n'est pas `ia` est absente du contexte injecté, et l'allow-list de sortie exclut nommément les 29 feuilles recensées (8 `stats`, 6 `curseurs`, 7 `_expr`, 8 littérales) avec leurs cardinalités assertées contre la vacuité.

**7. Filtre `MARQUEUR_A_ECRIRE`, mémoire nulle, et les deux variantes de `LigneProposition`.**
Étant donné un champ de contexte requis (`canon.ton`, seul, R1) portant `MARQUEUR_A_ECRIRE`, quand son retrait vide cette partie requise, alors la demande est refusée SANS appel réseau, en nommant le champ par son libellé français (« TON ») ; étant donné deux lancers successifs sur la même cible, quand les corps de requête sont comparés, alors ils sont identiques (aucune mémoire) ; et étant donné une cible dont le champ de prose est déjà rédigé (non vide), quand la proposition revient, alors `LigneProposition` rend la variante REMPLACEMENT (bloc AVANT statique + champ APRÈS), tandis qu'une cible vide rend REMPLISSAGE — les deux variantes existent dès l'it1.

**8. Le tuyau : route worker, garde-fous liés, non-régression, porte de commit.**
Étant donné la route `POST /ia/:role`, quand elle est appelée depuis un test en environnement node, alors `POST` figure dans `BASE_CORS`, la garde de taille refuse en octets (`TextEncoder`) au-dessus de `TAILLE_MAX_CORPS_IA`, et un test de liaison prouve (KR-236) que l'invite composée contient chaque clé du schéma de sortie (cas positif et cas négatif rejoués) et que `TAILLE_MAX_CORPS_IA` ≥ `BUDGET_CARACTERES_CONTEXTE` converti en pire cas d'octets ; par ailleurs les 10 sections existantes restent vides à l'identique, l'entrée de navigation « Copilote » respecte l'ordre relatif à « Contrôles », et `tsc`/`lint`/`jest` sont au vert sans import inter-features — sauf **l'exception unique et datée** : le lot contrat de l'it1 peut promouvoir dans `brain/dossier/libelles.ts` les labels que le panneau copilote consomme réellement (les 3 labels personnage de `BlocIdentite.tsx` + le label « TON » de `PanneauCanon.tsx`, **PAS** « SYNOPSIS MJ »), en extraction PURE sans modification de chaîne, non-régression prouvée par les suites de `dossier-fiches`/`dossier-canon` restant vertes sans retouche. **Non renouvelable** ; dès l'it2 la règle redevient strictement « aucun fichier de `dossier-canon`/`dossier-fiches`/`dossier-registres` dans un lot ».

## REPORTÉ

- Allow-list « famille » élargie à des champs adjacents (ex. `rang`) → **IT2**, quand `PropositionRendue` gagne la clé `rang`. Le test de fermeture reste dans le critère 6 dès l'it1.
- Cards « Tisser les indices » / « Éclater le synopsis » → **IT2 / IT4** (badges « Bientôt »).
- `caractere.cede_si`, `relations[].lien`, `plan_actions[].si_bloque`, `savoirs[].revele_comment`, `savoirs[].indice_id`/`.certitude`, `contre_mesures[].action`, `monde.indices[].verite`, `charpente.jalons[].enonce_texte` → hors contexte injecté à l'it1 ; plusieurs rouvrables au lot contrat de **l'IT3**.
- Lien cliquable « Aller à Personnages » dans l'état vide du `Select` → différé.
- Correction `ALLOWED_ORIGINS` / limiteur de débit → hors périmètre ; condition d'ouverture déjà écrite.
- `rang` sur `PropositionRendue` et sa table de résolution → **IT2**.
- Factorisation de `withTimeout` avec `CloudflareKVTransport.ts` → au 3ᵉ appelant (KR-109).

## REJETÉ

- Texte « vide-mais-réussi » comme 4ᵉ texte de l'it1 → aucun producteur avant l'it2 ; remplacé par le refus de budget.
- `Proposition<TRef>` générique / `resoudre<T>()` / `TableDesRangs` à l'it1 → abstraction à un seul appelant (KR-109), et « aucun rang » est au goal.
- `fetchImpl` injectable / option `copilote?` dans `CreateBrainOptions` → même motif.
- Un lot `worker` séparé du lot `brain` → l'`open_question` exige que les deux plafonds soient mesurés dans le même lot.
- Rejouer un 5xx / 413 / abort → l'absence de mémoire rend le second corps identique ; rejouer un déterminisme est une perte sèche et contredit le critère « mémoire nulle ».
- Écho du `champ` dans la sortie du modèle / tolérance d'une clé en trop → crée une seconde autorité sur la cible, ou avale le signal même de KR-236.
- Garde anti-paraphrase à seuil de similarité → instrument non mesuré ; remplacé par le bloc AVANT/APRÈS de la variante REMPLACEMENT.
- Promotion des 8 libellés (incluant « SYNOPSIS MJ ») → resserrée à ce que l'it1 consomme réellement ; promotion spéculative sans second consommateur, ce que la doctrine KR-109 du Tech Lead proscrit.
- 9ᵉ critère (témoin KR-236) et 10ᵉ critère (double-clic) → pliés dans les critères 8 et 1.

## Fichiers vérifiés pour ce tour (code, pas seulement les notes)

- `src/brain/dossier/amorce.ts` — seuls 4 champs de dossier portent `MARQUEUR_A_ECRIRE` à la création, aucun champ personnage.
- `src/features/dossier-fiches/hooks/useEcritureIdentite.ts` (l. 16-29) — un personnage neuf est semé avec `fonction`/`apparence`/`description_joueur` en chaîne vide, jamais marqué.
- Les cinq notes du tour 1 + `cadrage.md`.
