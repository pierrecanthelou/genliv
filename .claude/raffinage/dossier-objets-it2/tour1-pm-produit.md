# Raffinage `dossier-objets` it2 — Tour 1 (PM)

**RISQUE** — Le critère d'acceptation #4 exige que le refus « nomme le personnage/savoir fautif ». Or `REFERENCES_SIMPLES` (tables.ts:484) n'a **aucun `sujet` personnalisé** pour `savoirs[].revele_si.contrepartie.objet_id` — contrairement à `depart.lieu_id` qui en a un (`sujet: 'Le point de départ'`). Le message retombe sur `Le champ « objet_id » pointe…`, et `location` ne résout que le **personnage** (via `localiserEntite`), jamais le savoir précis. Si un personnage porte plusieurs savoirs, l'auteur sait *qui* mais pas *lequel*. La « découverte » « zéro code brain/ » risque d'être fausse au regard du texte même du critère — pas une hypothèse à trancher par défaut d'essaim, mais avant.

**OBJECTION** — Le goal cite deux précédents au mécanisme divergent (it7 : Modal ; dossier-canon it4 : retrait immédiat sans Modal) sans dire lequel s'applique ici pour *cette* action destructive et irréversible (§ Dangerous Actions, CLAUDE.md, non négociable). `design_contract.composants` a déjà tranché (« Modal (retrait) » listé) — mais le texte de l'it2 lui-même ne le répète pas, laissant la porte ouverte à ce qu'un essaim reproduise le raccourci de dossier-canon.

**PROPOSITION** — (1) Le tech-lead confirme/infirme explicitement en tour 1 si la localisation personnage seule satisfait « nomme… le savoir fautif », sinon un `sujet` d'une ligne sur l'entrée tables.ts (pas un mécanisme neuf). (2) La phrase de clôture nomme le Modal (précédent it7 + `forwardRef`/`useImperativeHandle`, anti-BUG-078). Aucun ajout de lot — clarification de définition, pas d'extension.

**VERDICT** — recevable sous réserve (les deux points ci-dessus, vérifiables en tour 1 sans toucher au périmètre).
