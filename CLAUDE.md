@AGENTS.md

## Específico de Claude Code
- Subagentes en `.claude/agents/`: `planner`, `implementer`, `reviewer`. Un subagente no puede lanzar otros: el coordinador es la sesión principal, guiada por `/coordinator`.
- Comandos en `.claude/commands/`: `/sdd-constitution`, `/sdd-spec`, `/sdd-clarify`, `/sdd-plan`, `/sdd-tasks`, `/sdd-implement`, `/sdd-validate`, `/sdd-change`, `/sdd-status`, `/coordinator`, `/feature`.
- Skills del proyecto: `sdd`, `mockup-screens`, `motion-rules`, `ahorro` (cargarla al empezar cada sesión y antes de cada encargo a un subagente: priorizar no gastar tokens innecesarios). El resto de `.claude/skills/` son skills de terceros (HyperFrames, Higgsfield).
- Guardarraíles en `.claude/settings.json`: commit, push e instalaciones siempre preguntan.
