// 1. Constants and Configurations
let map;
const HONG_KONG_CENTER = [114.1095, 22.3964];
const RAINFALL_RANGES = [0, 20, 40, 60, 80, 100];

// 2. Data Fetching Functions
async function fetchWeatherData() {
    const response = await fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en');
    return await response.json();
}

async function fetchWeatherStations() {
    const response = await fetch('https://services3.arcgis.com/6j1KwZfY2fZrfNMR/arcgis/rest/services/Network_of_weather_stations_in_Hong_Kong/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson');
    return await response.json();
}

// 3. Styling Functions
function getRainfallColor(value) {
    const maxRainfall = 100;
    const minOpacity = 0;
    const opacity = Math.max(minOpacity, Math.min(value / maxRainfall, 1) * 0.7);
    return `rgba(0, 0, 255, ${opacity})`;
}

function getStationStyle(feature, weatherData) {
    const stationName = feature.get('Name_en');
    const tempData = weatherData.temperature.data.find(t => 
        t.place.toUpperCase() === stationName.toUpperCase()
    );
    
    if (!tempData) {
        // console.log(`No temperature data found for station: ${stationName}`);
        return new ol.style.Style({}); // Empty style if no match
    }
    
    return new ol.style.Style({
        text: new ol.style.Text({
            text: tempData.value.toString() + '°C',
            fill: new ol.style.Fill({
                color: 'black'
            }),
            stroke: new ol.style.Stroke({
                color: 'white',
                width: 3
            }),
            font: 'bold 14px Arial'
        })
    });
}

function getDistrictStyle(feature, weatherData) {
    const districtName = feature.get('ENAME').toUpperCase();
    
    const rainfallData = weatherData.rainfall.data.find(r => {
        const normalizedPlace = r.place.replace(' District', '').toUpperCase();
        return districtName === normalizedPlace;
    });
    
    let fillColor;
    if (rainfallData) {
        fillColor = getRainfallColor(rainfallData.max);
        // console.log(`${districtName}: Rainfall ${rainfallData.max}mm -> Color ${fillColor}`);
    } else {
        fillColor = 'rgba(0, 0, 255, 0.1)';
        // console.log(`${districtName}: No rainfall data -> Using default color ${fillColor}`);
    }
    
    return new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'blue',
            width: 1
        }),
        fill: new ol.style.Fill({
            color: fillColor
        })
    });
}


// 4. Map Initialization
map = new ol.Map({
    target: 'WeatherMap',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/wgs84/{z}/{x}/{y}.png',
                visible: true
            })
        }),
        new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/en/wgs84/{z}/{x}/{y}.png',
                visible: true
            })
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat(HONG_KONG_CENTER),
        zoom: 10.3,
        constrainResolution: true
    })
});

// 5. Layer Management
function initializeDistrictLayer() {
    fetch('https://services3.arcgis.com/6j1KwZfY2fZrfNMR/arcgis/rest/services/Hong_Kong_18_Districts/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson')
        .then(response => response.json())
        .then(async geojson => {
            const weatherData = await fetchWeatherData();
            const vectorSource = new ol.source.Vector({
                features: new ol.format.GeoJSON().readFeatures(geojson, {
                    featureProjection: 'EPSG:3857'
                })
            });
            const vectorLayer = new ol.layer.Vector({
                source: vectorSource,
                style: function(feature) {
                    return getDistrictStyle(feature, weatherData);
                }
            });
            map.addLayer(vectorLayer);
        });
}


async function addWeatherStationsLayer() {
    const [stationsGeoJson, weatherData] = await Promise.all([
        fetchWeatherStations(),
        fetchWeatherData()
    ]);

    const stationSource = new ol.source.Vector({
        features: new ol.format.GeoJSON().readFeatures(stationsGeoJson, {
            featureProjection: 'EPSG:3857'
        })
    });

    const stationLayer = new ol.layer.Vector({
        source: stationSource,
        style: (feature) => getStationStyle(feature, weatherData),
        zIndex: 2
    });

    map.addLayer(stationLayer);
}

// 6. Popup Management
function initializePopup() {
    const container = document.createElement('div');
    container.className = 'ol-popup';
    
    const closer = document.createElement('a');
    closer.className = 'ol-popup-closer';
    container.appendChild(closer);
    
    const content = document.createElement('div');
    container.appendChild(content);
    
    const popup = new ol.Overlay({
        element: container,
        autoPan: true,
        autoPanAnimation: {
            duration: 250
        }
    });
    
    closer.onclick = function() {
        popup.setPosition(undefined);
        closer.blur();
        return false;
    };
    
    // Return both popup overlay and content element for use in click handler
    return { popup, content };
}

// 7. Legend Creation
function createLegend() {
    const legend = document.createElement('div');
    legend.className = 'map-legend';
    
    const title = document.createElement('div');
    title.className = 'map-legend-title';
    title.innerHTML = 'Rainfall (mm)';
    legend.appendChild(title);
    
    RAINFALL_RANGES.forEach((value, i) => {
        if (i < RAINFALL_RANGES.length - 1) {
            const row = document.createElement('div');
            row.className = 'map-legend-row';
            
            const colorBox = document.createElement('div');
            colorBox.className = 'map-legend-color-box';
            colorBox.style.backgroundColor = getRainfallColor(value);
            
            const label = document.createElement('span');
            label.innerHTML = `${value} - ${RAINFALL_RANGES[i + 1]}`;
            
            row.appendChild(colorBox);
            row.appendChild(label);
            legend.appendChild(row);
        }
    });
    
    document.getElementById('WeatherMap').appendChild(legend);
}

// 8. Weather Box
function createWeatherBox() {
    const weatherBox = document.createElement('div');
    weatherBox.className = 'weather-box';
    
    const title = document.createElement('div');
    title.className = 'weather-title';
    title.textContent = 'Current Weather';
    
    const weatherIcon = document.createElement('img');
    weatherIcon.className = 'weather-icon';
    
    const divider = document.createElement('hr');
    divider.className = 'weather-divider';
    
    const timeUpdate = document.createElement('div');
    timeUpdate.className = 'weather-time';
    
    async function updateWeather() {
        const weatherData = await fetchWeatherData();
        const iconValue = weatherData.icon[0];
        weatherIcon.src = `https://www.hko.gov.hk/images/HKOWxIconOutline/pic${iconValue}.png`;
    }
    
    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        timeUpdate.textContent = `Update at ${timeString}`;
    }
    
    updateWeather();
    updateTime();
    setInterval(updateTime, 1000);
    
    weatherBox.appendChild(title);
    weatherBox.appendChild(weatherIcon);
    weatherBox.appendChild(divider);
    weatherBox.appendChild(timeUpdate);
    
    document.getElementById('WeatherMap').appendChild(weatherBox);
}



// 9. Event Handlers
async function handleMapClick(evt, popupContent, popup) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
        return {feature: feature, layer: layer};
    });
    
    if (feature) {
        if (feature.feature.get('ENAME')) {
            const districtName = feature.feature.get('ENAME');
            const weatherData = await fetchWeatherData();
            const normalizedDistrictName = districtName.toUpperCase();
            
            const rainfallData = weatherData.rainfall.data.find(r => {
                const normalizedPlace = r.place.replace(' District', '').toUpperCase();
                return normalizedDistrictName === normalizedPlace;
            });
            
            if (rainfallData) {
                popupContent.innerHTML = `${districtName}: ${rainfallData.max} mm`;
                popup.setPosition(evt.coordinate);
            }
        } else if (feature.feature.get('Name_en')) {
            const stationName = feature.feature.get('Name_en');
            const weatherData = await fetchWeatherData();
            
            const tempData = weatherData.temperature.data.find(t => 
                t.place.toUpperCase() === stationName.toUpperCase()
            );
            
            if (tempData) {
                popupContent.innerHTML = `${stationName}: ${tempData.value}°C`;
                popup.setPosition(evt.coordinate);
            }
        }
    }
}

// 10. Initialization
const portfolioSection = document.querySelector('#portfolio');
const portfolioFilter = document.querySelector('#portfolio-flters li[data-filter=".filter-wd"]');

if (portfolioSection) {
    new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                map.updateSize();
            }
        });
    }).observe(portfolioSection);
}

document.addEventListener('DOMContentLoaded', () => {
    // Wait for map element to be ready
    const mapElement = document.getElementById('WeatherMap');
    
    // Initialize map only when element exists
    if (mapElement) {
        // Create map instance
        map = new ol.Map({
            target: 'WeatherMap',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/wgs84/{z}/{x}/{y}.png'
                    })
                }),
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/en/wgs84/{z}/{x}/{y}.png'
                    })
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat(HONG_KONG_CENTER),
                zoom: 10.3
            })
        });

        // Initialize layers after map is ready
		map.once('postrender', () => {
			initializeDistrictLayer();
			addWeatherStationsLayer();
			createLegend();
			createWeatherBox();
			
			const { popup, content } = initializePopup();
			map.addOverlay(popup);
			
			map.on('click', (evt) => handleMapClick(evt, content, popup));
		})
    }
});
