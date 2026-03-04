import copy from "../../../../common/data/copy.json";
import { language } from "../../../../common/utilities";

import nativeImg from "/NativelandBG.png";

const SatelliteOverlayToggle = ({
  
  isUsingNative,

  toggleNative,
}) => {
  const toggleClass = isUsingSatellite
    ? "satellite-overlay-toggle-map"
    : "satellite-overlay-toggle-sat";
  const toggleImg = isUsingSatellite ? mapImg : satImg;

  const nativeLabel = copy[language].tiles.native;
  return (
    <div id="satellite-overlay-toggle" className="satellite-overlay-toggle">
      <button
       
        className={`satellite-overlay-toggle-button native-toggle ${
          isUsingNative ? "satellite-overlay-toggle-active" : ""
        }`}
        style={{ backgroundImage: `url(${nativeImg})` }}
        name="native-toggle"
        onClick={toggleNative}
      >
        <div className="label">{nativeLabel}</div>
      </button>
    </div>
  );
};

export default SatelliteOverlayToggle;
