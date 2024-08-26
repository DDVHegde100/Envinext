const mapCanvas = document.getElementById('mapCanvas');
const confettiCanvas = document.getElementById('confettiCanvas');
const mapCtx = mapCanvas.getContext('2d');
const confettiCtx = confettiCanvas.getContext('2d');
const pointsDisplay = document.getElementById('points-display');
const plantSaplingBtn = document.getElementById('plantSaplingBtn');
const plantTreeBtn = document.getElementById('plantTreeBtn');

let points = 200;
let currentPlantType = null;

mapCanvas.width = mapCanvas.clientWidth;
mapCanvas.height = mapCanvas.clientHeight;
confettiCanvas.width = confettiCanvas.clientWidth;
confettiCanvas.height = confettiCanvas.clientHeight;

function updatePointsDisplay() {
    pointsDisplay.textContent = `Points: ${points}`;
}

function plantPlant(x, y) {
    if (currentPlantType === 'sapling' && points >= 2) {
        points -= 2;
        drawPlant(x, y, 'green', 'Sapling', 5);
        createConfetti(x, y, 100, ['#4CAF50', '#A5D6A7', '#81C784']);
    } else if (currentPlantType === 'tree' && points >= 10) {
        points -= 10;
        drawPlant(x, y, 'darkgreen', 'Tree', 10);
        createConfetti(x, y, 200, ['#2E7D32', '#4CAF50', '#C8E6C9']);
    } else {
        alert('Not enough points or no plant type selected.');
    }
    updatePointsDisplay();
}

function drawPlant(x, y, color, label, size) {
    mapCtx.beginPath();
    mapCtx.arc(x, y, size, 0, Math.PI * 2);
    mapCtx.fillStyle = color;
    mapCtx.fill();
    mapCtx.fillStyle = '#fff';
    mapCtx.font = 'bold 14px Arial';
    mapCtx.textAlign = 'center';
    mapCtx.fillText(label, x, y - size - 5);
}

function createConfetti(x, y, count, colors) {
    const particles = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: Math.random() * 10 - 5,
            vy: Math.random() * 10 - 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 5 + 2,
            opacity: 1
        });
    }
    animateConfetti(particles);
}

function animateConfetti(particles) {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // gravity
        particle.opacity -= 0.02; // fade out
        confettiCtx.globalAlpha = particle.opacity;
        confettiCtx.beginPath();
        confettiCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        confettiCtx.fillStyle = particle.color;
        confettiCtx.fill();
    });
    particles = particles.filter(particle => particle.opacity > 0);
    if (particles.length > 0) {
        requestAnimationFrame(() => animateConfetti(particles));
    }
}

function handleMapClick(event) {
    const rect = mapCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    plantPlant(x, y);
}

function handlePlantButtonClick(type) {
    currentPlantType = type;
}

// Event Listeners
mapCanvas.addEventListener('click', handleMapClick);
plantSaplingBtn.addEventListener('click', () => handlePlantButtonClick('sapling'));
plantTreeBtn.addEventListener('click', () => handlePlantButtonClick('tree'));

// Initial Points Display
updatePointsDisplay();
