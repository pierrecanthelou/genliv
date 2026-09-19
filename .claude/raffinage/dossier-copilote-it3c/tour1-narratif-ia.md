# Tour 1 — `narratif-ia` · `dossier-copilote` it3c

**RISQUE** — Premier rôle où le modèle **désigne** quelqu'un dont il **ignore le nom** **et écrit une prose SUR cette personne**. Risque propre à la combinaison : **que la prose NOMME** — « son frère Corvin ». **Un nom inventé est invisible à `porteUnIdentifiant`** (le scanner cherche des *identifiants*, pas des noms), il entre dans un champ `ia` que la n° 12 donnera au rôle acteur, et **il contredira le `nom` que l'auteur a écrit**. Les trois rôles précédents produisaient de la prose **sur soi** ; celle-ci a un **tiers** pour sujet — le nommage est maximalement tentant.

**OBJECTION** *(lue dans le code, pas supposée)* — **`CHAMPS_INJECTES` est une liste PLATE par rôle**, et les assembleurs bouclent sur `chemin.startsWith(PREFIXE_PERSONNAGE)` (`detenteurs.ts:111`, `plan.ts:99`). Chez `indice-detenteurs`, cible et candidats se distinguent par le **préfixe** (`monde.indices[]` vs `monde.personnages[]`). **Ici les deux sont des personnages** : une seule liste plate donne aux **huit** candidats **exactement les lignes du porteur** — le `but.pourquoi` de huit inconnus pour écrire un lien. **Contexte sans borne discriminante, et aucun test actuel ne rougirait.** Il faut **deux ensembles** (porteur ⊃ candidats), la liste blanche restant leur **union** — c'est elle seule que voit le confinement KR-232.

**PROPOSITION**
1. **Sortie scalaire ET paire**, `{"envers":"P2","nature":"…"}` : **une** relation par demande. Tranche « ce rôle fait LES DEUX » **sans constante** — « zéro » et « deux » non représentables (précédent 3b).
2. **Le champ cible ne s'injecte pas** : le test de rattachement 3b répond **seul** (interchangeable ⇒ précédent 3a). Et le seul service qu'aurait rendu l'injection — ne pas re-proposer une cible déjà liée — est un **filtre déterministe**, patron `detientDeja`. **Conséquence : la moitié manquante de `cible_id` NE SE POSE PAS en 3c.**
3. Donc **`secret` n'a toujours aucun site** : 3c ne l'exerce pas. Mais **sa justification est devenue fausse** (« aucun assembleur n'existe encore ») ; **amender LA PHRASE, aux deux sites, jamais le prédicat**.
4. **`intensite` : MESURÉ** — `useEcritureRelationsPresence.ts:13-16` pose **déjà `intensite: 0`** au geste d'ajout manuel. Le copilote n'invente rien et passe par **le même chemin d'écriture** ; **KR-221 est sans objet** (ce n'est pas un semis, c'est le défaut existant). Elle reste **hors** de la proposition.
5. **Le porteur est EXCLU de la table des rangs** : sans nom injecté, sa fiche et son bloc `Pn` seraient **deux blocs que le modèle croirait être deux personnes**. **KR-194 intact** — l'auto-référence reste écrivable à la main, et `FICHE ∉ rangs` la rend **refusable en sortie**.
6. Cinquième cible = **l'union étiquetée** promise par 3b : un dispatch structurel raté, **c'est une sortie validée par le mauvais schéma**.

**VERDICT — ACCEPTÉ SOUS CONDITIONS** (1) à (6), plus le contrat en annexe.

---

# ANNEXE (hors quota)

## 0. Rôle, route, cible
Rôle **`personnage-relations`** (sans accent, classe `[a-z-]+`). Cible : **union étiquetée** pour les cinq rôles, dans le lot contrat. **Un troisième synonyme (`porteurId`) n'est pas à fabriquer.** Corps réseau `{ role, contexte }` — **sans `champ`, sans le moindre entier**.

## 1. Entrée injectée — DEUX ENSEMBLES, UNE UNION

**Liste blanche (l'UNION, 8 chemins)**, tous `'ia'` :
```
canon.ton · canon.interdits_ton[] · canon.partage.accroche_joueur
monde.personnages[].fonction · .description_joueur · .but.libelle · .but.pourquoi
monde.personnages[].plan_actions[].action
```
**Sous-ensemble candidat (`CHEMINS_CANDIDAT`, nommé dans `contexte/relations.ts`) = 4 chemins** : `fonction`, `description_joueur`, `but.libelle`, `plan_actions[].action`. Mécanisme de `CHEMIN_VERITE_CIBLE`/`CHEMIN_BUT_CIBLE` : un test asserte **l'inclusion** dans la liste blanche, **plus un canari** assertant que `but.pourquoi` en est **absent** (sinon quelqu'un « harmonisera » les deux listes).

**Troncature** : `plan_actions[].action` réduit à son **premier** élément **chez les candidats seulement** (patron détenteurs) ; **non tronqué chez le porteur**. **Aucune chaîne n'est jamais coupée.**

**Retraits motivés** : `synopsis_mj` (**point de vue**, précédent 3b — pas le motif de ton de 3a) · `apparence` · `caractere.parler[]` · **`caractere.jamais`** (⚠ **motif NEUF** : `jamais` borne un **comportement**, or un lien est **éprouvé, pas agi** — l'injecter invite à écrire le lien comme une action que le personnage refuserait) · `cede_si` · `curseurs.*` · **`but.pourquoi` chez les CANDIDATS** (gardé chez le porteur — *le pourquoi privé de huit inconnus pour une valeur discriminante quasi nulle : **c'est cette ligne qui justifie la scission porteur/candidats***) · `relations[]` (§ 2) · `presence[]`, `savoirs[]`, `stats`, `camp`, `portee`, `nom`.

**Mise en page** : le porteur porte un en-tête littéral **`FICHE`**, les candidats `P1`…`PN`. ⚠ **JAMAIS `PERSONNAGE`** : un en-tête commençant par `P` **entre en collision avec l'alphabet des rangs** et produirait `{"envers":"PERSONNAGE"}` ⇒ `rang-inconnu` ⇒ rejeu ⇒ terminal.

## 2. Pourquoi `relations[]` n'entre pas — et pourquoi `secret` n'a donc pas de site
Le test de rattachement 3b **tranche seul** : une relation 2 ne présuppose pas la relation 1. **Interchangeable ⇒ pas d'injection.** Il tranche seul **parce que le seul service que l'injection aurait rendu est remplaçable par du code** (filtre `detientDeja`) — *une règle déterministe est moins chère et plus fiable qu'un prompt*. Second motif : injecter `lien` **sans** l'appellation donnerait « son créancier » sans dire de qui — **non seulement inutile mais ACTIF** : le modèle le rattacherait à l'un des `Pn` affichés.

**Conséquence pour `secret`** : le prédicat porte sur l'entrée d'une **ligne de `relations[]`** ; 3c n'en injecte **aucune**. **Le prédicat n'est PAS amendé.** **Mais sa justification l'est** — 5ᵉ instance de l'instrument « présent aux deux sites » (`types.ts` JSDoc **et** `destinations.ts`) : « ZÉRO mécanisme de code en itération 5 : **aucun assembleur n'existe encore à exercer** » est **factuellement FAUSSE** — cinq assembleurs existent. **Laisser une justification fausse dans le schéma, c'est garantir qu'un ouvrier conclura « un assembleur existe, donc exerçons-le ».**

## 3. Sélection des candidats — déterministe, sans modèle
1. **Exclure le porteur** (§ propos. 5). 2. **Exclure toute cible déjà liée** (`textesDuChemin`, total, KR-116 ; patron `detientDeja`, pas un `some` maison). 3. Ordre : `portee === 'premier'` d'abord, puis l'ordre du document — **`portee` sélectionne, jamais injectée**. 4. Tronquer à `CANDIDATS_MAX` (8). 5. **Un candidat dont les quatre chemins sont vides ne consomme pas de rang** — un bloc vide *enseignerait* « celui-là n'a rien », ce qui est une **affirmation** ; le repli est le silence. 6. `P1`,`P2`,… **aucune conversion numérique**, `Map.get` sur la chaîne.

**Symétrie à écrire une fois** : « pas une ligne, pas de jeu » sert **deux fois** — chez un **candidat** elle coûte son rang, chez le **porteur** elle est le refus `cible-a-ecrire`.

## 4. Refus de contexte — ordre figé, tous AVANT le `fetch`
`a-ecrire` (`canon.ton`) → **`cible-a-ecrire`** (**disjonction**, patron répliques et **non** un chemin nommé : *un lien peut naître d'une fonction, d'une réputation OU d'un but*) → **`aucun-candidat`** (table vide — **motif atteignable ici, et il faut qu'il le soit** : l'écran manuel affiche déjà `TEXTE_AUCUN_AUTRE_PERSONNAGE`) → `trop-long` (**refus, jamais coupure**, KR-230).
**Premier rôle à utiliser les QUATRE motifs. Aucun motif neuf.**

## 5. L'invite — les six décisions d'écriture

⚠ **LE PIÈGE DE RECOPIE, identifié nommément : c'est `indice-detenteurs`** (l'autre rôle à rangs, donc le jumeau structurel apparent). Sa ligne **« Tu ne rédiges rien d'autre : ni nom, ni phrase, ni justification »** recopiée ici **TUE LE SEUL CHAMP `ia`** : `nature` manquant ⇒ `schema` ⇒ rejeu ⇒ terminal. **Un rôle qui ne peut JAMAIS réussir, et rien ne rougirait au dépôt** — les tests de forme passeraient, **seule la production le dirait**. Sa jumelle « une liste vide est une réponse juste » produirait le même néant par l'autre bout.
**Runner-up, plus subtil** : le JSDoc de `lien` dit « même famille que `plan_actions[].action` », ce qui invite à recopier **« une INTENTION »** (3b) ⇒ « il ira lui réclamer son dû » : **une action datable qui cesse d'être vraie une fois faite**, gelée dans un champ que le moteur traite comme un **fait permanent**. **Même famille ≠ même chose : une intention se FAIT, un lien s'ÉPROUVE.** D'où « DIDASCALIE » sans le mot « intention ».

Autres décisions : « **jamais ce que celui-là éprouve en retour** » (un fait du PORTEUR, jamais de la PAIRE — aucun validateur ne peut le constater, KR-229) · « **Tu ne nommes personne** » (parade **persuasive seulement** au risque n° 1) · **la ligne du degré interdit le CHIFFRE et l'ÉCHELLE, pas la charge émotionnelle** (le JSDoc dit que `lien` « REMPLACE le chiffre côté prose » — une interdiction mal écrite (« reste neutre ») **viderait le champ de ce pour quoi il existe**) · « **UNE, et toujours une** », **sans citer aucune constante** — et elle règle la tension désignation/rédaction : « personne » n'est **pas** une réponse de ce rôle, **c'est le CONTEXTE qui décide s'il y a quelqu'un** (refus `aucun-candidat`) · « **une phrase** », aligné sur la mesure de `max_tokens`.

**Interdit de réciter** : `INTENSITE_MIN`/`MAX` et leurs chiffres · le nom `intensite`, toute paraphrase de degré · l'existence de `secret`, `cible_id`, `relations` · **le nom du champ `lien`** · ⚠ **le seuil `intensite >= 1` du transfert d'indice hors caméra** — *un modèle qui le connaît écrirait des liens POUR OUVRIR CE CANAL* · la table d'audience · `CANDIDATS_MAX` · seuils, tiers · le mot « tour ».

## 6. Forme de sortie
Gabarit apparié, écrit **deux fois à l'identique** : `'personnage-relations': '{"envers": "P2", "nature": "…"}',`
**Choix des clés — la clé nomme la FORME, jamais le CHAMP** (veto 3b) : **`nature`** et non `lien` (le schéma glose lui-même « la NATURE du lien » ; précédent `intention`→`action`) · **`envers`** et non `cible` (⚠ `cible`/`cibleId` sont **à deux lettres l'un de l'autre** — la confusion `textes`/`texte` que KR-231 a fermée) · **`P2`** dans l'exemple, **n'ancre pas sur le premier rang**.

```ts
export interface RelationRendue { envers: RangInjecte; nature: string }   // PREMIÈRE forme réseau à DEUX clés
export interface PropositionRelation { porteurId: string; cibleId: string; lien: string }   // zéro clé commune
```
**`intensite` n'est PAS là**, ni `secret`. **MESURÉ** : `useEcritureRelationsPresence.ts:13-16` + `seedRelation` (l. 44) écrivent **déjà** `{ cible_id:'', lien:'', intensite: 0, secret: false }`. **Le copilote n'invente aucune valeur : il emprunte la ligne d'écriture qui existe.** KR-221 sans objet — il interdit de **semer un OPTIONNEL** ; `intensite` est **requis**, `0` est le **point neutre** et non le plancher (`INTENSITE_MIN = -3`), et il n'y a **qu'un** champ, pas six curseurs formant un bloc. **Exigence** : l'acceptation emprunte le **même** chemin d'écriture que le bouton manuel — **deux chemins divergeraient au premier réglage ajouté**.

## 7. `validerRelation(brut, rangsConnus, dossier)` — HUIT prédicats
Premier validateur à **croiser les deux familles**. `MotifIllisible` **inchangée** ; `'rang-inconnu'` gagne son **second** utilisateur.

(1) objet simple `schema` · (2) clés **exactement** `['envers','nature']` `schema` · (3) `envers` chaîne `schema` · (4) `nature` chaîne — **un tableau meurt ici, jamais `[0]`, jamais `String(…)`** (KR-230) `schema` · (5) `nature.trim()` non vide `vide` · (6) `MARQUEUR_A_ECRIRE` **importé** `marqueur` · (7) `porteUnIdentifiant(nature, dossier)` `identifiant` · (8) `rangsConnus.has(envers)` — `Set.has`, **aucune conversion** `rang-inconnu`.

⚠ **`envers` n'est PAS passé au scanner d'identifiants** : l'appartenance constatée, **c'est l'une de nos propres chaînes**. L'y passer serait **du code mort présenté comme de la couverture** (BUG-084, KR-235). *Écrit pour que personne ne « symétrise ».*
**Aucune constante de borne** — la sortie est scalaire. ⚠ **Ne pas ajouter `RELATIONS_PROPOSEES_MAX` « par symétrie »**, et **le garde « la borne de l'invite est celle du validateur » NE S'APPLIQUE PAS à ce rôle** : son symétrique s'y écrit (l'invite n'annonce aucune borne).
**Refus du lot entier** : accepter `envers` et jeter `nature` ferait ratifier une relation **à moitié inventée par le code**.

**Deux critères qui SÉPARENT vraiment** (leçon BUG-113) : *`{"envers":"FICHE",…}` sur `{P1,P2}` ⇒ motif `rang-inconnu` et **non** `schema`* — cet état distingue « l'appartenance est constatée » de « seule la forme est vérifiée », ce qu'une sortie bien formée **ne distingue pas**. Et *`{"envers":"P1","nature":"   "}` ⇒ `vide` et non `schema`*.

## 8. `max_tokens: 300` — dérivé
**P = 110** (mesuré, deux sources : `dossier-reference.json:140` = 110 ; `dossier-minimal.json:112` = 109). Enveloppe **28** + pire rang `P10` **3** = **31**. `L = 141`. `r=3 ⇒ 200` ; **`r=2` (pire) ⇒ 211,5 ⇒ 300**.
⚠ **Le résultat dépend du ratio (200 contre 300) : on prend le pire ET ON LE DIT.** Jamais recopié — **surtout pas de `personnage-plan` (200)**, dont la valeur vient d'une mesure sans rapport.
**Mode d'échec nommé** : une `nature` très longue tronque le JSON ⇒ `schema` ⇒ rejeu ⇒ terminal. **C'est le bon échec.**

## 9. Échec — et deux modes NON gardés, nommés
Rejeu **une fois** puis terminal ; **la sortie fautive n'est jamais montrée** (*l'afficher serait montrer ce que le validateur vient de refuser*). À l'écriture, la cible disparue ⇒ `validateDossier` **expose** la référence pendante (KR-021), **aucun filtre silencieux**. **Mémoire : aucune** — deux demandes ⇒ deux corps **identiques par égalité stricte** ; la table de rangs vit le temps d'un appel, **jamais persistée**.
**NON GARDÉS** : (a) un **nom propre inventé** dans `nature` — aucun instrument ; parade = ligne d'invite + relecture. (b) une `nature` qui **double en prose** un lien vers une autre cible — hors périmètre, **et l'écran ne doit donc rien promettre de tel**.

## 10. Budget — protocole, NON mesuré
`CANDIDATS_MAX` **saturé**, **asserter d'abord que les huit chemins résolvent non vides** (sinon **plancher**), puis `ceil(M×3/1000)×1000`. **Si la mesure déplaît, on baisse `CANDIDATS_MAX` — on ne monte jamais le budget.**
⚠ **Attendu à VÉRIFIER, pas à supposer** : ce rôle est le **second plus large**. **Si le budget dépasse ~17 000, `TAILLE_MAX_CORPS_IA` (52 224) se déplace POUR LA PREMIÈRE FOIS** et doit être re-dérivé sur les **cinq** rôles — **ce n'est pas un cliquet**. Et le canari « deux rôles étroits aux budgets différents », ré-armé à 3b, doit être **re-vérifié non inerte** après l'arrivée d'une cinquième entrée.

## 11. REJETÉS — pour le registre (BUG-082)
injecter `relations[]` · mettre le porteur dans les rangs · que le modèle rende `intensite` ou une paraphrase de degré (*un seuil de jeu en dépend*) · **dériver `secret` de la prose** (« et ne l'a jamais dit à personne » ⇒ `secret: true` — *le modèle poserait un drapeau moteur par la bande, et `secret` commande une audience*) · amender **le prédicat** de `secret` (seule sa **justification** est réécrite) · une **liste de N** relations (*rouvre « vide = succès ou refus ? » et fabrique le doublon intra-lot*) · clés `lien`/`cible` · en-tête `PERSONNAGE` · **un scanner de noms propres** (*faux positifs non bornés, et un scanner sur les `nom` du dossier n'attrape que la coïncidence, jamais le nom **inventé** qui est le vrai risque*) · recopier les lignes de détenteurs ou « une INTENTION » · `synopsis_mj` · `caractere.jamais` · `apparence`/`parler[]`/`cede_si`/`curseurs` · `but.pourquoi` chez les candidats · une constante de borne · **un troisième synonyme de cible**.

## 12. Ce que je n'ai PAS mesuré
**Aucun test exécuté** — aucune affirmation de couleur dans cette note ; les deux critères séparateurs du § 7 sont **proposés, pas observés**. · `M` et le budget : **non mesurés** ; « second rôle le plus large » est un **raisonnement**, pas un relevé. · `E` et le sort de `TAILLE_MAX_CORPS_IA` : **non mesurés**. · **`noyau.ts` non lu** — `textesRediges`/`textesDuChemin` connus par leurs **appels** ; que `textesRediges` suffise pour le sous-ensemble candidat est **présumé**. · La scission de `CopiloteService.ts` : **périmètre tech-lead**. · Les écrans : **non lus** — je ne demande que deux choses, le chemin d'écriture **existant** et `intensite` **visible à la ratification**.
