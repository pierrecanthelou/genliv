# UX Designer — moteur-acteurs it4, tour 1

**RISQUE** — La carte de jet arrive sans contexte narratif : le joueur ne sait pas qui résiste ni pourquoi. Perte de continuité narrative.

**OBJECTION**
1. La carte arrive sans prose : le joueur ne sait pas quel PNJ résiste. La ligne « X te résiste » n'est pas spécifiée.
2. Les règles d'enjeu sont incomplètes : l'enjeu décrit l'attitude et non le contenu (pas de spoiler), au plus 80 caractères, à l'infinitif, 3e personne — rien de cela n'est écrit.
3. Le focus clavier est perdu quand `CarteJet` se monte/démonte : dette reportable à faible coût via `Field.inputRef`.
4. La règle de rejeu (que se passe-t-il quand le joueur retente au pas suivant) n'est pas écrite dans REGLES-DU-JEU.md.

**PROPOSITION**
- Avant la carte : une ligne de récit canal RÉCIT (pas un enjeu), ex. « Harek se ferme. »
- Enjeux : ≤ 80 caractères, infinitif, 3e personne, distincts, sans marqueur ni identifiant.
- Le focus revient à `PlayerInputBar` après résolution de la carte.
- Règle de rejeu à écrire dans § 6 avant le code.

**VERDICT** — Recevable sous réserve : contexte narratif de la carte (1), règles d'enjeu écrites (2), rejeu documenté (4).

---

## ANNEXE — contrat de design

### CarteJet réutilisée tel quel
`CarteJet.tsx` ne change pas. Les enjeux y arrivent déjà par `CarteJetState`. La seule différence : l'origine du jet (R2 vs R4).

### Règles de copie des enjeux
- ≤ 80 caractères (`ENJEU_CARACTERES_MAX`)
- Infinitif, 3e personne
- Distincts l'un de l'autre
- Sans marqueur (`porteUnMarqueur`), sans identifiant (`porteUnIdentifiant`), sans chiffre
- L'enjeu ne spoile pas le contenu du savoir

### Canal RÉCIT
La ligne contextuelle avant la carte est dans le canal RÉCIT du journal, pas un enjeu. Elle est écrite par le code (registre constant), pas par R4.

### Focus clavier
- Après montage de CarteJet : focus sur le bouton « Lancer »
- Après résolution : focus retour sur `PlayerInputBar`
- Dette reportable, pas bloquante pour cette itération
