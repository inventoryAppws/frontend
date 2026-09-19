import useGestureNavigation from "../hooks/useGestureNavigation";

/**
 * Invisible global listener that performs mouse edge drag navigation
 * (swipe left edge rightwards to go back, swipe right edge leftwards to go forward)
 * like mobile gestures, without displaying any overlays.
 */
export default function GestureNavigation() {
  useGestureNavigation();
  return null;
}

