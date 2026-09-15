# Tour 1 — `narratif-ia`

**VERDICT** : recevable sous réserve (P1 et P2 sont les réserves ; P3 à P5 sont des demandes fortes, non bloquantes).

**RISQUE** — le Temps 2 lira ces quatre proses, et il les lira **deux fois différemment**. `texte_ouverture_joueur` est émis verbatim : le moteur lirait au joueur « ⟨à écrire⟩ La première scène… ». Les trois proses `ia` entrent dans le contexte du modèle, où « ⟨à écrire⟩ Le registre de langue — par exemple : sombre et feutré » devient une consigne de ton adressée au modèle. Un rapport qui dit « prose non rédigée » sans nommer cette destination laisse l'auteur croire à un champ vide à remplir plus tard ; c'est le seul écran qui pouvait le lui apprendre.

**OBJECTION 1 (structurelle, mesurée)** — `canon` et `depart` sont **deux `SectionId` distincts** (`sections.ts` l. 83-84). La règle unique produit donc des contrôles dans deux sections et à deux niveaux, alors que `ControleDescripteur` déclare *un* `niveau` et *une* `section`. Le contrat ne peut pas porter l'arbitrage.

**OBJECTION 2** — le prédicat de détection n'est pas écrit. `startsWith` laisse passer un marqueur qu'un auteur aurait laissé en fin de chaîne : le glyphe part quand même dans le contexte du modèle, et le voyant est éteint.

**PROPOSITIONS** — **P1** : deux entrées au registre, pas une — `amorce-ouverture` (bloquant, `depart`, 1 contrôle) et `amorce-canon` (alerte, `canon`, jusqu'à 3). KR-164 le commande : deux destinations, deux conséquences, deux remèdes, donc deux causes ; le descripteur reste intact et la scission est visible dans le registre plutôt qu'enfouie dans un `controler()`. *(→ le tech-lead propose au contraire une entrée unique dont les constats portent niveau et section ; désaccord ouvert.)* **P2** : `includes`, jamais `startsWith`, avec un test à deux proses dans le même test. **P3** : la ligne QUOI nomme la **destination**, pas le manque. **P4** : `Controle.path` porte la clé littérale de `DESTINATION_DES_CHAMPS`, épinglée par un test. **P5** : `jouable` calculé et testé, pas rendu en verdict global.

## Audiences vérifiées — relevé champ par champ (`destinations.ts`)

| Champ semé par `construireAmorce` | Audience | Ligne | Niveau prêté | Verdict |
|---|---|---|---|---|
| `canon.mj.synopsis_mj` | `ia` | 117 | ALERTE | conforme |
| `canon.partage.accroche_joueur` | `ia` | 118 | ALERTE | conforme |
| `canon.ton` | `ia` | 119 | ALERTE | conforme |
| `charpente.depart.texte_ouverture_joueur` | `moteur` | 569 | BLOQUANT | conforme |

**Aucune divergence : l'arbitrage de cadrage tient sur une mesure exacte.** Trois corroborations indépendantes dans le même fichier, plus `types.ts` et le JSDoc d'`amorce.ts`. Quatre écrivains, une seule vérité.

**Conséquence non tirée par le cadrage** : `canon.interdits_ton[]` est aussi `ia` mais semé **vide**, donc sans marqueur, donc silence — correct (« absent ≠ vide »). Ne pas l'ajouter par symétrie.

## Ce que la ligne QUOI doit apprendre

Les quatre textes semés sont rédigés **à l'adresse de l'auteur** ; leur défaut n'est pas d'être vides — un champ vide est structurellement inatteignable sur un dossier persisté (KR-225) — mais d'être **une consigne de rédaction qui voyage vers une audience qui la prendra pour du contenu**. Les deux phrases doivent donc différer par leur **conséquence**, jamais par un adverbe d'intensité :

- BLOQUANT · « Le moteur lira ce texte au joueur mot pour mot : il lui lirait la consigne ⟨à écrire⟩. »
- ALERTE · « Ce texte part tel quel dans le contexte du modèle : il y sera lu comme du canon. »

Sans cette différence, les deux niveaux ne se distinguent que par la pastille — classe KR-199/KR-222 appliquée à la rédaction. **Aucune de ces phrases ne recopie le glyphe** : elles l'interpolent depuis `MARQUEUR_A_ECRIRE` importé de `./amorce` (KR-223).

## Frontière avec le Temps 2 — tranché

It1 est un rapport d'auteur, **et c'est déjà le prédicat**. Le JSDoc d'`amorce.ts` affecte nommément les deux moitiés : l'alerte au linter (n° 7), le refus d'ouvrir une partie au moteur (n° 9). Donc : aucun `peutOuvrirUnePartie()`, aucun helper pensé pour n° 9 — `controlerDossier(dossier): RapportControles` **est** déjà le prédicat, pur, total, dans `brain/`, sur un `Dossier` typé. La seule chose à garantir maintenant, parce qu'elle est chère à rattraper : `jouable` n'a **qu'une** définition, dérivée dans `controles.ts`, jamais stockée ni recalculée. Un test l'épingle sur le dossier d'amorce **et** sur un clone rédigé.

## `jouable` faux sur un dossier neuf — exact, et c'est le bon message

Tout dossier neuf naît injouable, et ce n'est pas une fausse alarme : une aventure dont la scène d'ouverture est « ⟨à écrire⟩ La première scène… » ne peut littéralement pas être jouée. Mais un bandeau rouge sur un document créé il y a deux secondes est un voyant allumé sur 100 % des dossiers à t=0 — le miroir du voyant tautologiquement vert refusé sous `SANS_COMPTE`. Donc : calculé, exporté, testé ; **pas rendu** en verdict global. Corollaire refusé d'avance : **aucune exemption « dossier jamais édité »** — le seul discriminant serait `updatedAt === createdAt`, qui cesse d'être vrai à la première édition sans rapport et rendrait la règle muette pile quand elle devient utile.

## Budget de contexte et identifiants

Aucune ligne neuve dans `DESTINATION_DES_CHAMPS` : les quatre champs y sont déjà avec la bonne audience, et le rapport n'est pas du schéma (sorties dérivées, jamais persistées, audience de fait `auteur`). Contexte du modèle inchangé à zéro tour — cette itération le **protège** : premier dispositif du dépôt qui empêche une consigne de rédaction d'entrer dans le contexte. Aucun identifiant stable créé (`ControleId` est une clé de règle, jamais persistée). `Controle.entityId` porte l'identifiant, jamais le nom ; pour les quatre contrôles d'it1 il reste `undefined` — canon et départ ne sont pas des entités, et c'est pourquoi le champ est optionnel.

## Contrat de sortie IA — néant, vérifié

Aucun modèle appelé, aucune sortie consommée, aucun prompt écrit. La frontière code/IA n'est pas déplacée d'un millimètre ; cette itération la renforce côté code. Aucune règle de jeu dupliquée : les quatre lignes sont des règles de **rédaction**, elles ne touchent aucun des quatre fichiers sous mutation, donc ni `test:mutation` ni table dorée.

## Invariants greppables

| # | Invariant | Relevé |
|---|---|---|
| I1 | ni la feature ni le module n'appellent un modèle ou le réseau | `rg "fetch\(|EventSource|/kv/" src/brain/dossier/ src/features/dossier-controles/` → 0 |
| I2 | aucune route worker ajoutée ni visée | `worker/index.ts` n'expose que `/kv/:key` ; le diff ne le touche pas |
| I3 | `controlerDossier` est synchrone et pure | pas d'`async`, pas de `Promise<` ; deux appels sur le même dossier gelé rendent des rapports profondément égaux |
| I4 | le glyphe n'a qu'un porteur dans `src/` | garde-grep n° 1 d'`amorce.test.ts` ; `controles.ts` **et** `controles.test.ts` importent la constante, y compris dans les messages et les assertions |
| I5 | la constante ne sort pas par le baril | garde-grep n° 2, inchangée |
| I6 | `jouable` n'a qu'une définition | `rg "jouable" src/` → une seule dérivation |
| I7 | les quatre `path` sont des clés de `DESTINATION_DES_CHAMPS` | test de `controles.test.ts` (P4) |
| I8 | aucune ligne neuve dans `DESTINATION_DES_CHAMPS` | `couverture.test.ts` vert sans modification |

**Ce sur quoi je ne bloque pas** : le double périmètre de features, la forme de l'onzième destination, le `maxHeight` d'`IssueList`, le calque local contre primitive partagée. Aucune découpe demandée — la démo ne survit pas à l'ablation de l'écran.
