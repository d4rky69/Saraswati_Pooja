// Custom A-Frame component for particle effects
AFRAME.registerComponent('particle-system', {
  schema: {
    enabled: { default: false },
    preset: { default: 'dust', oneOf: ['dust', 'sparkle', 'divine'] },
    particleCount: { default: 100, min: 1, max: 1000 },
    color: { default: '#fff' },
    size: { default: 0.1, min: 0.01, max: 1 },
    duration: { default: 2, min: 0.1 },
    velocity: { default: 1, min: 0.1, max: 10 }
  },

  init: function () {
    this.particles = [];
    this.presets = {
      dust: {
        particleCount: 100,
        color: '#ffffff',
        size: 0.05,
        duration: 2,
        velocity: 0.5
      },
      sparkle: {
        particleCount: 50,
        color: '#ffcc00,#ff9933,#ffffff',
        size: 0.03,
        duration: 1,
        velocity: 1.5
      },
      divine: {
        particleCount: 200,
        color: '#ff9933,#ffffff,#138808',
        size: 0.04,
        duration: 3,
        velocity: 0.8
      }
    };
    
    // Create particle container
    this.particleContainer = document.createElement('a-entity');
    this.el.appendChild(this.particleContainer);
    
    // Apply preset if specified
    if (this.data.preset !== 'none' && this.presets[this.data.preset]) {
      const preset = this.presets[this.data.preset];
      for (const key in preset) {
        if (preset.hasOwnProperty(key)) {
          // Only apply if not explicitly set by user (checking if it's the default value)
          const isDefault = JSON.stringify(this.data[key]) === 
                          JSON.stringify(this.schema[key].default);
          if (isDefault) {
            this.data[key] = preset[key];
          }
        }
      }
    }

    // Start particle system if enabled
    if (this.data.enabled) {
      this.startParticleSystem();
    }
  },
  
  update: function (oldData) {
    // Only react if enabled state changes
    if (oldData && oldData.enabled !== this.data.enabled) {
      if (this.data.enabled) {
        this.startParticleSystem();
      } else {
        this.stopParticleSystem();
      }
    }
  },
  
  startParticleSystem: function () {
    try {
      this.clearParticles();
      
      // Parse colors (can be comma-separated)
      const colorOptions = this.data.color.split(',').map(c => c.trim());
      
      // Create particles
      for (let i = 0; i < this.data.particleCount; i++) {
        // Pick a random color from options
        const colorIndex = Math.floor(Math.random() * colorOptions.length);
        const color = colorOptions[colorIndex];
        
        // Create particle
        const particle = document.createElement('a-sphere');
        
        // Random position around center
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.5;
        const height = Math.random() * 0.5 - 0.25;
        const x = Math.cos(angle) * radius;
        const y = height;
        const z = Math.sin(angle) * radius;
        
        // Random velocity direction
        const vx = Math.random() * 2 - 1;
        const vy = Math.random() * 2;
        const vz = Math.random() * 2 - 1;
        const speed = this.data.velocity * (0.5 + Math.random());
        
        // Normalize velocity vector
        const magnitude = Math.sqrt(vx*vx + vy*vy + vz*vz) || 1; // Avoid division by zero
        const normalizedVx = vx / magnitude;
        const normalizedVy = vy / magnitude;
        const normalizedVz = vz / magnitude;
        
        // Apply properties
        particle.setAttribute('position', `${x} ${y} ${z}`);
        particle.setAttribute('radius', this.data.size * (0.5 + Math.random() * 0.5));
        particle.setAttribute('color', color);
        particle.setAttribute('opacity', 0.7);
        particle.setAttribute('shader', 'flat');
        particle.setAttribute('material', 'blending: additive');
        
        // Store velocity
        particle.vx = normalizedVx * speed;
        particle.vy = normalizedVy * speed;
        particle.vz = normalizedVz * speed;
        particle.life = this.data.duration * (0.7 + Math.random() * 0.6);
        
        // Add to scene
        this.particleContainer.appendChild(particle);
        this.particles.push(particle);
      }
      
      // Start animation
      this.startTime = Date.now();
      this.lastTime = this.startTime;
      if (!this.animationId) {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
      }
    } catch (err) {
      console.error('Error starting particle system:', err);
    }
  },
  
  animate: function () {
    try {
      const now = Date.now();
      const dt = Math.min((now - this.lastTime || now) / 1000, 0.1); // Limit dt to avoid large jumps
      this.lastTime = now;
      
      let allDone = true;
      
      // Update each particle
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i];
        if (!particle || !particle.parentNode) continue;
        
        // Update life
        particle.life -= dt;
        
        if (particle.life <= 0) {
          // Remove dead particles
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        } else {
          // This particle is still alive
          allDone = false;
          
          // Get current position
          const pos = particle.getAttribute('position');
          if (!pos) continue; // Skip if position is not available
          
          // Update position
          particle.setAttribute('position', {
            x: pos.x + particle.vx * dt,
            y: pos.y + particle.vy * dt,
            z: pos.z + particle.vz * dt
          });
          
          // Fade out based on remaining life
          const normalizedLife = particle.life / this.data.duration;
          particle.setAttribute('opacity', Math.min(1, normalizedLife) * 0.7);
          
          // Scale down as it fades
          const scale = normalizedLife * this.data.size;
          particle.setAttribute('radius', Math.max(0.001, scale));
        }
      }
      
      // Continue animation if particles are still active
      if (!allDone && this.data.enabled) {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
      } else {
        this.animationId = null;
        this.data.enabled = false;
        this.el.emit('particlesComplete');
      }
    } catch (err) {
      console.error('Error in particle animation:', err);
      this.stopParticleSystem();
    }
  },
  
  stopParticleSystem: function () {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clearParticles();
  },
  
  clearParticles: function () {
    try {
      // Remove all existing particles
      while (this.particleContainer && this.particleContainer.firstChild) {
        this.particleContainer.removeChild(this.particleContainer.firstChild);
      }
      this.particles = [];
    } catch (err) {
      console.error('Error clearing particles:', err);
    }
  },
  
  remove: function () {
    this.stopParticleSystem();
    if (this.particleContainer && this.particleContainer.parentNode) {
      this.particleContainer.parentNode.removeChild(this.particleContainer);
    }
  },
  
  pause: function () {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  },
  
  play: function () {
    if (this.data.enabled && !this.animationId && this.particles.length > 0) {
      this.lastTime = Date.now();
      this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
  }
});
