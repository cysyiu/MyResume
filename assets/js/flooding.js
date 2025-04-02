// Initialize the Cesium Viewer with the correct container ID
function initializeFloodingMap() {
    // Initialize the Cesium Viewer
    const viewer = new Cesium.Viewer('floodingMap', {
        baseLayerPicker: false,
        timeline: false,
        animation: false,
        vrButton: false,
        fullscreenButton: false,
        homeButton: true,
        navigationHelpButton: false,
        geocoder: false,
        sceneModePicker: false,
        requestRenderMode: false
    });

    // Adding a static 3D Tileset layer (ground level)
    async function addBuildingLayer() {
        const tileset = await Cesium.Cesium3DTileset.fromUrl(
            'https://data.map.gov.hk/api/3d-data/3dtiles/f2/tileset.json?key=3967f8f365694e0798af3e7678509421'
        );
        viewer.scene.primitives.add(tileset);
        
        // Wait for tileset to load to get accurate bounding sphere
        return new Promise(resolve => {
            tileset.readyPromise.then(() => {
                const boundingSphere = tileset.boundingSphere;
                const center = boundingSphere.center;
                const cartographic = Cesium.Cartographic.fromCartesian(center);
                
                // Use a fixed minimum height that's definitely below the tileset
                let minHeight = -47; // Start with a negative value to ensure it's below ground
                
                console.log('Using minimum height:', minHeight);
                resolve({
                    baseHeight: minHeight,
                    center: center,
                    longitude: Cesium.Math.toDegrees(cartographic.longitude),
                    latitude: Cesium.Math.toDegrees(cartographic.latitude)
                });
            });
        });
    }

    // Create the sea level entity with a box using height relative to the tileset base
    function createSeaLevelEntity(tilesetInfo, relativeSeaLevel) {
        // Remove previous sea level entity
        if (viewer.entities.getById('seaLevelEntity')) {
            viewer.entities.removeById('seaLevelEntity');
        }
        
        // Calculate the absolute height of the sea level
        // Start from the base height (which is below the tileset) and add the relative sea level
        const absoluteSeaLevel = tilesetInfo.baseHeight + relativeSeaLevel;
        
        // The box height is from the base to the sea level
        const boxHeight = Math.max(0.1, absoluteSeaLevel - tilesetInfo.baseHeight);
        
        // Position the box center at the midpoint between base and sea level
        const boxCenterHeight = tilesetInfo.baseHeight + (boxHeight / 2);
        
        // Add new water box entity
        return viewer.entities.add({
            id: 'seaLevelEntity',
            position: Cesium.Cartesian3.fromDegrees(
                tilesetInfo.longitude, 
                tilesetInfo.latitude,
                boxCenterHeight // Position at the center of the box
            ),
            box: {
                dimensions: new Cesium.Cartesian3(70000, 40000, boxHeight), // Width, depth, and height
                material: Cesium.Color.LIGHTBLUE.withAlpha(0.6),
                outline: true,
                outlineColor: Cesium.Color.WHITE.withAlpha(0.8)
            }
        });
    }

    // Initialize the application
    async function initialize() {
        // Define the home view position and orientation
        const homeViewPosition = Cesium.Cartesian3.fromDegrees(
            114.09086884578214,
            22.044338206507053,
            35339.14068737606
        );
        
        const homeViewOrientation = {
            heading: 6.280194717481077,
            pitch: -0.7921019105734031,
            roll: 6.283182074536001
        };
        
        // Override the default home button behavior
        viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function(commandInfo) {
            // Cancel the default behavior
            commandInfo.cancel = true;
            
            // Fly to our custom home position
            viewer.camera.flyTo({
                destination: homeViewPosition,
                orientation: homeViewOrientation,
                duration: 1.5
            });
        });
        
        const tilesetInfo = await addBuildingLayer(); // Get the tileset height reference and center
        
        // Create slider element if it doesn't exist
        let slider = document.getElementById("seaLevel");
        let valueDisplay = document.getElementById("seaLevelValue");
        
        if (!slider) {
            // Create slider container
            const sliderContainer = document.createElement("div");
            sliderContainer.style.position = "absolute";
            sliderContainer.style.bottom = "30px";
            sliderContainer.style.left = "10px";
            sliderContainer.style.zIndex = "1000";
            sliderContainer.style.background = "rgba(42, 42, 42, 0.8)";
            sliderContainer.style.padding = "10px";
            sliderContainer.style.borderRadius = "5px";
            sliderContainer.style.color = "white";
            
            // Create label
            const label = document.createElement("div");
            label.textContent = "Sea Level Rise:";
            sliderContainer.appendChild(label);
            
            // Create slider
            slider = document.createElement("input");
            slider.type = "range";
            slider.id = "seaLevel";
            slider.min = 0;
            slider.max = 50;
            slider.step = 0.1;
            slider.value = 0;
            slider.style.width = "200px";
            sliderContainer.appendChild(slider);
            
            // Create value display
            valueDisplay = document.createElement("span");
            valueDisplay.id = "seaLevelValue";
            valueDisplay.textContent = "0.0 m";
            valueDisplay.style.marginLeft = "10px";
            sliderContainer.appendChild(valueDisplay);
            
            // Add the slider container to the map container
            document.getElementById("floodingMap").appendChild(sliderContainer);
        }
        
        // Set default sea level to 0 meters (at the base of the tileset)
        const defaultRelativeSeaLevel = 0;
        slider.value = defaultRelativeSeaLevel;
        
        // Create initial sea level based on relative height
        createSeaLevelEntity(tilesetInfo, defaultRelativeSeaLevel);
        
        // Update the initial display value
        valueDisplay.textContent = defaultRelativeSeaLevel.toFixed(1) + " m";
        
        // Fly to the specific location (initial view)
        viewer.camera.flyTo({
            destination: homeViewPosition,
            orientation: homeViewOrientation,
            duration: 0
        });
        
        // Set up the sea level slider event handler
        slider.addEventListener("input", (event) => {
            const relativeSeaLevel = parseFloat(event.target.value);
            valueDisplay.textContent = relativeSeaLevel.toFixed(1) + " m";
            
            // Update sea level using relative height
            createSeaLevelEntity(tilesetInfo, relativeSeaLevel);
        });
        
        // Add debug info to help verify alignment
        console.log("Building base height:", tilesetInfo.baseHeight);
        console.log("Initial relative sea level:", defaultRelativeSeaLevel);
        console.log("Initial absolute sea level:", tilesetInfo.baseHeight + defaultRelativeSeaLevel);
    }

    // Start the application
    initialize();
}

// Call the initialization function when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if the flooding map container exists
    if (document.getElementById('floodingMap')) {
        // Initialize the flooding map
        initializeFloodingMap();
    }
});
