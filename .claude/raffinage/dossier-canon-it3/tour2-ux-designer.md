## RISQUE / OBJECTION / PROPOSITION / VERDICT

**RISQUE** — Aucun risque nouveau : celui de tour 1 (collision `camp` singulier/pluriel) est neutralisé par le `Record<Camp,string>` du tech-lead, à condition qu'il porte exactement mes trois libellés, dans mon ordre — vérifié en annexe, inchangés.

**OBJECTION [QA — veto, rendu du warning]** — Le veto est fondé : mon contrat de tour 1 ne décrivait que le bandeau de refus, jamais un état d'avertissement. Correction en annexe : un second bandeau, sous la liste des objectifs, structurellement identique au premier (`IssueList` + eyebrow mono) mais jamais bordé de rouge sur les champs eux-mêmes — texte seul en `--bad`, cohérent avec le compteur de mots de Canon (même token déjà utilisé pour un avertissement non bloquant). Visible dès qu'un objectif porte une prose non vide, **y compris à l'ouverture d'un dossier déjà rédigé** — pas seulement après un commit de cette session ; je le pose en exigence, la mécanique de seed au montage revient à dev-contrat.

**Correction de ma propre erreur** — « injectée au modèle » (mon eyebrow de tour 1) contredit la classification moteur/auteur du tech-lead et le JSDoc de `Fin.condition_texte` (« jamais injectée, un narrateur qui la connaît y conduirait ») — même logique pour `Objectif`. Eyebrow corrigé en annexe.

**PROPOSITION** — Voir annexe : bandeau d'avertissement, eyebrow corrigé, confirmation des libellés `Record<Camp,string>`.

**VERDICT sur mon objection de tour 1 (Card imbriquée)** — MAINTENUE, confirmée par le tech-lead, inchangée (`--r-xl`/`--surface-inset`, pas de `Card`). Plus de veto de ma part sous réserve du bandeau d'avertissement ci-dessus.

---

## Annexe — textes révisés

**Confirmation `Record<Camp,string>`** (côté feature, comme prescrit par le tech-lead) — doit porter exactement :
```
protagonistes: 'Protagonistes'
antagonistes:  'Antagonistes'
joueur:        'Joueur'
```
dans cet ordre. Rien ne change à mon contrat de tour 1 sur ce point.

**Eyebrow de section, corrigé** (remplace « injectée au modèle ») :
```
OBJECTIFS DES CAMPS — interne, jamais injecté au modèle
```

**Nouveau bandeau d'avertissement** — sous la liste des cartes objectif, distinct et indépendant du bandeau de refus (les deux peuvent coexister) :
```tsx
{avertissementsObjectifs.length > 0 && (
  <div style={bandeauStyle}>
    <p style={eyebrowAvertissementStyle}>{EYEBROW_AVERTISSEMENT_OBJECTIFS}</p>
    <IssueList issues={avertissementsObjectifs} />
  </div>
)}
```
```
const EYEBROW_AVERTISSEMENT_OBJECTIFS = 'ENREGISTRÉ, AVEC AVERTISSEMENT'
```
`eyebrowAvertissementStyle` = copie exacte de `eyebrowRefusStyle` (mono, `--fs-eyebrow`, `--track-eyebrow`, couleur `--bad`) — seul le texte change, jamais « N'A PAS ÉTÉ ENREGISTRÉ » qui serait faux ici (D1 : avertit, ne bloque pas). `IssueList` reste le composant sans changement — sa bordure neutre (`--border-divider`) ne code aucune sémantique de blocage, elle est déjà réutilisable telle quelle.

Filtrage : `avertissementsObjectifs = warnings.filter(w => w.path.startsWith('canon.objectifs'))`, où `warnings` doit être seedé dès le montage (pas seulement après le premier commit de la session) — un dossier rouvert avec des objectifs déjà rédigés doit montrer l'avertissement immédiatement.

**Ce qui ne change pas** : ordre des champs, absence de dialogue de confirmation au retrait, texte des placeholders/hints, bloc interne non-`Card` (`--r-xl`/`--surface-inset`/`--border-subtle`).

---

**Note orchestrateur (post-hoc) :** le seed-au-montage réclamé ici est déjà satisfait par le `useMemo(() => validateDossier(dossier).warnings…, [dossier])` du tech-lead (tour 2, reçu en parallèle) — convergence indépendante, retenue à l'arbitrage.
