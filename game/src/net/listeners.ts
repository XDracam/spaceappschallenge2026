type Listener<A extends unknown[]> = (...args: A) => void;

/** Snapshot dispatch lets listeners subscribe/unsubscribe while an event is emitted. */
export function listeners<A extends unknown[]>(errorPrefix: string) {
  const set = new Set<Listener<A>>();
  return {
    add(cb: Listener<A>) {
      set.add(cb);
      return () => { set.delete(cb); };
    },
    emit(...args: A) {
      for (const cb of [...set]) {
        try { cb(...args); }
        catch (error) { console.error(errorPrefix, error); }
      }
    },
    get size() { return set.size; },
  };
}
