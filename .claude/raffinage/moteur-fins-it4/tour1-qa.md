## RAFFINAGE MOTEUR-FINS IT4 — NOTE DE CADRAGE

### VERDICT : RECEVABLE SOUS RÉSERVE

---

### RISQUE
La graine n'est jamais persistée (it4 « sacrifiable »). Le rejeu fonctionne **INTRA-PROCESS uniquement** (avant rechargement du navigateur). Cette limitation critique n'est pas énoncée explicitement dans l'acceptance criteria — elle vit sous le mot-clé PM « sacrifiable ». Conséquence : le bouton « Rejouer » (lui-même reporté) n'aurait pas de graine à passer d'une session à l'autre.

---

### OBJECTIONS

**1. CA#1 non observable sans graine persistée**
- Critère actuel : « Rejeu à graine égale, INTRA-PROCESS (KR-242/304) : mêmes commandes joueur + même graine → mêmes tirages aléatoires. »
- Problème : « graine égale » suppose une graine accessible à l'interface pour la passer au rejeu. Or, la graine vit en `useState` et n'est jamais sortie.
- Fix : Reformuler « Étant donné une partie terminée, AVANT RECHARGEMENT, quand l'auteur appuie sur Rejouer, les mêmes commandes sont relues avec la même graine → les résultats finaux (PV, rounds, postures affichées) sont identiques. »

**2. Trois tests DOIVENT être nommés, aucun ne l'est**
- KR-306 (entrées = commandes joueur) : aucun test n'existe pour vérifier que aucune décision modèle n'entre au journal.
- KR-248 (journal = constat) : même absence.
- KR-250/260 (moteurSansIA.test.ts régression) : seul test cité, mais pas dans le critère.
- Fix : Ajouter dans « Définition de fini » d'it4 :
  - `rejou.test.ts` : « Étant donné une partie terminée après 3 combats, quand on rejout les mêmes commandes avec la même graine, alors les PV finaux et postures affichées sont identiques. » (unitaire/moteurSansIA)
  - `EntreeJournal.test.ts` : « Quand on parcourt les entrées du journal, aucune ne porte 'jet_id', 'monstre_ref' ni 'postures_appliquees' comme champ de decision_modele. » (unitaire)
  - Régression `moteurSansIA.test.ts` : reste vert (intégration).

**3. Cas limites navigateur : scope unclear**
- Spec dit « REPORTÉ — cas limites navigateur (retour arrière, hors ligne, crash) → it4. »
- Mais l'acceptance criteria n'en parle pas.
- Question : c'est in-scope d'it4, ou dette à déclencheur libre post-it4 ?

**4. Bouton Rejouer + focus auto : ambiguïté**
- Spec cite « REPORTÉ — bouton Rejouer + focus auto → it4 » dans open_questions.
- C'est un critère qui doit entrer en it4, ou une dette libre sans critère associé ?

---

### PROPOSITIONS

1. **Reformuler CA#1 en observable INTRA-PROCESS** : graine non persistée, rejeu avant rechargement uniquement.

2. **Ajouter trois tests nommés dans la définition de fini** : rejou.test.ts, EntreeJournal.test.ts, moteurSansIA régression.

3. **Écrire noir sur blanc dans open_questions** : 
   - « Rejeu limité au combat (KR-292). Fins et rencontres non rejouables en it4 : R1 (rencontre) et R4 (posture automatique) ne sont pas persistées comme entrées (it3 sacrifiable). »
   - « Graine non persistée en it4. Rejeu fonctionne INTRA-PROCESS (avant rechargement du navigateur). Rejeu inter-session reste une dette à déclencheur. »

4. **Pour PM (avant essaim)** :
   - Bouton Rejouer + focus auto : critère exigible d'it4, ou dette libre après ?
   - Graine persistée : acceptable de la reporter à une it5 future, ou must-have en it4 ?

---

### CHEMIN VERS CONFORME

Deux clarifications PM, puis mettre à jour `specification.json` :
1. Ajouter les trois tests nommés dans « Définition de fini ».
2. Reformuler CA#1 pour INTRA-PROCESS.
3. Trancher Rejouer (critère ou libre) et graine persistée (it5 ou it4).

Après cela, l'itération est **prête pour l'essaim**.

---

**Fichiers pertinents :**
- `/C:/Users/pierr/Desktop/genliv/src/features/moteur-fins/specification.json` — plan d'it4, rows 82–85, CA rows 21–23
- `/C:/Users/pierr/Desktop/genliv/code-knowledge.json` — KR-242, KR-248, KR-292, KR-304, KR-306 à lire intégralement
- `/C:/Users/pierr/Desktop/genliv/docs/REGLES-PLAY.md` — contexte règles du jeu (sections A5, E1, G)
