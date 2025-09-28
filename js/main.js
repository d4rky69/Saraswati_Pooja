document.addEventListener('DOMContentLoaded', function() {
    const scene = document.querySelector('a-scene');
    const loadingScreen = document.getElementById('loading-screen');
    const audioControl = document.getElementById('audio-control');
    const audioElement = document.getElementById('background-audio');
    const audioIcon = audioControl ? audioControl.querySelector('.material-icons') : null;
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
                            // Show user-friendly error message
                            alert('Could not play audio. Please interact with the page first or check if audio is supported.');
                        });
                    }
                } else {
                    audioElement.pause();
                    audioControl.innerHTML = '<span class="material-icons">play_arrow</span> Play Mantra';
                    audioPlaying = false;
                }
            } catch (e) {
                console.error('Error controlling audio:', e);
            }
        });
    }
    
    // Add interactive behavior to the model with better error handling
    scene.addEventListener('loaded', () => {
        // Force loading screen to hide if still visible
        if (loadingScreen && loadingScreen.style.display !== 'none') {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }

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
                            
                            // Play audio if not already playing
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
                        
                        // Play audio if not already playing
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
                        
                        // Play audio if not already playing
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
    
    // Adjust model position for mobile/desktop
    function adjustForDevice() {
        try {
            const idolModel = document.querySelector('#saraswati-model');
            if (!idolModel) return;
            
            if (window.innerWidth < 768) {
                // Mobile positioning - bring closer and adjust size
                idolModel.setAttribute('position', '0 1.0 -2');
            } else {
                // Desktop positioning
                idolModel.setAttribute('position', '0 1.5 -3');
            }
        } catch (e) {
            console.error('Error adjusting for device:', e);
        }
    }
    
    // Run once and add event listener for resize
    window.addEventListener('resize', adjustForDevice);
    scene.addEventListener('loaded', adjustForDevice);
    
    // Force hide the loading screen after a reasonable timeout
    setTimeout(function() {
        if (loadingScreen && window.getComputedStyle(loadingScreen).display !== 'none') {
            console.warn('Forcing hide of loading screen after timeout');
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }, 12000);
});
