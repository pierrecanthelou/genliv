RISQUE — Le gabarit de sortie est recopié dans l'invite. Une clé `delta_confiance` fait donc échouer `worker/index.test.ts:1984`, le jour même où « confiance » devient une mécanique vivante. La sortie facile serait de retirer le mot du balayage (précédent KR-235). Elle supprimerait le seul garde contre une règle de confiance récitée dans le prompt. Second risque, de correction : si Δ est appliqué avant la re-vérification, `consignerReponseActeur` lève une erreur sur une réplique valide (savoir au seuil, Δ = −1).

OBJECTION — Ni l'entier ni le fait que R4 ignore la confiance ne sont des défauts. Les deux défauts sont le NOM de la clé et l'ORDRE d'écriture.

PROPOSITION —
1. A — RETIRÉ. Aucun critère n'échoue sans signal : le catalogue `CE QUE TU PEUX CONFIER` porte seul l'ouverture du savoir. Mon risque porte sur le ton, pas sur les faits. R4 ne reçoit rien de la confiance. Le bloc `ENVERS LUI` devient une dette à déclencheur. Déclencheur : un playtest KR-229 qui relève un ton contraire à l'état au-delà de K=4.
2. B — enum RETIRÉ, entier `-1|0|1` adopté. Une condition : `'confiance'` reste à la ligne 1984. `max_tokens` doit être re-dérivé sur l'enveloppe RECOMPTÉE.
3. C — MAINTENU, réduit. Aucun balayage lexical de la réplique ni du contexte : `cede_si` peut légitimement dire « confiance ». Je refuse le test UX « l'invite interdit le mot explicitement » : il écrirait le mot dans l'invite, ce qui casse la ligne 1984.
4. Ordre (re-vérifier avant Δ) — RETENU, il entre aux AC.

VERDICT — Recevable sous réserve : ligne 1984 intacte, ordre écrit en AC. Aucun veto.

---

Réponse aux objections

Tech Lead, question 6 — ACCEPTÉE, ma proposition est retirée. J'ai vérifié critère par critère : la démo passe sans signal. Les Δ se cumulent, la porte s'ouvre, S1 entre dans le catalogue à l'appel suivant, et R4 confie le savoir. Le catalogue suffit comme signal pour la démo. Mon risque (un ton qui contredit l'état) est une question de qualité, même statut que `PRESENTS` en it1. La question 6 est tranchée à l'unanimité : R4 ne reçoit rien. Cela lève le point (2) du veto QA.

Tech Lead, entier brut sur le réseau — ACCEPTÉE sur la forme, amendée sur le nom. Mon argument KR-235 vise la clé, pas l'entier. `+1` (JSON invalide) est un échec déjà défini : illisible, rejeu, puis KR-283 — résidu de playtest, pas un défaut de contrat. L'enum ajoutait un `Record` et 6 caractères d'enveloppe sans rien gagner.

QA, « R4 ne reçoit rien ; testé par l'absence du mot "confiance" dans le contexte » — ACCEPTÉE, mais le test est remplacé par un plus fort : un test lexical serait faux (la prose auteur d'audience `ia` peut contenir le mot). Le bon test est un test d'invariance du contexte (annexe, tests 1 et 2).

QA, AC#6a/6b/6c — ACCEPTÉE. Deux précisions : 6a doit dire « après le rejeu unique » (KR-283). 6b doit tester la saturation aux DEUX bornes.

PM, AC à 3 branches — ACCEPTÉE, avec une 4e branche : la réplique dont le Δ franchit le seuil ne confie pas le savoir dans le même appel.

UX, `motsInterdits.ts` amendé « invite seulement » — mon objection sur la réplique tombe. Le fichier relève du Tech Lead. Restent refusés : toute application au contexte ou à la réplique, toute ligne d'invite qui nomme le mot.

Tech Lead, `recit.ts` dans le lot contrat — SOUTENU. Test croisé dans les deux ordres (annexe, test 10).

Statut de mes objections du tour 1 : O1 MAINTENUE (recentrée sur le nom de clé) ; O2 MAINTENUE réduite ; O3 RETIRÉE (absorbée par AC#6a/6b).
Statut de mes propositions du tour 1 : P1 (enum elan) RETIRÉE ; P2 (bloc ENVERS LUI) RETIRÉE, devient dette à déclencheur ; P3 (ordre d'écriture) RETENUE, entre aux AC.

---

ANNEXE — contrat de sortie R4 it3, amendé

A. Entrée injectée — les blocs restent ceux d'it2, dans le même ordre, AUCUN bloc neuf. La confiance n'entre que par son effet : quand la porte `confiance_min` est ouverte, le savoir apparaît dans `CONFIER`. `BUDGET_CARACTERES_DOSSIER_ACTEUR` inchangé. Lecture par un seul site, `confianceDe(faits, id)` — seul endroit qui lit `CONFIANCE_DEPART`, seul appelant `portesOuvertes`.

B. Schéma de sortie — `{"replique", "indices_reveles": ["S<n>"] (≤1), "<clé>": -1|0|1}`, 3 clés toujours exigées (KR-236). Prédicat 13 ajouté en fin de liste : `typeof v === 'number' && <registre déclaré une fois>.includes(v)`. Valeurs refusées : `2`, `-2`, `0.5`, `"1"`, `true`, `null`, clé absente. Invite : « Tu indiques dans <clé> -1 si ce que le joueur vient de dire éloigne ce personnage de lui, 1 s'il l'en rapproche, 0 sinon — 0 est la réponse ordinaire. » Aucun signe « + » écrit. Gabarits montrent 0. Ligne 845 inchangée. `max_tokens` avec la clé `-1` : 43+12=55, L=455, 683 jetons au pire ratio : 700 inchangé.

C. Échec de validation — inchangé : refus atomique, rejeu une fois, puis KR-283. Session identique par référence, aucune entrée `pnj[id]` créée.

D. Application — ordre : re-vérification sur l'état d'AVANT Δ → `reveler_indice` → `a_dit` → Δ saturé (`crediterConfiance`) → récit. Δ=0 ou saturation sans effet → même référence.

Mémoire de session — confiance retenue toute la partie, jamais résumée, jamais projetée vers aucun rôle. Le Δ de chaque tour n'est pas journalisé.

Tests de contrat :
1. PNJ sans porte confiance_min : les 8 états donnent un contexte acteur identique à l'octet.
2. PNJ avec confiance_min=s : exactement 2 contextes, qui ne diffèrent que par la ligne du savoir dans CONFIER.
3. KR-282 : le contexte de X ne change pas quand Y parcourt ses 8 états.
4. Les contextes R1 et R3 ne changent pas quand la confiance varie.
5. Saturation : −3+(−1)→−3 ; +3+(+1)→+3.
6. Seuil 1, confiance 1, S1 choisi avec Δ=−1 : révélation appliquée, aucune erreur, confiance passe à 0.
7. Confiance 0, seuil 1, Δ=+1 : confiance passe à 1 ; S1 absent des rangs de cet appel, présent au suivant.
8. confiance_min avec jet : savoir fermé même à +3.
9. Δ invalide deux fois : session identique par référence.
10. Test croisé recit.ts : révéler puis créditer, et l'inverse — a_dit et confiance survivent tous les deux.
11. Ligne 1984 : 'confiance' toujours dans la liste, test passe.

---

Décisions prises en autonomie faute de spécification :
- Nom de la clé réseau → recommande `elan` (entier) mais laisse le choix final au Tech Lead → si on garde `delta_confiance` sans retirer le gabarit avant le balayage, la ligne 1984 échoue ; si on retire 'confiance' de la liste, une règle pourra être récitée dans le prompt sans qu'aucun test ne le voie.
- Déclencheur de la dette ENVERS LUI → playtest KR-229 → si livré maintenant : un bloc, un registre de libellés et une re-mesure du budget, sans lecteur dont l'utilité est prouvée.
- `+1` sur le réseau → échec « illisible », aucune réparation avant l'analyse du JSON.
- `1.0` → accepté, indiscernable de `1` après JSON.parse.
- Test d'invariance plutôt que test lexical → un test lexical donnerait un faux positif sur une fiche auteur qui écrit « confiance » dans cede_si.

Fichiers relus : les 5 notes de tour 1, specification.json, worker/index.ts (l.795-870), worker/index.test.ts (l.1972-2010), src/brain/dossier/deltas.ts.
