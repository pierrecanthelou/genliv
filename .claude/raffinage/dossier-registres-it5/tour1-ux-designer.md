# Tour 1 — `ux-designer` · `dossier-registres` it5

```
RISQUE      — Avec seulement deux champs neufs, le risque est de sous-dessiner le dernier
              écran : soit on referme effets_regles pour de bon sans éditeur (un Delta[]
              que l'auteur ne peut jamais écrire depuis l'UI, alors que le critère 7 dit
              « éditable via les opérations existantes »), soit on invente une justification
              ad hoc pour un champ « duree » qui rejoue une collision de sens déjà nommée
              (KR-198) sans que personne n'écrive le libellé/placeholder réel.

OBJECTION   — Le design_contract (« editeur_effets ») justifie l'absence d'EditeurEffets sur
              Climat par KR-208 (« aucune opération à opérande entier ») — mais KR-208 interdit
              une NOUVELLE opération entière, pas l'usage des QUATRE opérations existantes
              (donner_objet, retirer_objet, reveler_indice, atteindre_jalon). L'argument confond
              les deux, et laisse le critère d'acceptation n°7 non couvert par aucun écran.

PROPOSITION — Réutiliser EditeurEffets sans fork sur FicheClimat (coût nul — composant déjà
              générique sur 3 props), titre « EFFETS DE RÈGLE ». Les quatre opérations restent
              plausibles pour un climat prolongé (révéler un indice, marquer un jalon). J'écris
              label/hint/placeholder du champ DURÉE ci-dessous ; son nom INTERNE (jamais
              `duree` nu, KR-198) reste l'arbitrage du tech-lead.

VERDICT     — recevable sous réserve (sort d'EditeurEffets sur Climat + nom interne de la durée
              à trancher au tour 2).
```

---

## ANNEXE — Contrat de design

### Principe général
Aucun composant neuf, aucun token neuf. Reprise **strictement à l'identique** du motif `PanneauQuetes.tsx`/`FicheQuete.tsx`. Tous les styles viennent de `dossier-registres/components/styles.ts`, déjà écrit.

### Colonne liste
- `EYEBROW_SECTION = 'CLIMATS'` (`eyebrowStyle`) — pluriel de la collection, précédent `'INDICES'`/`'QUÊTES'`/`'ÉVÉNEMENTS'`.
- Liste `<ul style={listeStyle}>`, une `<li style={ligneListeStyle}>` par climat : `ListRow` (`title={localiserEntite('climat', climat, index)}`, `subtitle={climat.id}`, `selected`, `onSelect`) dans `ligneListRowStyle`, suivie de deux `IconButton` **frères** (Monter `▲` label `` `Monter le climat « ${nom} »` `` / repli `` `Monter le climat n°${index+1} (sans nom)` `` — Descendre symétrique), `size={HIT_TARGET_MIN}`.
- Bouton d'ajout : `+ Ajouter un climat…` (`boutonAjouterStyle`), commit immédiat, sélection posée, focus renvoyé au champ NOM (`intentionFocus`).
- **État vide** : glyphe `❏` (`emptyGlyphStyle`, `aria-hidden="true"`) + **« Aucun climat — cliquez « + Ajouter un climat… » pour commencer. »**

### Fiche, champ par champ
1. **NOM DU CLIMAT** — `Field`, `label="NOM DU CLIMAT"`, `hint="interne"`, `placeholder="Tempête de cendres"`, mono-ligne, `inputRef` du focus d'ajout, `Entrée` → `blur()` (commit), `onBlur` → commit.
2. **DURÉE** — `Field`, `label="DURÉE"`, mono-ligne (précédent `ÉCHÉANCE`), `placeholder="Trois jours, jusqu'à ce que les cendres retombent."`. Hint proposé : `"IA — informe le modèle de la durée de ce climat, jamais un décompte mécanique"` — **à confirmer PM/tech-lead** : si l'audience retenue est `auteur`, le hint devient `"interne — note de pacing, jamais lue par le modèle"`. Le nom **interne** du champ est hors de mon terrain ; seul le libellé affiché m'appartient et reste `DURÉE`.
3. **EFFETS DE RÈGLE** — `EditeurEffets` réutilisé sans modification : `titre="EFFETS DE RÈGLE"`, `legende="Ce que ce climat change tant qu'il est actif."`, `texteVide="Aucun effet de règle — cliquez « + Ajouter un effet… » pour commencer."`
4. **Bandeau de refus** — identique aux quatre fiches précédentes : `role="status"`, eyebrow `"CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"`, `IssueList` ou `TEXTE_ABSENT`.
5. **Aucune région D1** — `Climat` ne porte ni `declencheur_texte` ni `condition_texte` ; le silence n'est pas un oubli.
6. **Aucun bouton de retrait de fiche** — hors périmètre, même statut qu'it1–4.

### Tokens (tous déjà nommés dans `styles.ts`, aucun nouveau)
`--space-2/3/4/6/8/10`, `--font-mono`, `--font-ui`, `--fs-eyebrow`, `--fs-body`, `--fs-meta`, `--fs-h1`, `--text-label`, `--text-muted`, `--text-faint`, `--text-body`, `--track-eyebrow`, `--lh-body`, `--border-field`, `--border-divider`, `--r-md`, `--r-xl`, `--surface-inset`, `--surface-sunken`, `--accent`, `--accent-bg`, `--bad`, `--hit-target`.

### Parcours clavier
Tab : ligne(s) de la liste → Monter/Descendre de la ligne sélectionnée → `+ Ajouter un climat…` → `Card` : NOM → DURÉE → EFFETS DE RÈGLE (bouton `+ Ajouter un effet…`, puis par ligne `Select EFFET` → `Select CIBLE` → `IconButton` retirer) → bandeau de refus. `Entrée` dans NOM ou DURÉE blur-committe. Focus revient sur NOM après un ajout.

### Position sur les deux tensions
- **Tension 1** — je ne suis pas d'accord avec l'omission proposée au cadrage : rien dans `DELTAS` n'est absurde pour un climat qui dure (révéler un indice enfoui par la tempête, marquer un jalon de survie), et l'auteur voit le même état vide invitant que sur les quatre autres fiches. Le coût étant nul, le refus est plus cher que l'acceptation.
- **Tension 2** — vu de l'écran, aucune confusion pour l'auteur : le libellé est `DURÉE`, le hint dit l'audience, le placeholder est de la prose. La collision KR-198 est un problème de **nom de clé interne**, pas d'écran — je le signale, je ne le tranche pas.
