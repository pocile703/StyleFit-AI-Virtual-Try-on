import { useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";

const subscribe = () => () => {};

/**
 * False during SSR and on the first client render, true afterwards.
 *
 * `useReducedMotion()` can only know the user's preference in the browser, so
 * a component that swaps its whole tree on it renders one shape on the server
 * and another on hydration — React then throws a hydration mismatch. Gating the
 * swap on this hook makes both passes agree, and the reduced tree appears on
 * the render straight after.
 *
 * Only needed where the *tree shape* changes. Motion props that just switch
 * between `false` and an initial state are fine without it.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

/**
 * `useReducedMotion()`, but false until hydration has finished.
 *
 * Use this anywhere the preference changes what is *rendered* — a different
 * element, or a different `initial` style — rather than only how it animates.
 * The server always renders the motion version, the client's first pass agrees
 * with it, and the calm version takes over on the very next render.
 */
export function useCalmMotion(): boolean {
  const hydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  return hydrated && Boolean(prefersReduced);
}
