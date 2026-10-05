## PM · moteur-combat it3 · Tour 1

**Phrase de démo vérifiée** : « à la fin, l'auteur peut lire, sous chaque round de combat, le commentaire du narrateur de combat ». Il n'y a pas de « et ». La tranche traverse l'écran, le service `brain/` (CopiloteService), le worker (route `/ia/commentateur`) et le rejeu de combat. C'est une tranche verticale recevable. La non-persistance du récit est l'hypothèse que j'ai retenue, détaillée plus bas.

**RISQUE** — L'itération peut grossir par deux bords.
(a) Persister le récit rouvre `session.ts` (846 l., extraction `sessionCombat.ts` armée), impose un lot `contrat` et rouvre KR-292.
(b) « chaque round » n'est pas défini. On ne sait pas ce qui concerne la fuite d'it2, le round de clôture, et un round par rapport à un assaut.

**OBJECTION**
1. « Chaque round » reste flou.
   - Le round de clôture est le plus lu, et « Continuer » peut précéder la réponse IA.
   - La fuite n'est pas un round (KR-297).
2. Rien ne dit que le récit n'est pas persisté. Sans cette phrase, un ouvrier ajoute `combat.recits[]`.
3. R5 ignore `canon.ton` et `canon.interdits_ton[]`. L'auteur qui a écrit « pas de gore » le voit violé là où ça arrive. De plus, le critère « 2–3 phrases » n'est pas testable (KR-229).
4. Vocabulaire.
   - « Rejeu » désigne deux choses dans la même feature : le rejeu pur (KR-292) et le nouvel essai (KR-230).
   - « Narrateur de combat » fait doublon avec le narrateur R3.

**PROPOSITION**
- **Dedans** :
  - un appel par round de posture, plus le round de clôture avec `issue` dans la projection ;
  - appel non bloquant ;
  - récit rattaché à son round, sans titre de section ni placeholder ;
  - entrée `canon.ton` et `interdits_ton[]`, déjà destinés `ia`.
- **Dehors** :
  - fuite non commentée ;
  - récit non persisté (rechargement : log mécanique intact, récit perdu, jamais redemandé) ;
  - `session.ts` intact ;
  - butin ; posture choisie par l'IA ; ton propre au combat ; reprise (n° 15).
- **Je retire** :
  - le critère « 2–3 phrases » (devient une consigne d'invite) ;
  - « gère la sortie de combat » (ligne roadmap, hors goal).
- **Budget** : 3 lots (contrat + brain/worker + play-mode) et au plus 6 critères. Au-delà de 4 lots, je coupe d'abord `ton`/`interdits_ton[]`.
- **Vocabulaire** : « nouvel essai » pour la reprise après échec ; « commentaire de round » côté auteur ; « commentateur » réservé au rôle dans le code.

**VERDICT — recevable sous réserve.** Les points 1, 2 et 4 sont des conditions. Le point 3 est négociable : si le TL chiffre plus d'un fichier de plus, je cède et on le note en dette à déclencheur. Je ne bloque pas.

### Décisions prises en autonomie faute de spécification
- Persistance du récit → non persisté, perdu au rechargement, jamais redemandé.
- La fuite est-elle commentée ? → non, ses lignes restent mécaniques.
- Round de clôture → commenté avec `issue` en projection, sans jamais bloquer « Continuer ».
- Granularité → un appel par round, pas par assaut ni par ligne de journal.
- `canon.ton` et `interdits_ton[]` → inclus en entrée de R5.
- Critère « 2–3 phrases » → sorti des critères, porté par l'invite.
- Fichier orchestrateur → un hook voisin dédié, pas `useTourDeJeu.ts` (552 l.) ni `EcranPartie.tsx` (390 l.).
