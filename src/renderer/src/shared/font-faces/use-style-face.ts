import type { Style } from "@shared/contracts/library";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  acquireFace,
  type FaceStatus,
  faceStatus,
  subscribeToFace,
} from "./registry";

interface StyleFaceOptions {
  /** For what she looks at directly: loads first, and loads large files too. */
  priority?: boolean;
  /**
   * Wait this long before loading. Library rows use it, so flinging past 500
   * rows loads nothing in between.
   */
  delayMs?: number;
}

/** Loads a Style's face while the component is on screen, and reports its status. */
export function useStyleFace(
  style: Style | null,
  { priority = false, delayMs = 0 }: StyleFaceOptions = {},
): FaceStatus | "idle" {
  const styleId = style?.id ?? null;

  const subscribe = useCallback(
    (onChange: () => void) =>
      styleId ? subscribeToFace(styleId, onChange) : () => {},
    [styleId],
  );
  const status = useSyncExternalStore(subscribe, () =>
    styleId ? faceStatus(styleId) : null,
  );

  useEffect(() => {
    if (!style) return;
    if (delayMs === 0) return acquireFace(style, priority);
    let release: (() => void) | undefined;
    const timer = setTimeout(() => {
      release = acquireFace(style, priority);
    }, delayMs);
    return () => {
      clearTimeout(timer);
      release?.();
    };
  }, [style, priority, delayMs]);

  if (!style) return "idle";
  return status ?? "loading";
}

/**
 * Loads these Styles in the background and keeps them loaded while they are
 * listed, so showing one next is instant. Nothing renders from them here.
 */
export function useWarmFaces(styles: readonly (Style | null)[]): void {
  const latest = useRef(styles);
  latest.current = styles;
  const ids = styles.map((style) => style?.id ?? "").join("|");

  useEffect(() => {
    const byId = new Map(
      latest.current.flatMap((style) =>
        style ? [[style.id, style] as const] : [],
      ),
    );
    const releases = ids.split("|").flatMap((id) => {
      const style = byId.get(id);
      return style ? [acquireFace(style, false)] : [];
    });
    return () => {
      for (const release of releases) release();
    };
  }, [ids]);
}
