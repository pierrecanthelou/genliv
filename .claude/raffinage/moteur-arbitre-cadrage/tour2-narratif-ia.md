# Cadrage n°11 `moteur-arbitre` — Tour 2 — Narratif & IA

## RISQUE
Trois propositions du tour 1 déplacent la frontière :
- l'annexe du tech-lead (§ 1) fait lire `heros` par R2 « via le contexte injecté » ;
- son it2 pose une carte de jet qui ne résout rien ;
- ma propre garde lisait une prose d'auteur comme un interrupteur.

## OBJECTION
1. **Au tech-lead, sur `types.ts:985` : je confirme et je retire ma garde.** J'ai relu le fichier : « De la PROSE, jamais une règle […] Ce champ dit ce que le narrateur doit savoir du risque, il ne le déclenche pas. » Tester si le champ est rempli en fait un booléen. Et la présence ne veut pas dire danger : `dossier-reference.json:258` porte un `dangers` rempli qui dit « Rien n'y menace le corps ».
2. **Au tech-lead, annexe § 1 :** mon veto 2 est maintenu et durci. Aucun `heros.*` n'entre dans R1, R2 ou R3 en n°11.
3. **Au tech-lead, découpage it2/it3 :** si l'attente de jet est persistée sans lecteur, la partie se fige au rechargement. Si elle ne l'est pas, R2 est rappelé et un même geste produit deux jets. R2, `resolveChallenge` et R3 entrent donc ensemble (KR-249/263, comme le dit QA).

## PROPOSITION
- **R2 est déclenché par un identifiant clos.** Il est appelé seulement si `commande.commande === 'agir'` et que `heros` est présent. `aller` ne l'appelle jamais : un piège à l'arrivée est un `evenement`. `dangers` devient un contexte optionnel de R2 et reste fermé pour R3.
- **Caractéristiques : je concède.** On garde `charCreation.ts` et la répartition du bonus par le joueur : c'est un écran de jeu, pas une décision de l'arbitre. Une seule condition : `rollCreationPool(alea(graine,'heros',n))`, jamais le `Math.random` par défaut.
- **Découpage du PM :** IT1 le héros, sans aucune surface IA. IT2 le jet binaire raconté. IT3 la marge et l'XP, sur une même constante.

## VERDICT
Recevable. Je confirme le routage (2) du tech-lead avec une borne : `agir` seul, jamais « systématique ».

---

## Statut de mes objections du tour 1

| Objection du tour 1 | Statut | Motif |
|---|---|---|
| Veto 1 : R3 ne reçoit jamais `{issue, marge}` brut | **Maintenu** | La phrase IT2 du PM (« R3 narre issue + marge ») devient « narre l'issue ». La marge arrive en IT3, sous forme d'un mot choisi par le code. |
| Veto 2 : R2 ne voit jamais la fiche du héros | **Durci** | Étendu à R1, R3 et `heros.name`. Toutes les lignes `heros.*` de `sessionDestinations.ts` sont d'audience `moteur`. |
| Objection 3 : `{carac, tc}` est une entrée du rejeu | **Maintenue** | Même statut que la `Commande` produite par R1. Le tirage, la marge et l'issue se recalculent. |
| Déclenchement par la présence de `dangers` | **Retiré** | `types.ts:979-985` et la fixture de la ligne 258. |
| Caractéristiques tirées par le code, bonus reporté | **Retiré** | Concédé au PM, à l'UX et au tech-lead. Seule la condition d'aléa ci-dessus reste. |
| Découpage « jet binaire / la marge compte / au PM » | **Retiré comme numérotation** | Mon « it1 » supposait déjà un héros existant. Le contenu devient IT2/IT3 du PM. |
| L'attente pointe `lieu_id` | **Retiré** | Le jet appartient au pas, plus au lieu. Le stocker serait un champ dérivable (KR-013). |

---

## ANNEXE (hors quota) : amendements au contrat R2

**A'. Condition d'appel.** Fonction pure dans `brain/dossier` : `commande.commande === 'agir' && session.heros !== undefined`. Tests qui en découlent :
- `aller` n'appelle jamais R2 ;
- `agir` sur un lieu **sans** `dangers` appelle R2 quand même (inverse de mon test du tour 1) ;
- une session sans héros n'appelle jamais R2.

**A. Ce que reçoit R2.** Assembleur propre (`copilote/contexte/arbitre.ts`), liste fermée. **Je refuse « le contexte `'ia'` déjà injecté » du tech-lead** : le contexte du narrateur contient la mémoire, R2 doit rester sans mémoire.
- `lieux[].dangers` devient optionnel. Absent → aucune ligne, aucun refus, aucun texte de remplacement.
- `narrateur.ts:73` devient « OUVERT n° 11 : R2 seul (ICI, optionnel) ». R3 reste fermé à ce champ.
- Borne inchangée : aucun terme de mémoire, coût constant par pas. Un appel de plus par `agir`, aucun par `aller`.

**B. Schéma de sortie.** Inchangé : `{jet:{carac,tc,pourquoi,enjeu_reussite,enjeu_echec}} | {sans_jet:true}`, `pourquoi` ≤60, chaque enjeu ≤120 (calé avec l'UX).
Prédicat 7 proposé, à trancher par le tech-lead : refuser les enjeux contenant un pronom de tutoiement (`\b(tu|toi|te|ton|ta|tes)\b`) — le registre joueur n°10 vouvoie.

**C. Objection à l'UX sur le repli « — ».** Un enjeu absent rend la sortie invalide → bascule en `sans_jet`, aucune carte n'apparaît. Le tiret cadratin serait une affordance pour un état impossible. Les chiffres affichés par la carte (« 9 + 14 vs 14 », « marge +3 ») conviennent car c'est le CODE qui parle — le récit de R3 ne les reçoit jamais.

**D. Aléa.** Tirage = fonction de (graine, domaine, indice) :
- Création du héros : `alea(graine,'heros',n)`, `n=0` premier tirage, `1` relance (REGLES-PLAY B2).
- Jets : `alea(graine,'jet',horloge.tour)`, un jet au plus par pas.
- `creerRngDeSession(graine, curseur)` du tech-lead acceptée SI le domaine fait partie de la clé.
- **Je refuse le flux séquentiel du QA** (« la graine avance à chaque appel ») : chaque nouveau tirage ajouté ailleurs décalerait tous les jets suivants, cassant le rejeu des anciennes sessions. Son test « deux lancers donnent des résultats différents » peut échouer au hasard (deux lancers peuvent tomber pareil) — remplacé par : deux tours distincts lisent deux clés distinctes, graine fixe épinglée.

**E. Ce que reçoit R3.** Inchangé sur le fond. IT2 : le code classe en `réussit`/`échoue`. IT3 : ajoute `réussit de justesse`/`réussit nettement`, sur la MÊME constante que `xp.ts:48`. R3 reçoit seulement l'enjeu du côté qui s'est produit.

**F. Le héros.** Toutes les lignes `heros.*` en `moteur`. `heros.name` est une saisie libre du joueur — porte d'injection, le narrateur qui vouvoie n'en a pas besoin. `contexte.test.ts` vérifie qu'aucun assembleur ne lit `heros`. En IT1, le +5 PE n'est jamais raconté, visible seulement dans le bandeau. Signal (pas veto) pour le tech-lead : `pvMax`/`peMax` se calculent depuis `caracs` — importer `HeroState` tel quel pose la question KR-013.

**G. Risque connu, non gardé.** R2 peut écrire dans un enjeu une conséquence que le code n'applique pas. Aucun instrument ne le voit — la mémoire des faits établis de n°10 tient ensuite la cohérence.

## Décisions prises en autonomie faute de spécification
- Verbe déclencheur → `agir` seul → sinon il faut relire `dangers` comme un booléen, le contournement de `types.ts:985` qu'on vient de retirer.
- `dangers` absent → aucune ligne, aucun refus → sinon un lieu non rédigé rend tout jet impossible.
- Organisation de l'aléa → clé par domaine et indice → un flux séquentiel casse le rejeu dès la n°13.
- Audience de `heros.name` → `moteur` → en `ia` ce serait une porte d'injection et une entorse au vouvoiement.
- Renoncer au jet (REGLES-PLAY B1-bis) → non en IT2, au PM de rouvrir → repose sur un `optional` auteur que le dossier n'a pas ; le laisser décider par R2 donnerait au modèle le pouvoir de rendre un jet facultatif.
- Garde de voix (prédicat 7) → proposée, pas imposée.

## Fichiers relus
`src/brain/dossier/types.ts` (979-985), `src/brain/dossier/__fixtures__/dossier-reference.json` (258), `src/brain/copilote/contexte/narrateur.ts` (59, 73), `src/brain/dossier/session.ts` (52, 188-245), `src/brain/dossier/commandes.ts` (81-92), `src/brain/dossier/sessionDestinations.ts`, `src/player/engine/{charCreation,heroGen}.ts`, `src/player/types.ts` (24-33), `docs/REGLES-PLAY.md` (§A4, §B1-B2, §F), `.claude/raffinage/moteur-arbitre-cadrage/tour1-*.md`.
