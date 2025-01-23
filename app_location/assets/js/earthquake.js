// Initialize Map
let emap, popup, popupContent;
let tectonicLayer0, tectonicLayer1;
let earthquakeData = null;

const portfolioSection_e = document.querySelector('#portfolio');
const portfolioFilter_e = document.querySelector('#portfolio-flters li[data-filter=".filter-em"]');

if (portfolioSection_e) {
    new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                emap.updateSize();
            }
        });
    }).observe(portfolioSection);
}


document.addEventListener('DOMContentLoaded', () => {
	
	const emapElement = document.getElementById('earthquakeMap');
    // Initialize the OpenLayers map, centered on Hong Kong
	if(emapElement){
		emap = new ol.Map({
			target: 'earthquakeMap',
			layers: [
				new ol.layer.Tile({
					source: new ol.source.OSM(),
					visible: true
				})
			],
			view: new ol.View({
				center: ol.proj.fromLonLat([114.1095, 22.3964]), // Coordinates for Hong Kong
				zoom: 0 // Initial zoom level
			})
		});
		
		emap.once('postrender', () => {
			const popupContainer = document.createElement('div');
			popupContainer.className = 'ol-popup';
			popupContent = document.createElement('div');
			const popupCloser = document.createElement('a');
			popupCloser.className = 'ol-popup-closer';
			popupContainer.appendChild(popupContent);
			popupContainer.appendChild(popupCloser);

			popup = new ol.Overlay({
				element: popupContainer,
				autoPan: true,
				autoPanAnimation: {
					duration: 250
				}
			});
			emap.addOverlay(popup);

			popupCloser.onclick = function () {
				popup.setPosition(undefined);
				popupCloser.blur();
				return false;
			};

			// Call functions to add layers and controls
			fetchTectonicPlateData();
			fetchFaultLayer();
			createDropdownFilter();
			createLayerVisibilityControl();
			createTimeslider();
			createReferenceChart();

			// Initial fetch of all earthquake data
			const [startDate, endDate] = getDateRange('6');
			fetchEarthquakeData(null, startDate, endDate);
		})
	}   
});






// Fecth Tectonic Plate
const fetchTectonicPlateData = () => {
    tectonicLayer0 = new ol.layer.Vector({ // Initialize global variable
        source: new ol.source.Vector({
            loader: function (extent, resolution, projection) {
                const url = 'https://services.arcgis.com/jIL9msH9OI208GCb/arcgis/rest/services/Tectonic_Plates_and_Boundaries/FeatureServer/0/query/?f=json&where=1%3D1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&outFields=*&outSR=102100&inSR=102100';
                fetch(url).then(response => response.json()).then(data => {
                    const format = new ol.format.EsriJSON();
                    const features = format.readFeatures(data, {
                        featureProjection: projection
                    });
                    tectonicLayer0.getSource().addFeatures(features);
                });
            }
        }),
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'brown',
                width: 1
            })
        })
    });

    tectonicLayer1 = new ol.layer.Vector({ // Initialize global variable
        source: new ol.source.Vector({
            loader: function (extent, resolution, projection) {
                const url = 'https://services.arcgis.com/jIL9msH9OI208GCb/arcgis/rest/services/Tectonic_Plates_and_Boundaries/FeatureServer/1/query/?f=json&where=1%3D1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&outFields=*&outSR=102100&inSR=102100';
                fetch(url).then(response => response.json()).then(data => {
                    const format = new ol.format.EsriJSON();
                    const features = format.readFeatures(data, {
                        featureProjection: projection
                    });
                    tectonicLayer1.getSource().addFeatures(features);
                });
            }
        }),
        style: function (feature) {
            const label = feature.get('PlateName');
            const labelStyle = new ol.style.Text({
                text: label,
                overflow: false,
                placement: 'polygon',
                textBaseline: 'middle',
                fill: new ol.style.Fill({
                    color: '#000'
                })
            });
            
            return new ol.style.Style({
                text: labelStyle
            });
        }
    });
	
    emap.addLayer(tectonicLayer0);
    emap.addLayer(tectonicLayer1);
};

// Fecth Fault Layer
const fetchFaultLayer = () => {
    faultLayer = new ol.layer.Vector({ // Initialize global variable
        source: new ol.source.Vector({
            loader: function (extent, resolution, projection) {
                const url = 'https://services.arcgis.com/jIL9msH9OI208GCb/arcgis/rest/services/Active_Faults/FeatureServer/0/query/?f=json&where=1%3D1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&outFields=*&outSR=102100&inSR=102100';
                fetch(url).then(response => response.json()).then(data => {
                    const format = new ol.format.EsriJSON();
                    const features = format.readFeatures(data, {
                        featureProjection: projection
                    });
                    faultLayer.getSource().addFeatures(features);
                });
            }
        }),
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'orange',
                width: 1
            })
        })
    });
    emap.addLayer(faultLayer);
};

// Fetch Earthquake Data
const fetchEarthquakeData = async (alertLevel, startDate, endDate) => {
    try {
        const response = await fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson');
        const earthquake = await response.json();

        // console.log('Fetched Earthquake Data:', earthquake);

        // Clear existing earthquake layers
        const layersToRemove = [];
        emap.getLayers().forEach((layer) => {
            if (layer.get('name') === 'earthquakeLayer') {
                layersToRemove.push(layer);
            }
        });
        layersToRemove.forEach((layer) => emap.removeLayer(layer));

        // Process each earthquake feature
        earthquake.features.forEach((featureData) => {
            const { mag, place, time, alert, title } = featureData.properties;
            const [lon, lat] = featureData.geometry.coordinates;

            // Check if alert is not null and matches the selected alert level
            if (alert !== null && (!alertLevel || alert === alertLevel)) {
                const eventTime = new Date(time);

                // Log event time and date range for debugging
                // console.log('Event Time:', eventTime);
                // console.log('Start Date:', startDate);
                // console.log('End Date:', endDate);

                // Filter by date range
                if (eventTime >= startDate && eventTime <= endDate) {
                    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Hong_Kong', timeZoneName: 'short' };
                    const formattedTime = eventTime.toLocaleString('en-HK', options);
                    
                    let color;
                    switch (alert) {
                        case 'green':
                            color = 'green';
                            break;
                        case 'yellow':
                            color = 'yellow';
                            break;
                        case 'orange':
                            color = 'orange';
                            break;
                        case 'red':
                            color = 'red';
                            break;
                        default:
                            color = 'gray'; // Default color if alert level is unknown
                    }

                    const feature = new ol.Feature({
                        geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
                        name: `Location: ${place}<br>Magnitude: ${mag}<br>Time: ${formattedTime}`
                    });

                    const hollowCircleRadius = mag;
                    const hollowCircleStyle = new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: hollowCircleRadius,
                            stroke: new ol.style.Stroke({
                                color: color,
                                width: 2.5
                            }),
                            fill: new ol.style.Fill({
                                color: 'rgba(255, 0, 0, 0.0)'
                            })
                        })
                    });

                    // const filledCircleRadius = mag;
                    // const filledCircleStyle = new ol.style.Style({
                        // image: new ol.style.Circle({
                            // radius: filledCircleRadius,
                            // fill: new ol.style.Fill({
                                // color: color
                            // })
                        // })
                    // });

                    feature.setStyle([hollowCircleStyle]);

                    const vectorSource = new ol.source.Vector({
                        features: [feature]
                    });

                    const vectorLayer = new ol.layer.Vector({
                        source: vectorSource,
                        name: 'earthquakeLayer'
                    });

                    emap.addLayer(vectorLayer);

                    emap.on('singleclick', function (evt) {
                        emap.forEachFeatureAtPixel(evt.pixel, function (clickedFeature) {
                            if (clickedFeature === feature) {
                                const coordinates = clickedFeature.getGeometry().getCoordinates();
                                popupContent.innerHTML = `<div style="font-size: 1.2em;"><strong>${title}</strong></div>
                                                          <hr>
                                                          <div style="font-size: 0.8em;">${formattedTime}</div>`
                                popup.setPosition(coordinates);
                            }
                        });
                    });
                }
            }
        });
    } catch (error) {
        console.error('Error fetching earthquake data:', error);
    }
};





// Create Dropdown
const createDropdownFilter = () => {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';

    const dropdown = document.createElement('select');
    dropdown.id = 'alertDropdown';
    const options = [
        { value: '', text: 'All Alerts' },
        { value: 'green', text: 'Green Alert' },
        { value: 'yellow', text: 'Yellow Alert' },
        { value: 'orange', text: 'Orange Alert' },
        { value: 'red', text: 'Red Alert' }
    ];

    options.forEach(optionData => {
        const option = document.createElement('option');
        option.value = optionData.value;
        option.text = optionData.text;
        dropdown.appendChild(option);
    });

	dropdown.onchange = async function () {
		const timeslider = document.getElementById('timeslider');
		const sliderValue = timeslider ? timeslider.value : '6';
		const [startDate, endDate] = getDateRange(sliderValue);

		await fetchEarthquakeData(this.value, startDate, endDate);
	};

    filterContainer.appendChild(dropdown);
    document.getElementById('earthquakeMap').appendChild(filterContainer); // Append to the body for visibility
}

// Create Layer Visibility Control
const createLayerVisibilityControl = () => {
    const layerControl = document.createElement('div');
    layerControl.className = 'layer-control';

    // Checkbox for Tectonic Plates
    const tectonicCheckbox = document.createElement('input');
    tectonicCheckbox.type = 'checkbox';
    tectonicCheckbox.checked = true;
    tectonicCheckbox.onchange = function () {
        tectonicLayer0.setVisible(this.checked);
        tectonicLayer1.setVisible(this.checked);
    };

    const tectonicLabel = document.createElement('label');
    tectonicLabel.textContent = 'Tectonic Plates';
    layerControl.appendChild(tectonicCheckbox);
    layerControl.appendChild(tectonicLabel);
    layerControl.appendChild(document.createElement('br')); // Add line break

    // Checkbox for Fault Layer
    const faultCheckbox = document.createElement('input');
    faultCheckbox.type = 'checkbox';
    faultCheckbox.checked = true;
    faultCheckbox.onchange = function () {
        faultLayer.setVisible(this.checked);
    };

    const faultLabel = document.createElement('label');
    faultLabel.textContent = 'Fault Lines';
    layerControl.appendChild(faultCheckbox);
    layerControl.appendChild(faultLabel);

    document.getElementById('earthquakeMap').appendChild(layerControl); // Append to the body for visibility
};

// Create Timeslider
const getDateRange = (value) => {
    const now = new Date();
    let startDate;

    switch(value) {
        case '1': // 1 day
            startDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
            break;
        case '2': // 3 days
            startDate = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
            break;
        case '3': // 5 days
            startDate = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000));
            break;
        case '4': // 7 days
            startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            break;
        case '5': // 14 days
            startDate = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
            break;
        case '6': // 30 days
            startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            break;
        default:
            startDate = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)); // Default to 1 day
    }
    return [startDate, now];
};

// Create Time slider
const createTimeslider = () => {
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';

    const sliderLabel = document.createElement('label');
    sliderLabel.id = 'sliderLabel';
    sliderLabel.innerText = 'Last 30 days';

    const timeslider = document.createElement('input');
    timeslider.type = 'range';
    timeslider.id = 'timeslider';
    timeslider.min = '1';
    timeslider.max = '6';
    timeslider.step = '1';
    timeslider.value = '6';

    sliderContainer.appendChild(sliderLabel);
    sliderContainer.appendChild(timeslider);
    document.getElementById('earthquakeMap').appendChild(sliderContainer);

    // Event listener for the time slider
    timeslider.addEventListener('input', async (event) => {
        const sliderValue = event.target.value;
        const [startDate, endDate] = getDateRange(sliderValue);

        const labels = ['Yesterday', 'Last 3 days', 'Last 5 days', 'Last 7 days', 'Last 14 days', 'Last 30 days'];
        sliderLabel.innerText = labels[sliderValue - 1];

        const dropdown = document.getElementById('alertDropdown');
        const alertLevel = dropdown ? dropdown.value : null;

        await fetchEarthquakeData(alertLevel, startDate, endDate);
    });
};

// Create Reference Chart
const createReferenceChart = () => {
    const referenceContainer = document.createElement('div');
    referenceContainer.className = 'reference-container';
    referenceContainer.innerHTML = `
        <div class="reference-content">
            <h3>The PAGER Earthquake Impact Scale</h3>
            <table>
                <thead>
                    <tr>
                        <th>Alert Level and Color</th>
                        <th>Estimated Fatalities</th>
                        <th>Estimated Losses (USD)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="color: red;">Red</td>
                        <td>1,000+</td>
                        <td>$1 billion+</td>
                    </tr>
                    <tr>
                        <td style="color: orange;">Orange</td>
                        <td>100 - 999</td>
                        <td>$100 million - $1 billion</td>
                    </tr>
                    <tr>
                        <td style="color: yellow;">Yellow</td>
                        <td>1 - 99</td>
                        <td>$1 million - $100 million</td>
                    </tr>
                    <tr>
                        <td style="color: green;">Green</td>
                        <td>0</td>
                        <td>&lt; $1 million</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <span class="expand-btn">&lt;</span>
    `;

    document.getElementById('earthquakeMap').appendChild(referenceContainer);

    const expandBtn = referenceContainer.querySelector('.expand-btn');
    const referenceContent = referenceContainer.querySelector('.reference-content');

    expandBtn.addEventListener('click', () => {
        if (referenceContent.style.display === 'none' || referenceContent.style.display === '') {
            referenceContent.style.display = 'block';
            expandBtn.innerText = '>';
        } else {
            referenceContent.style.display = 'none';
            expandBtn.innerText = '<';
        }
    });

    referenceContent.style.display = 'none'; // Initially hide the content
};


