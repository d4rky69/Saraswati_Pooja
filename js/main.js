document.addEventListener('DOMContentLoaded', function() {
    const scene = document.querySelector('a-scene');
    const loadingScreen = document.getElementById('loading-screen');
    const audioControl = document.getElementById('audio-control');
    const audioElement = document.getElementById('background-audio');
    const clickSound = document.getElementById('click-sound');
    let audioPlaying = false;
    
    // Make sure scene is visible
    if (scene) {
        scene.style.visibility = 'visible';
        scene.style.opacity = '1';
    }
    
    // Additional panorama initialization
    const panoramaImg = document.getElementById('panorama');
    const backgroundSky = document.getElementById('background-sky');
    
    if (panoramaImg && backgroundSky) {
        // Try to ensure panorama loads
        console.log("Double-checking panorama setup");
        if (panoramaImg.complete) {
            console.log("Panorama is complete, applying to sky");
            backgroundSky.setAttribute('src', '#panorama');
            backgroundSky.removeAttribute('color');
        } else {
            // Force reload
            const imgSrc = panoramaImg.getAttribute('src');
            panoramaImg.setAttribute('src', '');
            setTimeout(() => {
                panoramaImg.setAttribute('src', imgSrc);
                panoramaImg.addEventListener('load', function() {
                    console.log("Panorama loaded from reload, applying to sky");
                    backgroundSky.setAttribute('src', '#panorama');
                    backgroundSky.removeAttribute('color');
                });
            }, 100);
        }
    }
    
    // Audio controls with better error handling
    if (audioControl && audioElement) {
        audioControl.addEventListener('click', function() {
            try {
                if (!audioPlaying) {
                    const playPromise = audioElement.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            audioControl.innerHTML = '<span class="material-icons">pause</span> Pause Mantra';
                            audioPlaying = true;
                        })
                        .catch(error => {
                            console.error('Audio playback failed:', error);
                            alert('Could not play audio. Please interact with the page first or check if audio is supported.');
                        });
                    }
                } else {
                    audioElement.pause();
                    audioControl.innerHTML = '<span class="material-icons">play_arrow</span> Play Mantra';
                    audioPlaying = false;
                }
                
                // Try to play click sound
                if (clickSound) {
                    clickSound.currentTime = 0;
                    clickSound.play().catch(err => console.log('Click sound failed to play:', err));
                }
            } catch (e) {
                console.error('Error controlling audio:', e);
            }
        });
    }
    
    // IMPORTANT: This function ensures the model is properly positioned and visible
    const ensureModelVisibility = function() {
        const idolModel = document.querySelector('#saraswati-model');
        if (idolModel) {
            // Make sure it's visible
            idolModel.setAttribute('visible', 'true');
            
            // Single consistent position - centered in the scene
            // We're not using different positions for mobile/desktop to avoid conflicts
            idolModel.setAttribute('position', '-7 1.5 -3');
            
            // Ensure rotation faces the camera
            idolModel.setAttribute('rotation', '0 270 0');
            
            console.log('Model visibility, position and rotation updated');
        }
    };
    
    // Add interactive behavior to the model with better error handling
    scene.addEventListener('loaded', () => {
        // Force loading screen to hide if still visible
        if (loadingScreen && loadingScreen.style.display !== 'none') {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }

        // Call our model positioning function
        ensureModelVisibility();

        setTimeout(() => {
            try {
                const idolModel = document.querySelector('#saraswati-model');
                
                if (idolModel && idolModel.getAttribute('visible') === 'true') {
                    console.log('Adding click interaction to model');
                    idolModel.addEventListener('click', function(evt) {
                        console.log('Model clicked');
                        
                        try {
                            // Create pulse animation
                            const currentScale = this.getAttribute('scale');
                            let scaleValues = [3, 3, 3]; // Default scale
                            
                            if (currentScale) {
                                if (typeof currentScale === 'string') {
                                    scaleValues = currentScale.split(' ').map(Number);
                                } else if (currentScale.x !== undefined) {
                                    scaleValues = [currentScale.x, currentScale.y, currentScale.z];
                                }
                            }
                            
                            const newScale = scaleValues.map(v => v * 1.1).join(' ');
                            const originalScale = scaleValues.join(' ');
                            
                            this.setAttribute('animation__pulse', {
                                property: 'scale',
                                from: originalScale,
                                to: newScale,
                                dur: 300,
                                easing: 'easeOutQuad',
                                dir: 'alternate',
                                loop: 1
                            });
                            
                            // Play click sound
                            if (clickSound) {
                                clickSound.currentTime = 0;
                                clickSound.play().catch(err => console.log('Click sound failed to play:', err));
                            }
                            
                            // Play background audio if not already playing
                            if (audioElement && !audioPlaying) {
                                audioElement.play()
                                    .then(() => {
                                        if (audioControl) {
                                            audioControl.innerHTML = '<span class="material-icons">pause</span> Pause Mantra';
                                        }
                                        audioPlaying = true;
                                    })
                                    .catch(err => console.error('Could not play audio on click:', err));
                            }
                        } catch (e) {
                            console.error('Error handling model click:', e);
                        }
                    });
                }
                
                // Add click handler to fallback model too
                const fallbackModel = document.querySelector('#fallback-model-entity');
                if (fallbackModel && fallbackModel.getAttribute('visible') === 'true') {
                    fallbackModel.addEventListener('click', function() {
                        console.log('Fallback model clicked');
                        
                        // Play click sound
                        if (clickSound) {
                            clickSound.currentTime = 0;
                            clickSound.play().catch(err => console.log('Click sound failed to play:', err));
                        }
                        
                        // Play background audio if not already playing
                        if (audioElement && !audioPlaying) {
                            audioElement.play()
                                .then(() => {
                                    if (audioControl) {
                                        audioControl.innerHTML = '<span class="material-icons">pause</span> Pause Mantra';
                                    }
                                    audioPlaying = true;
                                })
                                .catch(err => console.error('Could not play audio on fallback click:', err));
                        }
                    });
                }
                
                // Handle any boxes that might have been created as fallbacks
                const boxes = document.querySelectorAll('a-box');
                boxes.forEach(box => {
                    box.addEventListener('click', function() {
                        console.log('Box clicked');
                        
                        // Play click sound
                        if (clickSound) {
                            clickSound.currentTime = 0;
                            clickSound.play().catch(err => console.log('Click sound failed to play:', err));
                        }
                        
                        // Play background audio if not already playing
                        if (audioElement && !audioPlaying) {
                            audioElement.play()
                                .then(() => {
                                    if (audioControl) {
                                        audioControl.innerHTML = '<span class="material-icons">pause</span> Pause Mantra';
                                    }
                                    audioPlaying = true;
                                })
                                .catch(err => console.error('Could not play audio on box click:', err));
                        }
                    });
                });
            } catch (e) {
                console.error('Error setting up model interactions:', e);
            }
        }, 1000);
    });
    
    // Force hide the loading screen after a reasonable timeout
    setTimeout(function() {
        if (loadingScreen && window.getComputedStyle(loadingScreen).display !== 'none') {
            console.warn('Forcing hide of loading screen after timeout');
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
        
        // Call ensureModelVisibility again after everything has settled
        ensureModelVisibility();
    }, 12000);
    
    // Call ensureModelVisibility once more on window resize
    window.addEventListener('resize', ensureModelVisibility);
});
