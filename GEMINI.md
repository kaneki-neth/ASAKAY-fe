# Gemini CLI Bootstrap: ASAKAY Frontend

This file provides a standardized bootstrap process that future AI models can use when entering this project. The goal is to ensure that any future model inherits the accumulated project knowledge instead of starting from zero.

## Mandatory Entry Point

When a new model or agent enters the project:
1. Read this file first.
2. Load the required agent knowledge files.
3. Establish project context.
4. Understand historical decisions.
5. Learn project business rules.
6. Continue project development using existing knowledge.

Treat this file as the mandatory entry point into the repository.

## Required Startup Sequence

### Phase 1: Identity
Read:
- `agent/agent.md`
- `agent/persona.md`
- `agent/operating-system.md`

**Purpose:** Understand identity, mission, operating behavior, workflow standards, and engineering principles.

### Phase 2: Project Context
Read:
- `project/project-overview.md`
- `project/architecture.md`

**Purpose:** Understand system goals, technology stack, architecture, and core modules.

### Phase 3: Historical Knowledge
Read:
- `agent/memory.md`
- `agent/lessons-learned.md`
- `agent/decisions.md`

**Purpose:** Understand previous discoveries, mistakes to avoid, architectural rationale, and historical context.

### Phase 4: Project Rules
Read:
- `project/business-rules.md`
- `project/patterns/`

**Purpose:** Understand business logic, development standards, and existing implementation patterns.

### Phase 5: Task-Specific Context
Only load relevant module documentation from `project/modules/`.

## Continuity Requirement

- Assume existing decisions were made intentionally.
- Reuse existing patterns.
- Business rules are authoritative.
- Knowledge repository files are the primary source of truth.

Before implementing new functionality, ask:
1. Does the repository already contain guidance?
2. Is there an existing pattern?
3. Is there an existing business rule?
4. Has a similar problem already been solved?

## Repository Maintenance

After completing work, update:
- `agent/memory.md`
- `agent/lessons-learned.md`
- `agent/skills.md`
- `agent/decisions.md`
- `project/modules/` (relevant documentation)
- `agent/changelog.md`

## Bootstrap Rule

Before performing any non-trivial task:
1. Load required context.
2. Review applicable rules.
3. Review applicable lessons.
4. Review applicable module documentation.
5. Create a plan.
6. Execute.
7. Verify.
8. Update knowledge.

## Global Component & Pattern Mandate

To maintain UI/UX consistency across the application, **always** prioritize using and creating shared components or composables for generic functionality. 

**Mandatory Shared Patterns:**
- **Confirmation Modals:** Always use the `useAppConfirm` composable (`src/composables/useAppConfirm.ts`) for delete or sensitive action confirmations. **Never** use `confirm.require` or local dialogs directly in pages.
- **Toast Notifications:** Always use the global toast system. If a helper or event-based toast trigger exists, use it instead of local PrimeVue `useToast` calls where possible to ensure consistent formatting.
- **Data Tables:** Always use the `AppDataTable` component (`src/components/AppDataTable.vue`) for lists and data displays.
- **Empty Values:** Always use a dash (`"-"`) as the default display value for empty strings, nulls, or undefined fields in tables and detail views. Never leave a field completely empty (e.g., use `{{ data.field || '-' }}`).
- **Future Components:** Before creating any new UI component (e.g., Modals, Drawers, Pickers, Wrappers), check if a shared version exists.
 If the component is likely to be reused, it **must** be implemented as a shared component in `src/components/` or a shared composable in `src/composables/`.

When implementing a new module, check `src/components/` and `src/composables/` for existing patterns before creating local ones. AI agents must strictly follow these established standards for all future tasks.
