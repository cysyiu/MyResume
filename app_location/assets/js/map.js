document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded');

    if (typeof ol === 'undefined') {
        console.error('OpenLayers is not available. Make sure it\'s properly loaded.');
        return;
    }

    var basemapAPI = 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/wgs84/{z}/{x}/{y}.png';
    var labelAPI = 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/en/wgs84/{z}/{x}/{y}.png';
    var attributionInfo = '<a href="https://api.portal.hkmapservice.gov.hk/disclaimer" target="_blank" class="copyrightDiv">&copy; Map information from Lands Department</a><div style="width:28px;height:28px;display:inline-flex;background:url(https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg);background-size:28px;"></div>';

    var initialCenter = ol.proj.fromLonLat([114.1655, 22.2750]); // Initial center coordinates for Hong Kong

    // Create a source and vector layer for the measurements
    var source = new ol.source.Vector();
    var vector = new ol.layer.Vector({
        source: source,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ffcc33',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#ffcc33'
                })
            })
        })
    });

    try {
        var map = new ol.Map({
            target: 'map',
            controls: ol.control.defaults().extend([
                new ol.control.Attribution({ collapsible: false }),
                new ol.control.Zoom(),
                new ol.control.Rotate(),
                new ol.control.FullScreen()
            ]),                 
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
                }),
                vector
            ],
            view: new ol.View({
                center: initialCenter,
                zoom: 10,
                minZoom: 10,
                maxZoom: 20
            })
        });

        // Measure control
        var draw;
        var typeSelect = 'LineString'; // Default measurement type

        var measureControl = document.createElement('div');
        measureControl.className = 'ol-unselectable ol-control';
        measureControl.innerHTML = '<button id="measureButton">Measure</button>';
        measureControl.style.top = '10px';
        measureControl.style.left = '10px';
        measureControl.style.background = 'white';
        measureControl.style.padding = '5px';
        measureControl.style.borderRadius = '4px';
        measureControl.style.zIndex = '1000';

        document.body.appendChild(measureControl);

        // Add event listener for measure button
        document.getElementById('measureButton').addEventListener('click', function() {
            if (draw) {
                map.removeInteraction(draw);
            }
            draw = new ol.interaction.Draw({
                source: source,
                type: typeSelect,
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#ffcc33',
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                })
            });
            map.addInteraction(draw);
        });

        map.addControl(new ol.control.Control({
            element: measureControl
        }));

        console.log('Map initialized and centered on Hong Kong with measurement widget');
    } catch (error) {
        console.error('Error initializing map:', error);
    }
});
