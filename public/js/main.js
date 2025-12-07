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
// Scroll Detection
// ==============================
let lastScrollTop = 0;
const scrollThreshold = 100; // The scroll distance required to trigger the snow

// Handle the scroll event
function handleScroll() {
    let scrollTop = window.scrollY || document.documentElement.scrollTop;

    // Calculate the scroll strength (how far the user has scrolled)
    let scrollStrength = Math.abs(scrollTop - lastScrollTop) / scrollThreshold;
    if (scrollStrength > 1) scrollStrength = 1; // Limit the scroll strength to a maximum of 1

    // Trigger the snow effect with the calculated scroll strength
    if (scrollStrength > 0) {
        triggerSnow(scrollStrength);
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // Keep track of the scroll position
}

// Add scroll event listener
window.addEventListener('scroll', handleScroll);

// Handle resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});