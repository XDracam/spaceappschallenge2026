import { useRef } from 'preact/hooks';
import { useDialog } from '../shared/useDialog';
import { useStore } from '../core/createStore';
import { confirmationStore, finishConfirmation } from '../shared/confirmation';

export function ConfirmationPanel() {
  const request = useStore(confirmationStore, value => value);
  const root = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useDialog({ open: !!request, root, initialFocus: cancel, onClose: () => finishConfirmation(false) });

  if (!request) return null;
  return <div ref={root} class="shell-overlay shell-confirmation" role="dialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-message">
    <section class="shell-confirmation-panel">
      <h2 id="confirmation-title">{request.confirmLabel}</h2>
      <p id="confirmation-message">{request.message}</p>
      <div class="shell-confirmation-actions">
        <button ref={cancel} type="button" class="shell-btn" onClick={() => finishConfirmation(false)}>Cancel</button>
        <button type="button" class="shell-btn shell-btn-primary" onClick={() => finishConfirmation(true)}>{request.confirmLabel}</button>
      </div>
    </section>
  </div>;
}
