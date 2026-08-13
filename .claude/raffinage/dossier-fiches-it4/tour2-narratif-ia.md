# Tour 2 — narratif-ia, `dossier-fiches` it4

**Réponse nommément à tech-lead, § C, `but.echeance`.** Ton asymétrie du regret est juste, et je retire `ia`. Mais pas par ton chemin : non, mon choix ne rouvrait **pas** la décision A — le producteur existe (le `Field` d'it4), et la décision A frappe la forme *sans producteur* (cas `tier`), pas sans consommateur ; cinq familles `moteur` sans consommateur avant le Temps 2 vivent déjà dans la table. Ce qui me condamne, c'est ma propre invariante de fin de note : **une échéance textuelle EST une donnée d'horloge**. « Avant la pleine lune prochaine », injectée verbatim au tour 1 comme au tour 40 sans libellé d'écoulement, fait improviser au modèle une urgence que le moteur n'a pas constatée — c'est exactement la **paraphrase** que `destinations.ts` interdit déjà pour les caractéristiques tant que n° 10 n'a pas livré de libellé dérivé *par le code*. Marquer `ia` aujourd'hui, c'est promettre l'injection sans le garde. `auteur` la retient et se desserre en une ligne.

**Statut de mes quatre propositions du tour 1 :**

1. **Les ~8 lignes dans `REGLES-PLAY.md` d'abord — retirée.** Sur-application du précédent it3 : `duree` n'est pas sous mutation, il n'y a pas de valeur dorée, le mécanisme doc → table dorée → code ne transfère pas. Pire, mes 8 lignes *pré-tranchaient* l'unité d'horloge que je disais laisser à n° 9. Remplacée : **3 lignes de docstring au site du contrat** (`types.ts` + ligne de destination, idiome des caractéristiques) + **un renvoi d'une ligne** dans `REGLES-PLAY.md`, qui reste le bon fichier *par sujet* (orchestration de session, maison de n° 14) mais pas le bon *par mécanisme*.
2. **`duree` entier, `moteur`, `DUREE_MIN = 1` — durcie en veto.** J'accepte le coût chiffré par tech-lead (+1 `CHAMPS_ENTIERS`, ~8 l. de `validate.ts`, 2 tests). Un `moteur` posé sur de la prose libre est une promesse que le code ne peut pas tenir : le contrat entre les deux temps mentirait. `delai` suit, même type, même destination.
3. **Avertissement D1 `si_bloque` sans `duree` — maintenue**, dans sa forme minimale (non bloquant). C'est le seul garde déterministe qui empêche « bloqué » d'être une question posée au modèle. Corollaire assumé : pas de garde, pas de `si_bloque` dans ce lot.
4. **Aucune clé neuve à la sortie du modèle en it4 — durcie en veto.** Nommément : pas de `etape_suivante`, pas de `contre_mesure_declenchee`, pas de `duree_restante`.

---

## ANNEXE (hors quota) — ce qui change au contrat

### Destination corrigée

| Champ | Tour 1 | **Tour 2** | Clause à écrire à la ligne |
| --- | --- | --- | --- |
| `monde.personnages[].but.echeance` | ~~`ia`~~ | **`auteur`** | « note de pression, jamais injectée : une échéance en prose est une donnée d'horloge. Passe à `ia` le jour où n° 10 livre un **libellé d'écoulement dérivé par le code** et sa propre ligne d'audience — précédent `stats`, même refus de paraphrase. » |
| `plan_actions[].duree` | `moteur` | **`moteur`** (inchangé) | « compte de pas d'horloge de session, entier ≥ `DUREE_MIN`. L'unité est nommée par n° 9 ; it4 ne la pré-tranche pas, il interdit seulement la prose. » |
| `plan_actions[].si_bloque` | `ia` | **`ia`** (inchangé) | « injectée **uniquement** quand le moteur a déclaré l'étape bloquée. Aucun jumeau `_expr`, aucune entrée dans `FAMILLES_DE_CONDITIONS` — didascalie, statut de `cede_si`. » |
| `contre_mesures[].delai` | `moteur` | **`moteur`**, **entier** | Symétrie stricte avec `duree` : même type, ou le discriminant s'écrit — il ne s'écrit pas. |

Conséquence côté UX : l'**hypothèse A** (Stepper) est retenue ; borne `min = DUREE_MIN = 1`, sans borne haute.

### Contrat de sortie IA (rôle acteur, n° 12) — mis à jour

- **Entrée injectée** : `fonction`, `apparence`, `description_joueur`, `but.libelle`, `but.pourquoi`, l'`action` de l'étape courante seule, `si_bloque` **si et seulement si** le moteur a posé l'étape bloquée, `contre_mesures[].action` **si et seulement si** le moteur l'a armée.
- **Jamais injectés** : `but.echeance`, `camp`, `etape`, `duree`, `delai`, `portee`, `declencheur_expr`, `declencheur_texte`, `objectif_id`, les 8 `stats`.
- **Schéma de sortie** : `{ recit: string, indices_reveles: string[] }` — **inchangé par it4**.
- **Échec de validation** : un rejeu (même graine, même contexte) ; second échec → repli sur une réplique neutre du registre moteur, tour marqué *dégradé* au journal ; jamais d'interprétation partielle d'un texte libre.

### Testabilité

`but.echeance` se teste d'un seul côté : « champ visible auteur », ligne `'monde.personnages[].but.echeance': 'auteur'` balayée par `couverture.test.ts`. Pas de test « jamais injecté » — aucun assembleur n'existe avant n° 10.
