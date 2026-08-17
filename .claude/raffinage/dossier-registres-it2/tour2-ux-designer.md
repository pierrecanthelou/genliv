RISQUE — Le SegmentedControl JALONS/FINS reste à double sémantique (bascule pleine page ici, filtre de liste unique en it4). Rien de neuf ce tour ne l'aggrave : ma mitigation tour1 (deux compteurs, deux sélections indépendantes, D1 restreint à la fiche Fin) suffit, et QA en fait désormais un test nommé. Je maintiens le risque à l'état de vigilance — je ne le retire pas, je ne le durcis pas en veto.

OBJECTION — L'option marqueur committe immédiatement un jalon avec DEUX champs requis pré-remplis de prose réelle (`⟨à écrire⟩ …`) que l'auteur doit sélectionner-et-remplacer, sans aucun précédent « sélection au focus » dans ce dépôt — c'est inventer une interaction. Pire : rien ne détecte un marqueur oublié (reporté n°7/9), donc un ÉNONCÉ resté au marqueur valide silencieusement et peut un jour atteindre l'IA.

PROPOSITION — Retenir l'option brouillon différé (précédent exact : `etapeEnAjout`/`contreMesureEnAjout`, `BlocPlanActions.tsx`), étendue au cas à deux champs requis simultanés : l'entité n'entre `charpente.jalons[]`/`fins[]` qu'une fois TOUS ses champs requis non vides. Zéro texte de mon annexe tour1 à réécrire — NOM/DÉCLENCHEUR/ÉNONCÉ/CONDITION restent des `Field` vides classiques. Détails en annexe.

VERDICT — recevable sous réserve (brouillon différé acté, gating décrit en annexe).

---

## ANNEXE — mise à jour tour 2

### Décision : option brouillon différé, gating à N champs requis

Jalon a deux champs requis (`enonce_texte`, `declencheur_texte`), Fin en a un seul (`condition_texte` — `texte`, la prose de fin annoncée par le goal, N'EST PAS dans CHAMPS_REQUIS : elle reste un `Field` optionnel avec placeholder classique, jamais gatante — écart signalé au tech-lead/PM).

**Séquence** (identique pour Jalon et Fin) :
1. `+ Ajouter un jalon…` / `+ Ajouter une fin…` → une entrée locale (brouillon, hors `charpente`) apparaît en dernière position de la `ListRow`, auto-sélectionnée. Libellé de la ligne tant que `nom` est vide : `Nouveau jalon` / `Nouvelle fin`.
2. `FicheJalon`/`FicheFin` affiche ses champs réellement vides, placeholders gris HTML classiques (inchangés de tour1).
3. À chaque blur d'un champ requis : si TOUS les champs requis de l'entité sont désormais non vides, commit atomique en un seul appel (`nom`, s'il est encore vide, part `undefined`). Avant ce point, aucune écriture dans `charpente` : aucun bandeau de refus (l'entité n'existe pas encore).
4. Abandon silencieux, sans dialogue de confirmation (rien n'a jamais été persisté, hors du champ des « actions dangereuses ») : changer d'onglet, sélectionner une autre ligne, ou quitter le panneau alors qu'un brouillon est incomplet le fait disparaître.

### Champs (inchangés de tour1, reconduits verbatim)

**`FicheJalon.tsx`** :
1. `Field label="NOM DU JALON" hint="interne" placeholder="Le pacte avec l'Archiviste"`
2. `Field label="DÉCLENCHEUR" hint="auteur — jamais injecté au modèle" multiline rows=2 placeholder="Le joueur montre le sceau brisé à l'Archiviste."`
3. `Field label="ÉNONCÉ" hint="IA — injecté au modèle une fois ce jalon atteint" multiline rows=2 placeholder="L'Archiviste sait désormais que le sceau a été brisé."`
4. Aucune région D1 (silencieux par design).
5. Bandeau de refus (`role="status"`, motif `FicheIndice.tsx`) — n'apparaît qu'une fois l'entité committée.

**`FicheFin.tsx`** :
1. `Field label="NOM DE LA FIN" hint="interne" placeholder="Le Gouffre refermé"`
2. `Field label="CONDITION" hint="phrase factuelle pour le moteur, jamais de fiction" multiline rows=2 placeholder="Le héros porte la Clé d'Aldûr et a vaincu le Gardien."`
3. `Field label="TEXTE DE FIN" hint="lu par le joueur, à l'arrivée sur cette fin" multiline rows=3 placeholder="Le sceau se referme derrière toi ; Val-Cendre s'efface dans la brume, pour toujours."` — non gatant.
4. Région D1 (`role="status"`, `ENREGISTRÉ, AVEC AVERTISSEMENT`) — condition d'apparition inchangée : `condition_texte` non vide et `condition_expr` absent, donc jamais visible avant commit.
5. Bandeau de refus, motif inchangé.

### Clavier — ajout tour 2

Créer un brouillon place le focus sur NOM (précédent `intentionFocus`), pas sur le premier champ requis. `Échap` sur un champ d'un brouillon incomplet ne committe rien ; sur un champ d'une entité déjà committée, comportement inchangé.
