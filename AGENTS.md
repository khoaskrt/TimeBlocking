<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:design-integration-rules -->
# Claude Design integration

Before integrating Claude Design output, read `DESIGN_INTEGRATION.md`.

Choose the integration mode from the user's request:

- **Partial Visual Patch** is the default for small design edits. Treat the Claude Design pass as a visual patch, identify affected components from its change summary, edit only safe presentation zones, and preserve existing component contracts, handlers, state, data flow, and unmentioned UI sections.
- **Full UI State Sync** applies when the user explicitly says the latest Claude Design output is the newest required app state, product state, source of truth, or must be synced into codebase logic/features/functions. In this mode, update all affected layers as needed: UI, container wiring, props, state hooks, data types, mock data, routes, handlers, and feature logic.

Only stop for "not visual-only" when the request was explicitly a visual patch. In Full UI State Sync mode, implement the required logic and feature changes while preserving unrelated app areas.
<!-- END:design-integration-rules -->
