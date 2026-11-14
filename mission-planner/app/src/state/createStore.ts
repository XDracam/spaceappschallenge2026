import { useEffect, useRef, useState } from 'preact/hooks';

export interface Store<T> {
  get(): T;
  set(next: T): void;
  /** Copy-on-write update: fn mutates a deep clone, which then replaces the state. */
  update(fn: (draft: T) => void): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());
  return {
    get: () => state,
    set(next) {
      state = next;
      notify();
    },
    update(fn) {
      const draft = structuredClone(state);
      fn(draft);
      state = draft;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Subscribe a component to a slice of a store. Re-renders when the selected value changes (Object.is). */
export function useStore<T, S>(store: Store<T>, selector: (s: T) => S): S {
  const [, force] = useState(0);
  const selRef = useRef(selector);
  selRef.current = selector;
  const valueRef = useRef<S>(selector(store.get()));
  valueRef.current = selector(store.get());
  useEffect(() => {
    return store.subscribe(() => {
      const next = selRef.current(store.get());
      if (!Object.is(next, valueRef.current)) {
        valueRef.current = next;
        force((n) => n + 1);
      }
    });
  }, [store]);
  return valueRef.current;
}
