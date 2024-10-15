earthquakeJSON = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"; // The Earthquake JSON URL
let platesJSON = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"; // The Tectonic plate boundary JSON URL

// Get the earthquakeJSON data from its URL
d3.json(earthquakeJSON).then((dataQuake) => {
    // Get the platesJSON data from its URL
    d3.json(platesJSON).then((dataPlate) => {
        // Once the GeoJSON data is retrieved from both URLs, call the buildMap function with the features fields of both GeoJSONs
        buildMap(dataQuake.features, dataPlate.features);
    });
});

// Function for building the map based on the GeoJSON feature data
function buildMap(quakeData, plateData) {
    const colorSchemeInterpolated = d3.interpolateRgbBasis(["lime", "orange", "darkred"]); // The color range that will be used to indicate the depth of each feature 
    const colorVarsDiscrete = [-10, 10, 30, 50, 70, 90]; // The groups into which all the depths of each feature will be aggregated
    const color = d3.scaleSequentialQuantile(colorVarsDiscrete, colorSchemeInterpolated); // The color scale that will be used to assign to each marker its color based on the depth of its associated feature

    // Function for creating the circle markers for each feature
    function quakePointToLayer(feature, latlng) {
        return L.circleMarker(latlng, {
            radius: feature.properties.mag*4,
            stroke: true,
            weight: 1,
            fillOpacity: 1,
            color: "black",
            fillColor: color(feature.geometry.coordinates[2])
        });
    };

    // Function for creating popups that display the place and time of each feature
    function onEachFeature(feature, layer) {
        layer.bindPopup(`<h3>${feature.properties.place}</h3><hr><p>${new Date(feature.properties.time)}
        \n \n Magnitude: ${feature.properties.mag} \n Depth: ${feature.geometry.coordinates[2]}km</p>`);
    };

    // Create a GeoJSON layer that contains the features array on the quakeData object.
    // Run the previous functions for each feature of the array.
    let quakes = L.geoJSON(quakeData, {
        pointToLayer: quakePointToLayer,
        onEachFeature: onEachFeature
      });

    // Function for creating line markers to display the tectonic plate borders
    function plateStyle() {
        return {color: "orange"};
    };

    // Create a GeoJSON layer that contains the features array on the plateData object.
    // Run the previous function for each feature of the array.
    let plates = L.geoJSON(plateData, {
        style: plateStyle
    });

      // Create an overlay object to hold the earthquake and tectonic overlay.
    let overlayMaps = {
        Earthquakes: quakes,
        'Tectonic Plates': plates
    };

    // Create the default base map layer:
    // The access token used to get the base map tiles from Mapbox
    let accessToken = 'pk.eyJ1IjoibWFwLTF0LTB1dCIsImEiOiJjbHpyaDI3ZW4wNnpoMmxvbm1ka25xNGVtIn0.v7zheM6QmhTBzaEFLtxLXg';
    let satellite = L.tileLayer.provider('MapBox', { // The Satellite base map tile layer
        id: 'mapbox/satellite-v9',
        accessToken: accessToken
    });

    // Create the other base map layers: 
    let outdoors = L.tileLayer.provider('MapBox', { // The Outdoors base map tile layer
        id: 'mapbox/outdoors-v12',
        accessToken: accessToken
    });
   // The 
   let gray = L.tileLayer.provider('MapBox', {
    id: 'mapbox/light-v11',
    accessToken: accessToken
    });

    // Create a baseMaps object.
    let baseMaps = {
        Satellite: satellite,
        Grayscale: gray,
        Outdoors: outdoors
    };

    // Create the map with the streetmap and earthquakes layers to display on load.
    let myMap = L.map("map2", {
        center: [
          30.0, 0.0
        ],
        zoom: 2.2,
        layers: [satellite, quakes]
    });

    // Create a layer control.
    // Pass baseMaps and overlayMaps to it.
    // Add the layer control to myMap.
    L.control.layers(baseMaps, overlayMaps, {
        collapsed: false
    }).addTo(myMap);

    // Creating legend steps:
    var legend = L.control({position: 'bottomright'}); // Specify legend position in map
    // Steps for generating the content/info that legend will display;
    legend.onAdd = () => {
        var div = L.DomUtil.create('div', 'info legend');
        // loop through the depth intervals and generate a label with a colored square for each interval     
        colorVarsDiscrete.map((v, i) => {
            div.innerHTML +=
                '<i style="background:' + color(v + 1) + '"></i> ' +
                v + (colorVarsDiscrete[i + 1] ? '&ndash;' + colorVarsDiscrete[i + 1] + '<br>' : '+');
        });
        return div;
    };
    legend.addTo(myMap); // Add the legend into myMap
};