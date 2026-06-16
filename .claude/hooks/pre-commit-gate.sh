#!/usr/bin/env bash
# PreToolUse(Bash) gate — enforces the WORKFLOW.md rule deterministically:
# before any `git commit`, tsc --noEmit and jest must pass, or the commit is
# blocked (exit 2 feeds the failure back to Claude). Non-commit commands pass
# straight through. Safe-valves: if tooling/deps are missing, it skips rather
# than bricking commits.
set -uo pipefail

input=$(cat)

# Decide whether this Bash call actually invokes `git commit` (precise: checks
# each ;/&&/| segment's leading tokens, ignoring env-var and cd prefixes).
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
    if toks[i:i + 2] == ["git", "commit"]:
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
