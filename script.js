// Constants
const MAX_LIVES = 3;
const ROUND_DELAY_MS = 1000;
const DEBUG = false;

// Game state
let counties = [];
let currentCounty = null;
let score = 0;
let currentStreak = 0;
let highScore = localStorage.getItem('mnCountiesHighScore') || 0;
let lives = MAX_LIVES;
let gameActive = true;
let previousCounty = null;


// DOM elements
const mapContainer = document.getElementById('map-container');
const optionsContainer = document.getElementById('options-container');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const livesElement = document.getElementById('lives');
const gameMessageElement = document.getElementById('game-message');
const newGameBtn = document.getElementById('new-game-btn');

// Update display
function updateStats() {
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    livesElement.textContent = lives;
}

// Initialize high score from localStorage
highScoreElement.textContent = highScore;

// Fetch county data and initialize game
async function loadCountyData() {
    try {
        const response = await fetch('minnesota_counties.json');
        counties = await response.json();
        shuffleArray(counties);
        
        // Create SVG element and add counties
        createSvgMap();

        counties.forEach((county, index) => {
            county.status = (index < 8) ? 'active' : 'pending';
            county.streak = 0;
        });

        // Start the game
        startNewRound();

    } catch (error) {
        console.error('Error loading county data:', error);
        mapContainer.innerHTML = '<p>Error loading county data. Please refresh the page.</p>';
    }
}

// Create SVG map from county data
function createSvgMap() {
    // Create SVG container
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('viewBox', '-13347,-36535 57464,65388');
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // Add each county path
    counties.forEach(county => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('id', county.id);
        path.setAttribute('d', county.path);
        path.setAttribute('class', 'county');
        path.setAttribute('data-county', county.id);
        svgEl.appendChild(path);
    });
    
    mapContainer.appendChild(svgEl);
}

// Start a new round
function startNewRound() {
    if (!gameActive) return;
    
    // Clear previous highlights and options
    clearHighlights();
    optionsContainer.innerHTML = '';
    gameMessageElement.textContent = '';
    
    // Randomly select a county that is active
    while (true) {
        const randomIndex = Math.floor(Math.random() * counties.length);
        currentCounty = counties[randomIndex];
        if (currentCounty.status == 'active' && currentCounty !== previousCounty) {
            previousCounty = currentCounty;
            break;
        }
    }

    if (DEBUG) {
        console.log('Current County:', currentCounty.id);
    }
    
    // Highlight the selected county
    const countyElement = document.getElementById(currentCounty.id);
    if (countyElement) {
        countyElement.classList.add('highlight');
    }
    
    // Generate options (1 correct, 3 random)
    generateOptions();
}

// Clear all highlights
function clearHighlights() {
    document.querySelectorAll('.county').forEach(county => {
        county.classList.remove('highlight');
    });
}

// Generate answer options
function generateOptions() {
    // Create array with correct answer
    const correctCountyName = currentCounty.id;
    const options = [correctCountyName];
    
    // Add 3 random wrong options
    const activeCounties = counties.filter(c => c.status == 'active' && c !== currentCounty);
    while (options.length < 4) {
        const randomCounty = activeCounties[Math.floor(Math.random() * activeCounties.length)].id;
        // Ensure no duplicates
        if (!options.includes(randomCounty)) {
            options.push(randomCounty);
        }
    }
    
    // Shuffle options
    shuffleArray(options);
    
    // Create buttons for each option
    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.className = 'option-btn';
        button.addEventListener('click', () => checkAnswer(option));
        optionsContainer.appendChild(button);
    });
}

// Check if answer is correct
function checkAnswer(selectedOption) {
    if (!gameActive) return;
    
    const buttons = document.querySelectorAll('.option-btn');
    const isCorrect = selectedOption === currentCounty.id;
    
    // Disable all buttons after selection
    buttons.forEach(button => {
        button.disabled = true;
        if (button.textContent === currentCounty.id) {
            button.classList.add('correct');
        } else if (button.textContent === selectedOption && !isCorrect) {
            button.classList.add('incorrect');
        }
    });
    
    // Update score or lives
    if (isCorrect) {
        score += 100;
        gameMessageElement.textContent = 'Correct!';
        
        // Update high score if needed
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('mnCountiesHighScore', highScore);
        }
        currentCounty.streak++;
        currentStreak++;
        if (currentStreak % 5 === 0 && lives < MAX_LIVES) {
            lives++;
            gameMessageElement.textContent += ' +1 life!';
        }
        if (currentCounty.streak === 3) {
            currentCounty.status = 'mastered';
            currentCounty.streak = 0;
            // Choose a random inactive county and make it active
            const pendingCounties = counties.filter(c => c.status === 'pending');
            if (pendingCounties.length > 0) {
                const randomCounty = pendingCounties[Math.floor(Math.random() * pendingCounties.length)];
                randomCounty.status = 'active';
            } else {
                const masteredCounties = counties.filter(c => c.status === 'mastered');
                if (masteredCounties.length > 0) {
                    const randomCounty = masteredCounties[Math.floor(Math.random() * masteredCounties.length)];
                    randomCounty.status = 'active';
                }
            }
        }
    } else {
        lives--;
        gameMessageElement.textContent = `Incorrect! That was ${currentCounty.id}.`;
        currentCounty.streak = 0;
        currentStreak = 0;
        
        // Check if game over
        if (lives <= 0) {
            endGame();
            updateStats();
            return;
        }
    }
    
    // Update display
    updateStats();
    
    // Start new round after delay
    setTimeout(startNewRound, ROUND_DELAY_MS);
}

// End the game
function endGame() {
    gameActive = false;
    // gameMessageElement.textContent = '';
    
    const gameOverMessage = document.createElement('div');
    gameOverMessage.className = 'game-over';
    gameOverMessage.innerHTML = `
        <h2>Game Over!</h2>
        <p>Your final score: ${score}</p>
        <p>High score: ${highScore}</p>
    `;
    
    document.querySelector('.game-container').appendChild(gameOverMessage);
}

// Start a new game
function newGame() {
    // Remove game over message if present
    const gameOverMessage = document.querySelector('.game-over');
    if (gameOverMessage) {
        gameOverMessage.remove();
    }
    
    // Reset game state
    score = 0;
    lives = MAX_LIVES;
    gameActive = true;
    
    // Update display
    updateStats();
    
    // Start new round
    startNewRound();
}

// Utility function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Event listeners
newGameBtn.addEventListener('click', newGame);

// Initialize game
loadCountyData();
