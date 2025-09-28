document.addEventListener('DOMContentLoaded', function() {
    const scene = document.querySelector('a-scene');
    const loadingScreen = document.getElementById('loading-screen');
    const audioControl = document.getElementById('audio-control');
    const audioElement = document.getElementById('background-audio');
    const audioIcon = audioControl ? audioControl.querySelector('.material-icons') : null;
    let audioPlaying = false;
    
    // Audio controls with better error handling
    if (audioControl && audioElement) {
        audioControl.addEventListener('click', function() {
            try {
                if (!audioPlaying) {
                    const playPromise = audioElement.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            audioIcon.textContent = 'pause';
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
                    audioIcon.textContent = 'play_arrow';
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
        setTimeout(() => {
            try {
                const idolModel = document.querySelector('#saraswati-model');
                
                if (idolModel) {
                    console.log('Adding click interaction to model');
                    idolModel.addEventListener('click', function(evt) {
                        console.log('Model clicked');
                        
                        try {
                            // Create pulse animation
                            const currentScale = this.getAttribute('scale');
                            if (currentScale) {
                                const scaleValue = typeof currentScale === 'string' 
                                    ? currentScale.split(' ').map(Number)
                                    : [currentScale.x, currentScale.y, currentScale.z];
                                
                                const newScale = scaleValue.map(v => v * 1.1).join(' ');
                                const originalScale = scaleValue.join(' ');
                                
                                this.setAttribute('animation__pulse', {
                                    property: 'scale',
                                    from: originalScale,
                                    to: newScale,
                                    dur: 300,
                                    easing: 'easeOutQuad',
                                    dir: 'alternate',
                                    loop: 1
                                });
                            }
                            
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
            } catch (e) {
                console.error('Error setting up model interactions:', e);
            }
        }, 2000);
    });
    
    // Adjust model position for mobile/desktop
    function adjustForDevice() {
        try {
            const idolModel = document.querySelector('#saraswati-model');
            if (!idolModel) return;
            
            if (window.innerWidth < 768) {
                // Mobile positioning - bring closer and adjust size
                idolModel.setAttribute('position', '0 1.0 -2');
                const currentScale = idolModel.getAttribute('scale');
                if (currentScale) {
                    const scaleValue = typeof currentScale === 'string' 
                        ? currentScale.split(' ').map(Number)
                        : [currentScale.x, currentScale.y, currentScale.z];
                    
                    const mobileScale = scaleValue.map(v => v * 0.8).join(' ');
                    idolModel.setAttribute('scale', mobileScale);
                }
            } else {
                // Desktop positioning
                idolModel.setAttribute('position', '0 1.5 -3');
                // Scale is set by asset-loader.js based on model dimensions
            }
        } catch (e) {
            console.error('Error adjusting for device:', e);
        }
    }
    
    // Run once and add event listener for resize
    window.addEventListener('resize', adjustForDevice);
    scene.addEventListener('loaded', adjustForDevice);
});
