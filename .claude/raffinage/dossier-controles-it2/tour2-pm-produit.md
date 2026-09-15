# Tour 2 — `pm-produit`

**VERDICT** : recevable sous réserve — D1 = élision conditionnelle écrite au plan, teinte seule exclue, forme du porteur laissée au tech-lead.

**RETRAIT — deux.** (1) « Zéro lot `brain/` » : `PASTILLES` existe déjà, privé, et une copie serait invisible au lint — **le lot contrat est dû quelle que soit l'issue de D1**. (2) « Jamais un compte » : KR-218, acquis au cadrage, dit « toujours fusionné avec le compte » — je le tiens désormais en position générale, pas en simple objection à la substitution.

**MAINTIEN** — « aucun badge sur l'entrée Contrôles » (personne ne conteste) ; « `n` = 4, it2 avant it3 », **durci** : le lot contrat renforce l'ordre, puisque L1 sera consommé tel quel par les cinq règles d'it3, sans second lot contrat à cette date-là.

**RÉPONSE à la QA** — que seules Canon et Départ soient atteignables à it2 ne dévalue rien : c'est le squelette légitime, **prouver le câblage `brain/` → nav → `dossier:updated` sur le cas le plus pauvre** avant qu'it3 ne disperse les états.

**D1 tranché de mon poste : élision conditionnelle**, pas substitution — jamais un vrai compte qui disparaît, ce que la substitution ferait durablement dès it3. **Teinte seule : VETO** (domaine PM, valeur utilisateur) — `info` devient invisible, `alerte` presque : l'auteur ne repère plus rien pour **deux niveaux sur trois**, valeur nulle sur le goal même.

## Hors périmètre définitif

1. **Le compte par niveau agrégé** (« 2 bloquants ») — `parSection` reste `Record<SectionId, NiveauControle | null>` sans changement de forme ; le lot contrat est une **extraction**, pas un contrat de schéma.
2. **Section saine** : badge inchangé, `muted`, compte existant — jamais de coche verte.
3. **Dossier entièrement rédigé** : les badges redeviennent muets automatiquement — comportement dérivé, couvert par un test.
4. **L'entrée « Contrôles »** : aucun badge.
5. **Le clic d'une ligne vers sa section et le focus qui suit** — actés vers it3, non rouvrables (décision humaine du cadrage).
6. **Aucune interaction propre au badge** (infobulle, popover des constats) au-delà du `onSelect` existant.
7. **`sections.ts` (registre), `IssueList.tsx`, `ListRow.tsx`** : aucune modification — définitif, plus de clause « sauf si ». *(L'export d'une constante déjà présente dans `sections.ts` n'est pas une modification du registre.)*
8. **La variante « teinte seule »** comme forme du badge — exclue.
