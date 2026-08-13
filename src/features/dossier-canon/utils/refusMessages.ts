/**
 * Les messages du bandeau de refus d'écriture — les QUATRE composants de cette
 * feature qui rendent un bandeau les lisent ici : `FicheLieu.tsx`,
 * `ObjectifsCanon.tsx`, `PanneauCanon.tsx`, `PanneauDepart.tsx` (posé à la revue
 * de PR de dossier-fiches it2). `EYEBROW_REFUS` était redéclaré IDENTIQUE dans
 * quatre fichiers de cette MÊME feature — une divergence de typo qui attendait.
 * N'en laisser importer que deux aurait fermé une demi-classe, ce qui est pire
 * que rien : ça donne l'illusion du traitement.
 *
 * `EYEBROW_REFUS` est commun aux DEUX statuts (`'refuse'` ET `'absent'`) —
 * c'est le même bandeau, seul le corps change (`IssueList` pour `'refuse'`,
 * `TEXTE_ABSENT` pour `'absent'`), même patron que `FichePersonnage.tsx`
 * (dossier-fiches).
 *
 * POSÉS ICI, module LOCAL à `dossier-canon` — jamais promus vers
 * `brain/components/` : des appelants d'une même feature ne justifient pas
 * un contrat partagé (KR-109, qui exige un second appelant HORS feature).
 * Entre features, la redéclaration reste correcte et non négociable — c'est
 * SEULEMENT à l'intérieur d'une feature qu'une divergence de typo menace.
 */
export const EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"
export const TEXTE_ABSENT = "Ce dossier n'existe plus — il a été supprimé ailleurs pendant que vous l'éditiez."
