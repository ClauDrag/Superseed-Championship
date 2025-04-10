document.addEventListener('DOMContentLoaded', () => {
    // Player selection and game variables
    const players = document.querySelectorAll('.player');
    const selectedPlayers = new Set();
    const startGameBtn = document.getElementById('start-game');
    const gameScreen = document.getElementById('game-screen');
    const resetGameBtn = document.getElementById('reset-game');
    
    // Difficulty selection elements
    const difficultyOptions = document.querySelectorAll('.difficulty-option');
    let selectedDifficulty = 'beginner'; // Default difficulty
    
    // Game elements
    const ball = document.getElementById('ball');
    const playerA = document.getElementById('player-a');
    const playerB = document.getElementById('player-b');
    const scorePlayerAName = document.getElementById('score-player-a-name');
    const scorePlayerBName = document.getElementById('score-player-b-name');
    const crowdTop = document.querySelector('.crowd-top');
    const crowdBottom = document.querySelector('.crowd-bottom');
    const cheerSound = document.getElementById('cheer-sound');
    
    // Get all billboards
    const billboardTop1 = document.getElementById('billboard-top-1');
    const billboardTop2 = document.getElementById('billboard-top-2');
    const billboardBottom1 = document.getElementById('billboard-bottom-1');
    const billboardBottom2 = document.getElementById('billboard-bottom-2');
    
    // Advertising images from the "billboard pictures" folder
    const advertisingImages = [
        'billboard pictures/Velodrome.png',
        'billboard pictures/Ethereum.png',
        'billboard pictures/Optimism.png',
        'billboard pictures/FractalVision.png',
        'billboard pictures/Mintpad.png',
        'billboard pictures/Ionic.png',
        'billboard pictures/Seedfi.png',
        'billboard pictures/BulletX.png'
    ];
    
    // Billboard rotation intervals
    let billboardIntervals = [];
    
    // Initially hide the player seed pods until tournament starts
    playerA.style.display = 'none';
    playerB.style.display = 'none';
    
    // Store player data for game use
    const playerData = {
        1: { name: 'David', gender: 'male' },
        2: { name: 'Nick', gender: 'male' },
        3: { name: 'Aura', gender: 'female' },
        4: { name: 'João', gender: 'male' },
        5: { name: 'Adam', gender: 'male' },
        6: { name: 'Mesky', gender: 'male' }
    };
    
    // Tennis scoring system (simplified to first-to-7-points)
    let playerAPoints = 0;
    let playerBPoints = 0;
    
    // Game variables
    let gameInterval;
    let ballX = 50; // percentage
    let ballY = 50; // percentage
    let ballSpeedX = 0.5;
    let ballSpeedY = 0.3;
    let ballSpin = 0; // Add spin effect to the ball
    let ballTrail = []; // Array to store ball trail positions
    let playerAY = 40; // percentage
    let playerBY = 40; // percentage
    let servingPlayer = 'A'; // Start with player A serving
    let lastHitBy = null; // Track which player last hit the ball
    let inPlay = false;
    let readyToServe = true;
    let ballHitCount = 0; // Track how many times the ball has been hit
    let pointWinner = null; // Track who won the last point
    let isComputerControlled = true; // Flag for AI control of Player B
    let computerDifficulty = 0.7; // AI difficulty (0-1 scale)
    let computerReactionDelay = 0; // Delay in frames before AI reacts
    let computerReactionTimer = 0; // Timer for AI reaction delay
    let ballEnergy = 1.0; // Track ball energy (affects speed)
    let lastHitTime = 0; // Track when the ball was last hit
    let hitPosition = 0.5; // Track where on the racket the ball was hit (0=top, 1=bottom)
    let computerMovingUp = false; // Initialize computer movement direction
    
    // Listen for player selection
    players.forEach(player => {
        player.addEventListener('click', () => {
            const playerId = player.getAttribute('data-id');
            
            if (selectedPlayers.has(playerId)) {
                // Remove player
                selectedPlayers.delete(playerId);
                player.classList.remove('selected');
            } else if (selectedPlayers.size < 2) {
                // Add player if less than 2 players are selected
                selectedPlayers.add(playerId);
                player.classList.add('selected');
            } else {
                // If 2 players already selected, deselect the oldest one
                const oldestPlayer = Array.from(selectedPlayers)[0];
                selectedPlayers.delete(oldestPlayer);
                document.querySelector(`.player[data-id="${oldestPlayer}"]`)?.classList.remove('selected');
                
                // Add the new player
                selectedPlayers.add(playerId);
                player.classList.add('selected');
            }
            
            updateStartButton();
        });
    });
    
    // Listen for difficulty selection
    difficultyOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            difficultyOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            option.classList.add('selected');
            
            // Store selected difficulty
            selectedDifficulty = option.getAttribute('data-difficulty');
            console.log(`Difficulty set to: ${selectedDifficulty}`);
        });
    });
    
    function updateStartButton() {
        startGameBtn.disabled = selectedPlayers.size !== 2;
    }
    
    // Start game button
    startGameBtn.addEventListener('click', () => {
        document.querySelector('.player-selection').classList.add('hidden');
        startGameBtn.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        // Add game-active class to body to hide background
        document.body.classList.add('game-active');
        
        // Assign selected players to the game
        assignPlayersToGame();
        
        // Apply difficulty settings
        applyDifficultySettings();
        
        startGame();
    });
    
    // Reset game button
    resetGameBtn.addEventListener('click', () => {
        gameScreen.classList.add('hidden');
        document.querySelector('.player-selection').classList.remove('hidden');
        startGameBtn.classList.remove('hidden');
        
        // Remove game-active class from body to show background again
        document.body.classList.remove('game-active');
        
        stopGame();
    });
    
    // Tennis game movement with keyboard
    document.addEventListener('keydown', (e) => {
        // Only respond to keys if game screen is visible
        if (gameScreen.classList.contains('hidden')) return;
        
        // Log the key pressed to debug
        console.log('Key pressed:', e.key);
        
        switch (e.key) {
            case 'w':
            case 'W':
                // Move player A up (decrease Y value) - increased speed
                playerAY = Math.max(10, playerAY - 12);
                break;
            case 's':
            case 'S':
                // Move player A down (increase Y value) - increased speed
                playerAY = Math.min(90, playerAY + 12);
                break;
            case 'ArrowUp':
                // Only move player B if not computer controlled
                if (!isComputerControlled) {
                    // Move player B up (decrease Y value) - increased speed
                    playerBY = Math.max(10, playerBY - 12);
                }
                break;
            case 'ArrowDown':
                // Only move player B if not computer controlled
                if (!isComputerControlled) {
                    // Move player B down (increase Y value) - increased speed
                    playerBY = Math.min(90, playerBY + 12);
                }
                break;
            case ' ': // Space bar to serve
                if (readyToServe && !inPlay) {
                    serveTheBall();
                }
                break;
            case 'r': // Reset with R key
            case 'R':
                if (!gameScreen.classList.contains('hidden')) {
                    resetPoint();
                }
                break;
        }
    });
    
    // Function to determine gender based on player name
    function determineGender(name) {
        const femaleNames = ['Aura', 'Emma', 'Sophia', 'Sofia'];
        return femaleNames.includes(name) ? 'female' : 'male';
    }
    
    // Assign selected players to the game
    function assignPlayersToGame() {
        // Convert selected players set to array for indexing
        const playerIds = Array.from(selectedPlayers);
        
        // Get first two selected players for the match
        const playerAId = playerIds[0];
        const playerBId = playerIds[1];
        
        // Set player A details
        const playerAData = playerData[playerAId];
        // Only update scoreboard name, player-info elements are removed
        scorePlayerAName.textContent = playerAData.name;
        
        // Set player A to tennis racket styling
        playerA.classList.remove('male-player', 'female-player');
        playerA.innerHTML = ''; // Clear any existing content
        
        // Create racket container for player A
        const racketContainerA = document.createElement('div');
        racketContainerA.className = 'racket-container racket-a';
        
        // Create racket element for player A
        const racketA = document.createElement('div');
        racketA.className = 'tennis-racket';
        
        // Create racket handle
        const handleA = document.createElement('div');
        handleA.className = 'racket-handle';
        
        // Create grip tape for racket handle
        const gripTapeA = document.createElement('div');
        gripTapeA.className = 'racket-grip-tape';
        handleA.appendChild(gripTapeA);
        
        // Create racket head
        const racketHeadA = document.createElement('div');
        racketHeadA.className = 'racket-head';
        
        // Create racket strings
        const racketStringsA = document.createElement('div');
        racketStringsA.className = 'racket-strings';
        
        // Create Bitcoin logo for player A
        const bitcoinLogoA = document.createElement('div');
        bitcoinLogoA.className = 'bitcoin-logo';
        bitcoinLogoA.innerHTML = '₿';
        
        // Add Bitcoin logo to racket strings
        racketStringsA.appendChild(bitcoinLogoA);
        
        // Add strings to head
        racketHeadA.appendChild(racketStringsA);
        
        // Add head and handle to racket
        racketA.appendChild(racketHeadA);
        racketA.appendChild(handleA);
        
        // Add racket to container
        racketContainerA.appendChild(racketA);
        
        // Add expression container for player A
        const expressionA = document.createElement('div');
        expressionA.className = 'player-expression';
        expressionA.dataset.originalText = '';
        racketContainerA.appendChild(expressionA);
        
        // Add racket container to player
        playerA.appendChild(racketContainerA);
        
        // Style the player A
        playerA.style.width = '50px';
        playerA.style.height = '100px';
        playerA.style.backgroundColor = 'transparent';
        playerA.style.border = 'none';
        playerA.style.boxShadow = 'none';
        
        // Set player B details
        const playerBData = playerData[playerBId];
        // Only update scoreboard name, player-info elements are removed
        scorePlayerBName.textContent = playerBData.name;
        
        // Set player B to tennis racket styling
        playerB.classList.remove('male-player', 'female-player');
        playerB.innerHTML = ''; // Clear any existing content
        
        // Create racket container for player B
        const racketContainerB = document.createElement('div');
        racketContainerB.className = 'racket-container racket-b';
        
        // Create racket element for player B
        const racketB = document.createElement('div');
        racketB.className = 'tennis-racket';
        
        // Create racket handle
        const handleB = document.createElement('div');
        handleB.className = 'racket-handle';
        
        // Create grip tape for racket handle
        const gripTapeB = document.createElement('div');
        gripTapeB.className = 'racket-grip-tape';
        handleB.appendChild(gripTapeB);
        
        // Create racket head
        const racketHeadB = document.createElement('div');
        racketHeadB.className = 'racket-head';
        
        // Create racket strings
        const racketStringsB = document.createElement('div');
        racketStringsB.className = 'racket-strings';
        
        // Create Bitcoin logo for player B
        const bitcoinLogoB = document.createElement('div');
        bitcoinLogoB.className = 'bitcoin-logo';
        bitcoinLogoB.innerHTML = '₿';
        
        // Add Bitcoin logo to racket strings
        racketStringsB.appendChild(bitcoinLogoB);
        
        // Add strings to head
        racketHeadB.appendChild(racketStringsB);
        
        // Add head and handle to racket
        racketB.appendChild(racketHeadB);
        racketB.appendChild(handleB);
        
        // Add racket to container
        racketContainerB.appendChild(racketB);
        
        // Add expression container for player B
        const expressionB = document.createElement('div');
        expressionB.className = 'player-expression';
        expressionB.dataset.originalText = '';
        racketContainerB.appendChild(expressionB);
        
        // Add racket container to player
        playerB.appendChild(racketContainerB);
        
        // Style the player B
        playerB.style.width = '50px';
        playerB.style.height = '100px';
        playerB.style.backgroundColor = 'transparent';
        playerB.style.border = 'none';
        playerB.style.boxShadow = 'none';
        
        // Add CSS for the racket styling
        const racketStyles = document.createElement('style');
        racketStyles.textContent = `
            .racket-container {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                animation: floatRacket 2s infinite ease-in-out;
            }
            
            @keyframes floatRacket {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
            }
            
            @keyframes bounceRacket {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(15deg); }
            }
            
            .tennis-racket {
                position: relative;
                width: 40px;
                height: 90px;
                display: flex;
                flex-direction: column;
                align-items: center;
                transform-origin: bottom center;
                z-index: 5;
            }
            
            .racket-head {
                width: 36px;
                height: 50px;
                border: 3px solid #333;
                border-radius: 50% / 30%;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 5;
            }
            
            .racket-a .racket-head {
                background-color: rgba(52, 152, 219, 0.7);
            }
            
            .racket-b .racket-head {
                background-color: rgba(231, 76, 60, 0.7);
            }
            
            .racket-strings {
                width: 30px;
                height: 44px;
                border-radius: 50% / 30%;
                background-image: linear-gradient(to right, rgba(255,255,255,0.7) 1px, transparent 1px),
                                  linear-gradient(to bottom, rgba(255,255,255,0.7) 1px, transparent 1px);
                background-size: 5px 5px;
                z-index: 6;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            
            .bitcoin-logo {
                position: absolute;
                font-size: 20px;
                color: #f7931a;
                font-weight: bold;
                text-shadow: 0 0 3px rgba(0,0,0,0.5);
                z-index: 7;
                transform: translateY(-2px);
            }
            
            .racket-handle {
                width: 8px;
                height: 40px;
                background-color: #333;
                position: relative;
                margin-top: -3px;
                border-radius: 4px;
                z-index: 4;
                overflow: visible;
            }
            
            .racket-grip-tape {
                position: absolute;
                width: 100%;
                height: 100%;
                background-image: repeating-linear-gradient(
                    -45deg, 
                    transparent, 
                    transparent 3px, 
                    rgba(255, 255, 255, 0.3) 3px, 
                    rgba(255, 255, 255, 0.3) 6px
                );
                border-radius: 4px;
                z-index: 5;
            }
            
            .racket-handle::before {
                content: '';
                position: absolute;
                width: 15px;
                height: 10px;
                background-color: #333;
                top: -5px;
                left: 50%;
                transform: translateX(-50%);
                border-radius: 3px;
                z-index: 3;
            }
            
            .player-expression {
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                font-size: 24px;
                z-index: 10;
                opacity: 0;
            }
        `;
        document.head.appendChild(racketStyles);
        
        // Add "(CPU)" to Player B's name for indication
        const difficulty = ['Easy', 'Medium', 'Hard'][Math.floor(computerDifficulty * 3)];
        console.log(`Computer player set to ${difficulty} difficulty`);
    }
    
    // Serve the ball
    function serveTheBall() {
        // Hide match point indicator when play starts
        const existingMatchPoint = document.getElementById('match-point-indicator');
        if (existingMatchPoint) {
            existingMatchPoint.remove();
        }
        
        inPlay = true;
        readyToServe = false;
        ballHitCount = 0;
        lastHitBy = servingPlayer;
        ballEnergy = 1.0; // Reset ball energy
        lastHitTime = Date.now();
        
        // Set initial ball position and speed based on serving player
        if (servingPlayer === 'A') {
            ballX = 10;
            // Ensure ball starts within the court bounds
            ballY = Math.max(20, Math.min(80, playerAY + 10));
            ballSpeedX = 1.2; // Consistent speed for the entire game
            ballSpeedY = -0.2; // Reduced upward trajectory
            ballSpin = 0.1; // Add slight spin on serve
            hitPosition = 0.5; // Center of racket
        } else {
            ballX = 90;
            // Ensure ball starts within the court bounds
            ballY = Math.max(20, Math.min(80, playerBY + 10));
            ballSpeedX = -1.2; // Consistent speed for the entire game
            ballSpeedY = -0.2; // Reduced upward trajectory
            ballSpin = -0.1; // Add slight spin on serve
            hitPosition = 0.5; // Center of racket
        }
    }
    
    // Start the tennis game
    function startGame() {
        // Reset scores
        playerAPoints = 0;
        playerBPoints = 0;
        
        // Update scores display
        updateScores();
        
        // Show the players
        playerA.style.display = 'block';
        playerB.style.display = 'block';
        
        // Reset game state
        inPlay = false;
        readyToServe = true;
        ballHitCount = 0;
        lastHitBy = null;
        servingPlayer = 'A'; // Player A always serves first
        pointWinner = null;
        
        // Initialize billboards with rotating ads
        initializeBillboards();
        
        // Add info modal functionality
        const infoButton = document.getElementById('info-button');
        const infoModal = document.getElementById('info-modal');
        const closeButton = document.querySelector('.close-button');
        
        infoButton.addEventListener('click', () => {
            infoModal.style.display = 'block';
        });
        
        closeButton.addEventListener('click', () => {
            infoModal.style.display = 'none';
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === infoModal) {
                infoModal.style.display = 'none';
            }
        });
        
        // Add arena title for atmosphere
        const scoreElement = document.querySelector('.scoreboard');
        const arenaTitle = document.createElement('div');
        arenaTitle.style.textAlign = 'center';
        arenaTitle.style.margin = '5px 0 15px';
        arenaTitle.style.color = '#4CAF50';
        arenaTitle.style.fontSize = '25px';
        arenaTitle.textContent = 'SUPERSEED ARENA';
        arenaTitle.style.fontWeight = 'bold';
        arenaTitle.style.textShadow = '0 0 10px rgba(0, 255, 255, 0.8)';
        
        // Insert the title after the scoreboard
        scoreElement.after(arenaTitle);
        
        // Ensure players are properly positioned and visible
        updatePlayerPositions();
        
        // Position the ball for serving
        positionBallForServe();
        
        // Start the game loop
        gameInterval = setInterval(updateGame, 16); // ~60fps
    }
    
    // Position ball for serving
    function positionBallForServe() {
        if (servingPlayer === 'A') {
            ballX = 10;
            ballY = playerAY;
        } else {
            ballX = 90;
            ballY = playerBY;
        }
        
        // Update ball position visually
        ball.style.left = `${ballX}%`;
        ball.style.top = `${ballY}%`;
        
        // Display Match Point indicator if applicable
        if (playerAPoints === 9 || playerBPoints === 9) {
            showMatchPointAnimation();
        }
        
        // Display a message about who's serving
        const servingPlayerName = servingPlayer === 'A' ? scorePlayerAName.textContent : scorePlayerBName.textContent;
        console.log(`${servingPlayerName} is serving. Press SPACE to serve.`);
    }
    
    // Stop the tennis game
    function stopGame() {
        clearInterval(gameInterval);
        
        // Clear billboard intervals
        billboardIntervals.forEach(interval => clearInterval(interval));
        billboardIntervals = [];
    }
    
    // Reset point for a new serve
    function resetPoint() {
        inPlay = false;
        readyToServe = true;
        
        // Change serving player after each point
        servingPlayer = servingPlayer === 'A' ? 'B' : 'A';
        
        // Check for match point situation and show animation between points
        if (playerAPoints === 9 || playerBPoints === 9) {
            showMatchPointAnimation();
        }
        
        positionBallForServe();
    }
    
    // Update the game state
    function updateGame() {
        if (!inPlay) {
            // If not in play, just update paddle positions
            if (readyToServe) {
                // Update ball position to follow the server's paddle
                if (servingPlayer === 'A') {
                    ballX = 10;
                    ballY = playerAY;
                } else {
                    ballX = 90;
                    ballY = playerBY;
                    
                    // If computer is serving, add movement before serving
                    if (isComputerControlled && servingPlayer === 'B') {
                        // Random movement to make computer seem more alive
                        if (Math.random() < 0.05) { // 5% chance to change direction each frame
                            computerMovingUp = !computerMovingUp;
                        }
                        
                        // Move up or down based on current direction - increased speed
                        if (computerMovingUp) {
                            playerBY = Math.max(15, playerBY - 2.5);
                            if (playerBY <= 15) computerMovingUp = false;
                        } else {
                            playerBY = Math.min(85, playerBY + 2.5);
                            if (playerBY >= 85) computerMovingUp = true;
                        }
                        
                        // Check for match point situation while CPU is moving before serving
                        if ((playerAPoints === 9 || playerBPoints === 9) && !document.getElementById('match-point-indicator')) {
                            showMatchPointAnimation();
                        }
                        
                        // Serve the ball after moving for a while
                        setTimeout(() => {
                            if (!inPlay && readyToServe) {
                                serveTheBall();
                            }
                        }, 1000);
                    }
                }
                ball.style.left = `${ballX}%`;
                ball.style.top = `${ballY}%`;
            }
            
            // Update paddle positions
            updatePlayerPositions();
            return;
        }
        
        // Move the ball with physics-based improvements
        const gravity = 0.003; // Reduced for more consistent movement
        const friction = 0.9995; // Increased for less slowdown
        
        // Apply gravity and friction
        ballSpeedY += gravity;
        ballSpeedX *= friction;
        ballSpeedY *= friction;
        
        // Apply spin effect to ball movement - more realistic
        ballSpeedY += ballSpin * 0.03; // Reduced for more consistent movement
        ballSpeedX += ballSpin * 0.01; // Reduced for more consistent movement
        ballSpin *= 0.98; // Gradually reduce spin
        
        // Gradually reduce ball energy over time, but even less aggressively
        ballEnergy *= 0.9998; // Increased for less energy loss
        
        // Apply energy to ball speed
        ballSpeedX *= ballEnergy;
        ballSpeedY *= ballEnergy;
        
        // Ensure minimum speed to prevent ball from stopping, but with consistent value
        if (Math.abs(ballSpeedX) < 0.8) { // Increased minimum speed for consistency
            ballSpeedX = ballSpeedX > 0 ? 0.8 : -0.8;
        }
        
        // Store previous position for collision detection
        const prevBallX = ballX;
        const prevBallY = ballY;
        
        // Move the ball
        ballX += ballSpeedX;
        ballY += ballSpeedY;
        
        // Add ball trail effect (store last 5 positions)
        ballTrail.push({x: ballX, y: ballY});
        if (ballTrail.length > 5) {
            ballTrail.shift();
        }
        
        // Computer AI movement for Player B
        if (isComputerControlled) {
            // Only move when ball is approaching Player B's side
            if (ballSpeedX > 0) {
                // Calculate ideal position with some imperfection based on difficulty
                const targetY = ballY;
                const error = (1 - computerDifficulty) * 20; // 0-20% error margin
                const randomOffset = (Math.random() * error * 2 - error);
                const idealY = targetY + randomOffset;
                
                // Add reaction delay
                if (computerReactionTimer > 0) {
                    computerReactionTimer--;
                } else {
                    // Store previous position to detect movement
                    const prevPlayerBY = playerBY;
                    
                    // Move player B towards the ideal position - speed varies with difficulty
                    const moveSpeed = 2 + (computerDifficulty * 5); // 2-7 speed units based on difficulty
                    if (playerBY < idealY - moveSpeed) {
                        playerBY += moveSpeed;
                        // Add bounce animation when moving
                        addBounceAnimation(playerB);
                    } else if (playerBY > idealY + moveSpeed) {
                        playerBY -= moveSpeed;
                        // Add bounce animation when moving
                        addBounceAnimation(playerB);
                    }
                    
                    // Keep within bounds
                    playerBY = Math.max(10, Math.min(90, playerBY));
                    
                    // Reset reaction timer when ball is hit by player A
                    if (lastHitBy === 'A' && computerReactionDelay > 0) {
                        computerReactionTimer = computerReactionDelay;
                    }
                }
            }
        }
        
        // Improved boundary collision logic for better bouncing
        if (ballY <= 10) {
            // Top boundary collision
            ballY = 10.5; // Slight offset to prevent sticking
            
            // Improved bounce physics - preserve more energy
            ballSpeedY = Math.abs(ballSpeedY) * 0.95; // Increased bounce energy preservation from 0.9
            
            // Add slight random variation to bounce angle
            ballSpeedX += (Math.random() - 0.5) * 0.08; // Decreased randomness from 0.1
            
            // Add slight spin on bounce
            ballSpin += (Math.random() - 0.5) * 0.04; // Reduced spin effect
            
            // Visual feedback for bounce
            ball.style.transform = 'scale(0.9)';
            setTimeout(() => {
                ball.style.transform = 'scale(1)';
            }, 50);
        } 
        else if (ballY >= 90) {
            // Bottom boundary collision
            ballY = 89.5; // Slight offset to prevent sticking
            
            // Improved bounce physics - preserve more energy
            ballSpeedY = -Math.abs(ballSpeedY) * 0.95; // Increased bounce energy preservation from 0.9
            
            // Add slight random variation to bounce angle
            ballSpeedX += (Math.random() - 0.5) * 0.08; // Decreased randomness from 0.1
            
            // Add slight spin on bounce
            ballSpin += (Math.random() - 0.5) * 0.04; // Reduced spin effect
            
            // Visual feedback for bounce
            ball.style.transform = 'scale(0.9)';
            setTimeout(() => {
                ball.style.transform = 'scale(1)';
            }, 50);
        }
        
        // Check if ball hits player A's paddle
        const playerAWidth = 12; // Reduced from 25 to match visual size
        const playerAHeight = 20; // Reduced from 100 to match visual size
        const ballSize = 25; // Ball size in pixels
        const ballSizePercent = 2.5; // Approximate percentage of court width
        
        // Improved collision detection for player A with more precise hit detection
        const hitPlayerA = ballX <= 5 + (playerAWidth/2) && 
            ballX >= 5 - (playerAWidth/2) && 
            ballY >= playerAY - (playerAHeight/2) && 
            ballY <= playerAY + (playerAHeight/2);
            
        // Check if ball hits player B's paddle
        const playerBWidth = 12; // Reduced from 25 to match visual size
        const playerBHeight = 20; // Reduced from 100 to match visual size
        
        // Improved collision detection for player B with more precise hit detection
        const hitPlayerB = ballX >= 95 - (playerBWidth/2) && 
            ballX <= 95 + (playerBWidth/2) && 
            ballY >= playerBY - (playerBHeight/2) && 
            ballY <= playerBY + (playerBHeight/2);
        
        // Handle player A hit
        if (hitPlayerA) {
            // Only register hit if last hit wasn't by this player
            if (lastHitBy !== 'A') {
                ballHitCount++;
                lastHitBy = 'A';
                lastHitTime = Date.now();
                
                // Calculate hit position (0 = top of racket, 1 = bottom of racket)
                hitPosition = (ballY - (playerAY - playerAHeight/2)) / playerAHeight;
                hitPosition = Math.max(0, Math.min(1, hitPosition)); // Clamp between 0 and 1
                
                // Add more power as rally continues, but cap it
                const rallyBoost = Math.min(ballHitCount * 0.02, 0.1); // Reduced for consistency
                
                // Base speed plus rally boost (consistent speed)
                ballSpeedX = 1.2 + rallyBoost; // Consistent speed matching serve
                
                // Angle based on hit position: -0.8 (up) to 0.8 (down)
                // More extreme angles when hitting at the edges of the racket
                const angleMultiplier = 1.0 + (Math.abs(hitPosition - 0.5) * 0.4); // Reduced for consistency
                ballSpeedY = (hitPosition - 0.5) * 1.0 * angleMultiplier; // Reduced for consistency
                
                // Add spin based on hit position and racket movement
                // More spin when hitting at the edges of the racket
                ballSpin = (hitPosition - 0.5) * 0.15 * angleMultiplier; // Reduced for consistency
                
                // Add slight random variation for natural feel
                ballSpin += (Math.random() - 0.5) * 0.05; // Reduced for consistency
                
                // Ensure ball stays in vertical bounds even with extreme angles
                if (ballY <= 15 && ballSpeedY < 0) {
                    ballSpeedY = Math.abs(ballSpeedY) * 0.5; // Redirect upward ball slightly downward
                } else if (ballY >= 85 && ballSpeedY > 0) {
                    ballSpeedY = -Math.abs(ballSpeedY) * 0.5; // Redirect downward ball slightly upward
                }
                
                // Ensure the ball moves away from the racket
                ballX = 5 + (playerAWidth/2) + 0.5;
                
                // Add slight random variation for natural feel
                ballSpeedY += (Math.random() - 0.5) * 0.05; // Reduced for consistency
                
                // Add visual feedback for hit
                ball.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    ball.style.transform = 'scale(1)';
                }, 100);
                
                // Increase ball energy on hit
                ballEnergy = Math.min(1.0, ballEnergy + 0.02); // Reduced for consistency
                
                // Add reaction to the hit - happy expression
                handleRacketHit(playerA);
                
                // Add stronger bounce animation when hitting the ball
                addBounceAnimation(playerA);
            }
        }
        
        // Handle player B hit
        if (hitPlayerB) {
            // Only register hit if last hit wasn't by this player
            if (lastHitBy !== 'B') {
                ballHitCount++;
                lastHitBy = 'B';
                lastHitTime = Date.now();
                
                // Calculate hit position (0 = top of racket, 1 = bottom of racket)
                hitPosition = (ballY - (playerBY - playerBHeight/2)) / playerBHeight;
                hitPosition = Math.max(0, Math.min(1, hitPosition)); // Clamp between 0 and 1
                
                // Add more power as rally continues, but cap it - REDUCED
                const rallyBoost = Math.min(ballHitCount * 0.02, 0.1); // Reduced for consistency
                
                // Base speed plus rally boost (negative for left direction) - REDUCED
                ballSpeedX = -1.2 - rallyBoost; // Consistent speed matching serve
                
                // Angle based on hit position: -0.8 (up) to 0.8 (down)
                // More extreme angles when hitting at the edges of the racket - REDUCED
                const angleMultiplier = 1.0 + (Math.abs(hitPosition - 0.5) * 0.4); // Reduced for consistency
                ballSpeedY = (hitPosition - 0.5) * 1.0 * angleMultiplier; // Reduced for consistency
                
                // Add spin based on hit position and racket movement
                // More spin when hitting at the edges of the racket - REDUCED
                ballSpin = (hitPosition - 0.5) * 0.15 * angleMultiplier; // Reduced for consistency
                
                // Add slight random variation for natural feel - REDUCED
                ballSpin += (Math.random() - 0.5) * 0.05; // Reduced for consistency
                
                // Ensure ball stays in vertical bounds even with extreme angles
                if (ballY <= 15 && ballSpeedY < 0) {
                    ballSpeedY = Math.abs(ballSpeedY) * 0.5; // Redirect upward ball slightly downward
                } else if (ballY >= 85 && ballSpeedY > 0) {
                    ballSpeedY = -Math.abs(ballSpeedY) * 0.5; // Redirect downward ball slightly upward
                }
                
                // Ensure the ball moves away from the racket
                ballX = 95 - (playerBWidth/2) - 0.5;
                
                // Add slight random variation for natural feel - REDUCED
                ballSpeedY += (Math.random() - 0.5) * 0.05; // Reduced for consistency
                
                // Add visual feedback for hit
                ball.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    ball.style.transform = 'scale(1)';
                }, 100);
                
                // Increase ball energy on hit - REDUCED
                ballEnergy = Math.min(1.0, ballEnergy + 0.02); // Reduced for consistency
                
                // Add reaction to the hit - happy expression
                handleRacketHit(playerB);
                
                // Add stronger bounce animation when hitting the ball
                addBounceAnimation(playerB);
            }
        }
        
        // Check if ball passes player boundaries without being hit - scoring
        if (prevBallX > 5 && ballX <= 5 && !hitPlayerA) {
            // Ball passed player A without hitting
            if (inPlay) {
                // Always count the point, regardless of ballHitCount
                // Player B scores when ball passes player A
                playerScores('B');
                servingPlayer = 'B'; // Winner serves
                pointWinner = 'B';
                // Crowd cheers for player B
                triggerCrowdCheering('B');
                // Show sad expression on player A
                handleRacketHit(playerA);
                // Show happy expression on player B
                handleRacketHit(playerB);
            }
            inPlay = false;
            readyToServe = false;
            setTimeout(() => {
                readyToServe = true;
                positionBallForServe();
            }, 1000);
        } else if (prevBallX < 95 && ballX >= 95 && !hitPlayerB) {
            // Ball passed player B without hitting
            if (inPlay) {
                // Always count the point, regardless of ballHitCount
                // Player A scores when ball passes player B
                playerScores('A');
                servingPlayer = 'A'; // Winner serves
                pointWinner = 'A';
                // Crowd cheers for player A
                triggerCrowdCheering('A');
                // Show sad expression on player B
                handleRacketHit(playerB);
                // Show happy expression on player A
                handleRacketHit(playerA);
            }
            inPlay = false;
            readyToServe = false;
            setTimeout(() => {
                readyToServe = true;
                positionBallForServe();
            }, 1000);
        }
        
        // Update positions
        ball.style.left = `${ballX}%`;
        ball.style.top = `${ballY}%`;
        updatePlayerPositions();
    }
    
    // Track key presses
    const keysPressed = {};
    
    document.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
    });
    
    document.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });
    
    function isKeyPressed(key) {
        return keysPressed[key] === true;
    }
    
    // Add bounce animation to tennis racket
    function addBounceAnimation(player) {
        const racket = player.querySelector('.tennis-racket');
        if (racket && !racket.classList.contains('bouncing')) {
            racket.classList.add('bouncing');
            racket.style.animation = 'bounceRacket 0.3s ease-in-out';
            
            // Remove the class after animation completes
            setTimeout(() => {
                racket.style.animation = '';
                racket.classList.remove('bouncing');
            }, 300);
        }
    }
    
    // Handle player scoring - simplified to first-to-7-points to win match
    function playerScores(player) {
        if (player === 'A') {
            playerAPoints++;
            
            // Update the score display first
            updateScores();
            
            // Check if player A reached 7 points
            if (playerAPoints >= 10) {
                // Player A won the match
                const winner = scorePlayerAName.textContent;
                const winnerId = Array.from(selectedPlayers)[0]; // Get the player A ID
                
                // Show victory celebration with fireworks
                showVictoryCelebration(winner, winnerId);
                
                // Add a delay before stopping the game
                setTimeout(() => {
                    stopGame();
                }, 5000);
            }
        } else if (player === 'B') {
            playerBPoints++;
            
            // Update the score display first
            updateScores();
            
            // Check if player B reached 7 points
            if (playerBPoints >= 10) {
                // Player B won the match
                const winner = scorePlayerBName.textContent;
                const winnerId = Array.from(selectedPlayers)[1]; // Get the player B ID
                
                // Show victory celebration with fireworks
                showVictoryCelebration(winner, winnerId);
                
                // Add a delay before stopping the game
                setTimeout(() => {
                    stopGame();
                }, 5000);
            }
        }
    }
    
    // Handle racket hit
    function handleRacketHit(player) {
        const racket = player.querySelector('.tennis-racket');
        if (racket) {
            racket.style.transform = 'rotate(15deg)';
            racket.style.transition = 'transform 0.3s ease-out';
            
            // Reset after 0.5 seconds
            setTimeout(() => {
                racket.style.transform = 'rotate(0deg)';
            }, 500);
        }
    }
    
    // Function to show victory celebration with fireworks and player photo
    function showVictoryCelebration(winner, playerId) {
        // Create celebration overlay
        const overlay = document.createElement('div');
        overlay.id = 'celebration-overlay';
        document.body.appendChild(overlay);
        
        // Create winner container
        const winnerContainer = document.createElement('div');
        winnerContainer.className = 'winner-container';
        overlay.appendChild(winnerContainer);
        
        // Add winner image - use the player's actual image from the player selection
        const winnerImage = document.createElement('img');
        winnerImage.className = 'winner-image';
        // Get the player's image from the selection screen
        const playerElement = document.querySelector(`.player[data-id="${playerId}"] img`);
        if (playerElement) {
            winnerImage.src = playerElement.src;
        } else {
            // Fallback if player image not found
            winnerImage.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100" height="100"><path fill="gold" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>');
        }
        winnerImage.alt = winner + ' Victory';
        winnerContainer.appendChild(winnerImage);
        
        // Add champion title
        const winnerTitle = document.createElement('div');
        winnerTitle.className = 'winner-title';
        winnerTitle.textContent = 'CHAMPION';
        winnerContainer.appendChild(winnerTitle);
        
        // Add player name
        const winnerName = document.createElement('div');
        winnerName.className = 'winner-name';
        winnerName.textContent = winner;
        winnerName.style.fontSize = '32px';
        winnerName.style.color = 'white';
        winnerName.style.textShadow = '0 0 10px #ff0, 0 0 20px #ff0';
        winnerName.style.fontWeight = 'bold';
        winnerName.style.marginTop = '10px';
        winnerContainer.appendChild(winnerName);
        
        // Create fireworks and confetti
        const createEffects = () => {
            // Create fireworks (2-4 at a time)
            for (let i = 0; i < Math.floor(Math.random() * 3) + 2; i++) {
                createFirework(overlay);
            }
            
            // Create confetti (5-10 at a time)
            for (let i = 0; i < Math.floor(Math.random() * 6) + 5; i++) {
                createConfetti(overlay);
            }
        };
        
        // Initial burst of fireworks and confetti
        for (let i = 0; i < 15; i++) {
            createFirework(overlay);
        }
        
        for (let i = 0; i < 30; i++) {
            createConfetti(overlay);
        }
        
        // Continue creating effects for the duration of the celebration
        const effectsInterval = setInterval(createEffects, 300);
        
        // Remove celebration after 5 seconds
        setTimeout(() => {
            clearInterval(effectsInterval);
            document.body.removeChild(overlay);
            
            // Don't show alert - the celebration is enough
            gameIsRunning = false;
        }, 5000);
    }
    
    // Helper function to create a firework element
    function createFirework(container) {
        const fireworkElement = document.createElement('div');
        fireworkElement.className = 'firework';
        
        // Random position in the viewport
        const posX = Math.random() * 100; // random position as percentage of viewport width
        const posY = Math.random() * 100; // random position as percentage of viewport height
        
        // Random size between 10px and 30px
        const size = Math.random() * 20 + 10;
        
        // Random duration between 0.5s and 1.5s
        const duration = Math.random() * 1 + 0.5;
        
        // Random color
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#ff0088'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Set CSS variables for the animation
        fireworkElement.style.setProperty('--size', `${size}px`);
        fireworkElement.style.setProperty('--duration', `${duration}s`);
        fireworkElement.style.setProperty('--color', color);
        
        // Set position
        fireworkElement.style.left = `${posX}vw`;
        fireworkElement.style.top = `${posY}vh`;
        
        // Add to container
        container.appendChild(fireworkElement);
        
        // Remove after animation is complete
        setTimeout(() => {
            container.removeChild(fireworkElement);
        }, duration * 1000);
    }

    // Helper function to create a confetti element
    function createConfetti(container) {
        const confettiElement = document.createElement('div');
        confettiElement.className = 'confetti';
        
        // Random position at the top of the viewport
        const posX = Math.random() * 100; // random position as percentage of viewport width
        
        // Random size and shape
        const width = Math.random() * 8 + 5;
        const height = Math.random() * 8 + 5;
        const isSquare = Math.random() > 0.5;
        
        // Random rotation
        const rotation = Math.random() * 360;
        
        // Random duration between 2s and 5s
        const duration = Math.random() * 3 + 2;
        
        // Random color
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#ff0088', 
                        '#ffffff', '#ffcc00', '#00ccff', '#cc00ff'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Set CSS variables for the animation
        confettiElement.style.setProperty('--duration', `${duration}s`);
        confettiElement.style.setProperty('--color', color);
        
        // Set size and position
        confettiElement.style.width = `${isSquare ? width : width}px`;
        confettiElement.style.height = `${isSquare ? width : height}px`;
        confettiElement.style.left = `${posX}vw`;
        confettiElement.style.top = '0';
        confettiElement.style.transform = `rotate(${rotation}deg)`;
        
        // Add to container
        container.appendChild(confettiElement);
        
        // Remove after animation is complete
        setTimeout(() => {
            container.removeChild(confettiElement);
        }, duration * 1000);
    }
    
    // Update the score display
    function updateScores() {
        // Get score elements
        const scoreAPoints = document.getElementById('score-a-points');
        const scoreBPoints = document.getElementById('score-b-points');
        
        // Store previous values to detect changes
        const prevScoreA = scoreAPoints.textContent;
        const prevScoreB = scoreBPoints.textContent;
        
        // Set points using tennis ball emoji, making balls 8, 9 and 10 orange
        let scoreAHTML = '';
        for (let i = 0; i < playerAPoints; i++) {
            if (i === 7 || i === 8 || i === 9) {
                // Orange color for 8th, 9th and 10th balls
                scoreAHTML += '<span style="color: orange; filter: hue-rotate(45deg);">🎾</span>';
            } else {
                scoreAHTML += '🎾';
            }
        }
        
        let scoreBHTML = '';
        for (let i = 0; i < playerBPoints; i++) {
            if (i === 7 || i === 8 || i === 9) {
                // Orange color for 8th, 9th and 10th balls
                scoreBHTML += '<span style="color: orange; filter: hue-rotate(45deg);">🎾</span>';
            } else {
                scoreBHTML += '🎾';
            }
        }
        
        // Update HTML content instead of just text
        scoreAPoints.innerHTML = scoreAHTML;
        scoreBPoints.innerHTML = scoreBHTML;
        
        // Check for match point situation (9 points) and show animation only between points
        if ((playerAPoints === 9 || playerBPoints === 9) && !inPlay) {
            showMatchPointAnimation();
        } else {
            // Remove match point animation if no longer applicable or when point is in play
            const existingMatchPoint = document.getElementById('match-point-indicator');
            if (existingMatchPoint) {
                existingMatchPoint.remove();
            }
        }
        
        // Apply pulse animation when score changes
        if (scoreAPoints.innerHTML !== prevScoreA) {
            // Reset animation by removing and adding the class
            scoreAPoints.classList.remove('score-pulse');
            void scoreAPoints.offsetWidth; // Trigger reflow
            scoreAPoints.classList.add('score-pulse');
            
            // Highlight the row
            const rowA = scoreAPoints.parentElement;
            rowA.style.backgroundColor = 'rgba(33, 150, 243, 0.2)'; // Blue highlight
            setTimeout(() => {
                rowA.style.backgroundColor = '';
            }, 1000);
        }
        
        if (scoreBPoints.innerHTML !== prevScoreB) {
            // Reset animation by removing and adding the class
            scoreBPoints.classList.remove('score-pulse');
            void scoreBPoints.offsetWidth; // Trigger reflow
            scoreBPoints.classList.add('score-pulse');
            
            // Highlight the row
            const rowB = scoreBPoints.parentElement;
            rowB.style.backgroundColor = 'rgba(244, 67, 54, 0.2)'; // Red highlight
            setTimeout(() => {
                rowB.style.backgroundColor = '';
            }, 1000);
        }
        
        // Optional: Log scores to console for debugging
        console.log(`Score: ${scorePlayerAName.textContent} ${playerAPoints} | ${scorePlayerBName.textContent} ${playerBPoints}`);
    }
    
    // Function to show "Match Point" animation
    function showMatchPointAnimation() {
        // Remove existing match point indicator if it exists
        const existingMatchPoint = document.getElementById('match-point-indicator');
        if (existingMatchPoint) {
            existingMatchPoint.remove();
        }
        
        // Create match point indicator
        const matchPointIndicator = document.createElement('div');
        matchPointIndicator.id = 'match-point-indicator';
        matchPointIndicator.textContent = 'MATCH POINT';
        
        // Style the match point indicator
        matchPointIndicator.style.position = 'absolute';
        matchPointIndicator.style.top = '30%';
        matchPointIndicator.style.left = '50%';
        matchPointIndicator.style.transform = 'translate(-50%, -50%)';
        matchPointIndicator.style.fontFamily = 'Arial, sans-serif';
        matchPointIndicator.style.fontSize = '36px'; // Increased size
        matchPointIndicator.style.fontWeight = 'bold';
        matchPointIndicator.style.color = 'orange';
        matchPointIndicator.style.textShadow = '0 0 10px black, 0 0 20px black';
        matchPointIndicator.style.zIndex = '100';
        matchPointIndicator.style.opacity = '0';
        matchPointIndicator.style.animation = 'matchPointPulse 2s ease-in-out infinite';
        
        // Add keyframes if they don't exist already
        if (!document.getElementById('match-point-keyframes')) {
            const keyframes = document.createElement('style');
            keyframes.id = 'match-point-keyframes';
            keyframes.textContent = `
                @keyframes matchPointPulse {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(keyframes);
        }
        
        // Add the match point indicator to the court
        const courtWrapper = document.querySelector('.court-wrapper');
        courtWrapper.appendChild(matchPointIndicator);
        
        // Show match point indicator
        matchPointIndicator.style.display = 'block';
    }
    
    // Trigger crowd cheering animation
    function triggerCrowdCheering(player) {
        // Play the cheering sound
        if (cheerSound) {
            cheerSound.currentTime = 0;
            cheerSound.play().catch(e => console.log("Audio play failed:", e));
        }
        
        if (player === 'A') {
            // Remove any existing animation class
            crowdTop.classList.remove('crowd-cheering-a');
            // Trigger reflow to restart the animation
            void crowdTop.offsetWidth;
            // Add the animation class
            crowdTop.classList.add('crowd-cheering-a');
        } else if (player === 'B') {
            // Remove any existing animation class
            crowdBottom.classList.remove('crowd-cheering-b');
            // Trigger reflow to restart the animation
            void crowdBottom.offsetWidth;
            // Add the animation class
            crowdBottom.classList.add('crowd-cheering-b');
        }
    }

    // Info modal functionality
    const infoButton = document.getElementById('info-button');
    const infoModal = document.getElementById('info-modal');
    const closeButton = document.querySelector('.close-button');
    
    // Open modal when info button is clicked
    infoButton.addEventListener('click', () => {
        infoModal.style.display = 'block';
    });
    
    // Close modal when close button is clicked
    closeButton.addEventListener('click', () => {
        infoModal.style.display = 'none';
    });
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === infoModal) {
            infoModal.style.display = 'none';
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && infoModal.style.display === 'block') {
            infoModal.style.display = 'none';
        }
    });
    
    // Add keyboard shortcut for info modal
    document.addEventListener('keydown', (event) => {
        if (event.key === 'i' && gameStarted) {
            infoModal.style.display = 'block';
        }
    });

    // Apply difficulty settings based on selection
    function applyDifficultySettings() {
        switch(selectedDifficulty) {
            case 'beginner':
                computerDifficulty = 0.3; // Low accuracy
                computerReactionDelay = 30; // Slower reaction time
                console.log("Computer difficulty set to Beginner");
                // Don't add CPU label to player name
                break;
            case 'advanced':
                computerDifficulty = 0.6; // Medium accuracy
                computerReactionDelay = 15; // Medium reaction time
                console.log("Computer difficulty set to Advanced");
                // Don't add CPU label to player name
                break;
            case 'expert':
                computerDifficulty = 0.9; // High accuracy
                computerReactionDelay = 5; // Fast reaction time
                console.log("Computer difficulty set to Expert");
                // Don't add CPU label to player name
                break;
            default:
                computerDifficulty = 0.6; // Default to medium
                computerReactionDelay = 15;
                console.log("Computer difficulty set to default (Advanced)");
                // Don't add CPU label to player name
        }
    }

    // Function to update player faces based on gender
    function updatePlayerFaces() {
        const playerAFace = document.querySelector('.playerA .player-face');
        const playerBFace = document.querySelector('.playerB .player-face');
        
        if (playerAFace) {
            playerAFace.innerHTML = playerAGender === 'M' ? '👨' : '👩';
        }
        
        if (playerBFace) {
            playerBFace.innerHTML = playerBGender === 'M' ? '👨' : '👩';
        }
    }

    // Function to initialize the billboards with rotating ads
    function initializeBillboards() {
        // Clear any existing intervals
        billboardIntervals.forEach(interval => clearInterval(interval));
        billboardIntervals = [];
        
        // Group billboards 
        const allBillboards = [
            billboardTop1, 
            billboardTop2, 
            billboardBottom1, 
            billboardBottom2
        ];
        
        // Initialize all billboards with the same starting image (Velodrome)
        allBillboards.forEach(billboard => {
            setupBillboard(billboard, 'billboard pictures/Velodrome.png');
        });
        
        // Set up rotation for all billboards - cycle through all images
        let adIndex = 0;
        const billboardInterval = setInterval(() => {
            // Always rotate through all available images in sequence
            adIndex = (adIndex + 1) % advertisingImages.length;
            
            // Update all billboards with the same image
            allBillboards.forEach(billboard => {
                rotateBillboardAd(billboard, advertisingImages[adIndex]);
            });
        }, 7000); // Change every 7 seconds
        
        // Store interval for cleanup
        billboardIntervals.push(billboardInterval);
    }
    
    // Function to set up a billboard with an initial image
    function setupBillboard(billboard, imageUrl) {
        // Clear any existing content
        billboard.innerHTML = '';
        
        // Create and add the image
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = "Advertisement";
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        
        // Special styling for Ethereum image
        if (imageUrl.includes('Ethereum.png')) {
            img.style.objectPosition = 'center center';
            img.style.objectFit = 'cover';
            img.style.transform = 'scale(1.05)'; // Slightly enlarge to cover edges
        }
        
        billboard.appendChild(img);
    }
    
    // Function to rotate ads with a fade effect
    function rotateBillboardAd(billboard, newImageUrl) {
        // Create the new image that will replace any existing ones
        const newImg = document.createElement('img');
        newImg.src = newImageUrl;
        newImg.alt = "Advertisement";
        newImg.style.opacity = 0; // Start invisible
        newImg.style.width = '100%';
        newImg.style.height = '100%';
        newImg.style.objectFit = 'cover';
        
        // Special styling for Ethereum image
        if (newImageUrl.includes('Ethereum.png')) {
            newImg.style.objectPosition = 'center center';
            newImg.style.objectFit = 'cover';
            newImg.style.transform = 'scale(1.05)'; // Slightly enlarge to cover edges
        }
        
        // Remove all existing images first
        const existingImages = billboard.querySelectorAll('img');
        if (existingImages.length > 0) {
            // Add fading class to all existing images
            existingImages.forEach(img => {
                img.classList.add('ad-fading');
            });
            
            // Add the new image
            billboard.appendChild(newImg);
            
            // Fade in the new image
            setTimeout(() => {
                newImg.style.opacity = 1;
                
                // Remove all old images after transition completes
                setTimeout(() => {
                    existingImages.forEach(img => {
                        if (img && img.parentNode === billboard) {
                            billboard.removeChild(img);
                        }
                    });
                }, 1000);
            }, 50);
        } else {
            // If no existing images, just add the new one and make it visible
            billboard.appendChild(newImg);
            setTimeout(() => {
                newImg.style.opacity = 1;
            }, 50);
        }
    }

    // Function to update player positions
    function updatePlayerPositions() {
        playerA.style.top = `${playerAY}%`;
        playerB.style.top = `${playerBY}%`;
        console.log("Updated player positions:", playerAY, playerBY);
    }

    // Add keyboard shortcut for changing computer difficulty
    document.addEventListener('keydown', (e) => {
        // 1, 2, 3 keys for different difficulty levels
        if (!gameScreen.classList.contains('hidden') && isComputerControlled) {
            if (e.key === '1') {
                computerDifficulty = 0.3; // Easy
                computerReactionDelay = 30;
                console.log("Computer difficulty set to Beginner");
                // Update player name with new difficulty
                updateCPUName('Beginner');
            } else if (e.key === '2') {
                computerDifficulty = 0.6; // Medium
                computerReactionDelay = 15;
                console.log("Computer difficulty set to Advanced");
                // Update player name with new difficulty
                updateCPUName('Advanced');
            } else if (e.key === '3') {
                computerDifficulty = 0.9; // Hard
                computerReactionDelay = 5;
                console.log("Computer difficulty set to Expert");
                // Update player name with new difficulty
                updateCPUName('Expert');
            }
        }
    });

    // Helper function to update CPU player name with difficulty
    function updateCPUName(difficulty) {
        // Get the base name without CPU label
        const baseName = scorePlayerBName.textContent.split(' (CPU')[0];
        // Set just the base name without any CPU difficulty label
        scorePlayerBName.textContent = baseName;
    }

    // Add bounce animation when player A moves
    document.addEventListener('keydown', (e) => {
        if (!gameScreen.classList.contains('hidden')) {
            if (e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S') {
                addBounceAnimation(playerA);
            }
        }
    });
}); 
