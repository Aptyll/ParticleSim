// Canvas setup
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

/// Adjust canvas to fit the window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Update square position to stay within new canvas size
  square.x = Math.min(square.x, canvas.width - square.size);
  square.y = Math.min(square.y, canvas.height - square.size);
});

// Timer variables
let isPaused = false;
let elapsedTime = 0; // Time in seconds
let lastUpdateTime = null; // Tracks the last time the animation was updated

// Array to store timestamps of key presses
let keyPressTimestamps = [];

// Array to store active pulses
const pulses = [];

// Particle class
class Particle {
  constructor(x, y, dx, dy, radius, color) {
    this.x = x;
    this.y = y;
    this.dx = dx; // Velocity in x
    this.dy = dy; // Velocity in y
    this.radius = radius;
    this.color = color;
  }

  draw() {
    ctx.save();

    // Adjust glow color for red and orange particles
    let glowColor = this.color;
    if (this.color.includes('255, 0, 0')) {
      glowColor = 'rgba(255, 150, 150, 1)'; // Brighter red
    } else if (this.color.includes('255, 142, 0')) {
      glowColor = 'rgba(255, 200, 150, 1)'; // Brighter orange
    }

    // Outer glow (soft and visible)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.shadowBlur = 50; // Outer glow radius
    ctx.shadowColor = glowColor.replace('1)', '0.7)'); // Less transparent
    ctx.fillStyle = glowColor.replace('1)', '0.7)'); // Consistent fill color
    ctx.fill();
    ctx.closePath();

    // Inner glow (sharp and bright)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius / 2, 0, Math.PI * 2); // Smaller core
    ctx.shadowBlur = 30; // Inner glow radius
    ctx.shadowColor = glowColor; // Fully opaque
    ctx.fillStyle = glowColor; // Bright core color
    ctx.fill();
    ctx.closePath();

    ctx.restore();
  }

  update(particles) {
    if (isPaused) return;

    particles.forEach((other) => {
      if (this === other) return; // Skip self

      // Calculate distance
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Attraction force (inverse-square law)
      const force = 1 / (distance ** 2 + 1); // +1 to prevent division by zero

      // Apply the force to velocity
      this.dx += force * dx; // Pull toward the other particle
      this.dy += force * dy;
    });

    // Energy dissipation (damping) with minimum speed threshold
    const minSpeed = 0.1; // Minimum speed to prevent particles from stopping
    this.dx = Math.abs(this.dx) > minSpeed ? this.dx * 0.99 : (this.dx < 0 ? -minSpeed : minSpeed);
    this.dy = Math.abs(this.dy) > minSpeed ? this.dy * 0.99 : (this.dy < 0 ? -minSpeed : minSpeed);

    // Update position
    this.x += this.dx;
    this.y += this.dy;

    // Boundary conditions: Bounce off walls
    if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
      this.dx = -this.dx; // Reverse horizontal direction
      this.x = Math.min(Math.max(this.x, this.radius), canvas.width - this.radius); // Keep within bounds
    }
    if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
      this.dy = -this.dy; // Reverse vertical direction
      this.y = Math.min(Math.max(this.y, this.radius), canvas.height - this.radius); // Keep within bounds
    }

    // Collision with square
    this.checkCollisionWithSquare();

    // Draw the particle
    this.draw();
  }

  checkCollisionWithSquare() {
    // Calculate the closest point on the square to the particle
    const closestX = Math.max(square.x, Math.min(this.x, square.x + square.size));
    const closestY = Math.max(square.y, Math.min(this.y, square.y + square.size));

    // Calculate the distance between the particle and the closest point
    const dx = this.x - closestX;
    const dy = this.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check for collision
    if (distance < this.radius) {
      // Collision detected
      createPulseEffect(this.x, this.y);
    }
  }
}

// Pulse class for the expanding circle effect
class Pulse {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.color = 'rgba(255, 255, 255,'; // White color with adjustable opacity
    this.radius = 0;
    this.maxRadius = 50; // Adjust as needed
    this.opacity = 1; // Start fully opaque
    this.finished = false;
  }

  update(deltaTime) {
    // Increase the radius
    this.radius += 200 * deltaTime; // Speed of expansion

    // Fade out
    this.opacity -= 1 * deltaTime; // Fade over 1 second

    if (this.radius >= this.maxRadius || this.opacity <= 0) {
      this.finished = true; // Mark pulse as finished
    }
  }

  draw() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `${this.color}${this.opacity})`; // Apply opacity
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }
}

// Function to create a new pulse
function createPulseEffect(x, y) {
  pulses.push(new Pulse(x, y));
}

// Particle management
const particles = [];
const colors = {
  Red: 'rgba(255, 0, 0, 1)',
  Orange: 'rgba(255, 142, 0, 1)', // Orange color
  Yellow: 'rgba(255, 255, 0, 1)',
};
const particleCounts = {
  Red: 0,
  Orange: 0,
  Yellow: 0,
};
const radius = 7; // Particle size

function createParticles() {
  particles.length = 0; // Clear current particles
  Object.keys(particleCounts).forEach((colorKey) => {
    for (let i = 0; i < particleCounts[colorKey]; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const dx = (Math.random() - 0.5) * 1; // Halved initial speed
      const dy = (Math.random() - 0.5) * 1;
      particles.push(new Particle(x, y, dx, dy, radius, colors[colorKey]));
    }
  });
}

// Initialize particles
createParticles();

// Draw the black gradient background
function drawGradientBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'black'); // Black at the top
  gradient.addColorStop(1, '#1a1a1a'); // Slightly lighter shade at the bottom
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Draw the timer in the top-left corner
function drawTimer() {
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = Math.floor(elapsedTime % 60).toString().padStart(2, '0');

  ctx.save();
  ctx.font = '25px Arial'; // Larger, clean font
  ctx.fillStyle = 'white'; // White text for visibility
  ctx.fillText(`${minutes}:${seconds}`, 10, 30); // Position in top-left corner
  ctx.restore();
}

// Dropdown menu controls
const redSlider = document.getElementById('redSlider');
const orangeSlider = document.getElementById('orangeSlider');
const yellowSlider = document.getElementById('yellowSlider');
const pauseButton = document.getElementById('pauseButton');
const resetButton = document.getElementById('resetButton');

// Update particle counts dynamically
function updateParticleCount(color, count) {
  particleCounts[color] = count;
  createParticles();
}

// Event listeners for sliders
redSlider.addEventListener('input', () => {
  updateParticleCount('Red', parseInt(redSlider.value, 10));
  resetTimer(); // Reset the timer
});
orangeSlider.addEventListener('input', () => {
  updateParticleCount('Orange', parseInt(orangeSlider.value, 10));
  resetTimer(); // Reset the timer
});
yellowSlider.addEventListener('input', () => {
  updateParticleCount('Yellow', parseInt(yellowSlider.value, 10));
  resetTimer(); // Reset the timer
});

// Function to reset the timer
function resetTimer() {
  elapsedTime = 0; // Reset the timer to 0
  lastUpdateTime = null; // Clear the last update time
}

// Pause/Resume button
pauseButton.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
  if (!isPaused) {
    lastUpdateTime = performance.now(); // Reset last update time
  }
});

// Reset button
resetButton.addEventListener('click', () => {
  redSlider.value = 10;
  orangeSlider.value = 10;
  yellowSlider.value = 10;
  particleCounts.Red = 10;
  particleCounts.Orange = 10;
  particleCounts.Yellow = 10;
  createParticles();

  // Reset timer
  elapsedTime = 0; // Reset elapsed time to 0
  lastUpdateTime = null; // Clear last update time to ensure smooth resume

  // Resume simulation if paused
  isPaused = false;
  pauseButton.textContent = 'Pause';
});

// Square properties
let square = {
  x: canvas.width / 2 - 25, // Centered horizontally
  y: canvas.height / 2 - 25, // Centered vertically
  size: 50,
  speed: 200, // Pixels per second
  color: '#ffffff', // Original color
};

// Key state tracking
const keysPressed = {};

// Event listeners for key presses
document.addEventListener('keydown', function(event) {
  const key = event.key.toLowerCase();
  keysPressed[key] = true;

  // Record timestamp if W, A, S, or D is pressed
  if (['w', 'a', 's', 'd'].includes(key)) {
    keyPressTimestamps.push(performance.now());
  }
});

document.addEventListener('keyup', function(event) {
  keysPressed[event.key.toLowerCase()] = false;
});

// Function to calculate the speed multiplier
function calculateSpeedMultiplier() {
  const now = performance.now();
  const threeSecondsAgo = now - 3000; // 3000 milliseconds = 3 seconds

  // Remove timestamps older than 3 seconds
  keyPressTimestamps = keyPressTimestamps.filter(timestamp => timestamp >= threeSecondsAgo);

  const pressCount = keyPressTimestamps.length;

  let speedMultiplier;

  if (pressCount <= 20) {
    // Linear increase up to 2x speed
    speedMultiplier = 1 + (pressCount / 20); // From 1x to 2x
  } else {
    // Diminishing returns after 2x speed
    speedMultiplier = 2 + ((pressCount - 20) * 0.05);
  }

  return speedMultiplier;
}

// Converts a hex color code to an RGB array
function hexToRgb(hex) {
  const bigint = parseInt(hex.replace('#', ''), 16);
  return [
    (bigint >> 16) & 255, // Red
    (bigint >> 8) & 255,  // Green
    bigint & 255          // Blue
  ];
}

// Interpolates between two RGB colors
function interpolateColor(color1, color2, factor) {
  const result = color1.slice();
  for (let i = 0; i < 3; i++) {
    result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
  }
  return result;
}

// Function to draw the square
function drawSquare() {
  ctx.save();

  // Calculate the resource level
  const now = performance.now();
  const threeSecondsAgo = now - 3000; // 3 seconds ago
  keyPressTimestamps = keyPressTimestamps.filter(timestamp => timestamp >= threeSecondsAgo);
  const pressCount = keyPressTimestamps.length;
  const maxPressCount = 100; // Adjust as needed

  const resourceRatio = Math.min(pressCount / maxPressCount, 1); // Value between 0 and 1

  // Calculate glow properties based on resource level
  const maxGlowRadius = 100; // Maximum glow radius
  const glowRadius = resourceRatio * maxGlowRadius;

  const maxGlowOpacity = 10; // Maximum glow opacity (Note: Typically should be <=1)
  const glowOpacity = resourceRatio * maxGlowOpacity;

  // Set the glow effect
  ctx.shadowBlur = glowRadius;
  ctx.shadowColor = `rgba(0, 170, 255, ${glowOpacity})`; // Bright blue glow

  // Interpolate square color from white to blue
  const originalColor = hexToRgb('#ffffff'); // White
  const targetColor = hexToRgb('#0000ff');   // Blue
  const interpolatedColor = interpolateColor(originalColor, targetColor, resourceRatio);

  // Convert interpolated color back to CSS rgba format
  const fillColor = `rgba(${interpolatedColor[0]}, ${interpolatedColor[1]}, ${interpolatedColor[2]}, 1)`;

  // Draw the square with the interpolated color
  ctx.fillStyle = fillColor;
  ctx.fillRect(square.x, square.y, square.size, square.size);

  ctx.restore();
}

// Animation loop
function animate(currentTime) {
  // Calculate delta time
  if (!lastUpdateTime) lastUpdateTime = currentTime;
  const deltaTime = (currentTime - lastUpdateTime) / 1000; // Convert to seconds
  lastUpdateTime = currentTime;

  // Draw fresh background every frame
  drawGradientBackground();

  // Update the timer if not paused
  if (!isPaused) {
    elapsedTime += deltaTime;

    // Calculate speed multiplier
    const speedMultiplier = calculateSpeedMultiplier();
    const adjustedSpeed = square.speed * speedMultiplier * deltaTime;

    // Update square position based on keys pressed
    if (keysPressed['w'] && square.y > 0) {
      square.y -= adjustedSpeed;
    }
    if (keysPressed['s'] && square.y + square.size < canvas.height) {
      square.y += adjustedSpeed;
    }
    if (keysPressed['a'] && square.x > 0) {
      square.x -= adjustedSpeed;
    }
    if (keysPressed['d'] && square.x + square.size < canvas.width) {
      square.x += adjustedSpeed;
    }

    // Boundary checks
    square.x = Math.max(0, Math.min(square.x, canvas.width - square.size));
    square.y = Math.max(0, Math.min(square.y, canvas.height - square.size));

    // Update particles
    particles.forEach((particle) => {
      particle.update(particles);
    });

    // Update pulses
    pulses.forEach((pulse, index) => {
      pulse.update(deltaTime);
      pulse.draw();

      // Remove pulses that are finished
      if (pulse.finished) {
        pulses.splice(index, 1);
      }
    });
  } else {
    // Draw particles without updating their positions
    particles.forEach((particle) => {
      particle.draw();
    });

    // Draw pulses without updating
    pulses.forEach((pulse) => {
      pulse.draw();
    });
  }

  // Draw the square
  drawSquare();

  // Draw the timer
  drawTimer();

  // Request the next frame
  requestAnimationFrame(animate);
}

// Start the animation
animate(performance.now());
