document.addEventListener('DOMContentLoaded', function() {
    const scene = document.querySelector('a-scene');
    const loadingScreen = document.getElementById('loading-screen');
    const audioControl = document.getElementById('audio-control');
    const audioElement = document.getElementById('background-audio');
    let audioPlaying = false;
    
    console.log('Audio elements initialization:', {
        audioControlFound: !!audioControl,
        audioElementFound: !!audioElement
    });
    
    // Initialize audio state on page load
    function initializeAudio() {
        if (!audioElement || !audioControl) {
            console.error('Audio elements not found in DOM');
            return;
        }
        
        // Set the initial state based on whether audio is actually playing
        audioPlaying = !audioElement.paused;
        updateAudioButtonUI();
        
        // Check if audio is actually loaded
        if (audioElement.readyState >= 2) {
            console.log('Audio is ready to play');
        } else {
            console.log('Audio still loading...');
            
            audioElement.addEventListener('canplaythrough', function onCanPlay() {
                console.log('Audio can now play through');
                audioElement.removeEventListener('canplaythrough', onCanPlay);
            });
            
            audioElement.addEventListener('error', function(e) {
                console.error('Audio file failed to load:', e);
                alert('Could not load audio file. Please check your connection.');
            });
        }
    }
    
    // Function to update the audio button UI consistently
    function updateAudioButtonUI() {
        if (!audioControl) return;
        
        if (audioPlaying) {
            audioControl.innerHTML = '<span class="material-icons">pause</span> Pause Mantra';
        } else {
            audioControl.innerHTML = '<span class="material-icons">play_arrow</span> Play Mantra';
        }
    }
    
    // Audio controls with improved error handling
    if (audioControl && audioElement) {
        audioControl.addEventListener('click', function() {
            console.log('Audio button clicked. Current state:', audioPlaying ? 'playing' : 'paused');
            
            try {
                if (!audioPlaying) {
                    // First, make sure audio is at the beginning if it finished playing
                    if (audioElement.ended) {
                        audioElement.currentTime = 0;
                    }
                    
                    console.log('Attempting to play audio...');
                    const playPromise = audioElement.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            console.log('Audio playback started successfully');
                            audioPlaying = true;
                            updateAudioButtonUI();
                        })
                        .catch(error => {
                            console.error('Audio playback failed:', error);
                            
                            // Special handling for common errors
                            if (error.name === 'NotAllowedError') {
                                alert('Browser blocked audio playback. Please interact with the page first.');
                            } else if (error.name === 'NotSupportedError') {
                                alert('Audio format not supported by your browser.');
                            } else {
                                alert('Could not play audio: ' + error.message);
                            }
                            
                            audioPlaying = false;
                            updateAudioButtonUI();
                        });
                    }
                } else {
                    console.log('Pausing audio...');
                    audioElement.pause();
                    audioPlaying = false;
                    updateAudioButtonUI();
                }
            } catch (e) {
                console.error('Error controlling audio:', e);
                alert('An error occurred while trying to control audio playback.');
                audioPlaying = false;
                updateAudioButtonUI();
            }
        });
        
        // Keep UI in sync if audio ends naturally
        audioElement.addEventListener('ended', function() {
            console.log('Audio playback ended');
            audioPlaying = false;
            updateAudioButtonUI();
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
                                        audioPlaying = true;
                                        updateAudioButtonUI();
                                    })
                                    .catch(err => {
                                        console.error('Could not play audio on click:', err);
                                        // Do not show alert here as it would be annoying on model click
                                    });
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
                                    audioPlaying = true;
                                    updateAudioButtonUI();
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
    
    // Unlock audio on first user interaction with the page
    document.addEventListener('click', function unlockAudio() {
        if (audioElement) {
            console.log('User interaction detected, trying to unlock audio...');
            
            // Just try to play and immediately pause
            const silentPlay = audioElement.play();
            if (silentPlay !== undefined) {
                silentPlay.then(() => {
                    audioElement.pause();
                    audioElement.currentTime = 0;
                    console.log('Audio unlocked successfully');
                }).catch(err => {
                    console.log('Audio unlock failed, will try again on button click', err);
                });
            }
        }
        // Only need this once
        document.removeEventListener('click', unlockAudio);
    }, { once: true });
    
    // Run once and add event listener for resize
    window.addEventListener('resize', adjustForDevice);
    scene.addEventListener('loaded', adjustForDevice);
    
    // Initialize audio after a short delay to ensure elements are loaded
    setTimeout(initializeAudio, 1000);
});
