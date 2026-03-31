import { useRef, useState, useCallback, useEffect } from 'react';
import { CalendarEvent, SLOT_HEIGHT } from '@/components/admin/calendar/types';

const LONG_PRESS_MS = 400;

export interface TouchDragState {
  isDragging: boolean;
  event: CalendarEvent | null;
  ghostX: number;
  ghostY: number;
  offsetY: number;
}

interface UseTouchDragOptions {
  zoom: number;
  onDrop: (eventId: string, date: Date, timeStr: string) => void;
  /** CSS selector or ref for the day columns container */
  gridRef: React.RefObject<HTMLElement | null>;
  /** Maps column index → Date */
  activeDays: Date[];
  /** Width of time-label gutter (px) */
  gutterWidth: number;
}

export function useTouchDrag({ zoom, onDrop, gridRef, activeDays, gutterWidth }: UseTouchDragOptions) {
  const [dragState, setDragState] = useState<TouchDragState>({
    isDragging: false, event: null, ghostX: 0, ghostY: 0, offsetY: 0,
  });

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef({ x: 0, y: 0 });
  const dragRef = useRef(dragState);
  dragRef.current = dragState;

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, event: CalendarEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };

    longPressTimer.current = setTimeout(() => {
      // Vibrate for haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(30);

      const rect = e.currentTarget.getBoundingClientRect();
      const offsetY = touch.clientY - rect.top;

      setDragState({
        isDragging: true,
        event,
        ghostX: touch.clientX,
        ghostY: touch.clientY,
        offsetY,
      });
    }, LONG_PRESS_MS);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];

    // Cancel long-press if finger moves too much before activation
    if (!dragRef.current.isDragging) {
      const dx = Math.abs(touch.clientX - touchStart.current.x);
      const dy = Math.abs(touch.clientY - touchStart.current.y);
      if (dx > 10 || dy > 10) {
        clearLongPress();
      }
      return;
    }

    // Prevent page scroll while dragging
    e.preventDefault();
    e.stopPropagation();

    setDragState(prev => ({
      ...prev,
      ghostX: touch.clientX,
      ghostY: touch.clientY,
    }));
  }, [clearLongPress]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    clearLongPress();

    const state = dragRef.current;
    if (!state.isDragging || !state.event) {
      setDragState({ isDragging: false, event: null, ghostX: 0, ghostY: 0, offsetY: 0 });
      return;
    }

    const touch = e.changedTouches[0];
    const grid = gridRef.current;

    if (grid) {
      const gridRect = grid.getBoundingClientRect();
      const relX = touch.clientX - gridRect.left;
      const relY = touch.clientY - gridRect.top + grid.scrollTop - state.offsetY;

      // Figure out which day column
      const totalColumns = activeDays.length;
      const colWidth = gridRect.width / totalColumns;
      const colIndex = Math.max(0, Math.min(totalColumns - 1, Math.floor(relX / colWidth)));
      const dropDate = activeDays[colIndex];

      // Figure out time from Y position
      const hourHeight = SLOT_HEIGHT * 2 * zoom;
      const snappedHours = Math.round((relY / hourHeight) / 0.25) * 0.25;
      let newHour = 6 + Math.floor(snappedHours);
      let newMin = Math.round((snappedHours % 1) * 60);
      if (newMin >= 60) { newHour += 1; newMin = 0; }
      if (newHour < 6) { newHour = 6; newMin = 0; }
      if (newHour > 21 || (newHour === 21 && newMin > 30)) { newHour = 21; newMin = 30; }
      const newTimeStr = `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;

      if (dropDate) {
        onDrop(state.event.id, dropDate, newTimeStr);
      }
    }

    setDragState({ isDragging: false, event: null, ghostX: 0, ghostY: 0, offsetY: 0 });
  }, [clearLongPress, gridRef, activeDays, zoom, onDrop]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => clearLongPress();
  }, [clearLongPress]);

  return {
    dragState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
