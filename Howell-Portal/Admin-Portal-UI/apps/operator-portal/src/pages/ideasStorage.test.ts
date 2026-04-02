import { afterEach, describe, expect, it } from "vitest";
import {
  EMPTY_IDEAS_BOARD_STATE,
  getIdeasStorageKey,
  IDEAS_STORAGE_KEY,
  loadIdeasBoardState,
  MIN_NOTE_HEIGHT,
  MIN_NOTE_WIDTH,
  saveIdeasBoardState,
  type IdeasBoardState,
} from "./ideasStorage";

describe("ideasStorage", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("round-trips whiteboard state through localStorage", () => {
    const state: IdeasBoardState = {
      notes: [
        {
          id: "note-1",
          x: 0.2,
          y: 0.3,
          width: MIN_NOTE_WIDTH,
          height: MIN_NOTE_HEIGHT,
          text: "Capture release ideas",
          color: "#f8e587",
        },
      ],
      paths: [
        {
          points: [
            { x: 0.1, y: 0.1 },
            { x: 0.4, y: 0.5 },
          ],
          color: "#b86b3d",
          width: 6,
          tool: "draw",
        },
      ],
    };

    saveIdeasBoardState(state);

    expect(loadIdeasBoardState()).toEqual(state);
  });

  it("falls back to an empty state for invalid persisted data", () => {
    window.localStorage.setItem(IDEAS_STORAGE_KEY, "{not-json");

    expect(loadIdeasBoardState()).toEqual(EMPTY_IDEAS_BOARD_STATE);
  });

  it("supports separate storage keys for shared and private boards", () => {
    saveIdeasBoardState(EMPTY_IDEAS_BOARD_STATE, "shared");
    window.localStorage.setItem(getIdeasStorageKey("private:austin@howelltechnologies.com"), "{not-json");

    expect(loadIdeasBoardState("shared")).toEqual(EMPTY_IDEAS_BOARD_STATE);
    expect(loadIdeasBoardState("private:austin@howelltechnologies.com")).toEqual(EMPTY_IDEAS_BOARD_STATE);
  });
});
