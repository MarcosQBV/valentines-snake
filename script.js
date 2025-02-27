const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const submitBtn = document.getElementById("submitBtn");
const nicknameUIDiv = document.getElementById("nicknameUI");

const box = 20; // Grid size
let snake, direction, gameLoop, foodCoords;
let food = {
    x: Math.floor(Math.random() * (canvas.width / box)) * box,
    y: Math.floor(Math.random() * (canvas.height / box)) * box
}
let countdown = 3; // Countdown starts at 3
let gameRunning = false; // Game starts paused
let score = 0; // Track the score

const backend_url = "https://valentines-snake-backend-production.up.railway.app";

showLeaderboard();

// Show the start button when page loads
startBtn.style.display = "block"; 

// Event listener for the start button
startBtn.addEventListener("click", startGame);

submitBtn.addEventListener("click", saveScore);

document.addEventListener("keydown", changeDirection);

function startGame() {
    // Hide the start button
    startBtn.style.display = "none"; 
    restartBtn.style.display = "none";
    startBtn.style.display = "none"; 
    restartBtn.style.display = "none";
    nicknameUIDiv.style.display = "none";
    submitBtn.style.display = "none";
    submitBtn.disabled = false;

    // Reset variables
    snake = [{ x: 200, y: 200 }];
    direction = "RIGHT";
    food = generateFood();
    countdown = 3;
    score = 0;
    gameRunning = false;

    // Clear any existing intervals
    clearInterval(gameLoop);

    // Start countdown
    countdownTimer();
}

function countdownTimer() {
    if (countdown > 0) {
        drawCountdown(countdown);
        countdown--;
        setTimeout(countdownTimer, 500);
    } else {
        drawCountdown("LOVE !");
        setTimeout(() => {
            gameRunning = true; // Start game
            gameLoop = setInterval(gameLoopFunc, 100);
        }, 500); // Show "GO !" for 1 second, then start game
    }
}

function drawCountdown(num) {
    ctx.fillStyle = "rgb(181, 76, 144)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "pink";
    ctx.font = "50px VT323";
    ctx.textAlign = "center";
    ctx.fillText(num, canvas.width / 2, canvas.height / 2);
}

function changeDirection(event) {
    if (!gameRunning || moveQueued) return;

    const key = event.keyCode;
    let newDirection = direction;

    if (key === 37 && direction !== "RIGHT") newDirection = "LEFT";
    else if (key === 38 && direction !== "DOWN") newDirection = "UP";
    else if (key === 39 && direction !== "LEFT") newDirection = "RIGHT";
    else if (key === 40 && direction !== "UP") newDirection = "DOWN";

    // Allow pre-move: Store the new direction but apply it later
    if (newDirection !== direction) {
        direction = newDirection;
        moveQueued = true; // Prevent further input until next tick
    }
}

function generateFood() {
    x = Math.floor(Math.random() * (canvas.width / box)) * box;
    y = Math.floor(Math.random() * (canvas.height / box)) * box;
    let newFoodCoords = {x , y};
    if (
        !snake.some(segment => segment.x === newFoodCoords.x && segment.y === newFoodCoords.y) &&
        (newFoodCoords.x !== food.x || newFoodCoords.y !== food.y)
    ) {
        return newFoodCoords;
    } else {
        generateFood()
    }
}

function updateGame() {
    if (!gameRunning) return;

    let head = { x: snake[0].x, y: snake[0].y };

    if (direction === "LEFT") head.x -= box;
    if (direction === "UP") head.y -= box;
    if (direction === "RIGHT") head.x += box;
    if (direction === "DOWN") head.y += box;

    // Collision detection (wall or self)
    if (head.x < 0 || head.y < 0 || head.x >= canvas.width || head.y >= canvas.height || 
        snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        
        clearInterval(gameLoop);
        gameRunning = false;
        
        // Ask for a nickname
        nicknameUIDiv.style.display = "block";
        submitBtn.style.display = "block";
        submitBtn.innerHTML = "Save Score !";
        restartBtn.style.display = "block"; // Show restart button
    }

    snake.unshift(head);

    // Check if the snake eats the food
    if (head.x === food.x && head.y === food.y) {
        food = generateFood();
        score++;
    } else {
        snake.pop(); // Remove tail if no food is eaten
    }

    moveQueued = false; // Allow new input after the tick
}

function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "20px 'VT323', sans-serif"; // Use custom font
    ctx.fillText("           Score: " + score, 10, 30);
}

function drawGame() {
    if (!gameRunning) return;

    ctx.fillStyle = "rgb(181, 76, 144)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawScore(); // Draw the score

    // Draw snake
    ctx.fillStyle = "rgb(199, 159, 255)";
    snake.forEach(segment => ctx.fillRect(segment.x, segment.y, box, box));

    // Draw food
    ctx.fillStyle = "rgb(255, 159, 228)";
    ctx.fillRect(food.x, food.y, box, box);
}



function saveScore() {
    let nickname = document.getElementById("nickname").value;
    if (nickname) {
        submitBtn.innerHTML = "Loading...";
        // Submit the score to the backend
        fetch(backend_url + "/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: nickname, score: score })
        })
        .then(response => {
            if (response.ok) {
                submitBtn.innerHTML = "Great job, " + nickname + " <3";
                submitBtn.disabled = true;
                // Now show the updated leaderboard
                showLeaderboard();
            } 
        })
        .catch(error => {
            console.error("Error submitting score:", error);
            submitBtn.innerHTML = "Failed to submit score :(";
        });
    } else {
        submitBtn.innerHTML = "Set a Nickname !";
    }
}

function showLeaderboard() {
    let leaderboardDiv = document.getElementById("leaderboard"); // Move outside to be accessible in catch

    fetch(backend_url + "/leaderboard")
        .then(response => response.json())
        .then(data => {
            leaderboardDiv.innerHTML = "<h2>Leaderboard:</h2>";

            let list = document.createElement("ul");
            data.forEach(entry => {
                let listItem = document.createElement("li");
                listItem.textContent = `${entry[0]}: ${entry[1]}`;
                list.appendChild(listItem);
            });

            leaderboardDiv.appendChild(list);
            leaderboardDiv.style.display = "block";
        })
        .catch(error => {
            console.error("Error retrieving leaderboard", error);
            leaderboardDiv.innerHTML = "<h2>Leaderboard:</h2><p>Failed to retrieve leaderboard :(</p>";
            leaderboardDiv.style.display = "block";
        });
}

function gameLoopFunc() {
    updateGame();
    drawGame();
}
