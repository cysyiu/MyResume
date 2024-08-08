document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map
    var map = L.map('mapContainer').setView([22.3193, 114.1694], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Define the function to load WFS data
    function loadWFS() {
        // WFS request URL
        var wfsUrl = 'https://portal.csdi.gov.hk/server/services/common/hko_rcd_1634955821131_79239/MapServer/WFSServer?service=wfs&request=GetCapabilities' +
            'service=WFS&' +
            'version=1.1.0&' +
            'request=GetFeature&' +
            'typeName=your_layer_name&' +
            'outputFormat=application/json';

        fetch(wfsUrl)
            .then(response => response.json())
            .then(data => {
                L.geoJSON(data, {
                    style: function (feature) {
                        return {color: 'blue'};
                    },
                    onEachFeature: function (feature, layer) {
                        var popupContent = "";
                        for (var property in feature.properties) {
                            popupContent += property + ": " + feature.properties[property] + "<br>";
                        }
                        layer.bindPopup(popupContent);
                    }
                }).addTo(map);
            })
            .catch(error => console.error('Error:', error));
    }

    // Call the function to load WFS data
    loadWFS();
});
