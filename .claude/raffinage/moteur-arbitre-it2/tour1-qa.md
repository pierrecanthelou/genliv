# Tour 1 — `qa` · `moteur-arbitre` it2

**Constat mesuré** : les 8 critères mélangent observable (Étant donné / Quand / Alors) et déductif (« l'IA ne lance jamais les dés »). Trois critères nomment un niveau de test (KR-248 « rejeu », KR-265 « verrou », KR-260 « exclusion »), mais les cinq autres restent sans test nommé. Le dernier critère (rejeu unique + dégradation) est un pattern copié de moteur-interprete it2, jamais adapté : ce rôle reçoit une **union** {jet:...} | {sans_jet:true}, pas une branche qui retourne l'union ET doit la valider — la validation est déjà écrite.

**RISQUE** — Cinq critères n'énumèrent pas **le scénario qui falsifierait une implémentation candidate** : exemple, « R2 ne voit jamais heros.* » : un test qui bouchonne CopiloteService à accepter n'importe quoi réussit, un test qui **envoie le CorpsDemande au serveur** resterait vert même si le code glisse `heros.name` dedans. Absence de cas limites détaillés : R2 retourne {sans_jet:true} (valide et nominal), geste 'agir' SANS héros (ne déclenche pas R2), danger vide → R2 quand même (présence testée, pas contenu). Le dernier critère parle de **rejeu UNIQUE**, précédent exact d'it2 moteur-interprete où `jusquAuRejeuUnique` VALIDE une forme JSON, mais R2 retourne une **union étiquetée valide** {jet:...} | {sans_jet:true} — aucun rejeu n'y peut rien.

**OBJECTION** — Les critères d'acceptance de spec confondent le **grain de test**. « L'auteur voit le moteur lancer le dé » est un énoncé de feature, pas un critère ; il se décompose en pièces testables (bouton résout avec resolveChallenge, journal reçoit {lieu_id,carac,tc}, dés affichés APRÈS clic, seuil affiché). Trois de ces pièces n'ont pas de cas limites : geste 'aller' NE déclenche PAS R2, geste sans héros NE déclenche pas R2, action non-reconnue par le moteur (N°10) ne déclenche JAMAIS R2.

**PROPOSITION** — Chacun des 8 critères DOIT nommer : (1) **le scénario mesuré** qui ferait diverger « bon » et « mauvais » code (ex. toEqual stricte sur CorpsDemande.contexte pour KR-232), (2) **le test nommé** qui le porte (unitaire/contrat/composant), (3) **le cas limité** qu'il couvre (ex. sans_jet:true valide, aller ne déclenche pas). Le dernier critère : supprimer le « rejeu unique » — la validation est déjà là (jusquAuRejeuUnique générique reste, lit dans brain/CopiloteService.ts linéaire). Ajouter un cas explicite : « R2 retourne {sans_jet:true} → session avance sans jet ». Cas limites séparés : routage (structure pas contenu), auditorium (KR-232/262 mesuré en assertion de corps).

**VERDICT** — **Non recevable avant réécriture**. Chacun des critères doit mentionner son scénario de divergence + test + cas limité en ANNEXE (tableau 1 ligne/critère). Suppression ligne "rejeu unique", remplacement par cas {sans_jet:true} nominal. Pas d'acceptance de raffinement avant ce travail.

## ANNEXE — Scénarios manquants (à écrire dans spec itération avant essaim)

| Critère | Scénario divergent | Test nommé | Cas limité |
|---------|-------------------|-----------|-----------|
| Critère 1 (écran création) | création complète + bandeau recharge | `components/EcranPartie.test.tsx : BandeauHeros affiche heros courant` | abandon midway (pas compté) |
| Critère 3 (A4 PE+5) | déplacement réel (lieu différent) vs retour (même lieu) | `dossier/commandes.test.ts : TRANSITIONS.aller n'ajoute +5 PE si même lieu` | plafonnement à peMax |
| Critère 4 (geste agir R2) | geste='agir' + heros vs geste='aller' + heros vs geste='agir' sans heros | `hooks/useTourDeJeu.test.ts : R2 appelé ssi geste agir + heros présent` | danger vide ne change rien |
| Critère 5 (R2 corps stricte) | CorpsDemande.contexte = {lieu_id, description, dangers_texte?} exactement | `CopiloteService.test.ts : demanderArbitre envoie {role, contexte} sans heros.* ; toEqual strict` | corps sans danger si absent |
| Critère 6 (resolveChallenge + rng) | même graine reproduit même tirage | `session.test.ts : resolveChallenge(alea(g,arbitre,idx)) réplique` | graine alea jamais Math.random |
| Critère 7 (R3 amorce binaire) | issue classée avant d'être donnée à R3 | `useTourDeJeu.test.ts : narrative reçoit amorce [réussit/échoue], jamais chiffres` | R3 dégradé ne change pas amorce |
| Critère 8 (journal {lieu_id,carac,tc}) | EntreeJournal.jet? posé après jet résolu | `session.test.ts : apresInterpretation écrit {lieu_id,carac,tc} pas prose` | sans_jet:true nominal, jamais marge/issue |

