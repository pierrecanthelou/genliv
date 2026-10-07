## NOTE D'OUVERTURE — UX Designer, moteur-fins it1

**RISQUE** : l'écran de fin est la seule prose joueur « finale ». Si la mort recopie le motif du refus (⊘, bordure pointillée, `--bad`), l'auteur la lit comme une erreur de l'outil ou comme un échec de jet. Si le repli « sans texte » passe dans `OutcomeBlock`, l'outil prétend « lire » une prose qui n'existe pas.

**OBJECTION 1 (registre)** : `OutcomeBlock` exige `entete` (registre auteur). Un seul libellé ne suffit pas : le texte de fin vient du dossier (« mot pour mot »), le texte de mort est une constante du moteur. Les deux en-têtes doivent le dire, sinon l'auteur croit que la mort est de lui.
**OBJECTION 2 (repli)** : « Cette fin n'a pas de texte » est un constat, pas une invitation. La règle projet exige l'action suivante. Je l'étends, hors `OutcomeBlock`, en bloc pointillé calqué sur `etatVide`.
**OBJECTION 3 (accent)** : un seul bouton accent, « Rejouer ». « Quitter le test » reste dans l'en-tête, avec Échap. Pas de second bouton plein.
**OBJECTION 4 (mineur)** : `etatVide` et `blocRefus` existent déjà en double. Un troisième copier-coller est dette. Je tolère un partage local, pas en `brain/components/`.

**PROPOSITION** : `EcranFin` dans `CadrePartie`, `bandeau` conservé (PV/PE visibles à la mort). Aucun glyphe sur la mort (⊘ = refus). Titre `--fs-h2` en `--text-strong`. Aucun `--bad` / `--good`. Voir l'annexe.

**VERDICT** : APPROUVÉ SOUS CONDITIONS — (a) les deux en-têtes distincts, (b) le repli invitant, (c) zéro `--bad`/`--good` dans `EcranFin`.

---

## ANNEXE — CONTRAT DE DESIGN (tokens vérifiés dans `src/styles/tokens/` et `design_handoff_gamebook_editor/tokens/`)

**Structure** : `<CadrePartie titre sortie={{name:'dossier',dossierId}} bandeau={<BandeauHeros …/>}>` → colonne de lecture (maxWidth 640 existant, gap `--space-9`) → `<section aria-label="Fin de partie">` → `<h2>` titre, `OutcomeBlock` ou repli, bouton Rejouer.

**Textes exacts**

| Cas | Titre `<h2>` | En-tête `OutcomeBlock` (mono MAJ) | Corps |
|---|---|---|---|
| Fin | `FIN` + ` · ` + `Fin.nom` en chrome (nom interne ; jamais `condition_texte`) | `FIN — lue au joueur, mot pour mot` | `Fin.texte` verbatim (`pre-wrap` déjà dans `OutcomeBlock`) |
| Mort | `Vous êtes mort` | `MORT — texte du moteur, identique pour tous les dossiers` | « Vos forces vous abandonnent. Le monde se referme sur vous, et le silence qui suit est complet. » (2e personne, présent) |
| Fin sans texte (trim vide, KR-307) | idem Fin | aucun `OutcomeBlock` | « Cette fin n'a pas de texte — rédigez-la dans JALONS & FINS, onglet FINS, pour que le moteur la lise au joueur. » |

Bouton : `↻ Rejouer`. Compteur de session, graine et identifiants : absents (registre débogueur interdit ici).

**Tokens**
- Titre : `--font-ui`, `--fs-h2`, `--fw-semibold`, `--track-tight`, `--text-strong`, `margin: 0`. Le titre de mort est identique en couleur (KR-308).
- `OutcomeBlock` : inchangé (`--surface-card`, `--border-card`, `--r-lg`, `--space-7`, `--fs-row`, `--lh-loose`, `--text-strong`, en-tête `--text-label`).
- Repli : `--bw-strong dashed --border-field`, `--r-xl`, fond `--paper-1`, padding `--space-10 --space-8`, glyphe `⬚` en `--fs-h1` / `--text-faint`, texte `--text-muted`, `--lh-body`. Même anatomie que `etatVide`.
- Bouton Rejouer : copie du `boutonRetour` d'`EcranRefus` — `--font-mono`, `--fs-meta`, `--space-3 --space-5`, `--r-md`, `--bw-hair solid --accent`, fond `--accent`, `--text-on-accent`, `--fw-semibold`, `minHeight: --hit-target`. Survol et focus en CSS seul, pas d'état `isHovered`.
- Interdits dans `EcranFin.tsx` : `--bad*`, `--good*`, toute ombre, tout hex ou `rgb()`.

**États**
- Fin avec texte : `OutcomeBlock`.
- Fin sans texte : repli pointillé.
- Mort : `OutcomeBlock` du moteur.
- Pas d'état « chargement » : la fin est synchrone.
- Pas d'état « erreur » dans `EcranFin`. Une `Fin.id` introuvable relève du moteur ; je propose de la traiter en refus existant et le dis comme question ouverte.

**Clavier**
- Au montage, le focus passe sur `Rejouer` (le champ de saisie vient d'être démonté, le focus tomberait sur `body`). Entrée ou Espace relance.
- Échap : `CadrePartie` navigue déjà vers `sortie`. Rien à ajouter.
- Ordre de Tab : ✕ Quitter le test → (actions d'en-tête) → Rejouer. Cet ordre est celui du DOM : l'en-tête précède le corps.

**ESLint proposé** (`no-restricted-syntax`, portée `src/features/play-mode/components/Ecran*.tsx`)
1. Interdire toute chaîne littérale `var(--bad` / `var(--good` dans `EcranFin.tsx` (message : « Mort et fin ne sont pas un jet : --text-strong. »).
2. Interdire un `Literal` de style de couleur ou d'espacement qui ne commence pas par `var(--` (champs `color`, `background`, `border*`, `padding`, `gap`, `fontSize`) ; seules `maxWidth` et `0` sont autorisés.
3. Interdire l'import de `player/components/EndScreen` depuis `features/`.
4. Interdire `<button style={{…}}>` inline ; exiger une constante `CSSProperties` nommée.
5. Interdire tout élément `<dialog>` ou `role="dialog"` dans `Ecran*.tsx` (c'est une route).

---

## DÉCISIONS PRISES EN AUTONOMIE

- Le texte de mort n'était pas écrit → je l'ai écrit (2e personne, présent), avec un en-tête qui dit « moteur » → si l'auteur veut le texte de mort configurable, il faut un champ de dossier optionnel et un lot `contrat`.
- Le bandeau héros est-il conservé à l'écran de fin ? → oui, il montre les PV à 0 → l'inverse retire un repère, mais gagne un écran plus épuré.
- Focus automatique sur Rejouer → choisi, car le champ de saisie s'est démonté → si l'inverse, la reprise exige la souris ou un Tab depuis `body`. Risque : un Entrée maintenu (répétition de touche) pourrait relancer par mégarde.
- Afficher `Fin.nom` dans le titre (chrome) → oui, c'est un nom interne, jamais la `condition_texte` → s'il est vide, afficher « Fin sans nom », au même titre que « Sans nom » pour le climat.
- Nom exact du champ « texte de la fin » dans l'éditeur → je n'ai trouvé que l'onglet `JALONS & FINS` / `FINS` dans `PanneauJalonsFins.tsx` → à vérifier avant de figer la phrase du repli.
- Aucun glyphe sur Fin et Mort → ⊘ appartient au refus, ✕ à la sortie → si on veut un glyphe, ⚔ n'est pas neutre non plus (combat).
- Partage du style du repli → copie locale, comme dans `EcranRefus` → extraire un module de styles partagé est une dette tolérée (KR-109 ne s'applique pas, un seul module).
