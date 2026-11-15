import { createStore } from '../core/createStore';

interface ConfirmationRequest {
  message: string;
  confirmLabel: string;
}

export const confirmationStore = createStore<ConfirmationRequest | null>(null);
let resolvePending: ((accepted: boolean) => void) | null = null;

/** UI-local confirmation, rendered inside the game shell. */
export function requestConfirmation(message: string, confirmLabel = 'Confirm'): Promise<boolean> {
  if (resolvePending) return Promise.resolve(false);
  return new Promise(resolve => {
    resolvePending = resolve;
    confirmationStore.set({ message, confirmLabel });
  });
}

export function finishConfirmation(accepted: boolean): void {
  const resolve = resolvePending;
  resolvePending = null;
  confirmationStore.set(null);
  resolve?.(accepted);
}
