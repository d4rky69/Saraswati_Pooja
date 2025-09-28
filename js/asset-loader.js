// Asset loader and error handling system
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing asset loader...');
    
    // Track loading assets
    const assetStatus = {
        panorama: false,
        model: false,
        audio: false,
        totalAssets: 3,
        loadedAssets: 0,
        hasErrors: false,
        errors: []
    };
    
    // Elements
    const scene = document.querySelector('a-scene');
    const loadingScreen = document.getElementById('loading-screen');
    const progressPercent = document.getElementById('progress-percent');
    const backgroundSky = document.getElementById('background-sky');
    const saraswatiModel = document.getElementById('saraswati-model');
    const fallbackModel = document.getElementById('fallback-model-entity');
    
    // Load tracking
    function updateProgress() {
        const percentage = Math.round((assetStatus.loadedAssets / assetStatus.totalAssets) * 100);
        console.log(`Loading progress: ${percentage}%`);
        
        if (progressPercent) {
            progressPercent.textContent = `${percentage}%`;
        }
        
        // Check if all critical assets are loaded or failed with fallbacks
        if (assetStatus.loadedAssets >= assetStatus.totalAssets) {
            console.log('All assets processed, preparing scene...');
            finalizeLoading();
        }
    }
    
    function assetLoaded(type) {
        assetStatus[type] = true;
        assetStatus.loadedAssets++;
        updateProgress();
    }
    
    function assetError(type, error) {
        console.error(`Error loading ${type}:`, error);
        assetStatus.errors.push({ type, error });
        assetStatus.hasErrors = true;
        assetStatus.loadedAssets++; // Count as processed even if errored
        updateProgress();
    }
    
    // Panorama handling
    const panoramaImg = document.getElementById('panorama');
    if (panoramaImg) {
        panoramaImg.addEventListener('load', function() {
            console.log('Panorama loaded successfully');
            backgroundSky.setAttribute('src', '#panorama');
            assetLoaded('panorama');
        });
        
        panoramaImg.addEventListener('error', function(e) {
            console.error('Panorama failed to load, using fallback color');
            // Already set a default color in the HTML
            assetError('panorama', e);
        });
    } else {
        console.warn('Panorama element not found');
        assetError('panorama', 'Element not found');
    }
    
    // Model loading
    scene.addEventListener('loaded', function() {
        console.log('Scene loaded, initializing model loading');
        
        // Load main model
        loadMainModel();
        
        // Check audio loading
        const audioElement = document.getElementById('background-audio');
        if (audioElement) {
            audioElement.addEventListener('canplaythrough', function() {
                console.log('Audio loaded successfully');
                assetLoaded('audio');
            });
            
            audioElement.addEventListener('error', function(e) {
                console.error('Audio failed to load, continuing without audio');
                assetError('audio', e);
            });
            
            // Force audio status update after timeout in case events don't fire
            setTimeout(function() {
                if (!assetStatus.audio) {
                    console.warn('Audio load status unknown, marking as loaded');
                    assetLoaded('audio');
                }
            }, 5000);
        } else {
            console.warn('Audio element not found');
            assetError('audio', 'Element not found');
        }
    });
    
    function loadMainModel() {
        console.log('Loading main model...');
        
        // Set model source
        saraswatiModel.setAttribute('gltf-model', '#idol-model');
        
        // Model load success handler
        saraswatiModel.addEventListener('model-loaded', function(e) {
            console.log('Main model loaded successfully!');
            saraswatiModel.setAttribute('visible', 'true');
            
            // Attempt to adjust model scale based on actual size
            try {
                const model = e.detail.model;
                const bbox = new THREE.Box3().setFromObject(model);
                const size = bbox.getSize(new THREE.Vector3());
                console.log('Model dimensions:', size);
                
                // Adjust scale based on size
                if (size.x < 0.1 || size.y < 0.1) {
                    console.log('Model is very small, increasing scale');
                    saraswatiModel.setAttribute('scale', '80 80 80');
                } else if (size.x > 10 || size.y > 10) {
                    console.log('Model is very large, reducing scale');
                    saraswatiModel.setAttribute('scale', '25 25 25');
                }
            } catch (err) {
                console.error('Error analyzing model dimensions:', err);
            }
            
            assetLoaded('model');
        });
        
        // Model load error handler
        saraswatiModel.addEventListener('model-error', function(e) {
            console.error('Main model failed to load, trying fallback');
            loadFallbackModel();
        });
        
        // Set a timeout in case model loading hangs
        setTimeout(function() {
            if (!assetStatus.model) {
                console.warn('Model load timed out, trying fallback');
                loadFallbackModel();
            }
        }, 15000);
    }
    
    function loadFallbackModel() {
        console.log('Loading fallback model...');
        
        // Try the fallback model
        fallbackModel.setAttribute('gltf-model', '#fallback-model');
        fallbackModel.setAttribute('visible', 'true');
        
        // Fallback model load success
        fallbackModel.addEventListener('model-loaded', function() {
            console.log('Fallback model loaded');
            assetLoaded('model');
        });
        
        // Fallback model error - use a simple box as last resort
        fallbackModel.addEventListener('model-error', function() {
            console.error('Fallback model also failed, using simple box');
            createSimpleBox();
            assetError('model', 'All models failed');
        });
        
        // Another timeout for fallback model
        setTimeout(function() {
            if (!assetStatus.model) {
                console.warn('Fallback model timed out, using simple box');
                createSimpleBox();
                assetError('model', 'Fallback model timeout');
            }
        }, 10000);
    }
    
    function createSimpleBox() {
        console.log('Creating simple box as final fallback');
        const box = document.createElement('a-box');
        box.setAttribute('position', '0 1.5 -3');
        box.setAttribute('color', '#ff9933');
        box.setAttribute('width', '1');
        box.setAttribute('height', '1.5');
        box.setAttribute('depth', '0.5');
        scene.appendChild(box);
    }
    
    function finalizeLoading() {
        console.log('Finalizing experience loading');
        
        // Add a short delay to ensure everything is rendered
        setTimeout(function() {
            console.log('Hiding loading screen');
            loadingScreen.style.opacity = '0';
            
            setTimeout(function() {
                loadingScreen.style.display = 'none';
                console.log('Experience fully loaded and ready');
                
                // Initialize particle effects after everything is loaded
                if (window.AFRAME.components['particle-system']) {
                    const particles = document.createElement('a-entity');
                    particles.setAttribute('position', '0 1.5 -3');
                    particles.setAttribute('particle-system', 'preset: divine; enabled: true');
                    scene.appendChild(particles);
                }
            }, 700);
        }, 500);
    }
    
    // Absolute fallback - hide loading screen after maximum wait time
    setTimeout(function() {
        if (loadingScreen.style.display !== 'none') {
            console.warn('Maximum wait time reached, forcing experience to start');
            
            // Force status completion for any remaining assets
            if (!assetStatus.panorama) assetLoaded('panorama');
            if (!assetStatus.model) {
                createSimpleBox();
                assetLoaded('model');
            }
            if (!assetStatus.audio) assetLoaded('audio');
            
            finalizeLoading();
        }
    }, 30000);
});
