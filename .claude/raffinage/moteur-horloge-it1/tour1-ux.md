# moteur-horloge it1 — Tour 1 — UX Designer

**RISQUE**
La seule surface de l'itération est une ligne de journal, mais deux fuites de registre sont possibles. (1) Les lignes `moteur` existantes sont des constats mécaniques en identifiants : `lieu_courant : a → b` (`commandes.ts:356`), `jalons_atteints : {id}`, `interlocuteur : {id}`. Si le tick écrit « Le garde se met en marche », ou recopie `plan_actions[].action` ou `si_bloque` (prose `ia`), la fiction entre dans le journal de l'auteur et la prose IA est récitée. (2) Le numéro d'étape. La fiche auteur affiche « ÉTAPE {index+1} » (`BlocPlanActions.tsx:222`), dérivé de la position, alors que `plan_actions[].etape` se désynchronise après un retrait (`types.ts:1270`). Un journal qui affiche `rang` brut (base 0) ou le champ `etape` contredit ce que l'auteur lit dans sa fiche.

**OBJECTION**
- (a) Veto de registre : le texte de la ligne ne doit contenir ni prose ni nom libre. Il compose uniquement un identifiant et deux ordinaux.
- (b) Objection forte : `ÉTAPE BLOQUÉE` (open_question) n'a aucun lecteur en it1. « Bloqué » est dérivé et n'est pas un événement, donc il n'a pas de moment où émettre une ligne. En produire une à chaque tick serait du bruit, contraire à « tick sans effet = aucune ligne ». Aucune surface debug n'existe en it1. Ajouter un composant ou un panneau pour lui serait un composant maison (veto).
- (c) Mineure : le journal est déjà « débug-mécanique ». Un auteur qui voit `#7 ↻ MOTEUR etape_plan : pnj.garde 1 → 2` doit pouvoir le relier à sa fiche. D'où le point (a), avec le numéro en base 1.

**PROPOSITION**
- Une ligne par PNJ qui avance : `etape_plan : {pnj.id} {rang+1} → {rang+2}`. Elle passe par `JournalRow` inchangé, sans `origine` (précédent jalons).
- Même `#tour` répété sur toutes les lignes d'un même pas (§ J1). Ordre : celui des PNJ dans le dossier.
- Aucune ligne pour un PNJ non évalué, un plan terminé, un PNJ en attente, ni un PNJ bloqué.
- `ÉTAPE BLOQUÉE` reporté à it2, avec la projection `changementsDe` et le bandeau. Il y aura alors un lecteur et une surface réels.
- Zéro composant, zéro token neuf.

**VERDICT** : APPROUVÉ SOUS CONDITIONS — (a) en veto, (b) reportée à it2, (c) intégrée au contrat ci-dessous.

---

## Annexe — contrat de design it1

- **Composants** : `JournalRow` inchangé (`Badge tone="neutral"`, `↻ MOTEUR`, `#{tour}`). Aucun composant neuf, aucune extension de `HeroStatusBar`.
- **Tokens** : ceux déjà utilisés par `JournalRow` (`--space-3`, `--space-4`, `--bw-hair`, `--border-subtle`, `--font-mono`, `--fs-meta`, `--fs-body`, `--text-body`, `--text-faint`). Aucun ajout. `--accent`, `--good` et `--bad` sont interdits sur cette ligne.
- **Texte exact** : `etape_plan : {pnj_id} {n} → {n+1}`, avec `n = rang_avant + 1` et `n+1 = rang_après + 1`. Exemple : `etape_plan : pnj.garde 1 → 2`. Contenu interdit : `action`, `si_bloque`, `declencheur_texte`, `nom`, `duree` et tout verbe français.
- **États** :
  - avancement : 1 ligne.
  - tick sans effet : 0 ligne.
  - journal vide : l'état vide existant du journal ne change pas.
  - erreur, chargement : sans objet (moteur pur).
- **Clavier** : aucun élément interactif ajouté. L'ordre de Tab, Entrée et Échap du Aperçu est inchangé.
- **Langue** : registre interface uniquement. Rien de fiction côté journal. La prose IA (`action`) ne sort que par le narrateur R3 (it2).
