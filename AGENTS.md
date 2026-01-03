# AGENTS.md

## Git workflow

### Commit policy

- Use **Conventional Commits**:
  - `feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`, `test: ...`, `chore: ...`, `build: ...`, `ci: ...`
- Keep commits **small and working**:
  - Each commit should compile / run tests (or at least not break the build).
  - Prefer 1 logical change per commit.
- Commit message rules:
  - Imperative mood, no trailing period.
  - Optional scope: `feat(parser): ...`
  - If a change is purely mechanical (formatting), isolate it: `chore: format`.
- No “WIP” commits on `main`.

### Add changes incrementally

- Add files **one-by-one** where reasonable:
  - Introduce a new file with minimal scaffolding.
  - Follow-up commit(s) to implement behavior and tests.
- When a change touches multiple files, keep it as small as possible and explain why in the commit body.

### Branching

- Default: work directly on `main`.
- Use short-lived branches only when:
  - The change is > ~5 commits, or
  - There is risk/experimentation, or
  - You want parallel work (even solo).
- Branch naming:
  - `feat/<topic>`, `fix/<topic>`, `chore/<topic>`, `docs/<topic>`
- Merge strategy:
  - Prefer **rebase** to keep history linear.
  - If using PRs locally, use “squash merge” only when the branch history is noisy.

### Pushing

- Push to `main` is allowed.
- Push **after each working commit** or small sequence of related working commits.
- Do not push:
  - Broken states.
  - Temporary debug output.
  - Experimental commits unless isolated on a branch.

### Force pushes

- Avoid `git push --force`.
- `--force-with-lease` is allowed only after an interactive rebase of local, unpublished commits.

### Synchronization

- Before pushing:
  - `git fetch`
  - Ensure local `main` is not behind remote `main`.
- If behind:
  - `git rebase origin/main`
  - Resolve conflicts locally before pushing.

### Hygiene

- Before committing:
  - Run formatter/linter/tests if available.
  - Ensure `git status` is clean except intended changes.
- Avoid committing:
  - Secrets, credentials, large binaries, generated artifacts (unless explicitly required).
- Keep `.gitignore` updated as new tooling is introduced.

### Suggested local commands

- Create commit:
  - `git add -p`
  - `git commit -m "type(scope): message"`
- Amend last commit (message or content):
  - `git commit --amend`
- Rebase branch onto main:
  - `git fetch`
  - `git rebase origin/main`
