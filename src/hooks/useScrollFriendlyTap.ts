import { useCallback, useRef } from "react";

const MOVE_THRESHOLD_PX = 10;

/** Fires onTap only when the pointer did not move (scroll vs tap on mobile). */
export function useScrollFriendlyTap(onTap: () => void) {
  const pointer = useRef({ x: 0, y: 0, moved: false });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointer.current = { x: e.clientX, y: e.clientY, moved: false };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (pointer.current.moved) return;
    const dx = Math.abs(e.clientX - pointer.current.x);
    const dy = Math.abs(e.clientY - pointer.current.y);
    if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
      pointer.current.moved = true;
    }
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (pointer.current.moved) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      onTap();
    },
    [onTap],
  );

  const onPointerCancel = useCallback(() => {
    pointer.current.moved = true;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
