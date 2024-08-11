document.addEventListener('DOMContentLoaded', function() {
    // Define the projection
    var projection = ol.proj.get('EPSG:4326');
    var projectionExtent = projection.getExtent();

    // Define the map layers
    var basemapLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/wgs84/{z}/{x}/{y}.png',
            attributions: '© Map information from Lands Department'
        })
    });

    var labelLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/en/wgs84/{z}/{x}/{y}.png'
        })
    });

    // Create the map
    var map = new ol.Map({
        target: 'map',
        layers: [basemapLayer, labelLayer],
        view: new ol.View({
            projection: projection,
            center: ol.proj.fromLonLat([114.1694, 22.3193]), // Centered on Hong Kong
            zoom: 11
        })
    });

    // Add a simple control to show that the map is interactive
    map.addControl(new ol.control.ZoomSlider());

    console.log('Map initialized successfully');
});
