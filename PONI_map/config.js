const one_day = 1440;

const config = {
  title: "ukraine",
  display_title: "Projects of\nNational Interest",
  SERVER_ROOT: "",
  EVENTS_EXT: "/8th_fire_rising_PONI_map/data/events.json",
  SOURCES_EXT: "/8th_fire_rising_PONI_map/data/sources.json",
  ASSOCIATIONS_EXT: "/8th_fire_rising_PONI_map/data/associations.json",
  API_DATA: "https://bellingcat-embeds.ams3.cdn.digitaloceanspaces.com/production/ukr/timemap/api.json",
  // Mapbox tokens are sensitive and should not be committed.  We expect
  // them to be provided via environment variables at build time.  Vite
  // exposes any variable prefixed with `VITE_` through
  // `import.meta.env` in the client bundle.
  //
  // During local development you can create a `.env` file (see
  // `.env.example`) while the CI/Pages workflow can set the variables in
  // the GitHub Actions environment.
  MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN || "",
  NATIVE_MAPBOX_TOKEN: import.meta.env.VITE_NATIVE_MAPBOX_TOKEN || "",
  // The native-land endpoint also requires a key; default to whichever
  // token is available so we don't hardcode anything in the repository.
  NATIVE_LAND_GEOJSON_URL: (() => {
    const t = import.meta.env.VITE_NATIVE_MAPBOX_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN || "";
    return t
      ? `https://native-land.ca/api/polygons/geojson/territories?key=${t}`
      : "";
  })(),
  // MEDIA_EXT: "/api/media",
  DATE_FMT: "M/D/YYYY",
  TIME_FMT: "HH:mm",

  store: {
    app: {
      debug: true,
      map: {
        // anchor: [56.13793123747861, -94.66994184529888],
        anchor: [56.13793123747861, -94.66994184529888],
        maxZoom: 18,
        minZoom: 4,
        startZoom: 4,
        // maxBounds: []
      },
      cluster: { radius: 50, minZoom: 5, maxZoom: 12 },
      associations: {
        defaultCategory: "Weapon System",
      },
      timeline: {
        dimensions: {
          height: 90,
          contentHeight: 90,
        },
        zoomLevels: [
          // { label: "Zoom to 2 weeks", duration: 14 * one_day },
          { label: "Zoom to 1 month", duration: 31 * one_day },
          { label: "Zoom to 6 months", duration: 6 * 31 * one_day },
          { label: "Zoom to 1 year", duration: 12 * 31 * one_day },
          { label: "Zoom to 2 years", duration: 24 * 31 * one_day },
        ],
        range: {
          /**
           * Initial date range shown on map load.
           * Use [start, end] (strings in ISO 8601 format) for a fixed range.
           * Use undefined for a dynamic initial range based on the browser time.
           */
          initial: ["2020-01-01T00:00:00.000Z", "2026-12-31T23:59:59.999Z"],
          /** The number of days to show when using a dynamic initial range */
          initialDaysShown: 31*12,
          limits: {
            /** Required. The lower bound of the range that can be accessed on the map. (ISO 8601) */
            lower: "2020-01-01T00:00:00.000Z",
            /**
             * The upper bound of the range that can be accessed on the map.
             * Defaults to current browser time if undefined.
             */
            upper: undefined,
          },
        },
      },
      intro: [
        '<div class="two-columns"><div class="two-columns_column"><figure><img style="width: 100%; display:block;" src="https://bellingcat-embeds.ams3.cdn.digitaloceanspaces.com/ukraine-timemap/cover01-s.jpg" frameborder="0"><figcaption>Image: Vyacheslav Madiyevskyy/Reuters</figcaption></figure></div><div class="two-columns_column"><figure><img style="width: 100%; display:block;" src="https://bellingcat-embeds.ams3.cdn.digitaloceanspaces.com/ukraine-timemap/cover02-s.jpg" frameborder="0"><figcaption>Image: Järva Teataja/Scanpix Baltics via Reuters</figcaption></figure></div></div>',
        '<span style="font-weight: 400;">This research is an open source database focused on the slate of infrastructure announced as part of Prime Minister Carney&rsquo;s push to streamline, promote, de-risk, and fast track infrastructure in Canada. He called these &ldquo;Projects of National Interest&rdquo; or PONIs. At first, when the federal government released these lists of projects, we thought they were all going to be fast tracked through the Major Projects Office, as stipulated under </span><a href="https://8thfirerising.ca/bill-c-5-building-canada-act-and-one-canadian-economy-act/"><span style="font-weight: 400;">Bill C-5</span></a><strong>. </strong><span style="font-weight: 400;">But we took a </span><a href="https://8thfirerising.ca/what-is-happening-with-bill-c-5-an-update/"><span style="font-weight: 400;">closer look </span></a><span style="font-weight: 400;">and noticed many of these projects are already underway. What we do know is that these projects represent a priority for the federal and provincial governments, especially in response to Trump&rsquo;s tariff war on Canadian exports. But what is the net benefit of these projects, and to whom? What is the big picture if we pull back, and say, put them on a national map? This project seeks to map the PONIs and track their development to get a better sense of the kind of society this infrastructure seeks to build: Are they climate resilient or conscious? Are they a supermarket for global capital? We have been tracking data across 15 criteria to try to answer these questions.</span>'
      ],

      flags: { isInfopoup: false, isCover: false },
      cover: {
        title: "About and Methodology",
        exploreButton: "BACK TO THE PLATFORM",
        description: [
          "## Scope of Research",
          "This research is an open source database focused on the slate of infrastructure announced as part of Prime Minister Carney’s push to streamline, promote, de-risk, and fast track infrastructure in Canada. He called these “Projects of National Interest” or PONIs. At first, when the federal government released these lists of projects, we thought they were all going to be fast tracked through the Major Projects Office, as stipulated under Bill C-5. But we took a closer look and noticed many of these projects are already underway. What we do know is that these projects represent a priority for the federal and provincial governments, especially in response to Trump’s tariff war on Canadian exports. But what is the net benefit of these projects, and to whom? What is the big picture if we pull back, and say, put them on a national map? This project seeks to map the PONIs and track their development to get a better sense of the kind of society this infrastructure seeks to build: Are they climate resilient or conscious? Are they a supermarket for global capital? We have been tracking data across 15 criteria to try to answer these questions.",
          "## On Going Research",
          "This map will be updated on a rolling basis. Please reach out to contribute at comms@8thfirerising.ca.",
          "## Descriptions",
          "The pop out window includes a select display of data, focused on some key highlights, including project descriptions, ownership, and Indigenous stakes and resistance. More detailed data is indexed through FILTERS on the left-hand side.",
          "## Filters",
          "On the left hand side of the map, a user can toggle between different types of infrastructure.",
          "## Timeline",
          "At the bottom of the map you can navigate a timeline which displays when each project was approved.",
          "## Collaborators",
          "The database has been organized by the 8th Fire Rising research hub, which is an ongoing collaboration of researchers and activists, supervised by Professors Shiri Pasternak and Dayna Scott. This map was built and designed by Nessie Nankivell. Researchers who contributed to this map include Caitlyn Paridy, Haidi Wu, Zachary Glen, Hannah Toffelson, Isaac Thornley, and Tara Peterson (CUPE)."
        ],
      },
      toolbar: {
        panels: {
          categories: {
            // TRUE: {
            //   icon: "public",
            //   label: "Verified",
            //   description: "todo",
            // },
            // FALSE: {
            //   icon: "public",
            //   label: "Unverified",
            //   description: "todo",
            // }
          },
        },
      },
      spotlights: {},
    },
    ui: {
      coloring: {
        mode: "STATIC",
        maxNumOfColors: 9,
        defaultColor: "#dfdfdf",
        colors: [
          "#F57C00",
          "#7E57C2",
          "#FFEB3B",
          "#D34F73",
          "#08B2E3",
          "#A1887F",
          "#90A4AE",
          "#E57373",
          "#80CBC4",
        ],
      },
      card: {
        layout: {
          template: "sourced",
        },
      },
      carto: {
        eventRadius: 8,
      },
      timeline: {
        eventRadius: 9,
      },
      tiles: {
        current: "bellingcat-mapbox/cl0qnou2y003m15s8ieuyhgsy",
        default: "bellingcat-mapbox/cl0qnou2y003m15s8ieuyhgsy",
        satellite: "bellingcat-mapbox/cl1win2vp003914pdhateva6p",
        native: "nativeland.4pgB_next_nld_terr_prod_layer"
      },
    },
    features: {
      USE_CATEGORIES: false,
      CATEGORIES_AS_FILTERS: false,
      COLOR_BY_CATEGORY: false,
      COLOR_BY_ASSOCIATION: true,
      USE_ASSOCIATIONS: true,
      USE_FULLSCREEN: true,
      USE_DOWNLOAD: true,
      USE_SOURCES: true,
      USE_SPOTLIGHTS: false,
      USE_SHAPES: false,
      USE_COVER: true,
      USE_INTRO: false,
      USE_SATELLITE_OVERLAY_TOGGLE: true,
      USE_SEARCH: false,
      USE_SITES: false,
      ZOOM_TO_TIMEFRAME_ON_TIMELINE_CLICK: one_day,
      FETCH_EXTERNAL_MEDIA: false,
      USE_MEDIA_CACHE: false,
      GRAPH_NONLOCATED: false,
      NARRATIVE_STEP_STYLES: false,
      CUSTOM_EVENT_FIELDS: [
        { kind: "text", key: "Owners", title: "Owners" },
        { kind: "text", key: "Shareholders", title: "Shareholders" },
        { kind: "text", key: "approval_stage", title: "Approval Stage" },
        { kind: "text", key: "commodity", title: "Commodity" },
      ],
    },
  },
};

export default config;
