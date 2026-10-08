#!/usr/bin/env bash
# PreToolUse(Bash|PowerShell) gate — enforces the WORKFLOW.md rule deterministically:
# before any `git commit`, tsc --noEmit and jest must pass, or the commit is
# blocked (exit 2 feeds the failure back to Claude). Non-commit commands pass
# straight through. Safe-valves: if npx/node_modules are missing, it skips rather
# than bricking commits — mais PAS python3 : requis pour analyser la commande, son
# absence BLOQUE un commit candidat (fail-closed) au lieu de le laisser passer en
# silence (trou fermé au ménage du 2026-10-08).
set -uo pipefail

input=$(cat)

# Garde bon marché (ménage 2026-10-08) : ce hook se déclenche sur CHAQUE appel
# Bash/PowerShell, et le spawn de python3 coûte cher sous Windows. Si le JSON ne
# contient même pas « git » suivi plus loin de « commit », aucun segment ne peut
# être un commit — on sort sans rien lancer. Un faux positif (les deux mots dans
# une chaîne quelconque) ne coûte que l'analyse fine ci-dessous.
case "$input" in
	*git*commit*) : ;;
	*) exit 0 ;;
esac

if ! command -v python3 >/dev/null 2>&1; then
	echo "pre-commit gate: python3 introuvable — commit bloqué par prudence (fail-closed). Restaure python3 avant de committer." >&2
	exit 2
fi

# Decide whether this call actually invokes `git commit` (precise: checks each
# ;/&&/| segment's leading tokens, ignoring env-var and sudo/env/command prefixes,
# and git's own global options — `git -C x -c k=v commit` is a commit too).
# NB: python3 -c keeps stdin free for the piped JSON (a heredoc would steal it).
decision=$(printf '%s' "$input" | python3 -c '
import json, sys, re
try: cmd = (json.load(sys.stdin).get("tool_input") or {}).get("command", "")
except Exception: cmd = ""
res = "SKIP"
for seg in re.split(r"[\n;|]|&&", cmd):
    toks = seg.strip().split()
    i = 0
    while i < len(toks) and (("=" in toks[i] and not toks[i].startswith("-")) or toks[i] in ("sudo", "env", "command")):
        i += 1
    if i >= len(toks) or toks[i] != "git":
        continue
    i += 1
    while i < len(toks) and toks[i].startswith("-"):
        if toks[i] in ("-C", "-c", "--git-dir", "--work-tree", "--namespace"):
            i += 2
        else:
            i += 1
    if i < len(toks) and toks[i] == "commit":
        res = "COMMIT"; break
print(res)
')

[ "$decision" = "COMMIT" ] || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
command -v npx >/dev/null 2>&1 || { echo "pre-commit gate: npx not found — skipping." >&2; exit 0; }
[ -d node_modules ] || { echo "pre-commit gate: node_modules missing — skipping (run npm install)." >&2; exit 0; }

if ! out=$(npx tsc --noEmit 2>&1); then
	echo "Commit blocked by pre-commit gate: tsc --noEmit failed." >&2
	printf '%s\n' "$out" | tail -20 >&2
	exit 2
fi

if ! out=$(npx jest 2>&1); then
	echo "Commit blocked by pre-commit gate: jest failed." >&2
	printf '%s\n' "$out" | tail -30 >&2
	exit 2
fi

exit 0
