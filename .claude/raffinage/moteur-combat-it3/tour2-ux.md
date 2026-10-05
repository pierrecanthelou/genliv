## UX · moteur-combat it3 · Tour 2

RÉPONSE À QA — AC-3.3, test B : silence = aucun nœud récit, aucun Badge, aucun message. « Narrateur indisponible » est une faute de registre. Test B : `queryByText('Le narrateur écrit…') === null` et absence de tout nœud récit.

RÉPONSE À NIA — « ni nom de monstre » : le TL injecte `monstre: string`. Contradiction TL/NIA, à trancher. Exemple révisé sans nom propre par prudence.

RÉPONSE À PM — vocabulaire « commentaire de round » : accepté.

MES OBJECTIONS :
1. Veto font-mono/italic/accent pour le récit — maintenue.
2. Silence = absence de nœud — durcie en veto (tout message de repli refusé).
3. Focus non volé, boutons actifs, pas de scroll auto — maintenue.
4. Boutons maison — maintenue dette non bloquante.

VERDICT FINAL — recevable sous réserve.

## ANNEXE — Ajustements contrat de design
- Badge sans wrapper `role` (redondant avec `role="log"` parent).
- Exemple fiction : « Votre lame glisse sur le cuir tendu de l'adversaire ; il riposte d'un coup lourd que vous esquivez de justesse. »
- Test B : ni Badge, ni `<p>` récit, ni texte de repli.
- Règle ESLint `no-restricted-syntax` rejetant « indisponible »/« Réessayer » dans EcranCombat : reportée.
