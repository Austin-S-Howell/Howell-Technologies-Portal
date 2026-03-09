import { describe, expect, it } from "vitest";
import { createDefaultPOCState } from "./defaults";
import { applyPOCChange, createPOCHistoryState, discardPOCChanges, redoPOCChange, undoPOCChange } from "./history";

describe("poc history", () => {
  it("supports undo and redo", () => {
    let history = createPOCHistoryState(createDefaultPOCState());

    history = applyPOCChange(history, (current) => ({
      ...current,
      configName: "First",
    }));
    history = applyPOCChange(history, (current) => ({
      ...current,
      configName: "Second",
    }));

    expect(history.current.configName).toBe("Second");
    history = undoPOCChange(history);
    expect(history.current.configName).toBe("First");
    history = redoPOCChange(history);
    expect(history.current.configName).toBe("Second");
  });

  it("discard all resets to snapshot and clears history", () => {
    let history = createPOCHistoryState(createDefaultPOCState());
    history = applyPOCChange(history, (current) => ({
      ...current,
      configName: "Edited Name",
    }));

    const discarded = discardPOCChanges(history);
    expect(discarded.current.configName).toBe("Howell Demo POC");
    expect(discarded.undoStack).toHaveLength(0);
    expect(discarded.redoStack).toHaveLength(0);
  });
});
