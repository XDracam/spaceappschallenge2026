import type { RefObject } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';

interface DialogOptions {
  open: boolean;
  root: RefObject<HTMLElement>;
  modal?: boolean;
  onClose?: () => void;
  initialFocus?: RefObject<HTMLElement>;
}

interface OpenDialog { root: HTMLElement; modal: boolean }
const stack: OpenDialog[] = [];
const muted = new Map<HTMLElement, boolean>();
const focusable = 'button, [href], input, select, textarea, [tabindex]';

/** Restore previous inert values before isolating the topmost modal's DOM branch. */
function isolate() {
  for (const [element, wasInert] of muted) element.inert = wasInert;
  muted.clear();
  const top = stack[stack.length - 1];
  if (!top?.modal) return;
  let branch: HTMLElement = top.root;
  while (branch.parentElement) {
    for (const sibling of Array.from(branch.parentElement.children)) {
      if (sibling !== branch && sibling instanceof HTMLElement) {
        muted.set(sibling, sibling.inert);
        sibling.inert = true;
      }
    }
    branch = branch.parentElement;
    if (branch === document.body) break;
  }
}

function controls(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(focusable)).filter(element =>
    element.tabIndex >= 0 && !element.matches(':disabled') && !element.closest('[inert]')
    && element.getClientRects().length > 0);
}

/** Focus lifecycle for existing in-game dialogs; nested dialogs alone own Escape/Tab. */
export function useDialog({ open, root, modal = true, onClose, initialFocus }: DialogOptions): void {
  const latest = useRef({ onClose, initialFocus });
  latest.current = { onClose, initialFocus };
  useLayoutEffect(() => {
    const element = root.current;
    if (!open || !element) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalTabindex = element.getAttribute('tabindex');
    if (originalTabindex === null) element.tabIndex = -1;
    // A nonmodal surface opened over an existing modal cannot release that modal's
    // background. It temporarily inherits containment until it closes.
    const entry = { root: element, modal: modal || stack.some(dialog => dialog.modal) };
    stack.push(entry);
    isolate();
    const focusFirst = () => (latest.current.initialFocus?.current ?? element.querySelector<HTMLElement>('[autofocus]') ?? controls(element)[0] ?? element).focus();
    focusFirst();
    const onKey = (event: KeyboardEvent) => {
      if (stack[stack.length - 1] !== entry) return;
      if (event.key === 'Escape' && latest.current.onClose) {
        event.preventDefault();
        event.stopImmediatePropagation();
        latest.current.onClose();
      } else if (event.key === 'Tab' && entry.modal) {
        const items = controls(element);
        const first = items[0], last = items[items.length - 1];
        if (!first) { event.preventDefault(); element.focus(); }
        else if (!element.contains(document.activeElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (entry.modal && stack[stack.length - 1] === entry && !element.contains(event.target as Node)) focusFirst();
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', onFocus);
    return () => {
      const wasTop = stack[stack.length - 1] === entry;
      stack.splice(stack.indexOf(entry), 1);
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocus);
      if (originalTabindex === null) element.removeAttribute('tabindex');
      isolate();
      if (wasTop && previous?.isConnected && !previous.closest('[inert]')) previous.focus();
    };
  }, [open, root, modal]);
}
