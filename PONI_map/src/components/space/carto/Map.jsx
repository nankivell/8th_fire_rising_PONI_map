/* global L */
import { bindActionCreators } from "redux";
import "leaflet";
import { createRef, Component } from "react";
import { flushSync } from "react-dom";
import Supercluster from "supercluster";
import { isMobileOnly } from "react-device-detect";

import { connect } from "react-redux";
import config from "../../../../config";
import * as actions from "../../../actions";
import * as selectors from "../../../selectors";

import Sites from "./atoms/Sites";
import Regions from "./atoms/Regions";
import Events from "./atoms/Events";
import Clusters from "./atoms/Clusters";
import SelectedEvents from "./atoms/SelectedEvents";
import Portal from "../../Portal";
import Narratives from "./atoms/Narratives";
import DefsMarkers from "./atoms/DefsMarkers";
import LoadingOverlay from "../../atoms/Loading";
import SatelliteOverlayToggle from "./atoms/SatelliteOverlayToggle";

import {
  mapClustersToLocations,
  isIdentical,
  isLatitude,
  isLongitude,
  calculateTotalClusterPoints,
  calcClusterSize,
} from "../../../common/utilities";

// NB: important constants for map, TODO: make statics
// Note: Base map is OpenStreetMaps by default; can choose another base map
const supportedMapboxMap = ["streets", "satellite"];
const defaultToken = "your_token";

class Map extends Component {
  constructor() {
    super();
    this.projectPoint = this.projectPoint.bind(this);
    this.onClusterSelect = this.onClusterSelect.bind(this);
    this.loadClusterData = this.loadClusterData.bind(this);
    this.getClusterChildren = this.getClusterChildren.bind(this);
    this.svgRef = createRef();
    this.map = null;
    this.superclusterIndex = null;
    this.tileLayer = null;
    this.nativeLayer = null;
    this.nativeGeoJson = null;
    this.nativeFetchInFlight = null;
    this.activeNativeFeature = null;
    this.nativeMapClickBound = false;
    this.state = {
      mapTransformX: 0,
      mapTransformY: 0,
      indexLoaded: false,
      clusters: [],
    };
    this.styleLocation = this.styleLocation.bind(this);
  }

  componentDidMount() {
    if (this.map === null) {
      this.initializeMap();
      this.initializeTileLayer();
      this.initializeNativeOverlay();
    }
    window.dispatchEvent(new Event("resize"));
  }

  componentDidUpdate(prevProps) {
    if (prevProps.ui.tile !== this.props.ui.tile && this.map) {
      this.initializeTileLayer();
    }
    if (
      prevProps.ui.isUsingNative !== this.props.ui.isUsingNative &&
      this.map
    ) {
      this.initializeNativeOverlay();
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!isIdentical(nextProps.domain.locations, this.props.domain.locations)) {
      this.loadClusterData(nextProps.domain.locations);
    }

    // Set appropriate zoom for narrative
    const { bounds } = nextProps.app.map;
    if (!isIdentical(bounds, this.props.app.map.bounds) && bounds !== null) {
      this.map.fitBounds(bounds);
    } else {
      if (!isIdentical(nextProps.app.selected, this.props.app.selected)) {
        // Fly to first  of events selected
        const eventPoint =
          nextProps.app.selected.length > 0 ? nextProps.app.selected[0] : null;

        if (
          eventPoint !== null &&
          eventPoint.latitude &&
          eventPoint.longitude
        ) {
          // this.map.setView([eventPoint.latitude, eventPoint.longitude])
          this.map.setView(
            [eventPoint.latitude, eventPoint.longitude],
            this.map.getZoom(),
            {
              animate: true,
              pan: {
                duration: 0.7,
              },
            }
          );
        }
      }
    }
  }

  getTileUrl(tile) {
    if (
      supportedMapboxMap.indexOf(tile) !== -1 &&
      config.MAPBOX_TOKEN &&
      config.MAPBOX_TOKEN !== defaultToken
    ) {
      return `https://api.mapbox.com/v4/mapbox.${tile}/{z}/{x}/{y}@2x.png?access_token=${config.MAPBOX_TOKEN}`;
    } else if (config.MAPBOX_TOKEN && config.MAPBOX_TOKEN !== defaultToken) {
      return `https://api.mapbox.com/styles/v1/${tile}/tiles/256/{z}/{x}/{y}@2x?access_token=${config.MAPBOX_TOKEN}`;
      // `http://a.tiles.mapbox.com/styles/v1/${this.props.ui.tiles}/tiles/{z}/{x}/{y}?access_token=${config.MAPBOX_TOKEN}`
    } else {
      return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      // "https://api.maptiler.com/maps/bright/256/{z}/{x}/{y}.png?key="
    }
  }

  /**
   * Initialize the base tile layer based on the ui state
   */
  initializeTileLayer() {
    if (!this.map) {
      return;
    }

    const url = this.getTileUrl(this.props.ui.tile);
    /**
     * If a tile layer already exists, we update its url. Otherwise, we create it and add it to the map.
     */
    if (this.tileLayer) {
      this.tileLayer.setUrl(url);
    } else {
      this.tileLayer = L.tileLayer(url);
      this.tileLayer.addTo(this.map);
    }
  }

  initializeNativeOverlay() {
    if (!this.map) return;
    const isEnabled = this.props.ui.isUsingNative;
    const url = config.NATIVE_LAND_GEOJSON_URL;
    if (!url) return;
    if (!this.map.getPane("nativeLandPane")) {
      this.map.createPane("nativeLandPane");
      const pane = this.map.getPane("nativeLandPane");
      pane.style.zIndex = 300;
      pane.style.pointerEvents = "auto";
    }
    const colorRamp = [
      "#ed5151ff",
      "#149eceff",
      "#a7c636ff",
      "#9e559cff",
      "#fc921fff",
      "#ffde3eff",
    ];
    const pickColor = (feature) => {
      const props = feature?.properties || {};
      const key =
        props.name ||
        props.Name ||
        props.title ||
        props.Territory ||
        props.id ||
        JSON.stringify(props);
      let hash = 0;
      for (let i = 0; i < key.length; i += 1) {
        hash = (hash << 5) - hash + key.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % colorRamp.length;
      return colorRamp[idx];
    };
    const bindTerritoryTooltip = (feature, layer) => {
      const props = feature?.properties || {};
      const label =
        props.name ||
        props.Name ||
        props.title ||
        props.Title ||
        props.territory ||
        props.Territory ||
        props.id ||
        "Territory";
      if (!label) return;
      layer.bindTooltip(label, {
        className: "native-land-tooltip",
        direction: "top",
        opacity: 0.9,
        sticky: true,
      });
      layer.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        if (this.activeNativeFeature && this.activeNativeFeature !== layer) {
          this.activeNativeFeature.setStyle({
            weight: 1,
            opacity: 0.7,
            fillOpacity: 0.12,
          });
          this.activeNativeFeature.closeTooltip();
        }
        layer.setStyle({
          weight: 2,
          opacity: 0.95,
          fillOpacity: 0.3,
        });
        this.activeNativeFeature = layer;
        layer.openTooltip(e.latlng);
      });
    };

    if (isEnabled) {
      if (!this.nativeMapClickBound) {
        this.nativeMapClickBound = true;
        this.map.on("click", () => {
          if (this.activeNativeFeature) {
            this.activeNativeFeature.setStyle({
              weight: 1,
              opacity: 0.7,
              fillOpacity: 0.12,
            });
            this.activeNativeFeature.closeTooltip();
            this.activeNativeFeature = null;
          }
        });
      }
      if (this.nativeLayer) {
        this.nativeLayer.addTo(this.map);
        return;
      }
      if (this.nativeGeoJson) {
        this.nativeLayer = L.geoJSON(this.nativeGeoJson, {
          pane: "nativeLandPane",
          style: (feature) => ({
            color: pickColor(feature),
            weight: 1,
            opacity: 0.7,
            fillOpacity: 0.12,
          }),
          onEachFeature: bindTerritoryTooltip,
        });
        this.nativeLayer.addTo(this.map);
        return;
      }
      if (!this.nativeFetchInFlight) {
        this.nativeFetchInFlight = fetch(url)
          .then((res) => res.json())
          .then((data) => {
            this.nativeGeoJson = data;
            this.nativeLayer = L.geoJSON(this.nativeGeoJson, {
              pane: "nativeLandPane",
              style: (feature) => ({
                color: pickColor(feature),
                weight: 1,
                opacity: 0.7,
                fillOpacity: 0.12,
              }),
              onEachFeature: bindTerritoryTooltip,
            });
            if (this.props.ui.isUsingNative && this.map) {
              this.nativeLayer.addTo(this.map);
            }
          })
          .catch(() => {
            this.nativeGeoJson = null;
          })
          .finally(() => {
            this.nativeFetchInFlight = null;
          });
      }
    } else if (this.nativeLayer) {
      this.map.removeLayer(this.nativeLayer);
    }
  }

  initializeMap() {
    /**
     * Creates a Leaflet map
     */
    const { map: mapConfig, cluster: clusterConfig } = this.props.app;

    const map = L.map(this.props.ui.dom.map)
      .setView(mapConfig.anchor, mapConfig.startZoom)
      .setMinZoom(mapConfig.minZoom)
      .setMaxZoom(mapConfig.maxZoom)
      .setMaxBounds(mapConfig.maxBounds);
    // This assumes your map is the constant 'map'
    map.attributionControl.addAttribution(
      `<a href="http://mapbox.com/about/maps" class='mapbox-logo' target="_blank">Mapbox</a>© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>`
    );

    // Initialize supercluster index
    this.superclusterIndex = new Supercluster(clusterConfig);

    map.keyboard.disable();
    map.zoomControl.remove();

    if (!map.getPane("eventPane")) {
      map.createPane("eventPane");
      const pane = map.getPane("eventPane");
      pane.style.zIndex = 650;
      pane.style.pointerEvents = "auto";
    }

    map.on("moveend", () => {
      this.alignLayers();
      this.updateClusters();
    });

    map.on("zoomend viewreset", () => {
      this.map.dragging.enable();
      this.map.doubleClickZoom.enable();
      this.map.scrollWheelZoom.enable();
      flushSync(() => {
        this.alignLayers();
        this.updateClusters();
      });
    });
    map.on("zoomstart", () => {
      if (this.svgRef.current !== null)
        this.svgRef.current.classList.add("hide");
    });
    map.on("zoomend", () => {
      if (this.svgRef.current !== null)
        this.svgRef.current.classList.remove("hide");
    });
    window.addEventListener("resize", () => {
      this.alignLayers();
    });

    this.map = map;
  }

  getMapDetails() {
    const bounds = this.map.getBounds();
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
    const zoom = this.map.getZoom();
    return [bbox, zoom];
  }

  updateClusters() {
    const [bbox, zoom] = this.getMapDetails();
    if (this.superclusterIndex && this.state.indexLoaded) {
      this.setState({
        clusters: this.superclusterIndex.getClusters(bbox, zoom),
      });
    }
  }

  loadClusterData(locations) {
    if (locations && locations.length > 0 && this.superclusterIndex) {
      const convertedLocations = locations.reduce((acc, loc) => {
        const { longitude, latitude } = loc;
        const validCoordinates = isLatitude(latitude) && isLongitude(longitude);
        if (validCoordinates) {
          const feature = {
            type: "Feature",
            properties: {
              cluster: false,
              id: loc.label,
            },
            geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
          };
          acc.push(feature);
        }
        return acc;
      }, []);
      this.superclusterIndex.load(convertedLocations);
      this.setState({ indexLoaded: true }, () => {
        this.updateClusters();
      });
    } else {
      this.setState({ clusters: [] });
    }
  }

  getClusterChildren(clusterId) {
    if (this.superclusterIndex) {
      try {
        const children = this.superclusterIndex.getLeaves(
          clusterId,
          Infinity,
          0
        );
        return mapClustersToLocations(children, this.props.domain.locations);
      } catch (err) {
        return [];
      }
    }
    return [];
  }

  getSelectedClusters() {
    const { selected } = this.props.app;
    const selectedIds = selected.map((sl) => sl.id);

    if (this.state.clusters && this.state.clusters.length > 0) {
      return this.state.clusters.reduce((acc, cl) => {
        if (cl.properties.cluster) {
          const children = this.getClusterChildren(cl.properties.cluster_id);
          if (children && children.length > 0) {
            children.forEach((child) => {
              const clusterPresent =
                acc.findIndex((item) => item.id === cl.id) >= 0;
              if (selectedIds.includes(child.id) && !clusterPresent) {
                acc.push(cl);
              }
            });
          }
        }
        return acc;
      }, []);
    }
    return [];
  }

  alignLayers() {
    const mapNode = document.querySelector(".leaflet-map-pane");
    if (mapNode === null) return { transformX: 0, transformY: 0 };

    // We'll get the transform of the leaflet container,
    // which will let us offset the SVG by the same quantity
    const transform = window
      .getComputedStyle(mapNode)
      .getPropertyValue("transform");

    // Offset with leaflet map transform boundaries
    this.setState({
      mapTransformX: +transform.split(",")[4],
      mapTransformY: +transform.split(",")[5].split(")")[0],
    });
  }

  projectPoint(location) {
    const latLng = new L.LatLng(location[0], location[1]);
    return {
      x: this.map.latLngToLayerPoint(latLng).x + this.state.mapTransformX,
      y: this.map.latLngToLayerPoint(latLng).y + this.state.mapTransformY,
    };
  }

  onClusterSelect({ id, latitude, longitude }) {
    const expansionZoom = Math.max(
      this.superclusterIndex.getClusterExpansionZoom(parseInt(id)),
      this.superclusterIndex.options.minZoom
    );
    const zoomLevelsToSkip = 2;
    const zoomToFly = Math.max(
      expansionZoom + zoomLevelsToSkip,
      this.props.app.cluster.maxZoom
    );
    const currentZoom = this.map.getZoom();
    const adjustedZoom =
      currentZoom + (zoomToFly - currentZoom) * 0.7;

    this.map.dragging.disable();
    this.map.doubleClickZoom.disable();
    this.map.scrollWheelZoom.disable();
    this.map.flyTo(new L.LatLng(latitude, longitude), adjustedZoom);
  }

  getClientDims() {
    const boundingClient = document
      .querySelector(`#${this.props.ui.dom.map}`)
      .getBoundingClientRect();

    return {
      width: boundingClient.width,
      height: boundingClient.height,
    };
  }

  renderTiles() {
    const pane = this.map.getPane("eventPane") || this.map.getPanes().overlayPane;
    const { width, height } = this.getClientDims();

    return this.map ? (
      <Portal node={pane}>
        <svg
          ref={this.svgRef}
          width={width}
          height={height}
          style={{
            transform: `translate3d(${-this.state.mapTransformX}px, ${-this
              .state.mapTransformY}px, 0)`,
          }}
          className="leaflet-svg"
        />
      </Portal>
    ) : null;
  }

  renderSites() {
    return (
      <Sites
        sites={this.props.domain.sites}
        projectPoint={this.projectPoint}
        isEnabled={this.props.app.views.sites}
      />
    );
  }

  renderRegions() {
    return (
      <Regions
        svg={this.svgRef.current}
        regions={this.props.domain.regions}
        projectPoint={this.projectPoint}
        styles={this.props.ui.regions}
      />
    );
  }

  renderNarratives() {
    const hasNarratives = this.props.domain.narratives.length > 0;
    return (
      <Narratives
        svg={this.svgRef.current}
        narratives={
          hasNarratives
            ? this.props.domain.narratives
            : [this.props.app.narrative]
        }
        projectPoint={this.projectPoint}
        narrative={this.props.app.narrative}
        styles={this.props.ui.narratives}
        onSelectNarrative={this.props.methods.onSelectNarrative}
        features={this.props.features}
      />
    );
  }

  /**
   * Determines additional styles on the <circle> for each location.
   * A location consists of an array of events (see selectors). The function
   * also has full access to the domain and redux state to derive values if
   * necessary. The function should return an array, where the value at the
   * first index is a styles object for the SVG at the location, and the value
   * at the second index is an optional additional component that renders in
   * the <g/> div.
   */
  styleLocation(location) {
    return [null, null];
  }

  styleCluster(cluster) {
    return [null, null];
  }

  renderEvents() {
    /*
    Uncomment below to filter out the locations already present in a cluster.
    Leaving these lines commented out renders all the locations on the map, regardless of whether or not they are clustered
    */

    const individualClusters = this.state.clusters.filter(
      (cl) => !cl.properties.cluster
    );
    const filteredLocations = mapClustersToLocations(
      individualClusters,
      this.props.domain.locations
    );

    return (
      <Events
        svg={this.svgRef.current}
        events={this.props.domain.events}
        locations={filteredLocations}
        // locations={this.props.domain.locations}
        styleLocation={this.styleLocation}
        categories={this.props.domain.categories}
        projectPoint={this.projectPoint}
        selected={this.props.app.selected}
        narrative={this.props.app.narrative}
        onSelect={this.props.methods.onSelect}
        getCategoryColor={this.props.methods.getCategoryColor}
        eventRadius={this.props.ui.eventRadius}
        coloringSet={this.props.app.coloringSet}
        filterColors={this.props.ui.filterColors}
        features={this.props.features}
      />
    );
  }

  renderClusters() {
    const allClusters = this.state.clusters.filter(
      (cl) => cl.properties.cluster
    );
    return (
      <Clusters
        svg={this.svgRef.current}
        styleCluster={this.styleCluster}
        projectPoint={this.projectPoint}
        clusters={allClusters}
        isRadial={this.props.ui.radial}
        onSelect={this.onClusterSelect}
        coloringSet={this.props.app.coloringSet}
        getClusterChildren={this.getClusterChildren}
        filterColors={this.props.ui.filterColors}
      />
    );
  }

  renderSelected() {
    const selectedClusters = this.getSelectedClusters();
    const totalMarkers = [];

    this.props.app.selected.forEach((s) => {
      const { latitude, longitude } = s;
      totalMarkers.push({
        latitude,
        longitude,
        radius: this.props.ui.eventRadius,
      });
    });

    const totalClusterPoints = calculateTotalClusterPoints(this.state.clusters);

    selectedClusters.forEach((cl) => {
      if (cl.properties.cluster) {
        const { coordinates } = cl.geometry;
        totalMarkers.push({
          latitude: String(coordinates[1]),
          longitude: String(coordinates[0]),
          radius: calcClusterSize(
            cl.properties.point_count,
            totalClusterPoints
          ),
        });
      }
    });

    return (
      <SelectedEvents
        svg={this.svgRef.current}
        selected={totalMarkers}
        projectPoint={this.projectPoint}
        styles={this.props.ui.mapSelectedEvents}
      />
    );
  }

  renderMarkers() {
    return (
      <Portal node={this.svgRef.current}>
        <DefsMarkers />
      </Portal>
    );
  }

  render() {
    const { isShowingSites, isFetchingDomain } = this.props.app.flags;
    const checkMobile = isMobileOnly || window.innerWidth < 600;

    const classes =
      (this.props.app.narrative
        ? "map-wrapper narrative-mode"
        : "map-wrapper") + (checkMobile ? " mobile" : "");
    const innerMap = this.map ? (
      <>
        {this.renderTiles()}
        {this.renderMarkers()}
        {isShowingSites ? this.renderSites() : null}
        {this.renderRegions()}
        {this.renderNarratives()}
        {this.renderEvents()}
        {this.renderClusters()}
        {this.renderSelected()}
      </>
    ) : null;

    return (
      <div className={classes} onKeyDown={this.props.onKeyDown} tabIndex="0">
        <div id={this.props.ui.dom.map} />
        <LoadingOverlay
          isLoading={this.props.app.loading || isFetchingDomain}
          ui={isFetchingDomain}
          language={this.props.app.language}
        />
        <SatelliteOverlayToggle
          isUsingNative={this.props.ui.isUsingNative}
          toggleNative={this.props.actions.toggleNativeOverlay}
        />
        {innerMap}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    domain: {
      locations: selectors.selectLocations(state),
      narratives: selectors.selectNarratives(state),
      categories: selectors.getCategories(state),
      sites: selectors.selectSites(state),
      regions: selectors.selectRegions(state),
    },
    app: {
      views: state.app.associations.views,
      selected: selectors.selectSelected(state),
      highlighted: state.app.highlighted,
      map: state.app.map,
      cluster: state.app.cluster,
      language: state.app.language,
      loading: state.app.loading,
      narrative: state.app.associations.narrative,
      coloringSet: state.app.associations.coloringSet,
      flags: {
        isShowingSites: state.app.flags.isShowingSites,
        isFetchingDomain: state.app.flags.isFetchingDomain,
      },
    },
    ui: {
      tile: selectors.getTile(state),
      isUsingSatellite: selectors.isUsingSatellite(state),
      isUsingNative: selectors.isUsingNative(state),
      nativeTileId: state.ui.tiles.native,
      dom: state.ui.dom,
      narratives: state.ui.style.narratives,
      mapSelectedEvents: state.ui.style.selectedEvents,
      regions: state.ui.style.regions,
      eventRadius: state.ui.eventRadius,
      radial: state.ui.style.clusters.radial,
      filterColors: state.ui.coloring.colors,
    },
    features: selectors.getFeatures(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Map);
