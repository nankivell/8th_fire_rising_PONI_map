import initial from "../store/initial";

import { TOGGLE_TILE_OVERLAY, TOGGLE_NATIVE_OVERLAY } from "../actions";

function ui(uiState = initial.ui, action) {
  switch (action.type) {
    case TOGGLE_TILE_OVERLAY:
      return {
        ...uiState,
        tiles: {
          ...uiState.tiles,
          current:
            uiState.tiles.current === uiState.tiles.satellite
              ? uiState.tiles.default
              : uiState.tiles.satellite,
        },
      };
    case TOGGLE_NATIVE_OVERLAY:
      return {
        ...uiState,
        tiles: {
          ...uiState.tiles,
          nativeOverlay: !uiState.tiles.nativeOverlay,
        },
      };
    default:
      return uiState;
  }
}

export default ui;
