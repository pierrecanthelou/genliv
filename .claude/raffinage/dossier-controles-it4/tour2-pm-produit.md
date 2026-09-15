# Tour 2 — `pm-produit` (contre-lecture)

## 1. Contre-lecture

### A — La phrase de démo, réécrite sur la mesure

**Correction reçue** : ma clause d'exclusion (« jamais à la section du remède ») est **fausse dans 9 cas sur 10** mesurés, et **10 sur 10** offrent un remède sur place. Je ne peux plus l'écrire comme un fait négatif universel. Ce qui reste vrai — et c'est ça que la phrase doit porter — c'est le **contrat** (`Controle.section`, KR-219) et le **verbe** (« montrer le constat », jamais « corriger »), **pas une garantie d'itinéraire**.

> **Nouvelle phrase, remplace la mienne du tour 1 ET celle du cadrage :**
> « À la fin, un clic sur une ligne du rapport de contrôles mène l'auteur à **la section où le constat a été produit** — le contrat de `Controle.section`, jamais une promesse de remède. »

Une seule phrase, pas de « et », démontrable en un clic. Je reprends la formulation du **tech-lead** (« où le constat a été produit ») plutôt que la mienne (« qui porte l'absence signalée ») : plus courte, et déjà validée par deux lectures indépendantes du code.

**Le « jamais » ne porte plus sur la destination** (faux à 9/10) **mais sur ce que le dispositif PROMET** (rien) — cohérent avec le fait que 9/10 tombent quand même sur le remède, sans que ce soit un engagement du contrat.

### B-1 — Le trailing vaut son coût, du terrain de la valeur auteur

Trois raisons, toutes de mon poste :
- **valeur réelle** — un auteur qui lit un rapport de dix lignes bénéficie de savoir **où le clic mène avant de cliquer** : même logique de prévisibilité que le badge de niveau livré à it2 ;
- **coût marginal nul en fichiers** — `SECTIONS` est déjà exportée et déjà consommée par `SectionNav` ; le trailing vit dans `ListeControles.tsx`, **déjà** dans le lot ;
- **le motif qui l'aurait bloqué est dissous** par la correction : le trailing **confirme** la prose au lieu de la contredire dans 9 cas sur 10, et **ne ment dans aucun** puisqu'il ne nomme jamais le remède, seulement la section.

**Je n'ai pas de veto à poser ici** (ni hors périmètre, ni fichier neuf). Si le tech-lead le chiffre dans le même lot sans fichier neuf, je n'ai pas d'objection. **C'est à lui de dire si R10 tombe ou se maintient sur un autre motif** — registre, stabilité de `SECTIONS.titre` — ce n'est plus mon terrain une fois la valeur confirmée.

### Périmètre — je ne coupe pas, et le déclencheur n'est PAS atteint

Avec le chiffrage corrigé (~25 lignes, six fichiers, 4 tests neufs, 3 réécrits), les fichiers de `bascule-editeur` touchés restent **au nombre de deux** : `DossierEditorScreen.tsx` + son test — **exactement la déviation déjà actée à it1/it2, pas une de plus**. `src/App.tsx` est le **point de rendez-vous structurel**, pas un fichier de l'une ou l'autre feature : il ne compte dans aucune des deux colonnes du déclencheur.

Et **aucune ligne de logique métier n'est ajoutée** : le render-prop est un rendez-vous de type, le renversement des assertions est un renversement de garde de forme, et le trailing est **la lecture d'une table déjà exportée**, pas une règle neuve.

> **Le déclencheur écrit à la spec (« un TROISIÈME fichier de `bascule-editeur`, ou de la logique métier ajoutée ») n'est pas atteint.** Un lot, six fichiers, zéro coupe.

## 2. Statut de mes deux objections

**1. « Le chiffrage ne couvre pas l'opérabilité clavier » → RETIRÉE.** Le tech-lead corrige la **cause** que j'avais mal nommée — ce n'était pas le clavier, gratuit via `<button>` natif — mais **confirme le fond** : le chiffrage initial sous-estimait bien le lot, parce qu'il omettait ce que le passage au `<button>` **entraîne** (`<p>` invalide en contenu *phrasing*, trois étages en `<span>`, deux comptages de test qui tombent). Le chiffrage corrigé nomme désormais le poste et son vrai coût, et le clavier a son test explicite. **Mon exigence est remplie par la première branche : il est couvert, chiffré, testé. Je referme.**

**2. « La phrase de démo est ambiguë » → MAINTENUE, motif RENFORCÉ.** L'ambiguïté n'a pas disparu — **elle s'est révélée pire** : ma propre proposition de réécriture portait **la même erreur factuelle** que la tension n° 2 du cadrage, erreur que je n'avais aucun moyen de détecter au tour 1 puisque je travaillais sur une tension **présentée comme mesurée**. Je ne retire donc pas l'objection — **je livre la correction qu'elle réclamait** (§ A). Elle reste ouverte jusqu'à ce que la phrase corrigée soit celle qui entre dans `iterations[4].goal` ; si l'orchestrateur en retient une autre, **je demande à la revoir avant clôture**.

**Rien de neuf à `resolved_decisions` ni `open_questions` de mon fait.** Je soutiens toutefois, hors terrain, la demande de la QA (B-8) : écrire que le critère sera ***superseded*, pas régressé** si it5/it6 routaient vers le remède — « ça évite exactement le type de faux-signal que la correction A vient de coûter deux tours à démêler ».
