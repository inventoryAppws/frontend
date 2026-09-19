import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const GESTURE_NAV_STORAGE_KEY = "gesture_nav_enabled";

export function getGestureNavEnabled() {
  try {
    const val = localStorage.getItem(GESTURE_NAV_STORAGE_KEY);
    if (val === null) return true; // Default enabled
    return val === "true" || val === true;
  } catch {
    return true;
  }
}

export function applyGestureOverscrollStyle(enabled) {
  try {
    if (typeof document !== "undefined") {
      const mode = enabled ? "auto" : "none";
      document.documentElement.style.overscrollBehaviorX = mode;
      document.body.style.overscrollBehaviorX = mode;
    }
  } catch {}
}

export function setGestureNavEnabled(enabled) {
  try {
    localStorage.setItem(GESTURE_NAV_STORAGE_KEY, JSON.stringify(enabled));
    applyGestureOverscrollStyle(enabled);
    window.dispatchEvent(new Event("gesture-nav-change"));
  } catch (err) {
    console.warn("Could not save gesture nav setting:", err);
  }
}

export default function useGestureNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    // Synchronize overscroll behavior initially
    applyGestureOverscrollStyle(getGestureNavEnabled());

    const handleSettingChange = () => {
      applyGestureOverscrollStyle(getGestureNavEnabled());
    };
    window.addEventListener("gesture-nav-change", handleSettingChange);

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isTracking = false;
    let edgeSide = null; // 'left' | 'right' | null

    const EDGE_WIDTH = 60; // px from screen border where gesture must start
    const MIN_DRAG = 50; // min horizontal px to trigger navigation
    const MAX_VERTICAL_DRIFT = 120; // max vertical drift allowed
    const MAX_DURATION = 1500; // max ms for drag gesture

    const isInteractiveElement = (target) => {
      if (!target) return false;
      const tag = target.tagName ? target.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || tag === "select" || tag === "button") {
        return true;
      }
      if (target.isContentEditable) return true;
      return false;
    };

    // --- MOUSE LISTENERS ---
    const onMouseDown = (e) => {
      if (!getGestureNavEnabled()) {
        isTracking = false;
        edgeSide = null;
        return;
      }
      if (e.button !== 0) return; // Only primary mouse button
      if (isInteractiveElement(e.target)) return;

      const clientX = e.clientX;
      const windowWidth = window.innerWidth;

      if (clientX <= EDGE_WIDTH) {
        startX = clientX;
        startY = e.clientY;
        startTime = Date.now();
        isTracking = true;
        edgeSide = "left";
      } else if (clientX >= windowWidth - EDGE_WIDTH) {
        startX = clientX;
        startY = e.clientY;
        startTime = Date.now();
        isTracking = true;
        edgeSide = "right";
      } else {
        isTracking = false;
        edgeSide = null;
      }
    };

    const onMouseUp = (e) => {
      if (!getGestureNavEnabled() || !isTracking || !edgeSide) {
        isTracking = false;
        edgeSide = null;
        return;
      }

      const deltaX = e.clientX - startX;
      const deltaY = Math.abs(e.clientY - startY);
      const duration = Date.now() - startTime;

      isTracking = false;

      if (duration <= MAX_DURATION && deltaY <= MAX_VERTICAL_DRIFT) {
        if (edgeSide === "left" && deltaX >= MIN_DRAG) {
          // Dragged from left edge to right -> GO BACK
          navigate(-1);
        } else if (edgeSide === "right" && deltaX <= -MIN_DRAG) {
          // Dragged from right edge to left -> GO FORWARD
          navigate(1);
        }
      }

      edgeSide = null;
    };

    // --- TOUCH LISTENERS (Mobile / Touchscreen support) ---
    const onTouchStart = (e) => {
      if (!getGestureNavEnabled()) {
        isTracking = false;
        edgeSide = null;
        return;
      }
      if (e.touches.length !== 1) return;
      if (isInteractiveElement(e.target)) return;

      const touch = e.touches[0];
      const clientX = touch.clientX;
      const windowWidth = window.innerWidth;

      if (clientX <= EDGE_WIDTH) {
        startX = clientX;
        startY = touch.clientY;
        startTime = Date.now();
        isTracking = true;
        edgeSide = "left";
      } else if (clientX >= windowWidth - EDGE_WIDTH) {
        startX = clientX;
        startY = touch.clientY;
        startTime = Date.now();
        isTracking = true;
        edgeSide = "right";
      } else {
        isTracking = false;
        edgeSide = null;
      }
    };

    const onTouchEnd = (e) => {
      if (!getGestureNavEnabled() || !isTracking || !edgeSide) {
        isTracking = false;
        edgeSide = null;
        return;
      }
      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);
      const duration = Date.now() - startTime;

      isTracking = false;

      if (duration <= MAX_DURATION && deltaY <= MAX_VERTICAL_DRIFT) {
        if (edgeSide === "left" && deltaX >= MIN_DRAG) {
          navigate(-1);
        } else if (edgeSide === "right" && deltaX <= -MIN_DRAG) {
          navigate(1);
        }
      }

      edgeSide = null;
    };

    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("gesture-nav-change", handleSettingChange);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [navigate]);
}
