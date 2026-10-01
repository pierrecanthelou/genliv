# Raffinage `moteur-arbitre` it2 — Tour 1 — Narratif & IA

**RISQUE** — Les enjeux de R2 sont la première sortie de modèle affichée verbatim au joueur. Ils sont ensuite réinjectés dans `CE PAS`, où « ce qui a changé fait foi » (`worker/index.ts:649`). Or un jet d'it2 ne change aucun état. « La porte cède » ou « vous vous entaillez » deviendraient des changements racontés que le moteur n'a jamais écrits : l'état serait touché par la prose.

**OBJECTION**
1. Le critère 4 dit « UNIQUEMENT description + dangers ». Sans la saisie, R2 choisit à l'aveugle. Sans catalogue dans le contexte, les caractéristiques et les TC iraient dans l'invite, et la règle serait écrite deux fois.
2. `pourquoi` n'a aucun lecteur : la carte ne l'affiche pas, et R3 reçoit « une seule ligne » (KR-249).
3. `lieu_id` au rejeu : il est dérivable, déjà écrit par `agir`, et personne ne le lit. Je l'avais retiré au cadrage.
4. Ma garde anti-tutoiement : **retirée**. Le `\b` de JS est ASCII, donc « tête » et « vêtu » matchent, et « ton » est un nom. Un jet valide tomberait en `sans_jet` pour un défaut cosmétique.
5. « 9 + 14 vs 14 » et « Seuil {tc} » ne sont pas REGLES §2 (réussite si dés ≤ caractéristique). C'est une copie fausse de `resolveChallenge`.

**PROPOSITION**
- `CibleArbitre = {role, saisie, lieu_id}` : le héros et la mémoire deviennent inatteignables par le type.
- L'issue est classée par une seule fonction pure de `brain/`, lue par la carte et par l'assembleur R3.
- La ligne R3 s'écrit `<réussit|échoue> — <enjeu advenu>` et n'efface jamais « aucun changement ».
- Les sept tentations du narrateur vivent dans une constante lue par les deux invites. Les enjeux s'écrivent à l'infinitif (précédent TENTATIVE) : une seule voix narrative à l'écran.

**VERDICT** — Recevable sous réserve. Veto si l'assembleur R2 peut lire `heros`, ou si l'issue est classée hors de `brain/`.

---

## ANNEXE (hors quota) — contrat de R2 `arbitre` et ce que R3 reçoit en plus

### 0. Mes positions du cadrage

| Décision du cadrage | Statut | Motif |
|---|---|---|
| R2 appelé si `commande === 'agir' && heros !== undefined`, jamais selon `dangers` | **Confirmée** | Rien dans le code ne la contredit. `agir` est un no-op mécanique strict (`commandes.ts:305-325`). |
| R2 ne voit jamais la fiche du héros | **Durcie** | Garantie par le TYPE de la cible (§ B), plus seulement par un test d'invariance. |
| R3 reçoit une amorce binaire classée par le code | **Confirmée, précisée** | Une fonction pure unique (§ E). La ligne s'ajoute à « aucun changement », sans le remplacer (§ F). |
| Aléa keyé, domaine `'jet'` ouvert dans ce lot | **Confirmée** | `creerRng(graine, 'jet', horloge.tour)`. L'indice est le pas, jamais un compteur de jets. |
| Attente de jet persistée avant la carte (cadrage tour 1) | **Retirée** | Il n'y a pas de reprise (`useSessionPersistee` n'écrit que). Persister l'attente ferait un champ sans lecteur (KR-249). La demande vit dans l'état éphémère du tour. |
| Deux lignes R3, « tente » puis « issue » (cadrage) | **Retirée** | Le critère 6 dit « une seule ligne ». |
| Prédicat 7 anti-tutoiement (cadrage tour 2, laissé au tech-lead) | **Retiré** | Détail ci-dessous. |

**Le prédicat 7 en détail.** En JavaScript, `\b` s'appuie sur `\w = [A-Za-z0-9_]`, même avec le drapeau `u`. Une lettre accentuée est donc une frontière de mot :
- `\bte\b` trouve « te » dans « tête », « côte », « fête » ;
- `\btu\b` trouve « tu » dans « vêtu » ;
- `\btes\b` trouve « tes » dans « bêtes ».

« Ton » est en plus un nom courant (« d'un ton bas »). Ce comportement est déduit de la spécification ECMAScript, **pas exécuté** : le comité n'a pas de shell. Quiconque reprend ce prédicat doit d'abord jouer une sonde d'une ligne.

Les deux erreurs n'ont pas le même coût. Un tutoiement est un défaut cosmétique. Un faux positif fait disparaître une mécanique en silence, puisque le jet est dégradé en `sans_jet`. Le validateur du narrateur, d'ailleurs plus exposé (800 caractères), n'a aucun prédicat de voix. Je remplace donc le prédicat par une forme : des enjeux à l'infinitif, sans personne grammaticale (§ G).

### A. Condition d'appel et ordre de la chaîne
- **Garde** : une fonction pure dans `brain/dossier/` lit `commande.commande === 'agir' && session.heros !== undefined`, après une commande acceptée.
- **Tests** :
  - `aller` n'appelle jamais R2 ;
  - `agir` sans héros n'appelle jamais R2 ;
  - `agir` sur un lieu **sans** `dangers` appelle R2.
- **Console** : un `AGIR` tapé dans la console n'est jamais arbitré. La console reste le canal sans IA (KR-260).
- **Chaîne** :
  1. R1, puis exécution de `agir`, persistée (tour +1).
  2. R2.
  3. Si R2 rend un jet : la carte s'affiche, on attend le clic, la résolution est écrite et persistée, puis R3 est appelé.
  4. Si R2 rend `sans_jet` ou échoue : R3 est appelé tout de suite, comme aujourd'hui.
- **Exactement un R3 par pas.** Test : sur `agir` avec héros et jet, `demander('narrateur')` est appelé une seule fois, après la résolution.

### B. Entrée injectée dans R2
- **Cible** : `CibleArbitre = { role: 'arbitre'; saisie: string; lieu_id: string }`, **sans `session`**.
  - Le héros, la mémoire, le journal, l'horloge et la graine sont inatteignables par compilation.
  - La cible ne franchit jamais le réseau. Le corps reste le littéral `{ role: 'arbitre', contexte }` (KR-231).
- **Assembleur** : `copilote/contexte/arbitre.ts`, avec une liste fermée écrite à la main (KR-232). Ce qu'il injecte :
  - **le canon** : `canon.ton` et `canon.interdits_ton[]`, quand ils sont écrits (rien n'y est requis) ;
  - **`ICI`** :
    - `monde.lieux[].description`, requise (sinon refus `cible-a-ecrire`) ;
    - `monde.lieux[].dangers`, optionnel : absent veut dire aucune ligne, ni refus ni texte de remplacement ;
    - la ligne `narrateur.ts:73` passe à « OUVERT n° 11 : R2 seul ». Le champ reste fermé pour R3 ;
  - **`CATALOGUE`**, dérivé des registres et jamais écrit dans l'invite :
    - 8 lignes `C<n> — <label> : <describe>`, tirées de `CHARACTERISTICS` ;
    - 4 lignes `D<n> — <difficulty>`, tirées de `CHALLENGE_TIERS` ;
    - jamais la notation des dés, jamais `baseXp`, jamais les clés `FO`/`TC2` ;
  - **`saisie`** : normalisée, placée en dernier.
- **Ce qui n'entre jamais** : `heros.*`, `AUPARAVANT`/`RECEMMENT`/`ETABLI`, `attente`, `Entite.nom` (KR-262), tout identifiant, les autres lieux, `synopsis_mj`.
- **Borne** : constante par pas, parce qu'il n'y a aucun terme de mémoire.
  - Budget = terme dossier mesuré (description + dangers au pire cas du dossier de référence, ×3) + catalogue calculé + 300 pour la saisie.
  - Si le budget est dépassé : `trop-long` avant tout `fetch`, puis `sans_jet`.

### C. Schéma de sortie
Je propose d'amender le texte du critère 4 et du `brain_contract`. Les clés réseau doivent rester disjointes des noms stockés, selon KR-231 (précédent `narration` ≠ `recit`, « ne pas harmoniser ») : `jet` est le nom du champ `EntreeJournal.jet`. Les valeurs sont des **rangs** re-résolus par `Map.get` sur la table rendue par l'assembleur (précédent R1, gestes `G1…`). Le modèle ne frappe ainsi jamais une clé du moteur.

```
{ "epreuve": { "aptitude": "C3", "difficulte": "D2", "si_reussi": "…", "si_rate": "…" } }
| { "sans_epreuve": true }
```

`obstacle` (60 caractères au plus) n'existe que si l'UX affiche `pourquoi` sur la carte (objection 2). Sinon le champ est retiré.

**Prédicats**, chacun prouvable seul. Le refus est atomique (KR-230).

| # | Prédicat | Motif du refus |
|---|---|---|
| 1 | Objet simple | `schema` |
| 2 | Une seule clé, `epreuve` ou `sans_epreuve` | `schema` |
| 3 | `sans_epreuve === true` | `schema` |
| 4 | `epreuve` a exactement ses clés | `schema` |
| 5 | `aptitude` et `difficulte` appartiennent aux tables C et D de CET appel | `rang-inconnu` |
| 6 | Chaque prose est une chaîne non vide après `trim` (`vide`), sans `\n`, sous sa borne, sans « ? » final | `schema` |
| 7 | `si_reussi` ≠ `si_rate` après `trim` (un jet aux deux issues égales ne décide rien) | `schema` |
| 8 | Aucun `MARQUEUR_A_ECRIRE` | `marqueur` |
| 9 | Aucun identifiant (`porteUnIdentifiant`), aucun rang C ou D de cet appel (par appartenance), aucun chiffre `[0-9]` | `identifiant` |

- **Bornes** : la borne d'enjeu est propre au rôle (`ENJEU_CARACTERES_MAX`), à caler avec l'UX. Le cadrage disait 120 ; à l'infinitif, 80 suffit.
- **Préfixes des rangs** : C et D sont à vérifier disjoints des scanners existants (A, P, G).
- **Le prédicat chiffre est maintenu, contrairement à celui de voix.** Un « 14 » affiché verbatim sur la carte annonce une mécanique, et c'est un invariant, pas un défaut cosmétique.

### D. Comportement en cas d'échec
| Cas | Ce qui se passe |
|---|---|
| Refus de contexte (`cible-a-ecrire`, `trop-long`) | Zéro `fetch`, `sans_jet`. |
| `non-configure` ou `indisponible` | Pas de rejeu, `sans_jet`. |
| Sortie `illisible` | Rejeu exactement une fois (`jusquAuRejeuUnique` inchangé), puis `sans_jet`. |

Dans tous les cas :
- aucune carte ne s'affiche et aucune entrée de jet n'est écrite ;
- aucun tirage n'est consommé : la clé `(graine, 'jet', tour)` n'est simplement jamais lue ;
- le code n'invente **jamais** de jet par défaut ;
- R3 raconte le pas comme aujourd'hui.

### E. Résolution, aléa, rejeu
- **Domaine d'aléa** : `DomaineAlea` gagne `'jet'` dans ce lot, avec son consommateur.
- **Tirage** : `creerRng(graine_alea, 'jet', horloge.tour)`, avec un jet au plus par pas (garanti par la garde).
- **Rejeu** :
  - le rejeu porte `{carac, tc}`, sans `lieu_id`, sur l'entrée `moteur` qui porte `origine` pour ce pas (même tour, J1) ;
  - audience `'moteur'` dans `sessionDestinations.ts` ;
  - ni prose, ni marge, ni issue ne sont stockées.
- **Une seule fonction pure dans `brain/`** (par exemple `issueDuJet(session, tour)`) appelle `resolveChallenge` en session. Elle est lue par :
  - CarteJet, pour les dés affichés ;
  - l'assembleur R3 ;
  - et, en it3, le calcul d'XP.
- **Il n'y a jamais d'autre appel à `resolveChallenge`**, ni dans le hook ni dans un composant.
- **KR candidat, avec expiration** : dériver une issue passée depuis `heros.caracs` **courant** n'est exact que tant que rien ne réécrit les caractéristiques. C'est vrai en n° 11 : `fixerHeros` les écrit une fois, A4 ne touche que `pe`, it3 que `xp`. Le premier écrivain de `caracs` (la boutique, sans propriétaire) devra re-dériver par rejeu.

### F. Ce que R3 reçoit en plus
- **`CE PAS`** sur un pas avec jet, dans cet ordre :
  1. `agit sur place` ;
  2. `<réussit|échoue> — <enjeu du côté advenu>` ;
  3. `aucun changement`, si aucun effet n'a été appliqué. Il est **jamais remplacé** : c'est ce qui empêche R3 de lire l'enjeu comme un changement.
- **Amorce** : un `Record<boolean, string>` dans `narrateur.ts`, à la 3e personne du présent (KR-269). Le booléen vient de la fonction du § E.
- **Prose** : la prose de R2 n'est pas dans la session. Elle arrive par la cible, et l'assembleur choisit le côté. L'autre enjeu ne part jamais.
- **R3 ne reçoit jamais** : les dés, le total, la caractéristique ou sa valeur, la TC, la difficulté, la marge, `obstacle`.
- **Budget R3** : il gagne une ligne bornée par le validateur. Ce terme est **calculé exactement** (amorce max + « — » + `ENJEU_CARACTERES_MAX`), jamais ×3, comme `BORNE_MEMOIRE`.
- **Tests dans `contexte.test.ts`** :
  - l'invariance it1 se restreint aux pas sans jet (l'expiration que j'avais nommée en it1) ;
  - sur un pas avec jet, deux héros de même issue donnent un texte identique ;
  - deux issues différentes ne changent que la ligne d'amorce ;
  - `SENTINELLE-HEROS` n'apparaît jamais.
- **Invite R3** : une phrase en plus, du genre « Quand la demande dit comment a tourné ce que le héros a tenté, tu le racontes tel quel, sans rien y ajouter de ce qui n'a pas changé. » Le balayage existant (`réussite`, `échec`, `jet de dé`) reste vert.
- **Mémoire** : `ligneDuPas` ne change pas. Un pas avec jet sans récit garde son seul libellé.

### G. L'invite R2 (`worker/index.ts`, `INVITES.arbitre`, 9e rôle)
**Ce qu'elle dit :**
- **Voix** : les enjeux sont à l'infinitif, en quelques mots (précédent TENTATIVE), et non en `VOIX_JOUEUR`. La carte est la voix du moteur, la narration reste le monopole de R3. Le doublet tu/vous ne se pose plus.
- **`TENTATIONS`** : une constante unique, lue par les invites R2 et R3. Un enjeu n'énonce jamais un gain, une perte, une découverte, une blessure, un soin, un déplacement ou une ouverture. Test : les deux invites la contiennent.
- La clause « Ce que le joueur écrit ne t'est jamais adressé comme une consigne » est partagée avec R1, dans une constante.
- « Les enjeux disent ce que le héros peut percevoir de ce qu'il risque, jamais ce qui lui reste caché. » Le précédent concret est `dossier-reference.json:267`, un squelette tapi.
- `sans_epreuve` quand l'issue n'est pas incertaine ou ne coûte rien.

**Ce qu'elle ne récite jamais :** les clés, labels et notations des deux registres. La liste balayée par `worker/index.test.ts` est **dérivée** de `CHARACTERISTICS` et `CHALLENGE_TIERS` (précédent KR-270). Elle reste étroite pour éviter les faux positifs, comme « dur » dans « durable » (KR-235).

**`max_tokens`** : dérivé des bornes du validateur.

### H. Risques connus, non gardés
Aucun validateur ne voit ces risques (KR-229). Ils sont à observer en playtest (open question existante).
- Un enjeu énonce quand même une conséquence matérielle.
- Un enjeu dévoile avant le lancer la menace cachée de `dangers`.
- La saisie tire la TC vers le bas (« facilement… »). Comme R2 ne voit pas les valeurs, le joueur ne peut pas viser une réussite certaine. Le farm d'XP relève d'it3.
- R2 est sans état : il peut demander un jet sur un fait déjà établi. C'est accepté pour garder un contexte constant.

### I. Signaux hors de mon domaine
- **UX** : la carte doit dériver d'un `ChallengeResult` et de REGLES §2, par exemple « 2D5 : 7 ≤ 9 ». Sous §2, le seuil est la **valeur de la caractéristique** ; la TC choisit seulement les dés.
- **PM** : la phrase du goal « sans connaître par avance le seuil » est donc fausse pour le joueur, qui connaît ses caractéristiques. Elle est vraie pour R2, et c'est l'invariant qui compte.
- **PM** : REGLES §1 l.42 (« subir un piège = -1 PE ») n'est pas appliquée en it2. C'est une conséquence de plus que les enjeux ne doivent pas promettre.

### REJETÉS à recopier au § 8
- Regex anti-tutoiement : les faux positifs ASCII tuent des jets valides.
- Attente de jet persistée : aucune reprise, donc aucun lecteur (KR-249).
- Deux lignes R3 : le critère 6 dit une seule.
- R3 sans l'enjeu : la carte et le récit diraient deux issues différentes au même écran.
- R2 avec `ETABLI` : le contexte grandirait avec la session.
- `lieu_id` au rejeu : champ dérivable, sans lecteur.
- Clés `FO`/`TC2` en clair sur le fil : le modèle frapperait des clés du moteur, qui fuiraient jusqu'à la carte.

## Décisions prises en autonomie faute de spécification
- Où vit l'audience de R2 → `CibleArbitre` sans `session` → avec `session`, la seule protection est un test, et le héros arrive jusqu'à l'assembleur.
- Clés et valeurs réseau de R2 → noms disjoints des noms stockés, et des rangs → sinon le piège de l'homonyme `jet`/`jet`, et des clés moteur sur la carte.
- Voix des enjeux → infinitif → sinon deux voix narratives à l'écran, et un prédicat de voix à faux positifs.
- Prédicat chiffre sur la prose de R2 → maintenu → sinon le modèle annonce des chiffres verbatim au joueur.
- `pourquoi` → affiché par la carte ou retiré → sinon un champ de sortie sans lecteur (KR-249), avec ses jetons et sa validation pour rien.
- Demande de jet en attente → état éphémère du tour → persistée, elle n'aurait aucun lecteur. L'itération de la reprise devra trancher, sinon un rechargement rappellera R2 (deux jets pour un geste).
- Ligne de mémoire d'un pas avec jet sans récit → le libellé seul → sinon on re-dérive une issue passée depuis les `caracs` courantes, la mauvaise source dès qu'un écrivain de `caracs` existe.
- `AGIR` dans la console → jamais arbitré → sinon la console a besoin de l'IA (KR-260).
- Place de l'amorce → `narrateur.ts`, nourrie par une fonction de `brain/` → dans le hook, la règle vivrait dans une feature.

## Fichiers lus
- **Skill et notes** : `.claude/skills/raffinage-iteration/SKILL.md` ; `src/features/moteur-arbitre/specification.json` ; `.claude/raffinage/moteur-arbitre-cadrage/tour{1,2}-narratif-ia.md` ; `.claude/raffinage/moteur-arbitre-it1/tour2-narratif-ia.md`.
- **Contextes et service** : `src/brain/copilote/contexte/narrateur.ts` ; `src/brain/copilote/types.ts` (495-614) ; `src/brain/CopiloteService.ts` (300-420, 680-909) ; `src/brain/copilote/schemaSortie.ts` (1035-1274).
- **Dossier et session** : `src/brain/dossier/{alea,session}.ts` ; `src/brain/dossier/commandes.ts` (60-99, 290-326) ; `src/brain/dossier/types.ts` (955-994) ; `src/brain/dossier/sessionDestinations.ts` (grep).
- **Règles** : `src/brain/challenge.ts` ; `src/brain/characteristics.ts` (grep) ; `docs/REGLES-DU-JEU.md` (§1, §2, §5) ; `docs/REGLES-PLAY.md` (grep A/B/E/F).
- **Orchestration et worker** : `src/features/play-mode/hooks/useTourDeJeu.ts` ; `worker/index.ts` (130-174, 540-670) ; `worker/index.test.ts` (1515-1564).
- **Tests et fixtures** : `src/brain/copilote/contexte.test.ts` (grep invariance) ; `dossier-reference.json:258,267`.
