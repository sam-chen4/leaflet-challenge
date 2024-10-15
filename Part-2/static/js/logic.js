const earthquakeDataUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"; // URL for earthquake data in JSON format
const tectonicPlatesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"; // URL for tectonic plate boundaries in JSON format

// Fetch earthquake data from the specified URL
d3.json(earthquakeDataUrl).then((quakeResponse) => {
    // Fetch tectonic plate boundary data from the specified URL
    d3.json(tectonicPlatesUrl).then((plateResponse) => {
        // Call the initializeMap function using the retrieved data for earthquakes and plates
        initializeMap(quakeResponse.features, plateResponse.features);
    });
});

// Function to initialize and build the map using earthquake and plate data
function initializeMap(earthquakeFeatures, plateFeatures) {
    const depthColorScheme = d3.interpolateRgbBasis(["lime", "orange", "darkred"]); // Color interpolation based on earthquake depth
    const depthIntervals = [-10, 10, 30, 50, 70, 90]; // Depth ranges for categorization
    const depthColorScale = d3.scaleSequentialQuantile(depthIntervals, depthColorScheme); // Create a scale for assigning colors based on depth

    // Function to generate markers for each earthquake
    function createQuakeMarker(earthquake, latlng) {
        return L.circleMarker(latlng, {
            radius: earthquake.properties.mag * 4, // Marker size based on earthquake magnitude
            stroke: true,
            weight: 1,
            fillOpacity: 1,
            color: "black",
            fillColor: depthColorScale(earthquake.geometry.coordinates[2]) // Fill color determined by depth
        });
    }

    // Function to bind a popup to each earthquake marker showing details
    function attachPopup(earthquake, layer) {
        layer.bindPopup(
            `<h3>${earthquake.properties.place}</h3><hr><p>${new Date(earthquake.properties.time)}
            <br>Magnitude: ${earthquake.properties.mag}<br>Depth: ${earthquake.geometry.coordinates[2]} km</p>`
        );
    }

    // Create a GeoJSON layer containing the earthquake data and apply marker and popup functions
    let earthquakeLayer = L.geoJSON(earthquakeFeatures, {
        pointToLayer: createQuakeMarker,
        onEachFeature: attachPopup
    });

    // Function to style the lines representing tectonic plate boundaries
    function stylePlateBoundaries() {
        return { color: "orange" };
    }

    // Create a GeoJSON layer for tectonic plate boundaries with the specified style
    let plateLayer = L.geoJSON(plateFeatures, {
        style: stylePlateBoundaries
    });

    // Overlay layers for toggling earthquakes and tectonic plates on the map
    let overlayLayers = {
        "Earthquakes": earthquakeLayer,
        "Tectonic Plates": plateLayer
    };

    // Base map layers: Satellite, Grayscale, and Outdoors views
    let accessToken = 'pk.eyJ1IjoibWFwLTF0LTB1dCIsImEiOiJjbHpyaDI3ZW4wNnpoMmxvbm1ka25xNGVtIn0.v7zheM6QmhTBzaEFLtxLXg';
    let satelliteView = L.tileLayer.provider('MapBox', {
        id: 'mapbox/satellite-v9',
        accessToken: accessToken
    });
    let grayscaleView = L.tileLayer.provider('MapBox', {
        id: 'mapbox/light-v11',
        accessToken: accessToken
    });
    let outdoorView = L.tileLayer.provider('MapBox', {
        id: 'mapbox/outdoors-v12',
        accessToken: accessToken
    });

    // Base map options for the user to switch between different views
    let baseMaps = {
        "Satellite": satelliteView,
        "Grayscale": grayscaleView,
        "Outdoors": outdoorView
    };

    // Initialize the map with the satellite view and earthquake data displayed by default
    let map = L.map("map", {
        center: [30.0, 0.0],
        zoom: 2.2,
        layers: [satelliteView, earthquakeLayer]
    });

    // Add layer control for toggling between base maps and overlays
    L.control.layers(baseMaps, overlayLayers, {
        collapsed: false
    }).addTo(map);

    // Add a legend to the map for earthquake depth
    let legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
        let div = L.DomUtil.create('div', 'info legend');
        // Generate the legend content by iterating over depth ranges
        depthIntervals.forEach((interval, i) => {
            div.innerHTML +=
                `<i style="background:${depthColorScale(interval + 1)}"></i> ${interval}${depthIntervals[i + 1] ? '&ndash;' + depthIntervals[i + 1] + '<br>' : '+'}`;
        });
        return div;
    };
    legend.addTo(map); // Attach the legend to the map
}
