const earthquakeDataUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"; // URL for fetching earthquake data in JSON format

// Load the earthquake data from the specified URL
d3.json(earthquakeDataUrl).then((response) => {
    // Extract the relevant data (features) from the response
    let earthquakeArray = response.features;

    const depthColorScale = d3.interpolateRgbBasis(["lime", "orange", "darkred"]); // Interpolated color scheme based on earthquake depth
    const depthRanges = [-10, 10, 30, 50, 70, 90]; // Defined depth categories for color mapping
    const depthColor = d3.scaleSequentialQuantile(depthRanges, depthColorScale); // Create a color scale function based on depth ranges

    // Function to generate circle markers for each earthquake data point
    function createCircleMarker(earthquake, latlng) {
        return L.circleMarker(latlng, {
            radius: earthquake.properties.mag * 4, // Size of the marker based on earthquake magnitude
            stroke: true,
            weight: 1,
            fillOpacity: 1,
            color: "black",
            fillColor: depthColor(earthquake.geometry.coordinates[2]) // Color based on depth
        });
    };

    // Function to bind a popup to each marker displaying earthquake details
    function bindPopupContent(earthquake, layer) {
        layer.bindPopup(
            `<h3>${earthquake.properties.place}</h3><hr><p>${new Date(earthquake.properties.time)}<br>Magnitude: ${earthquake.properties.mag}<br>Depth: ${earthquake.geometry.coordinates[2]} km</p>`
        );
    };

    // Create a GeoJSON layer with the earthquake data, applying the marker and popup functions
    let earthquakeLayer = L.geoJSON(earthquakeArray, {
        pointToLayer: createCircleMarker,
        onEachFeature: bindPopupContent
    });

    // Initialize the base map layer
    let mapboxToken = 'pk.eyJ1IjoibWFwLTF0LTB1dCIsImEiOiJjbHpyaDI3ZW4wNnpoMmxvbm1ka25xNGVtIn0.v7zheM6QmhTBzaEFLtxLXg';
    let streetMap = L.tileLayer.provider('MapBox', {
        id: 'mapbox/light-v11',
        accessToken: mapboxToken
    });

    // Create the map with the specified center, zoom level, and initial layers
    let mapInstance = L.map("map", {
        center: [30.0, 0.0],
        zoom: 2.2,
        layers: [streetMap, earthquakeLayer]
    });

    // Define the legend and its position on the map
    let legendControl = L.control({ position: 'bottomright' });

    // Function to generate the legend content
    legendControl.onAdd = () => {
        let legendDiv = L.DomUtil.create('div', 'info legend');
        // Iterate over the depth ranges and create legend items
        depthRanges.forEach((range, index) => {
            legendDiv.innerHTML +=
                `<i style="background:${depthColor(range + 1)}"></i> ${range}${depthRanges[index + 1] ? '&ndash;' + depthRanges[index + 1] + '<br>' : '+'}`;
        });
        return legendDiv;
    };

    // Add the legend to the map
    legendControl.addTo(mapInstance);
});
