# Tour 2 — `narratif-ia` · `dossier-controles` it9

**RISQUE** — **Je me suis trompé au tour 1, et la source le prouve contre moi.** `dossier-reference.json:101` — l'`apparence` de Corvin : « **une lanterne toujours allumée à la ceinture** ». Le dossier ne suppose pas que le héros porte la lanterne : il écrit qu'un **autre** la porte. Ma phrase « l'auteur suppose donc que le héros la porte » était **mon invention, pas une lecture**. Le risque réel n'est plus le faux positif : c'est qu'it9 apprenne à l'auteur à **supprimer le prix que Tobin demande** au lieu d'écrire la scène qui manque.

**OBJECTION** — Contre la `qa`, nommément : **je retire ma lecture, la tienne est juste.** Tu as exécuté, j'avais lu, et j'avais lu une fixture saine là où elle ne l'est pas. `indice.trace-du-guet` est un **VRAI POSITIF**. Ce que je maintiens se déplace : ton flip est **ALERTE**, donc il n'exerce **pas** le troisième message bloquant.

**PROPOSITION** — (1) **H4 se reformule** : non pas « ensemble sur-compté » mais « **le schéma nomme un ÉCRIVAIN UNIQUE du fait, et aucun moteur n'a le droit d'en écrire un second** ». (2) La remédiation offre **trois** gestes, dont « donner l'objet ». (3) La correction de H3 entre dans ce lot.

**VERDICT — recevable.** Réserve principale **RETIRÉE**. Deux vetos reconduits, aucun neuf.

---

## ANNEXE

### A — Réponse nommée à la `qa`

| # | fait | ligne |
|---|---|---|
| 1 | Corvin **porte** la lanterne — « une lanterne toujours allumée à la ceinture » | `:101` |
| 2 | Corvin **vend des lanternes** et monnaie ce qu'il entend | `:100`, `:258` |
| 3 | Aucun `donner_objet` ne cible la lanterne ; seule occurrence : `retirer_objet` | `:341` |

Le dossier écrit **qui la tient** et **qui la veut**, et **ne joue jamais la scène du milieu**. Ce n'est pas un inventaire de départ implicite, c'est une **scène manquante** — un défaut d'auteur au sens le plus littéral de mon poste. Ma formule « faux positif sur un dossier sain » supposait un dossier que **je n'avais pas fini de lire**.

**Mon seul ajout** : ton témoin épingle un **ALERTE**. Le troisième message bloquant reste **sans témoin de fixture partagée**. Ne le laisse pas passer pour couvert par ton flip.

### B — Statut de mes positions du tour 1

| # | position | statut | motif |
|---|---|---|---|
| 1 | **H4 = « ensemble sur-compté »** | **RETIRÉE, reformulée** | Elle condamnerait rétroactivement `possede_objet` d'it7, décision juste. Et `objetsDonnes` n'est pas sous-compté : il est **exact au schéma** (§ D) |
| 2 | OBJECTION 1 — faux positif sur un dossier sain | **RETIRÉE** | Lecture fausse, corrigée par la source |
| 3 | **Réserve principale — `contrepartie` sort** | **RETIRÉE** | Conséquence de 1 et 2. **La porte reste dans it9** |
| 4 | OBJECTION 2 — l'équivalence cassée rend `SANS_RACINE` faux | **MAINTENUE, DURCIE EN VETO** | Classe BUG-088. Le troisième message part **dans le même lot** |
| 5 | it9 = une seule porte | **RETIRÉE** | Deux portes |
| 6 | Troisième message sous le **même** `ControleId` | **MAINTENUE** | KR-164 |
| 7 | Point fixe unique et entrelacé | **MAINTENUE** | |
| 8 | `jet` / `confiance_min` restent ouvertes | **MAINTENUE, désormais DÉRIVÉE** | Elles tombent mécaniquement sous H4 reformulée |
| 9 | Jamais « boucle » ; ne pas nommer l'indice attendu | **MAINTENUE** | BUG-088 |
| 10 | Aucun constat n'entre dans un contexte de modèle | **MAINTENUE, VETO** | |
| 11 | Le libellé de porte reste côté auteur | **MAINTENUE** | |
| 12 | Les six `REJETÉ` | **MAINTENUS** | |
| 13 | `contrepartie` hors tranche | **RETIRÉ** | Remplacé par le report **complémentaire** (§ F) |

### C — Le précédent d'it7 joue contre moi. Sans réserve.

**Même forme, même sens d'erreur, même ensemble lu.** it7 : objet jamais donné → **VRAI POSITIF**, fixture réparée dans le lot. it9 : objet jamais donné → j'ai conclu faux positif. Et c'est pire que « rien ne les distingue » : **à it7 c'est moi qui ai écrit** que la seule lecture restante confiait l'inventaire au narrateur, et que c'était ma ligne de veto.

**Ce qui distingue réellement les deux cas ne distingue que la RÉPARATION, jamais le verdict** :
- **it7** : la prose établissant l'intention était émise **VERBATIM au joueur** → retarget REJETÉ, réparation par ajout d'un `donner_objet`.
- **it9** : la prose est d'audience **`ia`** — injectée, jamais émise verbatim. L'argument d'it7 **ne transfère pas à la même force** ; retargetter reste défendable.

**Contrainte sur la réparation, si le plan la prend** : **jamais `objet.sceau-de-cendre`** — une fin exige `possede_objet(sceau)` et `consomme: true` la détruirait. Et le site narrativement juste est une **récompense de quête**, dont it7 a mesuré que le compte est épinglé **dans une seconde feature**. Sinon, le dispositif d'it7 (`cloneReferenceAvantReparation()`) donne les deux états dans le même test.

### D — Le critère, pas la conclusion

> **Un fait dont le schéma nomme un ÉCRIVAIN UNIQUE, et dont aucune instance de cet écrivain n'existe au dossier, est INACCOMPLISSABLE** — et le signaler n'est pas juger l'auteur, c'est constater que le moteur ne pourra pas l'honorer. **Un fait dont le schéma ne nomme AUCUN écrivain n'est pas décidable, et le linter s'y tait.**

Les deux moitiés sont indispensables : le silence porte sur l'**absence d'écrivain**, jamais sur l'**absence d'instance**.

| fait | écrivain(s) au schéma | verdict |
|---|---|---|
| l'objet est dans l'inventaire | **`donner_objet` SEUL** — `Depart` n'a aucun inventaire, `retirer_objet` écrit en négatif | **décidable** → `contrepartie` s'évalue |
| l'indice est au carnet | savoirs + `reveler_indice` + `mene_a`, sur-comptés | **décidable a fortiori** |
| la confiance atteint N | **AUCUN** — `modifier_confiance` écarté | **indécidable** → porte ouverte |
| le jet réussit | le **dé** — aucun document ne l'écrit | **indécidable** → porte ouverte |
| le lieu est atteint | aucun graphe (KR-224) | **indécidable** |

**La partition sort mécaniquement du critère** au lieu d'être posée porte par porte.

**Et voici pourquoi c'est MON critère** : « aucun moteur n'a le droit d'en écrire un second » n'est vrai que parce que **l'IA ne modifie jamais l'inventaire**. Si le narrateur pouvait tendre la lanterne, `objetsDonnes` cesserait d'être exact. **C'est mon invariant qui rend cette itération correcte**, et c'est pour ça qu'il doit être écrit dans le fichier.

### E — La ligne de base, et un complément mesuré

`dossier-minimal.json` porte le cas du `pm-produit` (deux portes sur le **même** savoir) sur du matériau réel : un savoir gardé **à la fois** par `contrepartie: clef-de-basalte` (**donnée**, `:178`) et `apres_indice_id: cendres-tiedes` (**révélé**, `:194`) — **le témoin positif du ET existe déjà**.

**Mais son rapport est INSENSIBLE**, et c'est le point à écrire au plan : je compte **trois** producteurs pour `indice.sceau-brise`. Retirer le savoir → 2 → **toujours silence**. **Un ouvrier qui traiterait les deux portes comme fermées ne ferait rougir aucun rapport sur cette fixture.** Si le plan veut une garde vivante du ET, l'assertion se pose sur **l'index**, jamais sur le rapport. À confirmer par la `qa`.

### F — « L'objet que personne ne donne » : une AUTRE itération, **complément et non substitut**

Critère de séparation, mécanique : (1) cause différente → identifiant différent (KR-164) : « cet **indice** n'a plus de producteur » vs « cet **objet** n'entre jamais dans l'inventaire », deux sections, deux écrans ; (2) **portée strictement plus large** — elle couvre aussi les feuilles `possede_objet` d'it7 ; (3) **elle n'a pas besoin du point fixe**.

**Matériau déjà mesuré, légué aux `open_questions`** : `dossier-reference.json` porte **un positif et deux contrôles négatifs** — `sceau-de-cendre` donné, `amulette-scellee` donnée, `lanterne-de-corvin` jamais donnée.

### G — La correction de H3 entre DANS CE LOT

**Motif propre à it9** : `objetsDonnes` passe d'**un** lecteur à **deux**. Une hypothèse tacite à un lecteur est une dette ; à deux lecteurs c'est un **invariant partagé que personne n'a écrit**. **C'est cette itération qui crée le second lecteur, donc c'est elle qui doit la nommer.**

**Forme — une PROMOTION, pas une suppression.** La phrase de H3 est vraie de la **liste H1/H2/H3** et fausse des **hypothèses du fichier**. On numérote ce qui manquait :

> **H5 — UN OBJET N'ENTRE DANS L'INVENTAIRE QUE PAR `donner_objet`.** `Depart` ne porte aucun inventaire, `retirer_objet` écrit en négatif, et **aucun moteur ne peut en écrire un second : le narrateur ne touche jamais l'inventaire**. **DEUX** lignes la lisent : `possede_objet` et `porteOuverte`.

Et H3 se corrige d'un mot : « la seule hypothèse » → « **l'une des DEUX** ».

### H — Les deux vetos reconduits

1. **Aucun constat de contrôle n'entre jamais dans un contexte de modèle.** Un narrateur à qui l'on apprendrait qu'une porte est morte jouerait autour — **c'est-à-dire donnerait la lanterne**.
2. **Le libellé de porte reste côté auteur.**

### I — Ce que je demande à l'`ux-designer`

Sa remédiation propose **deux** gestes (« retirez la porte, ou changez la cible »). **Il en manque un troisième**, et c'est celui qu'it7 a effectivement employé : **donner l'objet quelque part**. Sans lui, **la règle enseigne à l'auteur de supprimer le prix que Tobin demande — le linter appauvrirait la fiction qu'il est censé protéger.** Rédaction à elle ; la contrainte est de moi.

### J — Contrat de sortie IA : inchangé, revérifié

Entrée injectée : **aucune**. Schéma consommé : **aucun**. Budget : **inchangé**. **Frontière code/IA intacte et RENFORCÉE** : it9 déplace du jugement **vers le code** — une porte qui ne s'ouvrira jamais est constatée par une fonction pure, là où sans elle c'est une partie jouée qui le découvrirait au tour 40.

### K — REJETÉ (à recopier au § 8)

Reconduits : **1** évaluer `jet` (verdict constant + seconde source de vérité, KR-193/130 ; **nouveau motif dérivé** : aucun écrivain de document n'écrit le résultat d'un dé) · **2** évaluer `confiance_min` · **3** dériver « obtenable » de l'espace de noms ou de `retirer_objet` · **4** un second `ControleId` · **5** deux passes · **6** muter les fixtures partagées (la **réparation** d'un défaut réel est autre chose, dispositif d'it7).

Neufs :

7. **REJETÉ — ma propre réserve du tour 1.** Mesuré faux : le dossier de référence n'est pas sain, `objetsDonnes` est **exact**, et it7 a livré `possede_objet` sur le même ensemble **avec ma signature**.
8. **REJETÉ — H4 dans sa formulation du tour 1.** Elle condamnerait rétroactivement `possede_objet` et produirait une partition que personne ne voulait.
9. **REJETÉ — traiter « le schéma ne sait pas exprimer un inventaire de départ » comme un angle mort qui excuse l'auteur.** C'est l'inverse : il écrit un fait que **le moteur ne pourra pas honorer**, et la seule chose qui pourrait l'honorer — le narrateur — **est interdite de le faire**.
10. **REJETÉ — une remédiation qui n'offre que « retirez » et « changez la cible ».** Elle enseigne à supprimer le prix demandé par le personnage.
11. **REJETÉ — fusionner « l'objet que personne ne donne » dans it9.** Cause distincte, portée plus large, pas besoin du point fixe.
12. **REJETÉ — considérer le flip `trace-du-guet` comme couvrant le troisième message.** Il est **ALERTE** ; le bloquant reste sans témoin.

**Aucun test exécuté. Aucune couleur affirmée.**

---

## Notes de l'orchestrateur

**Le rôle s'est trouvé tort lui-même, dans la source, et l'a écrit sans l'atténuer.** C'est le mouvement le plus utile de ce raffinage : il retire sa réserve principale, donne raison à la QA nommément, et reconnaît que le précédent d'it7 joue **contre** lui — « à it7 c'est moi qui ai écrit que la seule lecture restante confiait l'inventaire au narrateur ».

**H4 reformulée est meilleure que l'originale** : elle partitionne les quatre portes mécaniquement au lieu de les arbitrer une par une, et elle explique *pourquoi* c'est le narratif qui doit la porter — la clause ne tient que parce que l'IA ne touche jamais l'inventaire.

**Conséquence sur l'arbitrage, et elle est lourde** : la prémisse du `pm-produit` (« le narratif a TROUVÉ la lecture qui sauve le dossier ») **est retirée par son auteur**. Le critère du PM reste juste ; son application à ce cas tombe. **L'objection de routage du `tech-lead`, elle, est indépendante et tient toujours** — mais elle a été formulée sans connaître la remédiation à trois gestes que le narratif exige ici.

**Reste à arbitrer, et la `qa` n'a pas encore rendu.**
