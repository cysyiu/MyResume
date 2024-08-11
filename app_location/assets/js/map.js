document.addEventListener('DOMContentLoaded', function() {
    var basemapAPI = 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/wgs84/{z}/{x}/{y}.png';
    var labelAPI = 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/en/wgs84/{z}/{x}/{y}.png';
    var attributionInfo = '<a href="https://api.portal.hkmapservice.gov.hk/disclaimer" target="_blank" class="copyrightDiv">&copy; Map information from Lands Department</a><div style="width:28px;height:28px;display:inline-flex;background:url(https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg);background-size:28px;"></div>';

    var attribution = new ol.control.Attribution({
        collapsible: false            
    });          

    var map = new ol.Map({
        controls: ol.control.defaults({attribution: false}).extend([attribution]),     			
        layers: [
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: basemapAPI,
                    attributions: attributionInfo
                })
            }),
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: labelAPI
                })
            })
        ],
        target: 'map',
        logo: false,
        view: new ol.View({
            center: ol.proj.fromLonLat([114.20847, 22.29227]),
            zoom: 17,
            minZoom: 10,
            maxZoom: 20
        })
    });
});
