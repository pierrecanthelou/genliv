# UX Designer — moteur-fins it3 — tour 1

RISQUE
La mort est le seul écran de fin où le joueur n'a rien écrit. Si elle prend l'allure d'EcranFin (prose en OutcomeBlock), l'auteur croira avoir rédigé la phrase du moteur, ou croira pouvoir la modifier. Deuxième risque : une bascule vers --bad, que KR-308 interdit.

OBJECTION
1. « bandeau » est ambigu. BandeauHeros existe (PV, PE, XP, PAS) et sa doc interdit déjà --good et --bad. Un bandeau « DÉFAITE » neuf serait un composant maison.
2. « texte constant » ne dit pas comment on le distingue de Fin.texte. Sans en-tête, les deux écrans se ressemblent.
3. EcranFin n'offre aucune sortie : la branche fin ne passe ni actionsEntete ni onNouvellePartie. Seul l'écran de mort aurait donc « Nouvelle partie ».
4. EcranCombat affiche encore « PARTIE TERMINÉE — Échap ou « Quitter le test » ». Aucun handler Échap n'existe dans PartieEnCours, et la phrase est dans le registre auteur-testeur. Elle mentirait.

PROPOSITION
- Un seul composant neuf, EcranMort (~50 lignes). Il se compose de OutcomeBlock, de BandeauHeros avec pvLive=0 via CadrePartie, de Badge muted et de boutonPrimaire.
- En-tête `MORT DU HÉROS — texte du moteur`.
- Focus automatique sur « ↻ Nouvelle partie », comme EcranReprise.
- Pas de dialogue : la partie est terminée, donc non reprenable.
- Retirer ↻ de l'en-tête sur l'écran de mort. Son dialogue dit « Abandonner la partie en cours », ce qui est faux.
- Suivi hors it3 : même bouton dans EcranFin, une prop.

VERDICT
Recevable sous réserve : (1) BandeauHeros réutilisé ; (2) en-tête « texte du moteur » ; (3) la phrase d'EcranCombat est retirée ou mise hors de portée ; (4) aucune occurrence de --bad ou --good.

ANNEXE — CONTRAT DE DESIGN

Fichier : play-mode/components/EcranMort.tsx. Props : { heros: HeroState; onNouvellePartie: () => void }.
TEXTE_MORT_HEROS constante nommée, non recopiée dans un test.

Structure (miroir d'EcranFin) :
CadrePartie bandeau={BandeauHeros pvLive=0} actionsEntete={carnet seul} puis section aria-label="Mort du héros" :
1. h2 « MORT · {nom} ». Fallback : « Héros sans nom ».
2. Badge tone="muted" « PARTIE TERMINÉE ».
3. glyphe ⚔ (aria-hidden), faint.
4. OutcomeBlock « MORT DU HÉROS — texte du moteur ».
5. bouton « ↻ Nouvelle partie ».
Aide sous le bouton : « La partie est terminée. Le dossier n'est pas modifié. »

Texte exact de TEXTE_MORT_HEROS :
« Vos forces vous quittent. Le combat est perdu : votre aventure s'arrête ici. »

Tokens (tous vérifiés) :
- Conteneur : flex column, gap --space-9.
- h2 : --font-ui, --fs-h2, --fw-semibold, --track-tight, --text-strong.
- Glyphe : --fs-h1, --text-faint.
- Prose (OutcomeBlock) : --text-strong, --fs-row, --lh-loose.
- Bouton : boutonPrimaire (--accent, --text-on-accent, --hit-target, --r-md).
- Aide : --text-muted, --lh-body.
- maxWidth 480 (identique à EcranRefus et EcranReprise).

États : défaut (bouton focalisé), survol (bouton partagé), vide impossible.
Clavier : Entrée active le bouton, Tab suit l'ordre visuel.
