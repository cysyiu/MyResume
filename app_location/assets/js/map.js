// Create base map
const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([114.2133, 22.29111]),
        zoom: 14,
        enableRotation: true
    })
});

// Add controls
map.addControl(new ol.control.FullScreen());
map.addControl(new ol.control.ZoomSlider());
map.addControl(new ol.control.ScaleLine());

// Function to load and process CSV data
function loadTidalData() {
    Papa.parse('./app_location/assets/data/HLT_QUB_Predicted.csv', {
        download: true,
        complete: function(results) {
            const tidalData = results.data.map(row => ({
                time: new Date(row[0], row[1]-1, row[2], row[3], row[4]),
                height: parseFloat(row[7])
            }));
            initializeVisualization(tidalData);
        }
    });
}

// Initialize the visualization with processed data
function initializeVisualization(tidalData) {
    // Create time slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = tidalData.length - 1;
    slider.value = 0;
    slider.className = 'time-slider';
    document.body.appendChild(slider);

    // Create time display
    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'time-display';
    document.body.appendChild(timeDisplay);

    // Create height display
    const heightDisplay = document.createElement('div');
    heightDisplay.className = 'height-display';
    document.body.appendChild(heightDisplay);

    // Create 3D water layer
    const waterLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: [
                new ol.Feature({
                    geometry: new ol.geom.Polygon([[
                        ol.proj.fromLonLat([114.1, 22.2]),
                        ol.proj.fromLonLat([114.3, 22.2]),
                        ol.proj.fromLonLat([114.3, 22.4]),
                        ol.proj.fromLonLat([114.1, 22.4]),
                        ol.proj.fromLonLat([114.1, 22.2])
                    ]])
                })
            ]
        }),
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: [0, 100, 200, 0.5]
            })
        })
    });
    map.addLayer(waterLayer);

    // Update visualization based on slider
    slider.addEventListener('input', function(e) {
        const index = parseInt(e.target.value);
        const currentData = tidalData[index];
        
        // Update displays
        timeDisplay.textContent = currentData.time.toLocaleString();
        heightDisplay.textContent = `Water Level: ${currentData.height.toFixed(2)}m`;
        
        // Update water layer style
        const opacity = 0.3 + (currentData.height / 5); // Adjust visibility based on height
        waterLayer.setStyle(new ol.style.Style({
            fill: new ol.style.Fill({
                color: [0, 100, 200, opacity]
            })
        }));
    });

    // Auto-play functionality
    let playing = true;
    let currentIndex = 0;

    function animate() {
        if (playing && currentIndex < tidalData.length) {
            slider.value = currentIndex;
            slider.dispatchEvent(new Event('input'));
            currentIndex++;
            setTimeout(animate, 100);
        }
    }
    animate();
}

// Start the visualization
loadTidalData();
