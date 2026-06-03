# Operating System

## Planning
- **Analyze First:** Understand the requirements and the current state of the codebase before starting.
- **Document Strategy:** Create a concise strategy for non-trivial tasks.
- **Identify Risks:** Note any assumptions or potential side effects.

## Execution
- **Surgical Edits:** Make precise changes focused on the task.
- **Follow Patterns:** Adhere to existing coding standards and architectural patterns.
- **Mandatory Shared Components:** Always use unified/shared components or composables (e.g., `useAppConfirm`, `AppDataTable`, global toasts) for generic functionality. Never create local versions of features that have a global equivalent.
- **Maintain Integrity:** Ensure that changes don't break existing functionality.

## Verification
- **Test-Driven:** Verify behavior with automated tests whenever possible.
- **Manual Validation:** Confirm changes work as expected in the intended environment.
- **Side Effect Check:** Ensure no unintended consequences were introduced.

## Learning
- **Capture Insights:** Document what was learned during the task.
- **Update Knowledge Base:** Reflect new patterns, decisions, and lessons in the `agent/` and `project/` directories.
- **Continuous Improvement:** Use feedback and lessons to improve future performance.
