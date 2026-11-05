/**
 * Install-prompt gate. AGENTS.md: "Never interrupt reading with an install
 * prompt. Offer installation only after a tool is used or from a settings link."
 *
 * The flag is a plain boolean that a tool was used. It holds no health content.
 */
const KEY = 'menowell_tool_used';

export function markToolUsed(): void {
  try {
    window.localStorage.setItem(KEY, '1');
  } catch {
    // Storage blocked (private mode): the install banner simply never appears.
  }
}

export function hasUsedTool(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
