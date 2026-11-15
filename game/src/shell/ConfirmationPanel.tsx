import { useEffect, useRef } from 'preact/hooks';
import { useStore } from '../core/createStore';
import { confirmationStore, finishConfirmation } from '../shared/confirmation';

export function ConfirmationPanel() {
  const request = useStore(confirmationStore, value => value);
  const cancel = useRef<HTMLButtonElement>(null);
  const accept = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!request) return;
    const previous = document.activeElement as HTMLElement | null;
    cancel.current?.focus();
    return () => previous?.isConnected && previous.focus();
  }, [request]);

  if (!request) return null;
  return <div class="shell-overlay shell-confirmation" role="dialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-message" onKeyDown={event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      finishConfirmation(false);
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      if (document.activeElement === cancel.current) accept.current?.focus();
      else cancel.current?.focus();
    }
  }}>
    <section class="shell-confirmation-panel">
      <h2 id="confirmation-title">{request.confirmLabel}</h2>
      <p id="confirmation-message">{request.message}</p>
      <div class="shell-confirmation-actions">
        <button ref={cancel} type="button" class="shell-btn" onClick={() => finishConfirmation(false)}>Cancel</button>
        <button ref={accept} type="button" class="shell-btn shell-btn-primary" onClick={() => finishConfirmation(true)}>{request.confirmLabel}</button>
      </div>
    </section>
  </div>;
}
