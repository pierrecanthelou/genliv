# Tour 1 — Narratif & IA — `dossier-copilote` it1

```
RISQUE      — L'invite vit dans le worker (hors porte de commit), le validateur dans
              `brain/`. Leur divergence produit un echec PERMANENT ET SILENCIEUX :
              deux appels, refus, quatre textes corrects, suite verte. Seule panne de
              cette iteration que ni `tsc`, ni `jest`, ni la revue de PR ne voient —
              et le Temps 2 en herite telle quelle.

OBJECTION   — (1) DEUX CRITERES SE CONTREDISENT. Le critere 2 rejoue « toute premiere
              reponse non conforme » ; le critere 10 prouve que deux lancers produisent
              des corps IDENTIQUES. Rejouer un 503, un 413 ou un abort rejoue donc un
              determinisme : cout double, zero chance. Le rejeu se motive par
              l'echantillonnage du modele, jamais par une garde.
              (2) KR-236 est le risque le mieux ecrit de la feature et LE SEUL SANS
              TEMOIN : aucun des 14 criteres ne fait se rencontrer l'invite et le
              validateur.
              (3) « si ce retrait vide une partie requise » suppose des parties requises
              que RIEN ne definit. Un ouvrier tranchera seul : tout requis (copilote
              inutilisable sur un dossier neuf) ou rien (critere vert par vacuite).

PROPOSITION — Quatre inscriptions chiffrees au lot contrat :
              · `CHAMPS_INJECTES['personnage-prose']` = 12 chemins de feuille, tous `ia` ;
                `PARTIES_REQUISES` = 2 (`canon.ton` seul ; identite en DISJONCTION, seuil
                1 sur 5) ; `DEROGATIONS_AUDIENCE = []` assertee vide.
              · `CHAMPS_PROPOSABLES` = 3 ; test d'allow-list enumerant 29 FEUILLES exclues
                nommement + l'universelle sur `DESTINATION_DES_CHAMPS` + trois cardinalites
                (8 / 6 / 7) contre la vacuite.
              · `CLE_SORTIE` / `GABARIT_SORTIE` dans UN SEUL fichier, invite composee depuis
                lui, +1 critere (total 15) : un test node lit l'invite RENDUE, asserte le
                gabarit, ET PORTE SON CAS NEGATIF.
              · Garde worker en OCTETS (`TextEncoder`), jamais `body.length` —
                `worker/index.ts:84` est un compte de caracteres.

VERDICT     — recevable sous reserve. Devient veto si le plan part sans temoin
              executable sur KR-236.
```

---

# ANNEXE (hors quota)

## (a) Le contexte assemble, champ par champ

Role : `personnage-prose`. Source unique : `src/brain/dossier/destinations.ts`. **Zero derogation** — chaque entree verifiee `'ia'` dans cette table.

### `CHAMPS_INJECTES['personnage-prose']` — 12 chemins de feuille, litteralement

| # | Chemin | Audience | Pourquoi il entre |
|---|---|---|---|
| 1 | `canon.ton` | `ia` | Le registre de langue. Sans lui la prose sort dans une voix moyenne et l'auteur refuse tout. **Requis** (voir d). |
| 2 | `canon.interdits_ton[]` | `ia` | Le seul champ du canon qui INTERDIT. Un copilote qui ne le lit pas propose ce que l'auteur a banni. |
| 3 | `canon.mj.synopsis_mj` | `ia` | La verite de l'aventure : ce qui donne un sens a « fonction ». |
| 4 | `canon.partage.accroche_joueur` | `ia` | Ce que le joueur sait — borne ce qu'une `description_joueur` peut supposer connu. |
| 5 | `monde.personnages[].fonction` | `ia` | Cible possible ET contexte des deux autres proses. |
| 6 | `monde.personnages[].apparence` | `ia` | Idem. |
| 7 | `monde.personnages[].description_joueur` | `ia` | Idem. |
| 8 | `monde.personnages[].but.libelle` | `ia` | Ce que le personnage veut — premiere source d'une `fonction`. |
| 9 | `monde.personnages[].but.pourquoi` | `ia` | Ce qui le pousse. |
| 10 | `monde.personnages[].caractere.parler[]` | `ia` | Dit COMMENT il parle. Tronque par `PARLER_REPLIQUES`, borne deja ecrite au champ — on la resserre, on n'en invente pas une seconde. |
| 11 | `monde.personnages[].caractere.jamais` | `ia` | La limite absolue, `ia` SANS condition. |
| 12 | `monde.personnages[].plan_actions[].action` | `ia` | Les moyens du personnage — que `destinations.ts` designe nommement comme le substitut de l'etiquette `camp`. |

Les entrees 5-12 sont **restreintes au personnage designe par l'auteur**. Aucune autre fiche n'entre.

### Champs d'audience `ia` DELIBEREMENT EXCLUS a l'it1 (rejets motives)

- `monde.personnages[].caractere.cede_si` — **REJET**. `ia` mais SOUS CONDITION DE ROLE : le JSDoc dit « n'entre QUE dans le contexte de l'appel **acteur du personnage QUI LE PORTE** ». Le copilote de redaction est un appel d'ATELIER, pas un role de jeu. Assimiler le copilote a « l'acteur du porteur » est une **decision d'audience** ; elle ne se prend pas par defaut dans un lot d'ouvrier. A rouvrir explicitement au lot contrat de l'it3.
- `monde.personnages[].relations[].lien` — **REJET**. Meme predicat de role. Et il arrive **non ancre** : `relations[].cible_id` est `moteur`, `personnages[].nom` est `auteur` (KR-195) — le modele lirait « son frere » sans savoir de qui.
- `monde.personnages[].plan_actions[].si_bloque` — **REJET**. `ia` SOUS CONDITION D'ETAT : n'entre que si **le moteur** a declare l'etape bloquee. Pas de moteur en redaction, donc predicat jamais satisfiable.
- `monde.personnages[].savoirs[].revele_comment` — **REJET**, meme motif (portes constatees ouvertes par le moteur).
- `monde.personnages[].savoirs[].indice_id` et `.certitude` — **REJET**. Ces deux lignes ne sont `ia` que parce que le code **recompose** le savoir par RANG. L'it1 interdit les rangs : matiere de l'it2.
- `monde.personnages[].contre_mesures[].action` — **REJET de PERIMETRE, pas d'audience**. Rouvrable a l'it3 sans debat d'audience.
- `monde.indices[].verite`, `charpente.jalons[].enonce_texte` — **REJET** : `ia` sous condition d'etat (indice acquis / jalon atteint), aucun moteur pour le constater.
- `monde.lieux[].*`, `monde.objets[].description_joueur`, `monde.quetes[].*`, `monde.evenements[].resolutions[].resultat`, `monde.conditions.climat[].manifestation` — **REJET de perimetre** : hors de la fiche designee.

### Ce que le modele ne VOIT PAS, et ce que ca coute — honnetement

1. **Le NOM du personnage** (`auteur`). Aucune onomastique possible ; l'auteur devra parfois re-accorder le genre a la main. Palliatif refuse : basculer `nom` en `ia` (KR-195).
2. **Le CAMP et la PORTEE** (`moteur`). Une `fonction` proposee peut etre trop plate pour un antagoniste. Substitut nomme par `destinations.ts` lui-meme : `but.*` + `plan_actions[].action`.
3. **Les 6 curseurs et les 8 caracteristiques** (`moteur`). Cout **reel et non couvert** : une `apparence` peut contredire un chiffre pose par l'auteur. Substitut partiel : `caractere.jamais` + `parler[]`. La parade n'est pas d'elargir la table, c'est le diff.
4. **Les AUTRES fiches.** Le copilote peut proposer un second « forgeron du bourg ». Cout reel, non couvert a l'it1. La parade n'est PAS d'injecter la distribution (cout lineaire en nombre de PNJ, sans borne) : c'est l'oeil de l'auteur dans le diff.
5. **Le LIEU** ou vit le personnage. Cout : `apparence` generique. Rouvrable a l'it3.

**Mea culpa a inscrire** (deja acte en `resolved_decisions`) : mon « toujours charge » du tour 1 de cadrage commencait par un champ d'audience `auteur`. C'est exactement la faute que la liste ci-dessus interdit — d'ou la colonne d'audience verifiee ligne par ligne dans le fichier, jamais de memoire.

---

## (b) L'allow-list de SORTIE (KR-232)

### `CHAMPS_PROPOSABLES['personnage-prose']` — exactement 3 chemins de feuille

```
monde.personnages[].fonction
monde.personnages[].apparence
monde.personnages[].description_joueur
```

Ce que le modele VOIT (12) et ce qu'il PROPOSE (3) sont **deux listes distinctes**, dans deux constantes distinctes. Les confondre est la faute que KR-232 nomme.

### Exclusions NOMMEES — 29 feuilles, jamais une famille

**Derivees des registres (KR-117), avec assertion de CARDINALITE :**

- 8 feuilles `monde.personnages[].stats.<carac>`, derivees de `CHARACTERISTIC_VALUES` — **cardinalite assertee = 8**.
- 6 feuilles `monde.personnages[].caractere.curseurs.<curseur>`, derivees de `CURSEUR_VALUES` — **cardinalite assertee = 6**.
- 7 feuilles `…_expr`, enumerees une par une — **cardinalite assertee = 7** :
  `canon.objectifs[].reussi_si_expr`, `canon.objectifs[].echoue_si_expr`,
  `monde.personnages[].plan_actions[].declencheur_expr`,
  `monde.personnages[].contre_mesures[].declencheur_expr`,
  `monde.evenements[].declencheur_expr`,
  `charpente.jalons[].declencheur_expr`, `charpente.fins[].condition_expr`.

**Litterales, ecrites en toutes lettres (8) :**

```
monde.personnages[].savoirs[].revele_si.jet.carac
monde.personnages[].savoirs[].revele_si.jet.tc
monde.personnages[].savoirs[].revele_si.confiance_min
monde.personnages[].relations[].intensite
monde.personnages[].relations[].secret
monde.personnages[].plan_actions[].duree
monde.conditions.climat[].duree
monde.personnages[].contre_mesures[].delai
```

> `duree` apparait a **DEUX sites du schema**. Le critere ecrit « duree » au singulier ; ecrit ainsi il ne designe rien. Les deux sont nommes. **A recopier tel quel au plan.**

**Plus deux, que le critere ne nomme pas et qui sont la porte d'entree de l'it4** : `monde.personnages[].id` (`moteur`) et `monde.personnages[].nom` (`auteur`). Un copilote qui peut proposer un `nom` peut renommer une entite — creation d'entite deguisee.

**Plus l'universelle, et sa garde contre la vacuite** : le test asserte que *toute* cle de `DESTINATION_DES_CHAMPS` dont la destination n'est pas `'ia'` est absente de l'allow-list. Seule, cette assertion serait **vraie par vacuite** sur une table vide ou mal importee — d'ou les trois cardinalites et les 8 litteraux. Lecon KR-235 appliquee a un autre instrument.

### Ou vit cette enumeration : dans `src/brain/copilote/contexte.ts`. JAMAIS dans le worker.

1. **Le worker ne connait pas le schema du dossier et ne doit pas le connaitre.** Un second exemplaire du schema dans `worker/index.ts` est la **regle dupliquee entre code et prompt** sur laquelle je pose veto — et elle deriverait au premier champ ajoute, le worker n'etant pas dans la porte de commit (KR-233).
2. **La validation doit etre la derniere chose avant l'ecriture, et l'ecriture est cliente.** Une allow-list appliquee au worker seul est contournable par n'importe quelle reponse fabriquee. KR-116 : l'entree non fiable se valide **a la frontiere**, et la frontiere est la ou la donnee entre dans le dossier.
3. **Corollaire** : le worker recoit un `role` et un `champ` deja valides cote client, et n'echantillonne rien du dossier.

**La nuance qui fait KR-236** : l'invite du worker doit NOMMER le champ. Le worker porte donc une table `(role, champ) -> consigne`, indexee par **les memes chaines litterales**. Second site — traite en (c).

---

## (c) Le schema de sortie, le rejeu, et la garde KR-236

### Le corps de REQUETE (client → worker) — trois cles, rien d'autre

```json
{
  "role": "personnage-prose",
  "champ": "monde.personnages[].fonction",
  "contexte": "<le texte assemble, UNE SEULE chaine>"
}
```

Ce qui n'y est **pas** : aucun `dossierId`, **aucun identifiant de personnage**, aucun fragment de dossier brut. Le modele ne voit jamais un handle (KR-231), et l'absence totale d'identifiant rend le critere « deux lancers, deux corps identiques » verifiable par une egalite stricte, sans normalisation.

### Le corps de REPONSE attendu du modele — UNE cle

```json
{ "valeur": "Forgeron du bourg, seul a savoir retremper une lame d'acier noir." }
```

**Aucun rang, aucun nombre, aucune sous-entite, aucun tableau, aucun echo du `champ`.** L'echo est refuse deliberement : un echo cree une **seconde autorite** sur la cible, et un modele qui echoerait un autre champ obligerait a arbitrer.

### Valider la FORME, jamais la PROSE (KR-229) — sept predicats

1. la charge est un **objet** JSON (ni tableau, ni `null`) ;
2. l'ensemble de ses cles est **exactement** `{ 'valeur' }` — une cle en trop est un **refus**, pas une tolerance : c'est la sortie d'un autre role ou d'une autre version d'invite, donc le signal KR-236 lui-meme ;
3. `typeof valeur === 'string'` ;
4. `valeur.trim().length > 0` ;
5. `valeur.length <= PLAFOND_PROSE` — borne de **forme**, mesuree ;
6. `!valeur.includes(MARQUEUR_A_ECRIRE)` — **importe** de `brain/dossier/amorce.ts` (KR-223) : un modele nourri d'un contexte marque recrache parfois le marqueur ;
7. le **scanner anti-identifiant NON ANCRE** (KR-235) ne trouve aucune sous-chaine en forme d'identifiant, avec ses **deux canaris dans le meme test**.

**Jamais valide** : que la prose soit bonne, idiomatique, conforme au ton, non complaisante. Le juge de la prose est **l'auteur, dans le diff**.

### Ce qui declenche le rejeu — EXACTEMENT UNE FOIS

**Declenche le rejeu** : la violation d'un des sept predicats de forme. Motif : ce sont les seuls echecs que **le re-echantillonnage du modele peut changer**.

**Ne declenche AUCUN rejeu** (branche `indisponible{raison}`, un seul appel) :
- worker injoignable, erreur reseau, 5xx, timeout ;
- **413 de la garde de taille de corps** — l'absence de memoire garantit que le second corps serait **identique**, donc la garde rendrait **identiquement** 413 ;
- abort par Annuler / Echap (`signal`) — une decision de l'auteur, pas un echec de forme.

**Ne declenche aucun appel du tout** (branche `refuse{champ}`) : filtre marqueur / partie requise vide — voir (d).

### « Etat terminal explicite sans rien persister » — apres le second echec de forme

- `demander` rend `{ statut: 'illisible', motif }`, branche d'une union **discriminee** ou `propose` n'est **pas representable** ;
- **aucun** appel a `DossierService.update` → aucune ecriture → **aucun `dossier:updated`**. Les trois negations s'epinglent **separement** : `update` non appele, `PersistenceService.set` non appele, bus muet ;
- **aucune retention** des deux sorties fautives, meme pour affichage — meme motif que le rejet du SSE ;
- **aucun troisieme appel** : `fetch` appele exactement **2** fois, compte asserte.

### KR-236 — la garde qui lie l'invite au schema

**La panne, ecrite pour qu'on la reconnaisse.** Quelqu'un modifie l'invite dans `worker/index.ts` pour demander `{"texte": …}`. Tout appel echoue la validation, est rejoue une fois, echoue encore ; l'auteur lit « Le copilote n'a pas produit de proposition exploitable. » — le bon texte, pour la mauvaise raison — **a chaque essai, pour toujours**. `tsc` vert, `jest` vert, la revue de PR ne lit pas deux fichiers a la fois, et le worker n'est pas dans la porte de commit.

**La garde, en trois pieces, toutes dans le lot contrat de l'it1 :**

1. **Une seule autorite.** `src/brain/copilote/schemaSortie.ts` exporte `CLE_SORTIE = 'valeur'` et `GABARIT_SORTIE` (le litteral que l'invite incruste). Le worker **compose** son invite depuis `GABARIT_SORTIE` ; il ne tape jamais le mot `valeur` lui-meme. Direction d'import `worker/ → src/brain/` : aucune des trois regles d'isolation cablees ne l'interdit. **A confirmer par le Tech Lead** : le bundle du worker tolere-t-il cet import ?
2. **Le temoin executable, DANS la porte de commit** — un test sous jest **environnement node** qui : (a) appelle le handler `POST /ia/:role` avec le `fetch` du fournisseur **moque**, (b) recupere **le texte d'invite reellement compose**, (c) asserte qu'il **contient** `GABARIT_SORTIE`. Puis — obligatoire — le **cas negatif** : une invite fabriquee demandant `{"texte":…}` doit faire **rougir** l'assertion.
3. **La rencontre** : dans le meme test, la reponse conforme au gabarit traverse le **validateur de `brain/`** et doit rendre `propose`. Unique point du depot ou l'invite et le validateur existent dans le meme processus.

**Repli si (1) est impossible** (contrainte de bundling worker) : `GABARIT_SORTIE` duplique dans le worker, **et** un test asserte l'identite des deux litteraux **en lisant les deux fichiers source**. Instrument deja eprouve ici : `amorce.test.ts` tient exactement cette propriete pour `MARQUEUR_A_ECRIRE` par un balayage de source. Cout ~15 lignes.

**Ce qui n'est pas acceptable** : « on fera attention ». Un risque dont la panne est silencieuse et permanente n'a pas de parade humaine.

---

## (d) Le filtre `MARQUEUR_A_ECRIRE` (KR-223)

**Predicat** : `valeur.includes(MARQUEUR_A_ECRIRE)`, **pas** `startsWith`. Les quatre textes d'`AMORCE` commencent par le marqueur, mais un auteur peut editer autour ; et les chevrons mathematiques ne se tapent pas au clavier — motif ecrit de leur choix — donc `includes` n'a pas de faux positif. Constante **importee**, jamais recopiee.

**Ou** : dans `assemblerContexte`, cote `brain/copilote/`, **avant tout `fetch`**. La branche `refuse{champ}` est atteinte sans reseau.

**Le retrait est un RETRAIT, pas une substitution.** Un `canon.ton` injecte a `""` enseigne au modele « ce livre n'a pas de ton » : c'est une affirmation. Le repli est le **silence** — meme doctrine que `climat.manifestation`, ecrite dans `destinations.ts`.

### Parties REQUISES pour `personnage-prose` — deux

**R1 · TON — `canon.ton`, seul.** Requis. Sans registre de langue la sortie est une voix moyenne et l'auteur refusera systematiquement : c'est le champ dont l'absence rend l'appel **inutile**. Et c'est un des quatre champs de l'amorce, donc **cas nominal** d'un dossier neuf.

**R2 · IDENTITE DU PERSONNAGE — disjonction, seuil 1 sur 5.** Au moins **un** non vide et non marque parmi : `fonction`, `apparence`, `description_joueur` (autres que la cible), `but.libelle`, `but.pourquoi`.
- Seuil bas : exiger les cinq rendrait l'assistant inutilisable la ou il sert.
- Seuil non nul : on ne peut pas proposer l'apparence d'un personnage dont on ne sait **rien**. Un personnage sans aucune prose ni but est la matiere d'« Eclater le synopsis » (it4).
- **Arbitrage assume et contestable** : le PM peut vouloir l'inverse. Pose comme decision explicite pour qu'il soit **discute au tour 2** plutot que tranche par un ouvrier.

### Parties FACULTATIVES — retirees en silence, l'appel part

`canon.mj.synopsis_mj`, `canon.partage.accroche_joueur`, `canon.interdits_ton[]`, `caractere.parler[]`, `caractere.jamais`, `plan_actions[].action`, et les proses d'identite non retenues par la disjonction.

> **L'asymetrie `ton` requis / `synopsis_mj` facultatif est deliberee et doit etre ecrite au plan** : les deux portent le marqueur sur un dossier neuf. Si `synopsis_mj` etait requis, le copilote serait **refuse sur tout dossier neuf**. Le `ton` gouverne la **forme** de la sortie (l'auteur ne peut pas la rattraper) ; le synopsis en gouverne le **fond** (l'auteur le juge dans le diff).
> `canon.interdits_ton[]` **vide** est un etat calme et legitime, jamais un manque.

### Le message de refus

Gabarit (c) du `design_contract` : il nomme **le champ par son libelle francais d'ecran**. Seul des quatre textes qui propose un **geste** (KR-171). Dans le cas R2 il nomme la **partie** (« ce que veut le personnage, ou ce qu'on voit de lui »), pas les cinq chemins.

### Piege a signaler a l'ouvrier : le marqueur a DEUX consommateurs

- sur un champ de **CONTEXTE** → retrait, puis refus si une partie requise se vide ;
- sur le champ **CIBLE** → selection de la variante **REMPLISSAGE** de `LigneProposition`. Ce n'est **pas** un refus.

**Et cette seconde branche est INERTE a l'it1** : l'amorce ne seme que quatre champs (`canon.mj.synopsis_mj`, `canon.partage.accroche_joueur`, `canon.ton`, `charpente.depart.texte_ouverture_joueur`) — **aucun champ de personnage**. Son test est un **test de contrat**, pas un test de comportement observable, et **la revue d'iteration doit l'ecrire ainsi**.

---

## (e) Anti-complaisance et budget par tour (§ 2.8) — en REDACTION, a l'it1

### Anti-complaisance — PAS sans objet

Le § 2.8 l'ecrit en trois enonces de resolution mecanique — aucun n'a de sens sans moteur. Mais la **regle** derriere, si : sans contrainte, le modele **accorde**. En redaction, il accorde a **l'auteur**. Deux formes :

1. **La paraphrase du contexte.** On donne `but.libelle`, on demande `fonction`, le modele rend le `but.libelle` reformule.
   **Traitement a l'it1 : AUCUN garde automatique.** Un seuil de similarite serait exactement le « garde a seuil numerique sans semantique choisie » deja rejete (KR-235).
   **Ce qui le traite : le panneau de diff.** La variante REMPLACEMENT montre AVANT et APRES cote a cote : la paraphrase **se voit**.
   **Consequence executable a inscrire** : le bloc AVANT n'est **pas facultatif** quand la cible est non vide. C'est un critere d'acceptation, pas une finition — seul garde anti-complaisance de l'iteration.
2. **La flatterie de l'interface.** Aucun texte d'ecran ne **qualifie** la proposition : ni « bonne suggestion », ni « proposition amelioree ». L'ecran dit **ce qui est**. Verifiable : les quatre textes + les libelles d'action ne contiennent aucun adjectif evaluatif.

### Budget par tour — en partie sans objet

- **« Plafond d'appels par tour » : SANS OBJET.** Il n'y a pas de tour.
- **Ce qui n'est pas sans objet — un appel en vol a la fois par panneau.** « Lancer » desactive pendant l'appel ; Annuler/Echap abortent via le `signal` **deja present** dans `demander(role, dossier, cible, signal?)`. Sans cela, trois clics = trois appels payes, et la **derniere reponse arrivee gagne** — etat illegal representable, sur une iteration qui a deja paye BUG-082 pour ce motif.
  **Critere chiffrable** : deux clics rapproches produisent **exactement 1** appel reseau.
- **Le plafond de jetons devient les DEUX plafonds de (f)** : en redaction on borne la **taille**, pas la **cadence**.
- **Ce qu'on ne livre pas, et qui reste nomme** : aucun compteur d'appels, aucun limiteur de debit. Deja inscrit comme point d'extension non livre — je confirme qu'il reste ouvert et que **quiconque connait une cle de synchronisation valide peut bruler du budget modele** (KR-148).

---

## (f) Le budget de contexte cote client

### La grandeur

**Le nombre de caracteres (`String.length`, UTF-16) du texte de contexte assemble** — la chaine unique que `assemblerContexte` rend, **avant** serialisation, **avant** l'enveloppe, **avant** l'invite.

- c'est la seule grandeur que le **client controle** : il choisit quels champs y entrent ;
- c'est la seule qui permet de **nommer ce qu'il faut couper** : on coupe des **champs**, et un champ a une longueur en caracteres, pas en octets HTTP ;
- et c'est **deliberement** une autre grandeur que celle du worker (octets du corps HTTP, invite et enveloppe comprises, refus **apres** l'aller-retour).

### Defaut existant a ne PAS recopier — mesure ici

`worker/index.ts:84` :

```ts
if (body.length > 25_000_000) return respond('Payload too large', 413)
```

`body` vient de `request.text()` : `.length` est un compte de **caracteres UTF-16**, pas d'octets. La route `/ia/:role` doit compter des **octets** — `new TextEncoder().encode(body).length`, ou un refus sur `Content-Length` avant meme de lire le corps. Recopier la ligne 84 donnerait **deux plafonds qui pretendent mesurer deux grandeurs et n'en mesurent qu'une**. Le contexte du copilote est riche en non-ASCII : `MARQUEUR_A_ECRIRE` fait **10 caracteres et 16 octets** en UTF-8.

Note complementaire pour le lot worker (constatee, hors mon domaine) : la ligne 69 `if (!match) return respond('Not found', 404)` s'execute **avant** toute autre route — l'ajout de `/ia/:role` doit passer devant. Et le catch de la ligne 97 rend du **texte brut**, alors que le critere exige une **reponse JSON** pour la garde de taille.

### Ce qu'on coupe en premier — un ordre ecrit, jamais un tronquage a mi-phrase

1. `monde.personnages[].plan_actions[].action` — la liste entiere ; et **au sein** de la liste, on coupe par la **fin** ;
2. `monde.personnages[].caractere.parler[]` — deja borne par `PARLER_REPLIQUES` : le budget **resserre cette borne** ;
3. `canon.mj.synopsis_mj` ;
4. `canon.partage.accroche_joueur` ;
5. les proses d'identite **non ciblees**.

**Jamais coupes** : `canon.ton`, `canon.interdits_ton[]`, `caractere.jamais`, la partie requise de la disjonction R2, et **le champ cible lui-meme quand il est non vide**.

**Si le budget deborde encore apres les cinq coupes** : `refuse{champ}`, en nommant la section la plus lourde. Jamais un appel qu'on sait condamne au 413 — application directe de la decision DEGRADATION.

### Pourquoi la taille BRUTE d'une fixture n'est pas cette mesure

`__fixtures__/dossier-minimal.json` **peuple toutes les collections** pour eprouver le validateur. Son poids est celui des identifiants, des `…_expr`, des nombres, des portes de revelation — c'est-a-dire, a l'ecrasante majorite, **exactement ce que la garde d'audience retire**. Mesurer le fichier, c'est mesurer ce qu'on **n'envoie pas**.

**La mesure valide, a relever une fois l'assembleur ecrit :**

```
assemblerContexte(fixture, 'personnage-prose', <le personnage le plus rempli>).length
```

Puis plafond = arrondi superieur au multiple immediat — meme doctrine que le budget de contexte de `WORKFLOW.md` : **la mesure d'abord, le plafond ensuite, et l'arrondi EST la marge**. Le chiffre se releve **dans la revue d'iteration**. Le plafond du worker se mesure dans le **meme lot**, sur le **meme appel**, en octets.

---

## (g) La voix

**1 · Le bouton de relance.** Libelle **« Lancer »**, identique au premier essai et aux suivants. Refuses : « Relancer », « Affiner », « Ameliorer », « Une autre proposition ».

**2 · Le texte d'echec (b).** Conforme. Peut y etre ajoute « Vous pouvez relancer. » (un fait). Jamais « Relancez pour affiner. » (un mensonge).

**3 · Le texte d'indisponibilite (a).** Conforme, rien a changer : il promet une **disponibilite** (propriete du worker), pas une **amelioration** (propriete de la proposition).

**4 · Ce que personne d'autre ne verra — la voix de la PROSE PROPOSEE n'est pas celle du mode jeu.**
Une `description_joueur` est du **contexte injecte au narrateur**, jamais emis verbatim : `destinations.ts` l'ecrit en toutes lettres (l. 168-174 — les proses lues mot pour mot sont `charpente.depart.texte_ouverture_joueur` et `charpente.fins[].texte`, et c'est precisement ce qui les rend `moteur`).

**Donc : AUCUNE consigne « deuxieme personne, present, immersive » ne doit entrer dans l'invite de ce role.** Une `description_joueur` proposee sous la forme « tu vois un homme voute pres de la forge » devient **fausse** le jour ou la n° 10 l'injecte comme fiche a un narrateur. L'invite demande une **fiche**, pas une scene.

C'est un point d'**invite**, donc il vit dans le worker, donc **il doit etre ecrit noir sur blanc dans le lot qui pose l'invite** : un ouvrier qui connait le § 2.8 recopiera la voix du Temps 2 par reflexe, et personne ne le verra en revue — le texte produit sera joli.

---

## Rejets a recopier au registre des desaccords (§ 8 du plan)

| # | Rejet | Motif en une phrase |
|---|---|---|
| N-R1 | `caractere.cede_si` au contexte de l'it1 | `ia` **sous condition de role** ; assimiler le copilote a ce role est une decision d'audience, elle se prend au lot contrat de l'it3. |
| N-R2 | `relations[].lien` au contexte de l'it1 | Meme predicat de role, **et** il arrive non ancre (`cible_id` = `moteur`, `nom` = `auteur`) : « son frere » sans savoir de qui. |
| N-R3 | `plan_actions[].si_bloque` et `savoirs[].revele_comment` | `ia` **sous condition d'etat** constatee par **le moteur** : predicat jamais satisfiable en redaction. |
| N-R4 | `savoirs[].indice_id` / `.certitude` | Ne sont `ia` que via la recomposition par **rang** ; l'it1 interdit les rangs. |
| N-R5 | Un garde anti-paraphrase a **seuil de similarite** | Meme faute que le garde de confinement a seuil deja rejete (KR-235). Le diff AVANT/APRES fait le travail. |
| N-R6 | Rejouer un 5xx, un 413 ou un abort | L'absence de memoire rend le second corps **identique** : rejouer un determinisme est une perte seche, et met deux criteres en contradiction. |
| N-R7 | Un echo du `champ` dans la sortie du modele | Cree une **seconde autorite** sur la cible et oblige a arbitrer une divergence que personne ne doit trancher. |
| N-R8 | Tolerer une cle en trop dans la sortie | Une cle en trop **est** le signal KR-236 : l'avaler rend la panne muette. |
| N-R9 | L'allow-list de sortie hebergee dans le worker | Regle dupliquee entre code et prompt, qui derive au premier champ ajoute ; KR-116 place la validation la ou la donnee entre dans le dossier. |
| N-R10 | Une consigne « deuxieme personne, present » dans l'invite de `personnage-prose` | `description_joueur` est du **contexte injecte**, jamais emis verbatim : une prose en voix de scene devient fausse a la n° 10. |
| N-R11 | Recopier `body.length > …` de `worker/index.ts:84` | C'est un compte de **caracteres**, pas d'octets : les deux plafonds mesureraient la meme grandeur. |
| N-R12 | Rendre `canon.mj.synopsis_mj` **requis** | Il porte le marqueur sur tout dossier neuf : le copilote serait refuse exactement la ou il sert. |

## Fichiers lus (lecture seule)

cadrage.md, SKILL.md (raffinage-iteration), `src/features/dossier-copilote/specification.json`, `src/brain/dossier/destinations.ts`, `src/brain/dossier/amorce.ts`, `worker/index.ts`, `docs/ROADMAP-BASCULE-IA.md` (D2 l. 62-66, l. 152, l. 173), `docs/PLAN-BASCULE-IA.dc.html` (§ 1.7 l. 283-293, § 2.8 l. 611-618).
