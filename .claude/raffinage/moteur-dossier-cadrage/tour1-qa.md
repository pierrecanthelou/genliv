# TOUR 1 — qa — cadrage n°9 moteur-dossier

RISQUE — Le score de mutation est borne a 4 fichiers que la n°9 ne touche pas. Or
elle ecrit un evaluateur TRIVALENT d'ExprNode et applique des deltas : logique de
signe reelle HORS de tout instrument de mutation. Meme trou que KR-228 sur
tourzero.ts : « la direction d'erreur ne survit pas a non ». Un non(indecidable)
promu vrai ne fait rougir aucun instrument par construction.

OBJECTION — « graine_alea + journal rendent une session rejouable bug pour bug »
n'est PAS observable : aucun instrument ne rejoue un process. Reformulable en
replay intra-process, sinon c'est une promesse, pas un critere.

PROPOSITION — Critere de feature : coexistence avec tree-canvas (temoin = suite
tree-canvas INCHANGEE et verte + test-grep d'imports, JAMAIS une hausse de
couverture globale). Ecrire noir sur blanc que expr.ts reste hors score de mutation.

VERDICT — recevable sous reserve.

## Criteres d'acceptation proposes (9)
1. (unitaire) MARQUEUR_A_ECRIRE sur texte_ouverture_joueur -> refus nomme ;
   dossier reecrit -> accepte. LES DEUX DANS LE MEME TEST (KR-197/202).
2. (contrat) RapportControles.jouable false puis true -> previewDisabledReason
   reflete l'etat par LECTURE DERIVEE, aucun useEffect miroir (KR-013/113).
3. (unitaire) ExprNode melant et/ou/non/pred avec un predicat indecidable ->
   resultat indecidable. Scenario nomme qui SEPARE l'implementation fautive
   « non(indecidable)=vrai ».
4. (unitaire) graine_alea fixee + journal de N actions rejoue depuis le meme etat
   initial DANS LE MEME PROCESS -> etat final identique champ a champ. Toute
   garantie cross-process/cross-build explicitement HORS de ce critere.
5. (contrat) jalon dont le declencheur devient vrai -> seul enonce_texte est
   expose ; ni declencheur_expr ni conditions de fin ne fuient (ext. KR-232).
6. (unitaire) quete a plusieurs etapes -> l'etape precedente reste franchie,
   aucune etape sautee sans que son declencheur ait ete vrai.
7. (test-grep + suite existante) Apres demolition KR-181, la suite tree-canvas
   reste verte SANS avoir ete modifiee, + test-grep sur ses imports. Une
   couverture globale qui MONTE n'est jamais citee comme preuve.
8. (test-grep) src/player/ apres repointage : aucun import vers src/features/**
   ni vers un service brain/ non pur.
9. (unitaire) commande invalide a la console -> refus nomme, jamais ignoree
   silencieusement.

## KR-237 a KR-243
237 evaluateur trivalent : non(indecidable) reste indecidable (corollaire KR-228).
238 demolition KR-181 prouvee par suite tree-canvas inchangee + test-grep, jamais
    par une hausse de couverture.
239 « rejouable bug pour bug » observable seulement reformule en replay
    intra-process ; sinon la revue l'ecrit non verifie.
240 sessionEngine/actionEngine/expr.ts hors score de mutation : jest+RTL est
    l'unique instrument, la revue l'ecrit noir sur blanc.
241 refus MARQUEUR_A_ECRIRE teste par opposition marque/reecrit dans le meme test.
242 jouable -> previewDisabledReason = lecture derivee pure.
243 projection des jalons : enonce_texte seul (ext. KR-232).

## Cas limites
journal vide au tour zero = replay no-op stable · depart non resolu -> refus, pas
de defaut silencieux · commande double-soumise : refusee ou idempotente, a
TRANCHER puis tester · reference orpheline en session a la reprise (le dossier
n'est en lecture seule que PENDANT la partie) -> refus nomme · MARQUEUR partiel :
seul texte_ouverture_joueur bloque l'OUVERTURE, un fins[].texte marque ne bloque
que SA fin · graine_alea non fournie : defaut a nommer et tester, jamais
Math.random non seede · journal a plusieurs milliers d'entrees : performance HORS
PERIMETRE, a ecrire · annulation / retour arriere navigateur : HORS CADRE.

## REJETES (a recopier au registre des desaccords)
1. Tout critere affirmant « reproductible bug pour bug » sans reformulation.
2. Une hausse de couverture jest comme preuve que la demolition n'a rien casse.
3. Tout critere de spec navigateur / Playwright sur cette feature.
4. Tout critere d'accessibilite sur la console (hors cadre par decision projet).

## Non verifiable depuis ce cadrage
Le format exact de journal[].deltas et memoire.faits_etablis n'existe nulle part
au depot : pas de test de non-regression avant que tech-lead/narratif-ia le fixent.
