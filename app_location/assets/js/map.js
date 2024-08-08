// Initialize the map
const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([0, 0]),
        zoom: 2
    })
});

// Create a vector source and layer for GeoJSON features
const vectorSource = new ol.source.Vector();
const vectorLayer = new ol.layer.Vector({
    source: vectorSource
});
map.addLayer(vectorLayer);

// Function to publish GeoJSON
function publishGeoJSON() {
    const geojsonInput = document.getElementById('geojson-input');
    const geojsonStr = geojsonInput.value;

    try {
        const geojsonObj = JSON.parse(geojsonStr);
        const features = new ol.format.GeoJSON().readFeatures(geojsonObj, {
            featureProjection: 'EPSG:3857'
        });

        vectorSource.clear();
        vectorSource.addFeatures(features);

        // Zoom to the extent of the added features
        map.getView().fit(vectorSource.getExtent(), {
            padding: [50, 50, 50, 50],
            duration: 1000
        });

        alert('GeoJSON published successfully!');
    } catch (error) {
        alert('Error parsing GeoJSON: ' + error.message);
    }
}

// Add event listener to the publish button
document.getElementById('publish-button').addEventListener('click', publishGeoJSON);
