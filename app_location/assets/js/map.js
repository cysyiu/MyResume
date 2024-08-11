document.addEventListener('DOMContentLoaded', function() {
    // Initialize map
    const map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            })
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat([114.20847, 22.29227]),
            zoom: 10
        })
    });

    // Function to read GeoJSON file
    async function readGeoJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error reading GeoJSON:', error);
            throw error;
        }
    }

    // Function to download and parse CSV
    async function downloadCSV(url) {
        return new Promise((resolve, reject) => {
            Papa.parse(url, {
                download: true,
                header: true,
                complete: function(results) {
                    if (results.errors.length > 0) {
                        console.warn('CSV parsing completed with errors:', results.errors);
                    }
                    resolve(results.data);
                },
                error: function(error) {
                    console.error('Error parsing CSV:', error);
                    reject(error);
                }
            });
        });
    }

    // Function to process data, add to map, and prepare download
    async function processDataAndAddToMap() {
        try {
            // Read GeoJSON
            const geojsonData = await readGeoJSON('assets/data/latest_1min_temperature.json');

            // Process each feature
            for (let feature of geojsonData.features) {
                const properties = feature.properties;
                const csvUrl = properties.Data_url; // Get CSV URL from Data_url column

                if (csvUrl) {
                    try {
                        // Download CSV for this feature
                        const csvData = await downloadCSV(csvUrl);

                        if (csvData.length > 0) {
                            // Get the latest temperature value
                            const latestData = csvData[csvData.length - 1];
                            const temperature = latestData["Air Temperature(degree Celsius)"];

                            // Add temperature to feature properties
                            feature.properties.temperature = temperature !== undefined ? parseFloat(temperature) : 'N/A';
                        } else {
                            feature.properties.temperature = 'No Data';
                        }
                    } catch (error) {
                        console.error(`Error processing CSV for feature ${properties.id}:`, error);
                        feature.properties.temperature = 'Error';
                    }
                } else {
                    feature.properties.temperature = 'No Data URL';
                }
                console.log(`Processed feature ${properties.id}: Temperature = ${feature.properties.temperature}`);
            }

            // Add GeoJSON to map
            const vectorLayer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: new ol.format.GeoJSON().readFeatures(geojsonData, {
                        featureProjection: 'EPSG:3857'
                    })
                }),
                style: function(feature) {
                    const temp = feature.get('temperature');
                    const tempText = (typeof temp === 'number') ? temp.toFixed(1) + '°C' : temp.toString();
                    return new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 5,
                            fill: new ol.style.Fill({color: 'red'}),
                            stroke: new ol.style.Stroke({color: 'black', width: 1})
                        }),
                        text: new ol.style.Text({
                            text: tempText,
                            offsetY: -15,
                            fill: new ol.style.Fill({color: 'black'}),
                            stroke: new ol.style.Stroke({color: 'white', width: 3})
                        })
                    });
                }
            });
            map.addLayer(vectorLayer);

            // Prepare download link for updated GeoJSON
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojsonData));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "updated_geojson.json");
            downloadAnchorNode.textContent = "Download Updated GeoJSON";
            document.body.appendChild(downloadAnchorNode);

            console.log('GeoJSON processing complete. Download link added to page.');

        } catch (error) {
            console.error('Error processing data:', error);
        }
    }

    // Call the function to process data and add to map
    processDataAndAddToMap();
});
