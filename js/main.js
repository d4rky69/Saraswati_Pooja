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
        audioPlaying = !audioElement.paused && !audioElement.ended && audioElement.currentTime > 0;
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
                // Don't alert - just show in console
            });
        }
    }
    
    // Function to update the audio button UI consistently
    function updateAudioButtonUI() {
        if (!audioControl) return;
        
        if (audioPlaying) {
            audioControl.innerHTML = '<span class="material-icons">pause</span> Pause Mantra';
            audioControl.style.background = 'linear-gradient(135deg, #138808, #0c5d06)'; // Green when playing
        } else {
            audioControl.innerHTML = '<span class="material-icons">play_arrow</span> Play Mantra';
            audioControl.style.background = 'linear-gradient(135deg, #ff9933, #ff8000)'; // Orange when paused
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
                    
                    // For iOS specifically, need to load first
                    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                        audioElement.load();
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
                                // Don't alert - just update in console
                                console.log('Browser blocked audio. Try clicking again after interacting with page.');
                                unlockAudio(); // Try to unlock
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
                audioPlaying = false;
                updateAudioButtonUI();
            }
        });
        
        // Keep UI in sync if audio ends naturally
        audioElement.addEventListener('ended', function() {
            console.log('Audio playback ended');
            audioPlaying = false;
            updateAudioButtonUI();
            
            // Auto-replay
            setTimeout(() => {
                if (audioElement) {
                    audioElement.currentTime = 0;
                    audioElement.play()
                        .then(() => {
                            audioPlaying = true;
                            updateAudioButtonUI();
                        })
                        .catch(err => {
                            console.warn('Auto-replay failed:', err);
                        });
                }
            }, 2000);
        });
    }
    
    // Function to unlock audio on iOS
    function unlockAudio() {
        if (!audioElement) return;
        
        // Create and play a silent audio element
        const silentSound = document.createElement('audio');
        silentSound.setAttribute('src', 'data:audio/mp3;base64,SUQzAwAAAAAAJlRQRTEAAAAcAAAAU291bmRKYXkuY29tIFNvdW5kIEVmZmVjdHMA//tAwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABQAB/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3//////////////////////////////////////////////////AAAAAExhdmM1OC45MS4xMDAAAAAAAAAAAAAAAP/7UMQAAEiC3VlTEEQs1X7hLQhCkH8+gAAk2GRkQAAAwBgGAQBgYBgIAgABgGAYDAYA4Dv4xkf/yfg7/4xk//5P/h38f9/n/j4D8H4P//+IAIYIQhCEIQhCACAIAgCMwQhCEAA');
        silentSound.setAttribute('playsinline', '');
        silentSound.setAttribute('preload', 'auto');
        document.body.appendChild(silentSound);
        
        const promise = silentSound.play();
        if (promise !== undefined) {
            promise.then(() => {
                // Remove after playing
                silentSound.remove();
                console.log('Audio unlocked successfully');
            }).catch(err => {
                // Remove even if failed
                silentSound.remove();
                console.log('Audio unlock failed:', err);
            });
        }
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
                                
                                // Create divine particles on click
                                if (window.AFRAME.components['particle-system']) {
                                    const particles = document.createElement('a-entity');
                                    particles.setAttribute('position', this.getAttribute('position'));
                                    particles.setAttribute('particle-system', 'preset: divine; enabled: true; particleCount: 100');
                                    scene.appendChild(particles);
                                    
                                    // Remove after animation completes
                                    setTimeout(() => {
                                        if (particles.parentNode) {
                                            particles.parentNode.removeChild(particles);
                                        }
                                    }, 3000);
                                }
                            }
                            
                            // Play audio if not already playing
                            if (audioElement && !audioPlaying) {
                                audioElement.play()
                                    .then(() => {
                                        audioPlaying = true;
                                        updateAudioButtonUI();
                                    })
                                    .catch(err => {
                                        console.warn('Could not play audio on click:', err);
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
                                .catch(err => console.warn('Could not play audio on fallback click:', err));
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
            const fallbackModel = document.querySelector('#fallback-model-entity');
            
            // Adjust main model
            if (idolModel) {
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
            }
            
            // Also adjust fallback model
            if (fallbackModel) {
                if (window.innerWidth < 768) {
                    fallbackModel.setAttribute('position', '0 1.0 -2');
                } else {
                    fallbackModel.setAttribute('position', '0 1.5 -3');
                }
            }
        } catch (e) {
            console.error('Error adjusting for device:', e);
        }
    }
    
    // Unlock audio on first user interaction with the page
    function unlockAudioOnInteraction() {
        if (audioElement) {
            console.log('User interaction detected, trying to unlock audio...');
            unlockAudio();
        }
        // Only need this once
        document.removeEventListener('click', unlockAudioOnInteraction);
        document.removeEventListener('touchstart', unlockAudioOnInteraction);
    }
    
    // Add multiple event listeners for better mobile support
    document.addEventListener('click', unlockAudioOnInteraction, { once: true });
    document.addEventListener('touchstart', unlockAudioOnInteraction, { once: true });
    
    // Run once and add event listener for resize
    window.addEventListener('resize', adjustForDevice);
    
    // Initialize audio and device adjustments after scene loaded
    scene.addEventListener('loaded', function() {
        adjustForDevice();
        setTimeout(initializeAudio, 1000);
    });
});
