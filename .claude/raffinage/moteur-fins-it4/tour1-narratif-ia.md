## Tour 1 — Directeur narratif-IA — moteur-fins it4

### RISQUE

**Ambiguïte du mot « Rejouer ».** L'auteur qui teste son aventure va cliquer « Rejouer » en pensant revoir la meme partie. Il obtiendra les memes jets de des mais une narration differente (R1/R3/R4/R5 sont des sorties LLM non deterministes). Au tour 8, un PNJ dira autre chose, le joueur reagira autrement, les evenements divergeront — et l'auteur pensera que l'outil est casse. Le risque n'est pas technique (la graine fonctionne), il est dans le contrat implicite que le mot « rejouer » pose envers l'auteur.

### OBJECTION

La definition dit « memes tirages aleatoires » (AC-11) mais ne dit rien de ce que l'auteur **voit** ni de ce qu'on lui **dit**. L'ecran de fin / mort affichera un bouton « Rejouer » sans aucune indication que seuls les des sont reproduits. Or l'ecart entre l'attente et le resultat est maximal : au premier challenge, le jet tombera pareil ; a la premiere narration, le texte sera different. Si le bouton ne gere pas cette attente, le test de l'aventure — qui est le seul usage reel de cette graine a ce stade — produit de la confusion, pas de la confiance.

**Pas d'objection sur la frontiere code/IA** : cette iteration est integralement du code. Aucun appel modele, aucun prompt, aucune injection de contexte. La graine ne pilote que `alea(graine, domaine, indice)` et ses deux consommateurs (`creerRng` pour 'jet', 'combat', 'heros') — jamais une sortie IA. Le cloisonnement est intact.

### PROPOSITION

1. Le bouton porte le libelle **« Rejouer (meme graine) »** — pas « Rejouer » seul.
2. Une ligne d'aide sous le bouton ou dans le dialogue de confirmation : **« Les tirages seront identiques. La narration sera differente. »** — c'est du copy UI, pas de la fiction, donc ca ne viole pas la regle de voix.
3. La `graine_alea` de la session terminee passe par un callback (`onRejouer(graine)`) distinct de `onNouvellePartie`. `AiguillagePartie` distingue les deux flux : nouvelle graine (Math.random) vs graine conservee (entier injecte). Pas de champ supplementaire dans `EtatSession` — la graine vit deja dans la session lue, elle remonte par la prop.
4. Tester (RTL) que deux `ouvrirSession` avec la meme graine + les memes commandes (fixture, pas de modele) produisent le meme journal de jets. `moteurSansIA.test.ts` couvre deja ca implicitement — le verifier nommement.

### VERDICT

**Recevable.** Aucun veto — la frontiere code/IA est intacte, l'IA ne touche a rien dans cette iteration. La graine est `moteur` (audience deja posee dans `sessionDestinations.ts`), le modele ne la voit jamais. Le journal reste un constat (KR-248). Aucun contexte ne grossit.

---

### ANNEXE NARRATIF-IA

**Frontiere code/IA.** Intacte. It4 ajoute un chemin de relance qui reinjecte une graine existante dans `ouvrirSession` — meme fonction, meme contrat, meme cloisonnement. L'IA n'est pas appelee, n'est pas informee du rejeu, et ne recoit a aucun moment la valeur de la graine (audience `moteur`). Les cinq roles IA (R1-R5) restent non deterministes : c'est voulu et documenter.

**Budget de contexte.** Zero croissance. La graine est deja dans `EtatSession.graine_alea`. Aucun champ de session ajoute (KR-251). Aucun bloc de contexte modele modifie.

**Identifiants stables.** Pas concerne — aucun nouvel identifiant. La graine est un entier numerique, pas un identifiant de domaine.

**Voix narrative.** Le texte du bouton et de la ligne d'aide est du **copy UI** (comme « Nouvelle partie »), pas de la fiction. Il n'entre dans aucun contexte de modele. Il respecte la regle : le moteur ne parle pas en tant que modele, n'annonce pas de mecanique. « Les tirages seront identiques » est une promesse d'outil adressée a l'auteur, pas une adresse au joueur.

**Memoire de session.** Inchangee. La graine est persistée depuis la n°9. Le rejeu ouvre une session neuve (journal vide, monde reinitialise). Aucune fuite de contexte.

**Coherence de la fiction.** Par construction : le rejeu ouvre une partie vierge. Les faits reveles repartent de zero. Aucun etat fantome d'une partie precedente ne persiste.

**Contrat de sortie IA.** Aucun — cette iteration n'appelle pas de modele. Le seul contrat est mecaniste : `ouvrirSession(dossier, { graine_alea: N })` rend un `EtatSession` identique pour un meme `N` et un meme dossier, verifie par `resoudreJalons` (pur). Pas de schema de sortie IA, pas de comportement d'echec IA a specifier.

---

### Decisions prises en autonomie faute de specification

- **Le libelle du bouton n'etait pas tranche** → j'ai choisi « Rejouer (meme graine) » avec ligne d'aide → si c'est « Rejouer » seul, le cout est la confusion auteur decrite ci-dessus (support, faux rapports de bug).
- **Le mecanisme de passage de la graine n'etait pas specifie** → j'ai propose un callback `onRejouer(graine)` separe de `onNouvellePartie` → si c'est un seul callback avec un parametre optionnel, le cout est une API moins lisible mais fonctionnellement equivalente.
- **Le test de determinisme nomme n'etait pas explicitement demande** → j'ai propose un test RTL « meme graine = meme journal de jets » → si on ne l'ecrit pas, la couverture est implicite via `moteurSansIA.test.ts`, mais l'intention du rejeu n'est pas documentee par un test nomme.
