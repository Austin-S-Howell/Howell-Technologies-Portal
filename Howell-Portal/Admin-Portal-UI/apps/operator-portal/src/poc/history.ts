import { clonePOCState } from "./defaults";
import type { POCHistoryState, POCGeneratorState } from "./types";

export const POC_HISTORY_LIMIT = 100;

export function createPOCHistoryState(initialState: POCGeneratorState): POCHistoryState {
  const baseline = clonePOCState(initialState);
  return {
    current: baseline,
    initialSnapshot: clonePOCState(baseline),
    undoStack: [],
    redoStack: [],
  };
}

function pushHistory(stack: POCGeneratorState[], previousState: POCGeneratorState): POCGeneratorState[] {
  const next = [...stack, clonePOCState(previousState)];
  if (next.length > POC_HISTORY_LIMIT) {
    next.splice(0, next.length - POC_HISTORY_LIMIT);
  }
  return next;
}

export function pocStateEquals(left: POCGeneratorState, right: POCGeneratorState): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function applyPOCChange(
  history: POCHistoryState,
  updater: (state: POCGeneratorState) => POCGeneratorState,
): POCHistoryState {
  const nextCurrent = updater(history.current);
  if (pocStateEquals(history.current, nextCurrent)) {
    return history;
  }

  return {
    ...history,
    current: clonePOCState(nextCurrent),
    undoStack: pushHistory(history.undoStack, history.current),
    redoStack: [],
  };
}

export function undoPOCChange(history: POCHistoryState): POCHistoryState {
  if (!history.undoStack.length) {
    return history;
  }
  const nextUndo = [...history.undoStack];
  const previous = nextUndo.pop();
  if (!previous) {
    return history;
  }
  return {
    ...history,
    current: clonePOCState(previous),
    undoStack: nextUndo,
    redoStack: pushHistory(history.redoStack, history.current),
  };
}

export function redoPOCChange(history: POCHistoryState): POCHistoryState {
  if (!history.redoStack.length) {
    return history;
  }
  const nextRedo = [...history.redoStack];
  const nextState = nextRedo.pop();
  if (!nextState) {
    return history;
  }
  return {
    ...history,
    current: clonePOCState(nextState),
    redoStack: nextRedo,
    undoStack: pushHistory(history.undoStack, history.current),
  };
}

export function discardPOCChanges(history: POCHistoryState): POCHistoryState {
  return {
    ...history,
    current: clonePOCState(history.initialSnapshot),
    undoStack: [],
    redoStack: [],
  };
}
