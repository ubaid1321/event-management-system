/**
 * Shared shape for every server-action form result.
 *
 * This lives outside the action files on purpose: a "use server" module may
 * only export async functions, so the initial-state constants cannot sit
 * beside the actions that consume them.
 */
export interface FormState {
  /** Message to show the person, or null when nothing went wrong. */
  error: string | null;
  /** True once a save has landed. Forms use this to close themselves. */
  ok: boolean;
}

export const emptyFormState: FormState = { error: null, ok: false };
