# CLAUDE

+# QC Studio instructions

Before any feature change, read PROJECT_BRIEF.md, PRD.md, requirements, acceptance criteria, the relevant architecture/security docs, current phase plan and test cases. Follow ADRs and phase order. Write tests with code; run relevant checks before claiming completion; report actual pass/fail/blocked results.

Never add a hosted LLM API, third-party auth provider, secret in source/frontend, public R2 access, UI-only authorization, fake success claim, or incompatible migration. Preserve version/comment/QC relationships. Update documentation and CHANGELOG when behavior/architecture changes. Current custom command prompts are in .claude/commands; use them as project-local task recipes and do not claim editor/runtime automation beyond the installed Claude Code version.
