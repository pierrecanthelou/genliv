**RISQUE** — Cette itération est presque entièrement contenu (fixture JSON) + tests `brain/`, donc mon risque principal n'est pas visuel : c'est qu'on résolve l'open question export en lui inventant une surface qui n'existe pas encore, ou qu'on rende le dossier de référence *quelque part* à l'écran en contournant KR-156.

**OBJECTION** — Le libellé « import/export » du goal de la feature suppose une affordance symétrique à `ImportDossierButton`, mais j'ai vérifié `LibraryScreen.tsx` : elle ne liste que `books` (arbre), pas les dossiers — `REASSURANCE_TEXT` le dit lui-même (« La bibliothèque n'affiche pas encore les dossiers importés »). Il n'existe donc **aucune ligne par dossier** où accrocher un bouton « Exporter » sans inventer un écran, ce que KR-156 interdit à cette feature. Second point de mon domaine : le jeu de glyphes canonique (`DESIGN-SYSTEM.md`) est ✎ ✕ ⠿ ▾ → ↪ ↻ ⏱ ⊘ ⚔ 🗝 ⬚ + — aucun ne signifie « télécharger ». Un bouton d'export ne peut donc être qu'un lien texte, jamais une icône inventée.

**PROPOSITION** — Si le comité retient l'export pour it5 malgré tout, la seule surface qui existe déjà sans construire un écran est la ligne de confirmation post-import d'`ImportDossierButton` (déjà montée, déjà stateful sur le titre importé). J'écris son texte exact en annexe. Sinon, je recommande REPORTÉ n°2 : la vraie place d'« Exporter » est une action de ligne symétrique à celles de `BookCard` (rename/duplicate/delete), qui n'existe que quand les dossiers seront listés.

**VERDICT** — recevable sous réserve (pas de veto — c'est un arbitrage PM/tech-lead sur le périmètre, mais je pose la contrainte glyphe/surface qui s'impose à toute réponse retenue).

---

## Annexe — contrat de design

### 1. Ce que cette itération NE touche PAS visuellement

Le dossier de référence (fixture JSON) n'est **jamais rendu dans un écran** (KR-156). Aucun placeholder, aucun état vide à écrire pour lui : la preuve est un test `brain/` lisant le fichier réel. `ImportDossierButton.tsx` / `ImportDossierDialog.tsx` restent inchangés dans leur anatomie actuelle (§ 3.1/3.2 déjà livrés it1) — je n'ai rien à raffiner dessus si l'export n'est pas retenu ici.

### 2. SI l'export est retenu en it5 — seule proposition de surface neuve

**Composant** : extension de la ligne de confirmation existante dans `ImportDossierButton.tsx` (pas de composant maison, pas de `Modal` neuve).

**État actuel (rappel, livré it1)** :
```tsx
{confirmation !== null && (
  <p role="status" style={confirmationStyle}>{confirmation}</p>
)}
```

**Proposition si retenu** — remplacer le `<p>` seul par une ligne flex texte + action, même `confirmationStyle` pour le texte :

```tsx
{confirmation !== null && (
  <div role="status" style={confirmationRowStyle}>
    <p style={confirmationStyle}>{confirmation}</p>
    <button type="button" onClick={handleDownload} style={downloadLinkStyle}>
      {DOWNLOAD_LABEL}
    </button>
  </div>
)}
```

- `confirmationRowStyle` : `display: 'flex', alignItems: 'center', gap: 'var(--space-3)'`.
- `downloadLinkStyle` : **copier `retryButtonStyle` de `ImportDossierDialog.tsx`** trait pour trait (bouton texte, `background: none`, `border: none`, `color: var(--text-muted)`, `fontFamily: var(--font-ui)`, `fontSize: var(--fs-body)`, `minHeight: var(--hit-target)`) — cohérence avec le seul autre lien-bouton déjà établi par cette feature.
- **Pas d'icône** : aucun glyphe canonique ne porte le sens « télécharger ». Texte seul.
- **Texte exact** : `DOWNLOAD_LABEL = 'Télécharger le fichier'` (registre interface, mono-esque via `--font-ui` comme son voisin `RETRY_LABEL`, pas de MAJUSCULES — `RETRY_LABEL` n'en porte pas non plus, cohérence de casse à respecter).
- Nom de fichier téléchargé : `slugifyFilename(titre) + '.json'`, via `downloadJson` — aucun texte neuf à écrire pour ce mécanisme, il est déjà nommé par ses paramètres.

**Registre de langue** : `DOWNLOAD_LABEL` est un libellé d'interface (registre auteur), jamais de la fiction — aucun risque de confusion ici car il n'y a aucune prose joueur dans ce fragment.

**Clavier** : le bouton est un `<button>` natif dans le flux du DOM après la confirmation — Tab l'atteint naturellement, Entrée l'active, rien à spécifier de plus (pas de modale, donc pas de piège de focus à gérer).

**Dépendance hors mon domaine** : `handleImported(titre)` ne reçoit aujourd'hui que le titre, pas l'id — passer l'id est un changement de contrat que je ne tranche pas (tech-lead), je ne fais que documenter le texte et l'anatomie visuelle du geste.

### 3. SI l'export est reporté n°2 (mon option par défaut)

Aucun contrat de design à écrire ici — la place naturelle sera une `IconButton` de ligne dans la future liste de dossiers de `LibraryScreen`, symétrique aux actions déjà dessinées sur `BookCard`. Ce travail se raffinera avec l'écran qui le porte, pas avant.
