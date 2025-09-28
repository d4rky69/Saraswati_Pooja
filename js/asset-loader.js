// Asset loader and error handling system
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing asset loader...');
    
    // Debug mode
    const DEBUG = false;
    
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
    const forceStartButton = document.getElementById('force-start');
    const backgroundSky = document.getElementById('background-sky');
    const saraswatiModel = document.getElementById('saraswati-model');
    const fallbackModel = document.getElementById('fallback-model-entity');
    
    // Show force start button after a delay
    setTimeout(() => {
        if (forceStartButton) {
            forceStartButton.style.display = 'block';
        }
    }, 10000);

    // Add force start button event listener
    if (forceStartButton) {
        forceStartButton.addEventListener('click', function() {
            console.log('Force starting experience');
            finalizeLoading();
        });
    }
    
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
    console.log('Attempting to load panorama from:', panoramaImg.getAttribute('src'));
    
    panoramaImg.addEventListener('load', function() {
        console.log('Panorama loaded successfully');
        backgroundSky.setAttribute('src', '#panorama');
        assetLoaded('panorama');
    });
    
    panoramaImg.addEventListener('error', function(e) {
        console.error('Panorama failed to load, using fallback color. Error:', e);
        // Use a more visible default color
        backgroundSky.setAttribute('color', '#2A0A4A');
        assetError('panorama', e);
    });
    
    // Increased timeout from 10s to 20s for larger images
    setTimeout(function() {
        if (!assetStatus.panorama) {
            console.warn('Panorama load timed out, using fallback');
            backgroundSky.setAttribute('color', '#2A0A4A');
            assetLoaded('panorama');
        }
    }, 20000);
} else {
        console.warn('Panorama element not found');
        assetError('panorama', 'Element not found');
    }
    
    // Model loading
    scene.addEventListener('loaded', function() {
        console.log('Scene loaded, initializing model loading');
        
        // Create debug display if needed
        if (DEBUG) {
            const debugInfo = document.createElement('div');
            debugInfo.className = 'debug-info';
            debugInfo.textContent = 'Scene loaded';
            document.body.appendChild(debugInfo);
            debugInfo.style.display = 'block';
        }
        
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
            
            // Set a default scale in case size detection fails
            saraswatiModel.setAttribute('scale', '50 50 50');
            
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
        }, 10000);
    }
    
    function loadFallbackModel() {
        console.log('Loading fallback model...');
        
        // Hide the main model since it failed
        saraswatiModel.setAttribute('visible', 'false');
        
        // Try the fallback model
        fallbackModel.setAttribute('gltf-model', '#fallback-model');
        fallbackModel.setAttribute('visible', 'true');
        fallbackModel.setAttribute('scale', '0.5 0.5 0.5');  // Larger scale for visibility
        
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
        }, 5000);
    }
    
    function createSimpleBox() {
        console.log('Creating simple box as final fallback');
        fallbackModel.setAttribute('visible', 'false');
        
        const box = document.createElement('a-box');
        box.setAttribute('position', '0 1.5 -3');
        box.setAttribute('color', '#ff9933');
        box.setAttribute('width', '1');
        box.setAttribute('height', '1.5');
        box.setAttribute('depth', '0.5');
        scene.appendChild(box);
        
        // Add some basic animation to show something is working
        box.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 10000');
    }
    
    function finalizeLoading() {
        console.log('Finalizing experience loading');
        
        // Force assets to complete loading if they haven't already
        if (!assetStatus.panorama) assetLoaded('panorama');
        if (!assetStatus.model) {
            createSimpleBox();
            assetLoaded('model');
        }
        if (!assetStatus.audio) assetLoaded('audio');
        
        // Hide loading screen immediately
        loadingScreen.style.opacity = '0';
        
        setTimeout(function() {
            loadingScreen.style.display = 'none';
            console.log('Experience fully loaded and ready');
            
            // Make sure the scene is visible
            if (scene) {
                scene.style.visibility = 'visible';
                scene.style.opacity = '1';
            }
            
            // Initialize particle effects after everything is loaded
            try {
                if (window.AFRAME.components['particle-system']) {
                    const particles = document.createElement('a-entity');
                    particles.setAttribute('position', '0 1.5 -3');
                    particles.setAttribute('particle-system', 'preset: divine; enabled: true');
                    scene.appendChild(particles);
                }
            } catch (e) {
                console.error('Failed to initialize particles:', e);
            }
        }, 500);
    }
    
    // Absolute fallback - hide loading screen after maximum wait time
    setTimeout(function() {
        if (loadingScreen.style.display !== 'none') {
            console.warn('Maximum wait time reached, forcing experience to start');
            finalizeLoading();
        }
    }, 15000); // Reduced from 30s to 15s for quicker fallback
});
