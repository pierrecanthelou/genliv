# Tour 2 — PM Produit (contre-lecture)

## RÉPONSE NOMMÉE

**Narratif & IA (tour 1, RISQUE)** : « Le linter devient le premier auteur de la mémoire de session du Temps 2 ». C'est une objection d'**ordre de construction** — mon terrain.

**Réponse** : risque écarté, pas ignoré. La table trivaluée que narratif et tech-lead proposent tous deux (H6 : deux cellules décidées — `lieu_courant_est`, `possede_objet` — cinq `indecidable`) est exactement le **plus petit bouchon acceptable** : elle ne tranche RIEN que le document ne détermine déjà, et laisse les cinq champs de session ouverts pour que la n° 9 les décide sans contrainte héritée. Le garde-fou que le narratif écrit lui-même (§ E, « à quoi on reconnaîtra la dérive ») EST la condition qui empêche ce bouchon de devenir un doublon durable — **je l'exige copié dans H6**, pas seulement dans l'annexe de sa note, pour que la n° 9 le lise sans le redériver. Sous cette condition, aucun veto d'ordre de construction.

## STATUT DE MES OBJECTIONS (TOUR 1)

- **Obj-1 (bloquant sans geste, réplique BUG-090)** — **MAINTENUE, et désormais EXERCÉE.** Ma condition de tour 1 avait un déclencheur explicite ; l'orchestrateur vient de mesurer que ce déclencheur se produit. Voir (A).
- **Obj-2 (Q4 : extension aux `fins` = travail spéculatif)** — **MAINTENUE**, désormais unanime : le narratif y répond « KR-164, aucun témoin positif réel » (identique à mon motif), le tech-lead la classe « REJETÉ, hors mon terrain, sans veto ». Aucune voix ne la conteste. Ce qui change au tour 2 n'est pas la portée mais son **adresse de rangement** — voir (C).

## (A) — Un constat sans geste réparateur : valeur ou voyant vain ? Tranche définitive.

**OUI**, il a de la valeur. Il transforme une incohérence de conception invisible — un objectif que l'auteur a lui-même rédigé pour être vivable, et qui ne l'est pas — en un fait visible que l'auteur peut traiter par le seul geste qui existe réellement aujourd'hui : relire, réécrire ou supprimer l'objectif depuis Canon → Objectifs des camps (`ObjectifsCanon.tsx` existe, mesure E), même si ce geste ne répare pas la cause technique.

Mais cette valeur est exactement celle d'une **ALERTE**, pas d'un bloquant : le bloquant exige, dans la doctrine d'it8 que j'ai moi-même posée en condition, un geste qui **restaure** la capacité manquante — le précédent `objectif-sans-chemin` répare vraiment sa cause en posant un producteur. L'orchestrateur mesure que ce geste-là est structurellement inapplicable ici : à t=0 rien n'a encore été donné, par construction.

**Tranche définitive, non rouverte côté PM : ALERTE.** Le message et la remédiation littéraux de l'UX sont adoptés tels qu'écrits — ils disent honnêtement l'absence de geste réparateur plutôt que de le maquiller, ce qui est précisément ce qu'exige mon Obj-1.

## (B) — La tranche `chore` (scission de `controles.ts`)

Je suis le tech-lead (§ 8, motif 4 : bénéfice nul pour n° 7, la prémisse d'« avant it10 » tombe). **Ne pas la prendre ici.**

**Re-datation** — pas simplement « le premier lot qui rouvrira `controles.ts` après n° 7 » écrit dans le `specification.json` de `dossier-controles` : ce fichier n'a plus de lecteur dans cette feature après it10, exactement la même panne d'adressage que (C). La dette part dans **`code-knowledge.json`**, le seul document que `docs/WORKFLOW.md` rend obligatoire « avant d'écrire tout code », dans n'importe quelle feature future. Candidat nommé par le tech-lead (« cet objet, personne ne le donne », REPORTÉ it9) : si cette règle est un jour construite, son lot lira le KR et héritera de la mise en garde (les deux bornes `indexOf` qui voyagent avec le bloc ou mentent en silence). Ce n'est pas un enterrement précisément parce que l'adresse choisie survit à la clôture de n° 7.

## (C) — Q4, confirmé, adresse changée

**Confirmé** : `canon.objectifs[].echoue_si_expr` seul, `charpente.fins[].condition_expr` exclu — aucun témoin positif réel, cause distincte (KR-164), unanimité du comité.

Mais je corrige ma propre proposition de tour 1 : je ne le loge plus en `open_questions` du `specification.json` de `dossier-controles`. C'est la dernière itération de la feature — un `open_questions` qui y reste n'a plus de propriétaire. Même remède : entrée dans **`code-knowledge.json`**, formulée comme candidat pour la feature qui résoudra les deux décisions moteur que H6 nomme (résolution des `declencheur_expr` avant le premier tour ; le lieu de départ compte-t-il comme visité) — très probablement la n° 9, sans lui imposer cette étiquette par avance.
