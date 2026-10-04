# Tour 2 — QA · moteur-combat it2

## Note

**RÉPONSES NOMMÉES**
- **TL O2** (`fuite` terminale, `jouerPosture` no-op) : convergence. Testable par `jouerPosture apres fuite rend la meme reference`.
- **TL O3** (inconscient = mort) : convergence. Testable par `tryHeroFlee frontiere inconscient` (PV 0 → mort, PV 1 → fled).
- **PM O3** (fuite persistée) : convergence. `fuite?: true` est une entrée du rejeu, KR-292 intact.

**MES OBJECTIONS**
1. Critères non observables : **retirée**. PM fournit 5 critères, TL fournit les tests nommés.
2. KR-292 chaîne de rejeu non testée : **maintenue en veto**. Le plan doit nommer explicitement un test de rejeu pur pour la fuite : deux appels à `rejouerCombat` avec le même état donnent le même résultat, et un aller-retour JSON de la session ne change rien au rejeu.
3. Définition de fini floue (`hero-fled` retire `combat`) : **retirée**. TL épingle dans `CLOTURES` + test nommé.

**VERDICT** — APPROUVÉ SOUS CONDITIONS.

Condition : le plan doit inclure les tests nommés suivants (non négociable) :
- `rejouerCombat est pur : deux appels identiques`
- `rejouerCombat identique apres aller-retour JSON de la session`
- `rejouerCombat applique la fuite apres les postures`
- `rejouerCombat ignore une fuite sur issue deja terminale`
