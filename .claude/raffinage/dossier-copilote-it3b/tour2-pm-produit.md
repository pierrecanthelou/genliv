# Tour 2 — `pm-produit` · `dossier-copilote` it3b

**RÉPONSE NOMMÉE — tech-lead (§ E.1) / QA (goal périmé, valeur de 3b)** : j'adopte leur reformulation. Le neuf n'est plus « plusieurs champs » mais **l'unité acceptée est une sous-entité que le CODE construit**, `{ etape, action }` — **un seul champ `ia`** (`si_bloque` sort). Réponse à « en quoi 3b diffère de 3a » : **deux traits absents de 3a** — (a) `etape` **posé par le code au moment de l'écriture**, jamais semé par le modèle ; (b) le contexte **injecte les étapes DÉJÀ écrites** (amendement narratif § B) — **première continuation du copilote sur une liste ORDONNÉE**, pas un sac. **Valeur propre pour l'auteur, pas un doublon de 3a.**

**RÉPONSE NOMMÉE — UX (un lancer, une étape)** : **je tranche POUR l'UX.** Trois étapes séquentielles dépendantes en un seul lancer produisent une **chaîne incohérente** si l'auteur rejette l'étape 2 mais voit déjà l'étape 3. **Je retire le format à trois** — borne de sortie → **1**, invite au singulier. C'est une **réduction** (moins de prédicats, moins d'UI), pas un ajout.

**`si_bloque`** : j'entérine le rejet (tech-lead + narratif, **motifs indépendants convergents**) — chaque acceptation allumerait un avertissement chez l'auteur, **pire qu'une absence**. `action` seule reste une tranche démontrable. Réouverture déjà conditionnée (étape existante + `duree` posée par l'auteur) : suffisant.

**Bug préexistant `handleRetirerEtape`** : hors périmètre **confirmé** — **condition : journalisé dans `bug_history.json` DANS CE LOT**, pas reporté.

**MES OBJECTIONS DU TOUR 1** — **MAINTENUE, resserrée** : un seul champ `ia` (pas deux), sort des cinq autres nommé. Le point « geste = étape entière » n'est plus un flou : **RETIRÉ en tant que point ouvert**, tranché par consensus UX + tech-lead.

**VERDICT** — **recevable** : `goal` réécrit à un champ, **un lancer = une étape**, `si_bloque` hors 3b, bug journalisé ce lot.
