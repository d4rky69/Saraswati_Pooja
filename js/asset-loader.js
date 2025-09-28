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
    const errorMessage = document.getElementById('error-message');
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
        
        // Show error in UI
        if (errorMessage) {
            if (type === 'audio') {
                // Audio errors aren't critical, don't show in UI
                console.warn('Audio failed but experience can continue');
            } else {
                errorMessage.textContent = `Error loading ${type}. Using fallback.`;
                errorMessage.style.display = 'block';
                
                // Hide error after 5 seconds
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                }, 5000);
            }
        }
        
        updateProgress();
    }
    
    // Panorama handling with better error handling
    function loadPanorama() {
        console.log('Loading panorama image...');
        const panoramaImg = document.getElementById('panorama');
        
        if (!panoramaImg) {
            console.warn('Panorama element not found');
            backgroundSky.setAttribute('color', '#190033'); // Default purple color
            assetError('panorama', 'Element not found');
            return;
        }
        
        // Create new image to test loading
        const testImage = new Image();
        testImage.onload = function() {
            console.log('Panorama loaded successfully');
            backgroundSky.setAttribute('src', '#panorama');
            assetLoaded('panorama');
        };
        
        testImage.onerror = function(e) {
            console.error('Panorama failed to load, using fallback color');
            backgroundSky.setAttribute('color', '#190033'); // Default purple color
            assetError('panorama', e);
        };
        
        // Try to load the image
        testImage.src = panoramaImg.getAttribute('src');
        
        // Set timeout for image loading
        setTimeout(function() {
            if (!assetStatus.panorama) {
                console.warn('Panorama load timed out, using fallback color');
                backgroundSky.setAttribute('color', '#190033'); // Default purple color
                assetError('panorama', 'Load timeout');
            }
        }, 10000);
    }
    
    // Model loading with improved scaling logic
    function loadMainModel() {
        console.log('Loading main model...');
        
        // Set model source
        saraswatiModel.setAttribute('gltf-model', '#idol-model');
        
        // Model load success handler with fixed scale approach
        saraswatiModel.addEventListener('model-loaded', function(e) {
            console.log('Main model loaded successfully!');
            
            // IMPORTANT: Fix for model scaling - use consistent scale
            // Adjust these values based on your specific model
            saraswatiModel.setAttribute('scale', '5 5 5');
            saraswatiModel.setAttribute('position', '0 1.2 -3');
            saraswatiModel.setAttribute('visible', 'true');
            
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
        
        // Show any critical errors
        if (assetStatus.hasErrors && errorMessage) {
            let criticalErrors = assetStatus.errors.filter(err => err.type !== 'audio');
            if (criticalErrors.length > 0) {
                errorMessage.textContent = 'Some assets failed to load. Using fallbacks.';
                errorMessage.style.display = 'block';
            }
        }
        
        // Add a short delay to ensure everything is rendered
        setTimeout(function() {
            console.log('Hiding loading screen');
            loadingScreen.style.opacity = '0';
            
            setTimeout(function() {
                loadingScreen.style.display = 'none';
                console.log('Experience fully loaded and ready');
                
                // Initialize particle effects after everything is loaded
                if (window.AFRAME && window.AFRAME.components['particle-system']) {
                    const particles = document.createElement('a-entity');
                    particles.setAttribute('position', '0 1.5 -3');
                    particles.setAttribute('particle-system', 'preset: divine; enabled: true');
                    scene.appendChild(particles);
                }
            }, 700);
        }, 500);
    }
    
    // Start loading process
    scene.addEventListener('loaded', function() {
        console.log('Scene loaded, starting asset loading...');
        
        // Load panorama
        loadPanorama();
        
        // Load main model
        loadMainModel();
        
        // Check audio loading
        const audioElement = document.getElementById('background-audio');
        if (audioElement) {
            // For browsers that support it, this event fires when audio can be played
            audioElement.addEventListener('canplaythrough', function onCanPlay() {
                console.log('Audio can play through now');
                audioElement.removeEventListener('canplaythrough', onCanPlay);
                assetLoaded('audio');
            });
            
            audioElement.addEventListener('error', function(e) {
                console.error('Audio failed to load, continuing without audio');
                assetError('audio', e);
            });
            
            // Force audio status update after timeout in case events don't fire
            setTimeout(function() {
                if (!assetStatus.audio) {
                    // Check readyState as an alternative to event
                    if (audioElement.readyState >= 2) {
                        console.log('Audio appears to be loaded based on readyState');
                        assetLoaded('audio');
                    } else {
                        console.warn('Audio load status unknown, marking as loaded anyway');
                        assetLoaded('audio');
                    }
                }
            }, 5000);
            
            // Try to pre-load audio for iOS
            try {
                audioElement.load();
            } catch (e) {
                console.warn('Audio preload attempt failed:', e);
            }
        } else {
            console.warn('Audio element not found');
            assetError('audio', 'Element not found');
        }
    });
    
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
