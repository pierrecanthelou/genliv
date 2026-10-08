# Narratif & IA — dossier-repetition it3, tour 1

**RISQUE** — Le rapport ne porte que le lieu final et le nombre de combats. Pour les constats et le dépliable, il faut une trace par pas et la liste des lieux visités. Extension significative du type rapport, qui doit rester déterministe sans miroir de session (KR-013).

**OBJECTION** — Le dépliable exige une trace collectée pendant la simulation, pas après. La session est consommée dans repeter() et n'est pas retournée. `lieux_visites` seul ne suffit pas : le dépliable veut savoir à quel pas le joueur est arrivé où et si un combat s'est produit.

parler/agir : à exclure. Sans IA, parler serait un automate arbitraire qui ne mesure rien. La co-présence (lieu visité = PNJ atteint si presence[].lieu_id matche) est une approximation honnête. Le libellé « NON ATTEINT EN 20 PAS » est exact pour la co-présence.

**PROPOSITION**
1. `lieux_visites: readonly string[]` + `trace: readonly TracePas[]` dans RapportRepetition. `TracePas = { pas: number, lieu_id: string, combat?: string }`. Borné par PAS_MAX=20.
2. PNJ « atteints » = dérivé par le panneau : `personnages.filter(p => (p.presence ?? []).some(pr => lieux_visites.includes(pr.lieu_id)))`. Jamais dans le rapport (KR-013).
3. Ni parler ni agir dans cette itération.
4. Chaque élément référence par identifiant stable, noms résolus à l'affichage.

**VERDICT** — recevable sous réserve : (a) trace + lieux_visites dans le rapport, (b) PNJ atteints dérivés par co-présence, (c) parler/agir exclus.
