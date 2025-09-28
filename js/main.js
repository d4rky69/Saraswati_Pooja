document.addEventListener('DOMContentLoaded', function() {
    const scene = document.querySelector('a-scene');
    const loadingScreen = document.getElementById('loading-screen');
    const audioControl = document.getElementById('audio-control');
    const audioElement = document.getElementById('background-audio');
    const audioIcon = audioControl.querySelector('.material-icons');
    let audioPlaying = false;
    
    // Audio controls
    audioControl.addEventListener('click', function() {
        if (!audioPlaying) {
            audioElement.play()
                .then(() => {
                    audioIcon.textContent = 'pause';
                    audioControl.innerHTML = '<span class="material-icons">pause</span> Pause Mantra';
                    audioPlaying = true;
                })
                .catch(error => {
                    console.error('Audio playback failed:', error);
                    alert('Could not play audio. Please interact with the page first.');
                });
        } else {
            audioElement.pause();
            audioIcon.textContent = 'play_arrow';
            audioControl.innerHTML = '<span class="material-icons">play_arrow</span> Play Mantra';
            audioPlaying = false;
        }
    });
    
    // Add interactive behavior to the model
    scene.addEventListener('loaded', () => {
        setTimeout(() => {
            const idolModel = document.querySelector('#saraswati-model');
            
            if (idolModel) {
                console.log('Adding click interaction to model');
                idolModel.addEventListener('click', function(evt) {
                    console.log('Model clicked');
                    
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
                        
                        // Play audio if not already playing
                        if (!audioPlaying) {
                            audioElement.play()
                                .then(() => {
                                    audioControl.innerHTML = '<span class="material-icons">pause</span> Pause Mantra';
                                    audioPlaying = true;
                                });
                        }
                    }
                });
            }
        }, 2000);
    });
    
    // Adjust model position for mobile/desktop
    function adjustForDevice() {
        const idolModel = document.querySelector('#saraswati-model');
        if (!idolModel) return;
        
        if (window.innerWidth < 768) {
            // Mobile positioning - bring closer and adjust size
            idolModel.setAttribute('position', '0 1.0 -2');
            idolModel.setAttribute('scale', '0.8 0.8 0.8');
        } else {
            // Desktop positioning
            idolModel.setAttribute('position', '0 1.5 -3');
            idolModel.setAttribute('scale', '1 1 1');
        }
    }
    
    // Run once and add event listener for resize
    window.addEventListener('resize', adjustForDevice);
    scene.addEventListener('loaded', adjustForDevice);
    
    // Add ambient particle effect
    scene.addEventListener('loaded', () => {
        setTimeout(() => {
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('a-entity');
                
                // Random position around the model
                const angle = Math.random() * Math.PI * 2;
                const radius = 2 + Math.random() * 2;
                const x = Math.cos(angle) * radius;
                const y = Math.random() * 3 - 0.5;
                const z = Math.sin(angle) * radius - 3;
                
                particle.setAttribute('position', `${x} ${y} ${z}`);
                particle.setAttribute('geometry', 'primitive: sphere; radius: 0.02');
                particle.setAttribute('material', 'color: #ffcc66; shader: flat; transparent: true; opacity: 0.6');
                
                // Add floating animation
                particle.setAttribute('animation', {
                    property: 'position',
                    dir: 'alternate',
                    dur: 3000 + Math.random() * 5000,
                    easing: 'easeInOutSine',
                    loop: true,
                    to: `${x} ${y + 0.5 + Math.random()} ${z}`
                });
                
                // Add subtle pulsing animation
                particle.setAttribute('animation__pulse', {
                    property: 'scale',
                    dir: 'alternate',
                    dur: 2000 + Math.random() * 3000,
                    easing: 'easeInOutSine',
                    loop: true,
                    from: '1 1 1',
                    to: '1.5 1.5 1.5'
                });
                
                scene.appendChild(particle);
            }
        }, 3000);
    });
});
