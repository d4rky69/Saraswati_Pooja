// Asset loader and error handling system
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing asset loader...');
    
    // Track loading assets with more granular states
    const assetStatus = {
        panorama: { loaded: false, started: false, error: null },
        model: { loaded: false, started: false, error: null },
        audio: { loaded: false, started: false, error: null },
        totalAssets: 3,
        loadedAssetsCount: 0,
        startTime: Date.now()
    };
    
    // Elements
    const scene = document.querySelector('a-scene');
    const loadingScreen = document.getElementById('loading-screen');
    const progressPercent = document.getElementById('progress-percent');
    const progressDetails = document.getElementById('progress-details');
    const errorMessage = document.getElementById('error-message');
    const backgroundSky = document.getElementById('background-sky');
    const saraswatiModel = document.getElementById('saraswati-model');
    const fallbackModel = document.getElementById('fallback-model-entity');
    
    // More frequent progress updates
    const progressInterval = setInterval(updateProgressDisplay, 250);
    
    // Load tracking with more granular progress
    function updateProgress(type, status, error = null) {
        console.log(`Asset ${type} ${status}`, error ? error : '');
        
        // Update the asset status
        assetStatus[type].started = true;
        
        if (status === 'loaded') {
            assetStatus[type].loaded = true;
            assetStatus[type].error = null;
            assetStatus.loadedAssetsCount++;
        } else if (status === 'error') {
            assetStatus[type].error = error || 'Unknown error';
            assetStatus.loadedAssetsCount++; // Count as processed even if errored
        }
        
        updateProgressDisplay();
        
        // Check if all assets are processed
        if (assetStatus.loadedAssetsCount >= assetStatus.totalAssets) {
            console.log('All assets processed, preparing scene...');
            clearInterval(progressInterval);
            finalizeLoading();
        }
    }
    
    function updateProgressDisplay() {
        // Calculate loaded percentage
        const loadedAssets = assetStatus.loadedAssetsCount;
        const totalAssets = assetStatus.totalAssets;
        let percentage = Math.round((loadedAssets / totalAssets) * 100);
        
        // Add a time-based progress component for better user experience
        const elapsedTime = Date.now() - assetStatus.startTime;
        const timeBonus = Math.min(20, Math.floor(elapsedTime / 1000) * 2); // Add up to 20% based on time
        
        // If not fully loaded, show a progressive percentage that increases with time
        if (percentage < 100) {
            percentage = Math.min(95, percentage + timeBonus);
        }
        
        // Update the progress display
        if (progressPercent) {
            progressPercent.textContent = `${percentage}%`;
        }
        
        // Update detailed loading info if available
        if (progressDetails) {
            let details = [];
            if (assetStatus.panorama.started) details.push(`Background: ${assetStatus.panorama.loaded ? 'Ready' : 'Loading...'}`);
            if (assetStatus.model.started) details.push(`Model: ${assetStatus.model.loaded ? 'Ready' : 'Loading...'}`);
            if (assetStatus.audio.started) details.push(`Audio: ${assetStatus.audio.loaded ? 'Ready' : 'Loading...'}`);
            
            progressDetails.innerHTML = details.join(' | ');
        }
    }
    
    // Simplified asset loading tracking
    function assetLoaded(type) {
        updateProgress(type, 'loaded');
    }
    
    function assetError(type, error) {
        updateProgress(type, 'error', error);
        
        // Show error in UI
        if (errorMessage) {
            if (type === 'audio') {
                // Audio errors aren't critical
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
    }
    
    // Panorama handling with better error handling
    function loadPanorama() {
        console.log('Loading panorama image...');
        updateProgress('panorama', 'started');
        
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
        
        // Set timeout for image loading - reduced from 10s to 7s
        setTimeout(function() {
            if (!assetStatus.panorama.loaded) {
                console.warn('Panorama load timed out, using fallback color');
                backgroundSky.setAttribute('color', '#190033'); // Default purple color
                assetError('panorama', 'Load timeout');
            }
        }, 7000);
    }
    
    // Model loading with improved error handling
    function loadMainModel() {
        console.log('Loading main model...');
        updateProgress('model', 'started');
        
        // Set model source
        saraswatiModel.setAttribute('gltf-model', '#idol-model');
        
        // Model load success handler
        saraswatiModel.addEventListener('model-loaded', function(e) {
            console.log('Main model loaded successfully!');
            
            // Use consistent scale
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
        
        // Set a timeout in case model loading hangs - reduced from 15s to 8s
        setTimeout(function() {
            if (!assetStatus.model.loaded) {
                console.warn('Model load timed out, trying fallback');
                loadFallbackModel();
            }
        }, 8000);
    }
    
    function loadFallbackModel() {
        console.log('Loading fallback model...');
        
        // Hide the main model
        saraswatiModel.setAttribute('visible', 'false');
        
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
        
        // Another timeout for fallback model - reduced from 10s to 5s
        setTimeout(function() {
            if (!assetStatus.model.loaded) {
                console.warn('Fallback model timed out, using simple box');
                createSimpleBox();
                assetError('model', 'Fallback model timeout');
            }
        }, 5000);
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
        
        // Ensure we complete the model loading process
        setTimeout(() => assetLoaded('model'), 500);
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
                if (window.AFRAME && window.AFRAME.components['particle-system']) {
                    try {
                        const particles = document.createElement('a-entity');
                        particles.setAttribute('position', '0 1.5 -3');
                        particles.setAttribute('particle-system', 'preset: divine; enabled: true');
                        scene.appendChild(particles);
                    } catch(e) {
                        console.error("Failed to create particle effect:", e);
                    }
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
        
        // Handle audio with more reliable detection
        updateProgress('audio', 'started');
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
            
            // Force audio status update after timeout
            setTimeout(function() {
                if (!assetStatus.audio.loaded) {
                    // Check readyState as an alternative to event
                    if (audioElement.readyState >= 2) {
                        console.log('Audio appears to be loaded based on readyState');
                        assetLoaded('audio');
                    } else {
                        console.warn('Audio load status unknown, marking as loaded anyway');
                        assetLoaded('audio');
                    }
                }
            }, 3000); // Reduced from 5s to 3s
            
            // Try to pre-load audio
            try {
                audioElement.load();
            } catch (e) {
                console.warn('Audio preload attempt failed:', e);
                // Continue anyway
                setTimeout(() => assetLoaded('audio'), 1000);
            }
        } else {
            console.warn('Audio element not found');
            assetError('audio', 'Element not found');
        }
    });
    
    // Absolute fallback - hide loading screen after maximum wait time
    // Reduced from 30s to 15s which is more reasonable for user patience
    setTimeout(function() {
        if (loadingScreen.style.display !== 'none') {
            console.warn('Maximum wait time reached, forcing experience to start');
            
            // Force status completion for any remaining assets
            if (!assetStatus.panorama.loaded) updateProgress('panorama', 'loaded');
            if (!assetStatus.model.loaded) {
                createSimpleBox();
                updateProgress('model', 'loaded');
            }
            if (!assetStatus.audio.loaded) updateProgress('audio', 'loaded');
            
            clearInterval(progressInterval);
            finalizeLoading();
        }
    }, 15000);
});
