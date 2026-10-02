# Raffinage `moteur-acteurs` it1 — Tour 2 — UX Designer

## RÉPONSE AUX OBJECTIONS — nommée

**Sur l'affichage de `Personnage.nom` dans `entete`** — Narratif-IA n'a pas objecté, et ce n'est pas un oubli de sa part : son veto de cadrage sur `monde.indices[].nom` porte sur un risque précis — un nom d'indice qui CONTREDIT `Indice.verite` (fiabilité narrative, l'indice ment sur son propre contenu). Un nom de PNJ n'a pas d'équivalent : `Personnage.nom` ne peut pas « contredire » une réplique, il l'étiquette. Les deux audiences ne se confondent pas :
- **Audience IA (injection modèle)** — son annexe C est explicite : `fonction`/`apparence` entrent, `nom` JAMAIS. Le Tech Lead confirme côté code : `assemblerActeur` reçoit `fonction`/`apparence` du PNJ, jamais `nom`. C'est KR-284 : le modèle ne doit jamais halluciner une identité qu'il n'a pas reçue.
- **Affichage joueur (chrome d'interface)** — `entete={nomPnj}` est rendu par le navigateur, jamais par le modèle ; même geste que `entete="RÉCIT"` pour le narrateur, une étiquette structurelle qui ne ment sur rien. Le joueur sait déjà qui il a interpellé (`parler <PNJ>` vient de sa propre saisie) ; lui redonner le nom n'invente aucune information et ne contredit aucune vérité du dossier.

Confirmé : zéro conflit entre KR-284 (audience IA) et mon usage (affichage) — ils ne portent pas sur le même consommateur du champ.

**Sur `EntreeJournal.interlocuteur?` (Narratif-IA)** — champ `moteur`, jamais lu par aucun composant d'écran (le journal affiché au joueur montre `recit`/`entete`, pas la structure interne de l'entrée). Zéro impact sur mon contrat de design. Confirmé sans réserve.

## MA POSITION MISE À JOUR

Deux points laissés ouverts en tour 1 se résolvent avec les verdicts reçus :

1. **Les « deux textes système »** — mon tour 1 proposait un texte pour absent/sans-identité et un texte distinct pour mort. Le Tech Lead descope « mort » d'it1 (aucun `EtatPnj` ne porte de statut de vie avant la n°13) et fusionne absent + sans-identité sous un seul refus `RefusCommande.cible_indisponible`, pour ne pas exposer à l'auteur une distinction que le design_contract ne demande pas. Je m'aligne : **un seul texte système** suffit, mon second branchement devient un cas mort. Texte retenu : `TEXTE_CIBLE_INDISPONIBLE = (cible) => `${cible} n'est pas ici.`` — toujours légèrement faux au sens strict pour un PNJ « sans prose d'identité » mais physiquement présent, mais c'est un compromis de cadrage, pas un problème de registre (le texte reste neutre, non mécanique). J'abandonne ma proposition de distinction.
2. **La casse MAJUSCULE de `entete`** — resté sans réponse d'aucun autre rôle. Je le maintiens comme vérification de build, pas comme blocage : si `OutcomeBlock.tsx` ne porte pas déjà un `text-transform: uppercase` sur son style d'entête, l'agent d'essaim doit l'ajouter via un token nommé existant (`tokens/*.css`), jamais une valeur en dur.

**Contrat de design mis à jour (delta sur l'annexe tour 1)** :
- **États** : « PNJ absent/sans identité » et « PNJ mort » fusionnent en un seul état « PNJ indisponible » → bannière unique `⊘ {cible} n'est pas ici.`, consommée par `TRANSITIONS.parler` avant tout appel R4 (aucun texte « mort » à écrire en it1).
- **`entete`** : nom du PNJ (`Personnage.nom`), mono MAJUSCULES — vérifier `text-transform: uppercase` déjà porté par le token d'`OutcomeBlock`, sinon l'ajouter via un token nommé existant.
- Reste inchangé : composants (`OutcomeBlock`, `Field`+submit `PlayerInputBar`, bannière `role="status"`), discipline de l'accent, clavier (Entrée soumet, pas de modale donc pas d'Échap), placeholder existant.
- Constante renommée : `TEXTE_PNJ_ABSENT`/`TEXTE_PNJ_MORT` → `TEXTE_CIBLE_INDISPONIBLE`, alignée sur le nom de refus `cible_indisponible` du Tech Lead — même mot des deux côtés (code et bannière), pour que le lint proposé en tour 1 (interdire la chaîne littérale hors constante nommée) reste cohérent.

## VERDICT
**Recevable.** Les deux réserves de mon tour 1 sont levées : la distinction d'`entete` n'a plus besoin d'arbitrage, et le texte système unique du cadrage initial est restauré. Aucun veto, aucune réserve restante côté design/registre.
