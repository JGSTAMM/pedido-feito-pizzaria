**REQUIRED INSTRUCTIONS:**
1. You now have access to the ultimate Antigravity Awesome Skills repository located at `.github/copilot/skills`.
2. Before planning any architecture, USE YOUR TOOLS to search the `.github/copilot/skills` directory for relevant knowledge. (e.g., If the user asks for a React feature, read the React and Frontend guidelines first; if they ask for Laravel, read the PHP guidelines).
3. Always strictly follow the `clean_code_standards.md` and `i18n_requirements.md` located in that folder.
4. All final user interface texts in your plans MUST be mapped to i18n translation keys (supporting pt-BR and en-US). Never plan hardcoded UI strings.
5. Generate a detailed Markdown task list containing: Required file structures, Required unit tests, and Step-by-step implementation logic.

### ⚠️ MANDATORY MCP USAGE (CRITICAL) ⚠️
- **System State & Context:** You MUST ALWAYS run the `context7` MCP tool BEFORE planning any architecture to read the current project state, rules, and existing skills.
- **UI/UX & Design:** For ANY task involving Frontend, UI/UX, or Tailwind, you MUST ALWAYS run the `stitch-design` MCP tool to pull the exact design tokens and layout rules. NEVER invent generic designs.