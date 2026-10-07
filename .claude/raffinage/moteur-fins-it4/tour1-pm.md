## PM — moteur-fins it4 — Tour 1

Phrase de démo retenue : « À la fin de cette itération, l'auteur peut relancer sa partie terminée avec les mêmes dés. » Il n'y a pas de « et ». Elle traverse l'écran terminal, l'aiguillage, `ouvrirSession` et `useSessionPersistee`.

**RISQUE** — Un bouton « Rejouer » sans qualificatif promet de relire la partie. Or R1/R4 ne sont pas persistées : aucune commande structurée n'existe en session, seule la graine survit. L'auteur croirait retrouver sa partie et retrouverait ses dés. Second risque : une graine « collante ». Après Rejouer, « Nouvelle partie » réutiliserait la graine imposée, sans aucun signal.

**OBJECTION**
1. Le goal de la spec (« relance… et obtient ») contient un « et ». « Graine » n'apparaît dans aucune chaîne d'interface (grep des `.tsx`), donc ce n'est pas un terme produit. L'auteur connaît « dés » (création du héros). Je demande le libellé « mêmes dés ».
2. Le brief empile.
   - « Refus dans illisible » n'est pas reporté vers it4. La spec (`open_questions`) dit : dette à déclencheur « reprise.ts rouvert ». It4 ne rouvre pas `reprise.ts`.
   - « Cas limites navigateur » (retour arrière, hors ligne, crash) est du polish. KR-242 (intra-process) l'exclut.
3. Le déterminisme est déjà épinglé en `brain/` : `alea.test`, `arbitre.test`, `rencontre.test`. It4 est du câblage, pas du moteur : zéro lot `contrat`.
4. Architecture, sans veto : `PartieEnCours.tsx` fait 381 lignes pour un seuil de 400 (KR-112). Budget : +15 lignes au plus.

**PROPOSITION** — Une itération, un lot feature, 5 critères. Aucune découpe en N itérations n'est nécessaire.
- Bouton secondaire « ↻ Rejouer — mêmes dés » sur `EcranFin` et `EcranMort`, à côté de « Nouvelle partie », qui reste inchangé.
- `AiguillagePartie` garde `session.graine_alea` de la partie terminée, pour la seule relance.
- Preuve visible sans IA : après Rejouer, l'écran de création du héros affiche les mêmes 8 dés (`creerRng(graine, 'heros', 0)`).
- Test qui épingle : Rejouer puis Nouvelle partie tire une nouvelle graine.
- Je retire : focus auto, cas limites navigateur, refus illisible.

**VERDICT** — Recevable sous réserve : libellé « dés », graine non collante, liste « hors périmètre » respectée. Aucun veto.

---

## Critères d'acceptation proposés (5, tous rattachés aux AC 12–14 de la spec)
1. Sur `EcranFin` et `EcranMort`, « Rejouer — mêmes dés » ouvre une partie neuve (tour 0, journal vide, héros absent) avec la `graine_alea` de la partie terminée, écrite en session persistée.
2. Après Rejouer, l'écran de création du héros affiche le même pool qu'à la première partie (AC 12, intra-process).
3. Rejouer puis « Nouvelle partie » tire une graine fraîche (pas de graine collante).
4. Le test de rejeu n'injecte que des commandes joueur (`aller`, postures). Il ne lit jamais le journal ni une décision modèle (AC 13, KR-248/306).
5. `moteurSansIA.test.ts` reste vert. Aucun champ ajouté à `EtatSession` ou `Dossier`. Aucun des 4 fichiers de règles n'est touché, donc pas de `test:mutation` (AC 14).

## Hors périmètre (explicite, pour qu'aucun ouvrier ne code par défaut)
- Rejeu automatique des commandes de l'auteur (macro) et persistance de R1/R4/commandes. Ce serait un champ optionnel et un lot `contrat`.
- Afficher, copier ou saisir une graine. Le mot « graine » n'entre pas dans l'interface.
- Rejouer en cours de partie (menu d'entête). Ce serait une action dangereuse avec dialogue. « ↻ Nouvelle partie » avec dialogue reste tel quel.
- Rejouer après rechargement : une partie terminée rouverte ouvre directement une nouvelle partie (décision #20, close).
- Rejouer après modification du dossier : la session est périmée, donc « Nouvelle partie » avec une graine neuve. C'est la limite de valeur assumée d'it4, à dire dans l'aide, pas à corriger.
- Conserver le héros entre deux parties.
- Focus auto sur `EcranFin` ou sur Rejouer. L'`autoFocus` d'`EcranMort` (it3) n'est pas déplacé.
- Cas limites navigateur (retour arrière, hors ligne, crash).
- Refus dans « illisible ».
- Changer les libellés ou le dialogue existants de « Nouvelle partie ».

Garde-fou de mon biais : si le tech-lead chiffre plus d'un lot, ou un dépassement du seuil de `PartieEnCours.tsx`, it4 est sacrifiée comme prévu par la spec. On ne la gonfle pas.

## Décisions prises en autonomie faute de spécification
- « Rejouer » = relancer avec les mêmes dés, ou rejouer les commandes ? → relancer avec les mêmes dés, parce qu'aucune commande structurée n'est persistée. → Si c'est l'inverse : un champ optionnel dans `EtatSession` + `sessionDestinations` + `validate` + `reprise.ts` rouvert, soit un lot `contrat` et au moins 2 itérations de plus. KR-248 serait à rouvrir.
- Nom visible → « mêmes dés », jamais « graine ». → Si l'on garde « graine » : un terme technique dans l'interface, à justifier comme nouveau vocabulaire.
- Où apparaît le bouton → `EcranFin` et `EcranMort`. → Un seul écran rendrait la phrase « partie terminée » fausse pour l'autre et rouvrirait la consistance des écrans terminaux (décision it3).
- Rejouer remplace-t-il « Nouvelle partie » ? → non, un second bouton. → Si l'on remplace : le choix « autres dés » disparaît et les tests it3 sont à réécrire.
- Rejouer en cours de partie ? → non. → Si oui : dialogue dangereux (`color="error"`, Annuler nommé) + 1 critère + 1 maquette.
- Rejouer après rechargement ? → non. La décision #20 reste close : une partie terminée rouverte démarre directement une nouvelle partie. → Si oui : il faut persister la fin ou la mort, `reprise.ts` rouvert, `AiguillagePartie` à reconcevoir.
- Graine après Rejouer ? → imposée pour la seule relance suivante, remise à zéro par « Nouvelle partie ». → Si c'est l'inverse : « Nouvelle partie » ne donne plus de dés neufs, un bug silencieux.
- Le héros est-il conservé ? → non, la création rejoue avec le même pool. → Si oui : un état de héros à porter entre parties, hors graine.
- Focus → inchangé. → Si UX veut un autre focus : changer un choix d'it3, à justifier.
- Brief : « refus illisible » classé en « REPORTÉ vers it4 » → je suis la spec (dette à déclencheur), pas le brief. → Si on l'inclut : `reprise.ts` rouvert dans la dernière itération, sans décision d'écran.

## Fichiers lus (tous en lecture seule)
- `C:\Users\pierr\Desktop\genliv\src\features\moteur-fins\specification.json`
- `C:\Users\pierr\Desktop\genliv\docs\ROADMAP-BASCULE-IA.md`
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\components\AiguillagePartie.tsx`
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\components\PartieEnCours.tsx`
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\components\EcranFin.tsx`
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\components\EcranMort.tsx`
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\components\EcranCreationHeros.tsx` (partiel : usage de la graine, indices 0 et 1)

Je n'ai pas relu `brief/context.md`, ni le contenu des tests `alea.test`, `arbitre.test` et `rencontre.test`. J'ai vu que `alea.test.ts` porte des cas de rejeu ; les deux autres ne sont connus que par leur nom de fichier.
