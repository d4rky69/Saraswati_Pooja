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
        if (assetStatus[type]) return; // Prevent double-counting
        assetStatus[type] = true;
        assetStatus.loadedAssets++;
        updateProgress();
    }
    
    function assetError(type, error) {
        console.error(`Error loading ${type}:`, error);
        assetStatus.errors.push({ type, error: error.toString() });
        assetStatus.hasErrors = true;
        
        // Only count as loaded if we haven't already
        if (!assetStatus[type]) {
            assetStatus[type] = 'error';
            assetStatus.loadedAssets++; // Count as processed even if errored
        }
        
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
    
    // Panorama handling
    const panoramaImg = document.getElementById('panorama');
    if (panoramaImg) {
        // Set a timeout to catch if the load event never fires
        const panoramaTimeout = setTimeout(() => {
            if (!assetStatus.panorama) {
                console.warn('Panorama load timeout, using fallback');
                assetError('panorama', new Error('Load timeout'));
            }
        }, 10000);
        
        panoramaImg.addEventListener('load', function() {
            console.log('Panorama loaded successfully');
            clearTimeout(panoramaTimeout);
            backgroundSky.setAttribute('src', '#panorama');
            assetLoaded('panorama');
        });
        
        panoramaImg.addEventListener('error', function(e) {
            console.error('Panorama failed to load, using fallback color');
            clearTimeout(panoramaTimeout);
            // Already set a default color in the HTML
            assetError('panorama', e);
        });
    } else {
        console.warn('Panorama element not found');
        assetError('panorama', new Error('Element not found'));
    }
    
    // Model loading
    scene.addEventListener('loaded', function() {
        console.log('Scene loaded, initializing model loading');
        
        // Load main model
        loadMainModel();
        
        // Check audio loading
        const audioElement = document.getElementById('background-audio');
        if (audioElement) {
            // Set a timeout for audio loading
            const audioTimeout = setTimeout(() => {
                if (!assetStatus.audio) {
                    console.warn('Audio load timeout, continuing without audio');
                    assetLoaded('audio'); // Mark as loaded anyway to proceed
                }
            }, 8000);
            
            // For browsers that support it, this event fires when audio can be played
            audioElement.addEventListener('canplaythrough', function onCanPlay() {
                console.log('Audio can play through now');
                clearTimeout(audioTimeout);
                audioElement.removeEventListener('canplaythrough', onCanPlay);
                assetLoaded('audio');
            });
            
            audioElement.addEventListener('error', function(e) {
                console.error('Audio failed to load, continuing without audio');
                clearTimeout(audioTimeout);
                assetError('audio', e);
            });
            
            // Try to pre-load audio for iOS
            try {
                audioElement.load();
            } catch (e) {
                console.warn('Audio preload attempt failed:', e);
            }
        } else {
            console.warn('Audio element not found');
            assetError('audio', new Error('Element not found'));
        }
    });
    
    function loadMainModel() {
        console.log('Loading main model...');
        
        // Set model source
        saraswatiModel.setAttribute('gltf-model', '#idol-model');
        
        // Set a timeout for model loading
        const modelTimeout = setTimeout(() => {
            if (!assetStatus.model) {
                console.warn('Model load timed out, trying fallback');
                loadFallbackModel();
            }
        }, 15000);
        
        // Model load success handler
        saraswatiModel.addEventListener('model-loaded', function(e) {
            console.log('Main model loaded successfully!');
            clearTimeout(modelTimeout);
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
            clearTimeout(modelTimeout);
            loadFallbackModel();
        });
    }
    
    function loadFallbackModel() {
        console.log('Loading fallback model...');
        
        // Try the fallback model
        fallbackModel.setAttribute('gltf-model', '#fallback-model');
        fallbackModel.setAttribute('visible', 'true');
        
        // Set a timeout for fallback model loading
        const fallbackTimeout = setTimeout(() => {
            if (!assetStatus.model) {
                console.warn('Fallback model timed out, using simple box');
                createSimpleBox();
                assetError('model', new Error('Fallback model timeout'));
            }
        }, 10000);
        
        // Fallback model load success
        fallbackModel.addEventListener('model-loaded', function() {
            console.log('Fallback model loaded');
            clearTimeout(fallbackTimeout);
            assetLoaded('model');
        });
        
        // Fallback model error - use a simple box as last resort
        fallbackModel.addEventListener('model-error', function() {
            console.error('Fallback model also failed, using simple box');
            clearTimeout(fallbackTimeout);
            createSimpleBox();
            assetError('model', new Error('All models failed'));
        });
    }
    
    function createSimpleBox() {
        console.log('Creating simple box as final fallback');
        const box = document.createElement('a-box');
        box.setAttribute('position', '0 1.5 -3');
        box.setAttribute('color', '#ff9933');
        box.setAttribute('width', '1');
        box.setAttribute('height', '1.5');
        box.setAttribute('depth', '0.5');
        box.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 10000; easing: linear');
        scene.appendChild(box);
        assetLoaded('model'); // Mark model as loaded with the box fallback
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
                    try {
                        const particles = document.createElement('a-entity');
                        particles.setAttribute('position', '0 1.5 -3');
                        particles.setAttribute('particle-system', 'preset: divine; enabled: true');
                        scene.appendChild(particles);
                    } catch (e) {
                        console.error('Failed to create particle system:', e);
                    }
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
