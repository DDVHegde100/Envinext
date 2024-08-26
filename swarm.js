const canvas = document.getElementById('swarmCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const robots = [];
const obstacles = [];
let selectedRobot = null;
let placingObstacle = false;
let tempObstacle = null;
let currentMode = 'flocking';  // Default mode

// Vector class for 2D vector operations
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
    }

    sub(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
    }

    mult(scalar) {
        this.x *= scalar;
        this.y *= scalar;
    }

    div(scalar) {
        this.x /= scalar;
        this.y /= scalar;
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        let m = this.mag();
        if (m !== 0) this.div(m);
    }

    limit(max) {
        if (this.mag() > max) {
            this.normalize();
            this.mult(max);
        }
    }

    static dist(v1, v2) {
        return Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2);
    }
}

// Robot class
class Robot {
    static idCounter = 0;

    constructor(x, y) {
        this.position = new Vector(x, y);
        this.velocity = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
        this.velocity.normalize();
        this.acceleration = new Vector(0, 0);
        this.maxSpeed = 2;
        this.maxForce = 0.03;
        this.size = 5;
        this.id = Robot.idCounter++;
        this.color = 'white';
        this.disabled = false;
        this.disableTime = 0;
    }

    update() {
        if (this.disabled) {
            this.disableTime--;
            if (this.disableTime <= 0) {
                this.disabled = false;
                this.color = 'white';
            }
            return;
        }

        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.position.add(this.velocity);
        this.acceleration.mult(0);
        this.edges();
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    edges() {
        if (this.position.x > canvas.width) this.position.x = 0;
        else if (this.position.x < 0) this.position.x = canvas.width;
        if (this.position.y > canvas.height) this.position.y = 0;
        else if (this.position.y < 0) this.position.y = canvas.height;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
        this.drawArrow();
        this.drawId();
    }

    drawArrow() {
        let endX = this.position.x + this.velocity.x * 10;
        let endY = this.position.y + this.velocity.y * 10;
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'blue';
        ctx.stroke();
    }

    drawId() {
        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(this.id, this.position.x, this.position.y - 10);
    }

    flock(robots, obstacles) {
        switch (currentMode) {
            case 'flocking':
                this.applyFlockingBehavior(robots);
                break;
            case 'avoidance':
                this.applyAvoidanceBehavior(obstacles);
                break;
            case 'predatory':
                this.applyPredatoryBehavior(robots);
                break;
            case 'formation':
                this.applyFormationFlying(robots);
                break;
            case 'chaotic':
                this.applyChaoticMovement();
                break;
        }
    }

    applyFlockingBehavior(robots) {
        let alignment = this.alignment(robots);
        let cohesion = this.cohesion(robots);
        let separation = this.separation(robots);

        this.applyForce(alignment);
        this.applyForce(cohesion);
        this.applyForce(separation);
    }

    applyAvoidanceBehavior(obstacles) {
        // Same as flocking, but with faster reaction to obstacles
        let alignment = this.alignment(robots);
        let cohesion = this.cohesion(robots);
        let separation = this.separation(robots);
        let avoidance = this.avoidObstacles(obstacles);

        this.applyForce(alignment);
        this.applyForce(cohesion);
        this.applyForce(separation);
        this.applyForce(avoidance);
    }

    applyPredatoryBehavior(robots) {
        const perceptionRadius = 100;
        let closestPrey = null;
        let closestDistance = Infinity;

        robots.forEach(robot => {
            if (robot !== this && !robot.disabled) {
                let d = Vector.dist(this.position, robot.position);
                if (d < perceptionRadius && d < closestDistance) {
                    closestPrey = robot;
                    closestDistance = d;
                }
            }
        });

        if (closestPrey) {
            let desired = new Vector(closestPrey.position.x, closestPrey.position.y);
            desired.sub(this.position);
            desired.normalize();
            desired.mult(this.maxSpeed);

            let steering = new Vector(desired.x, desired.y);
            steering.sub(this.velocity);
            steering.limit(this.maxForce);

            this.applyForce(steering);

            if (closestDistance < this.size * 2) {
                this.huntPrey(closestPrey);
            }
        }
    }

    huntPrey(prey) {
        prey.disabled = true;
        prey.color = 'red';
        prey.disableTime = 300;  // 5 seconds at 60 fps
    }

    applyFormationFlying(robots) {
        // Formation flying can be achieved with a strong cohesion behavior
        let formation = this.cohesion(robots);
        this.applyForce(formation);
    }

    applyChaoticMovement() {
        // Chaotic movement could be simulated by applying random forces
        let randomForce = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
        randomForce.normalize();
        randomForce.mult(this.maxForce * 2);
        this.applyForce(randomForce);
    }

    alignment(robots) {
        const perceptionRadius = 50;
        let steering = new Vector(0, 0);
        let total = 0;

        robots.forEach(robot => {
            if (robot !== this) {
                let d = Vector.dist(this.position, robot.position);
                if (d < perceptionRadius) {
                    steering.add(robot.velocity);
                    total++;
                }
            }
        });

        if (total > 0) {
            steering.div(total);
            steering.normalize();
            steering.mult(this.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(this.maxForce);
        }

        return steering;
    }

    cohesion(robots) {
        const perceptionRadius = 50;
        let steering = new Vector(0, 0);
        let total = 0;

        robots.forEach(robot => {
            if (robot !== this) {
                let d = Vector.dist(this.position, robot.position);
                if (d < perceptionRadius) {
                    steering.add(robot.position);
                    total++;
                }
            }
        });

        if (total > 0) {
            steering.div(total);
            steering.sub(this.position);
            steering.normalize();
            steering.mult(this.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(this.maxForce);
        }

        return steering;
    }

    separation(robots) {
        const perceptionRadius = 30;
        let steering = new Vector(0, 0);
        let total = 0;

        robots.forEach(robot => {
            if (robot !== this) {
                let d = Vector.dist(this.position, robot.position);
                if (d < perceptionRadius) {
                    let diff = new Vector(this.position.x, this.position.y);
                    diff.sub(robot.position);
                    diff.div(d);
                    steering.add(diff);
                    total++;
                }
            }
        });

        if (total > 0) {
            steering.div(total);
            steering.normalize();
            steering.mult(this.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(this.maxForce);
        }

        return steering;
    }

    avoidObstacles(obstacles) {
        const perceptionRadius = 60;
        let steering = new Vector(0, 0);
        let total = 0;

        obstacles.forEach(obstacle => {
            let d = Vector.dist(this.position, obstacle.position);
            if (d < perceptionRadius + obstacle.radius) {
                let diff = new Vector(this.position.x, this.position.y);
                diff.sub(obstacle.position);
                diff.div(d);
                steering.add(diff);
                total++;
            }
        });

        if (total > 0) {
            steering.div(total);
            steering.normalize();
            steering.mult(this.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(this.maxForce);
        }

        return steering;
    }

    isClicked(mousePos) {
        return Vector.dist(this.position, mousePos) < this.size * 2;
    }

    displayInfo() {
        ctx.font = '16px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(`Robot ${this.id}`, 10, canvas.height - 20);
        ctx.fillText(`Mode: ${currentMode}`, 10, canvas.height - 40);
    }
}

// Obstacle class
class Obstacle {
    constructor(x, y, radius) {
        this.position = new Vector(x, y);
        this.radius = radius;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    }
}

// Add Robot
function addRobot() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const robot = new Robot(x, y);
    robots.push(robot);
}

// Add Obstacle
function addObstacle(event) {
    let rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const radius = Math.random() * 20 + 10;
    const obstacle = new Obstacle(x, y, radius);
    obstacles.push(obstacle);
    placingObstacle = false;
    tempObstacle = null;
}

// Add Random Obstacle
function addRandomObstacle() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 20 + 10;
    const obstacle = new Obstacle(x, y, radius);
    obstacles.push(obstacle);
}

// Main Simulation Loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    robots.forEach(robot => {
        robot.flock(robots, obstacles);
        robot.update();
        robot.draw();
    });

    obstacles.forEach(obstacle => {
        obstacle.draw();
    });

    if (tempObstacle) {
        tempObstacle.draw();
    }

    if (selectedRobot) {
        selectedRobot.displayInfo();
    }

    requestAnimationFrame(animate);
}

animate();

// Event Listeners
canvas.addEventListener('click', event => {
    if (placingObstacle) {
        addObstacle(event);
    } else {
        let rect = canvas.getBoundingClientRect();
        const mousePos = new Vector(event.clientX - rect.left, event.clientY - rect.top);
        robots.forEach(robot => {
            if (robot.isClicked(mousePos)) {
                selectedRobot = robot;
            }
        });
    }
});

document.getElementById('addRobotBtn').addEventListener('click', () => {
    for (let i = 0; i < 5; i++) {
        addRobot();
    }
});

document.getElementById('addObstacleBtn').addEventListener('click', () => {
    placingObstacle = true;
});

document.getElementById('randomObstacleBtn').addEventListener('click', addRandomObstacle);

document.getElementById('modeSelect').addEventListener('change', (event) => {
    currentMode = event.target.value;
});
