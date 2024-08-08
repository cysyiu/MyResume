document.addEventListener('DOMContentLoaded', function() {
    var map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            })
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([114.1575, 22.35]), // Center on Hong Kong
            zoom: 10
        })
    });

    var wfsSource = new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        url: function(extent) {
            return 'https://portal.csdi.gov.hk/server/services/common/hko_rcd_1634871488130_57930/MapServer/WFSServer?' +
                   'service=WFS&version=1.1.0&request=GetFeature&typename=hko_rcd_1634871488130_57930&' +
                   'outputFormat=application/json&srsname=EPSG:3857&' +
                   'bbox=' + extent.join(',') + ',EPSG:3857';
        },
        strategy: ol.loadingstrategy.bbox
    });

    var wfsLayer = new ol.layer.Vector({
        source: wfsSource,
        style: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 5,
                fill: new ol.style.Fill({color: 'red'})
            })
        })
    });

    map.addLayer(wfsLayer);
});
