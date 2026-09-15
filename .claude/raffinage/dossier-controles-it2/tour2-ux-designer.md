# Tour 2 — `ux-designer`

**VERDICT** : recevable sous réserve — (a) D1 tranché élision ; (b) teinte seule rejetée ; (c) mesure de largeur jointe, aucun débordement.

**RETRAIT** — aucune position abandonnée. **Le veto conditionnel du tour 1 est LEVÉ** : il portait sur la juxtaposition illisible « — · BLOQUANT », et les deux survivants (mon élision, la substitution du tech-lead) l'évitent également — le motif du veto a disparu quelle que soit l'issue.

**MAINTIEN — élision contre substitution (tech-lead)** : le cadrage et KR-218 disent « TOUJOURS fusionné avec le compte », posé acquis ; la substitution l'enfreint en toutes lettres sur les sections à compte réel (« 6 fiches » disparaît). L'infléchir est une décision humaine, pas une facilité de composant. **Mot obligatoire contre teinte seule (QA)** : motif confirmé par la note du tech-lead lui-même — `info → muted` EST la teinte du calme, `alerte → neutral` n'en diffère que d'un gris. Coût accepté : deux sondes bougent, pas une.

**RÉPONSE au tech-lead (« la vue recompose une phrase ») — partiellement recevable.** Que la fonction vive en `brain/` répond au grief littéral : la vue fait **un seul appel, un seul rendu**, exactement le régime de `compte()` aujourd'hui, et mon branchement (présence ou absence de compte) n'est pas une décision d'**accord** comme celles que `sections.ts` réserve — c'est un cas d'**absence**. Mais je concède le vrai coût que tu vises ailleurs : ton lot L1 change de forme si l'élision l'emporte, et ce n'est pas un détail.

## Mesure de largeur — « 0 jalon · 0 fin · BLOQUANT », le pire cas

| Étape | Calcul |
|---|---|
| Colonne de nav | 280 px |
| − padding du wrapper (`--space-8` = 18 px ×2) | 244 px |
| − padding de `ListRow` (10/12 px) | **220 px** de boîte de contenu |
| − `gap` (`--space-5` = 12 px) | **208 px** partagés entre sous-titre et badge |
| Badge : mono 10 px (≈6 px/car.), 26 caractères ≈ 156 px + padding 18 px + bordures 2 px | **≈ 176 px** |

**176 px < 208 px : aucun débordement.** Le bloc titre/sous-titre est repoussé à ≈32 px et se replie sur plusieurs lignes — comportement déjà prévu par `ListRow` (`flex: 1` / `minWidth: 0`, le sous-titre wrap au lieu de tronquer). Dégradé, jamais tronqué.

**Et ce cas ne se produit sous aucune règle vivante** : `jalons-fins` n'est cible ni à it2, ni sous les cinq règles d'it3. C'est un plafond théorique. Règle de repli : aucune action tant que les trois mots restent ≤ 8 caractères — le budget tient ; si un mot plus long apparaissait, préférer le mot court, **jamais** tronquer le compte.

## Les neuf états — confirmés, zéro jeton neuf

| # | Cas | Texte | Ton |
|---|---|---|---|
| 1 | Section saine, compte réel | `6 fiches` | `muted` |
| 2 | Section saine, sans compte | `—` | `muted` |
| 3 | **Bloquant, sans compte** (Départ aujourd'hui) | `BLOQUANT` | `bad` |
| 4 | Bloquant, avec compte (it3) | `3 fiches · BLOQUANT` | `bad` |
| 5 | **Alerte seule, sans compte** (Canon aujourd'hui) | `ALERTE` | `neutral` |
| 6 | Alerte seule, avec compte (it3) | `12 fiches · ALERTE` | `neutral` |
| 7 | Info seule (it3) | `4 fiches · INFO` | `muted` — distinct d'une section saine **par le mot seul** |
| 8 | Plusieurs niveaux mêlés | le pire seul, jamais une liste | du pire |
| 9 | Entrée « Contrôles » | aucun badge | — |
