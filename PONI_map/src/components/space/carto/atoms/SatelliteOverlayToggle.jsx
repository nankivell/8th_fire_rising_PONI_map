import copy from "../../../../common/data/copy.json";
import { language } from "../../../../common/utilities";
import mapImg from "../../../../assets/satelliteoverlaytoggle/map.png";
import satImg from "../../../../assets/satelliteoverlaytoggle/sat.png";
import nativeImg from "/NativelandBG.png";

const SatelliteOverlayToggle = ({
  isUsingSatellite,
  isUsingNative,
  toggleSatellite,
  toggleNative,
}) => {
  const toggleClass = isUsingSatellite
    ? "satellite-overlay-toggle-map"
    : "satellite-overlay-toggle-sat";
  const toggleImg = isUsingSatellite ? mapImg : satImg;
  const toggleLabel = isUsingSatellite
    ? copy[language].tiles.default
    : copy[language].tiles.satellite;
  const nativeLabel = copy[language].tiles.native;
  return (
    <div id="satellite-overlay-toggle" className="satellite-overlay-toggle">
      <button
        className={`satellite-overlay-toggle-button ${toggleClass}`}
        style={{ backgroundImage: `url(${toggleImg}` }}
        name="satellite-toggle"
        onClick={toggleSatellite}
      >
        <div className="label">{toggleLabel}</div>
      </button>
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
