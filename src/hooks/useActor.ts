// Very simple placeholder for the ICP actor hook.
// You can replace this with real actor initialization later.

export type Actor<T = unknown> = T;

export function useActor<T = unknown>() {
  const actor = {} as T;
  return { actor };
}
