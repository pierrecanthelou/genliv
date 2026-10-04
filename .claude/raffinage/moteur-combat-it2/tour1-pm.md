# Tour 1 — PM · moteur-combat it2

**RISQUE** — `fleeTarget` est toujours `null` (aucune entrée du bestiaire ne le porte, vestige du modèle d'arbre). D5 dit « pas de fuite sans fleeTarget ». Le bouton ne s'active jamais. Valeur nulle pour l'auteur.

**OBJECTION**
1. La démo « l'auteur voit son héros fuir » ne peut pas être vérifiée tant que la cible n'existe pas.
2. Naviguer vers `fleeTarget` ferait de l'écran un second écrivain de `lieu_courant`, hors horloge/journal/jalons. Refusé.
3. Le signal de fuite doit être persisté (`fuite?: true`). Un héros mort en fuyant laisse `combat` en place, et le rejeu le montrerait vivant sans ce signal.

**PROPOSITION** — Amender D5 dans `REGLES-PLAY.md` (KR-130) : la fuite coûte l'assaut gratuit, ne donne ni XP ni butin, et le héros reste au lieu courant. 2 lots, 5 critères.

**VERDICT** — Veto sur le cadrage tel quel (valeur nulle). Levé si la proposition est adoptée.

**Constats vérifiés** : `tryHeroFlee` ne teste pas `fleeTarget`. `MonsterInstance.fleeTarget` est un vestige du modèle d'arbre. D5 est un « Défaut proposé », pas une « Décision » — le réécrire est légitime.
