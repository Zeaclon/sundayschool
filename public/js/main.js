// ==============================
// Snowflake Setup
// ==============================
let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
canvas.style.position = 'fixed';
canvas.style.top = 0;
canvas.style.left = 0;
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.pointerEvents = 'none';
canvas.style.zIndex = 9999;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let snowflakes = [];
const baseSnowflakes = 100;
let animating = false;
let windX = 0; // snow globe effect

// Determine snow color based on theme
function getSnowColor() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return '255,255,255'; // white for dark mode
    } else {
        return '180,180,255'; // soft bluish-white for light mode
    }
}

// Create a snowflake
function createSnowflake() {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 4 + 1,
        speed: Math.random() * 2 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        fadeSpeed: Math.random() * 0.005 + 0.002
    };
}

// Animate snowflakes
function animateSnow() {
    animating = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const color = getSnowColor();

    snowflakes.forEach((flake, index) => {
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},${flake.opacity})`;
        ctx.fill();

        // Move snowflake
        flake.x += windX * 0.2;
        flake.y += flake.speed;

        // Fade out
        flake.opacity -= flake.fadeSpeed;
        if (flake.opacity <= 0) {
            snowflakes.splice(index, 1); // remove faded flakes
        }

        // Wrap around
        if (flake.y > canvas.height) flake.y = 0;
        if (flake.x > canvas.width) flake.x = 0;
        if (flake.x < 0) flake.x = canvas.width;
    });

    if (snowflakes.length > 0) {
        requestAnimationFrame(animateSnow);
    } else {
        animating = false;
    }
}

// ==============================
// Snow Trigger
// ==============================
function triggerSnow(strength = 1) {
    const count = Math.floor(baseSnowflakes * strength);
    for (let i = 0; i < count; i++) {
        snowflakes.push(createSnowflake());
    }
    if (!animating) animateSnow();
}

// ==============================
// Shake Detection
// ==============================
let lastX = null, lastY = null, lastZ = null;
const shakeThreshold = 15;

function handleShake(x, y, z) {
    if (lastX !== null) {
        let deltaX = x - lastX;
        let deltaY = y - lastY;
        let deltaZ = z - lastZ;

        let magnitude = Math.abs(deltaX + deltaY + deltaZ);
        if (magnitude > shakeThreshold) {
            windX = deltaX * 0.5;
            triggerSnow(Math.min(magnitude / 50, 3)); // stronger shake = more snow
        }
    }

    lastX = x;
    lastY = y;
    lastZ = z;
}

window.addEventListener('devicemotion', (event) => {
    let {x, y, z} = event.accelerationIncludingGravity;
    handleShake(x, y, z);
});

// Keyboard for testing on PC
window.addEventListener('keydown', (e) => {
    if (e.key === 's') {
        let randomShake = Math.random() * 20 + 5;
        handleShake(randomShake, randomShake, randomShake);
    }
});

// Handle resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
