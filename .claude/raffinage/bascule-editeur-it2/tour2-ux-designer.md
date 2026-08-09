# Tour 2 — UX Designer — bascule-editeur it2

## Réponse nommée — PM (RISQUE) et Tech Lead (Annexe C) : réouverture d'une carte de dossier

**Je retire ma position de tour 1 (Annexe E : « ne pas l'inclure dans it2 »).** Motif écrit, pas juste constaté :

Ma note de tour 1 tranchait sur la **lettre** du goal et sur le **précédent** d'it1 — deux arguments de procédure, pas de design. Sur le fond, la question que j'aurais dû poser est celle que pose le tech-lead : *une fois que cette itération construit un écran d'édition, qu'est-ce que la bibliothèque promet ?* Avant it2, `LibraryScreen` promet exactement ce que fait `DossierCard` : retrouver, télécharger, supprimer (« Retrouvez un dossier déjà importé, téléchargez-le ou supprimez-le », `LibraryScreen.tsx:54`) — la carte inerte ne ment à personne, elle tient sa promesse actuelle. **Mais it2 change la promesse implicite** : un dossier n'est plus seulement un fichier archivé, c'est un document qu'on est en train d'écrire, avec un écran pour ça. Une bibliothèque qui sait créer un document éditable mais ne sait plus jamais y ramener l'auteur n'est pas fidèle à ce qu'elle est devenue — vérifié en relisant le code, pas supposé : rien d'autre dans le lot proposé (App.tsx, DossierService, EditorTopBar) n'ouvre un dossier existant, et le seul moyen de retour serait d'exporter puis réimporter le fichier — absurde pour continuer une rédaction en cours.

**Précision sur MA doctrine, pour ne pas la citer à faux** : ce n'est pas littéralement « une affordance qui ment » au sens strict où je l'emploie ailleurs (un bouton désactivé qui promet une action qu'il ne tient pas — `etat_vide_section`). La carte n'a jamais prétendu être cliquable : pas de curseur pointeur, pas de survol, rien. C'est plus proche de ma règle des **états vides** (« jamais un vide, toujours une invitation à l'action suivante ») appliquée non pas à un champ mais au **parcours** : une bibliothèque qui liste un document sans jamais offrir le geste qui le rouvre est un vide fonctionnel, pas un vide visuel — mais le résultat pour l'auteur est le même abandon. Sur ce terrain-là (le mien), la conclusion du tech-lead tient : coder l'ouverture n'est pas une extension de périmètre gratuite, c'est fermer un état vide que cette itération elle-même a ouvert en construisant l'écran.

**Ce qui reste hors de mon domaine** : si rouvrir cette question va à l'encontre de l'arbitrage `resolved_decisions` d'it1 (« navigation carte→éditeur… hors périmètre, nommément reportés ») est une question de PROCÉDURE/PÉRIMÈTRE — au PM et au tech-lead de trancher si c'est un nouvel arbitrage ou une révision. Je ne bloque pas dessus, je n'ai pas voix dessus.

## Statut de mes objections de tour 1

1. **Objection formelle (EditorTopBar : tooltip désactivé câblé en dur sur `!onPreview`, un seul texte possible)** — **maintenue mais satisfaite** par l'Annexe A.4 du tech-lead. `backLabel?: string` (défaut `'Mes livres'`) et `previewDisabledHint?: string` (défaut = texte actuel) sont exactement le paramétrage que je demandais, avec la rétro-compatibilité que je n'avais pas chiffrée moi-même (zéro prop requise changée, `EditorScreen.tsx` intact). Je referme l'objection avec le texte exact à passer côté écran dossier — inchangé depuis mon tour 1 :
   `Aperçu du jeu — disponible quand le mode jeu sera repointé sur le dossier (feature n° 9)`
   — cohérent avec l'assertion `toHaveAttribute('title', expect.stringContaining('feature n° 9'))` proposée par la QA.

2. **Position d'Annexe E (exclure le clic de réouverture)** — **retirée**, voir ci-dessus.

## Contrat de design ajusté — DossierCard cliquable

Convergence avec le tech-lead (Annexe C, point 2 : « le titre devient le bouton d'ouverture »), avec un resserrement sur la micro-spec puisque c'est mon domaine :

- **Seul le TITRE devient l'affordance** — pas le bloc titre+date comme je l'avais écrit en tour 1 (je corrige : la date est une métadonnée, pas une invite à l'action ; élargir la cible n'apporte rien et complique l'implémentation pour un gain nul, la cible ≥44px étant hors cadre). La date reste un `<span>` non interactif, inchangée.
- Remplacer le `<span style={cardTitle}>` (branche `lisible: true` seulement) par un `<button type="button">`, style = une **const locale** `cardTitleButtonStyle` (même discipline que `telechargerButtonStyle`, jamais importée d'ailleurs) : reprend exactement `cardTitle` (`fontSize: var(--fs-title)`, `fontWeight: var(--fw-semibold)`, `color: var(--text-strong)`) + reset de bouton (`border: none`, `background: none`, `padding: 0`, `font: inherit`, `textAlign: 'left'`) + `cursor: pointer`.
- **Survol** : `text-decoration: underline` sur ce texte uniquement. **Pas** de changement de couleur vers l'accent — la couleur reste `var(--text-strong)` : l'accent est réservé à la sélection/action primaire/option active, pas à un survol de navigation (discipline de l'accent, item 4 de mon mandat).
- **Focus clavier** : rien à ajouter — un `<button>` natif entre dans l'ordre de tabulation sans configuration, et `.dossier-card:focus-within .dossier-card__actions` (déjà dans `src/style.css:48-49`) révèle en prime les actions coin (télécharger/supprimer) dès que ce bouton reçoit le focus — comportement CSS existant, aucune règle nouvelle.
- **Jamais sur `lisible: false`** : le titre y reste le `<span>` actuel, aucun bouton, aucun curseur pointeur — l'union discriminée l'interdit au typage, pas une convention de rendu (même invariant que documenté dans le commentaire existant de `DossierCard.tsx:16-18`).
- **Chargement** : aucun état à prévoir — `dossiers.open()` puis la navigation sont synchrones (lecture locale déjà en mémoire), même famille que les autres transitions de cette feature.
- **Aucun nouveau texte** : cette interaction ne consomme que des données déjà affichées (`dossier.titre`) — zéro risque de faute de registre, zéro placeholder à écrire.

## Réponse à l'objection 2 du tech-lead (registre de langue — obligatoire, domaine mien)

Le tech-lead lit `design_contract.registres_de_langue` (« aucun champ ici n'est lu ou entendu par le joueur ») comme contredit par le seed, qui écrit `accroche_joueur` et `texte_ouverture_joueur` (registre `ia`/`moteur` selon `destinations.ts`). **Je précise plutôt que je contredis** : cette clause du design_contract est scopée explicitement à « nav, sous-titres, états vides » — la copie d'INTERFACE que *cette feature* fabrique (labels de `EditorTopBar`, futur `ListRow`, textes d'état vide). Le seed de `DossierService.create()` n'écrit aucune de ces choses : il écrit du **contenu de dossier**, un objet de données, pas une chaîne d'interface rendue par un composant de `bascule-editeur`. La clause reste vraie dans son périmètre écrit ; elle ne couvre juste pas ce que le tech-lead lui demande de couvrir.

Ceci dit, le risque de fond que le tech-lead pointe est réel et j'endosse pleinement, depuis mon autorité sur les deux registres, la **Proposition 1 de narratif-ia** (marqueur `⟨à écrire⟩` + textes constants) : ces quatre chaînes sont rédigées à la deuxième personne adressée à l'**auteur** (« Ce que le joueur sait en ouvrant le livre »), jamais à la deuxième personne adressée au **joueur** — elles ne peuvent donc jamais être prises, ni par un lecteur ni par un modèle non averti, pour de la prose jouable. C'est exactement la discipline qui distingue nom interne et description-joueur ailleurs dans ce projet, appliquée ici à un placeholder plutôt qu'à un objet d'inventaire. Je valide ces quatre textes tels quels, sans amendement.

---

Fichiers relus pour ce tour : les quatre notes de tour 1 (`tour1-pm-produit.md`, `tour1-tech-lead.md`, `tour1-qa.md`, `tour1-narratif-ia.md`), `src/features/book-library/components/DossierCard.tsx`, `src/style.css` (règles `.dossier-card__actions`, l. 41-51).
