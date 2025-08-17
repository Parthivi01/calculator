// DOM Elements
let display = document.getElementById('display');
let history = document.getElementById('history');
let scientificPanel = document.getElementById('scientificPanel');
let mainMenu = document.getElementById('mainMenu');
let calculatorContainer = document.getElementById('calculatorContainer');
let calculatorTitle = document.getElementById('calculatorTitle');
let leftParen = document.getElementById('leftParen');
let rightParen = document.getElementById('rightParen');
let voiceBtn = document.getElementById('voiceBtn');
let speakBtn = document.getElementById('speakBtn');
let voiceStatus = document.getElementById('voiceStatus');

// State variables
let currentMode = 'basic';
let shouldResetDisplay = false;
let lastResult = null;

// Voice recognition variables
let recognition = null;
let isListening = false;
let speechSynthesis = window.speechSynthesis;

// Memory and History variables
let memoryValue = 0;
let calculationHistory = [];
let isHistoryVisible = false;

// Theme variables
let currentTheme = 'default';
let isThemeSelectorVisible = false;

// Visual effects variables
let soundEnabled = true;
let particles = [];
let particleCanvas = null;
let particleCtx = null;

// Initialize display when calculator is shown
function initializeDisplay() {
    if (display) {
        display.value = '0';
    }
    initializeVoiceRecognition();
    loadMemoryAndHistory();
    initializeParticles();
}

// Load saved memory and history from localStorage
function loadMemoryAndHistory() {
    const savedMemory = localStorage.getItem('calculatorMemory');
    const savedHistory = localStorage.getItem('calculationHistory');
    const savedTheme = localStorage.getItem('calculatorTheme');

    if (savedMemory) {
        memoryValue = parseFloat(savedMemory);
        updateMemoryDisplay();
    }

    if (savedHistory) {
        calculationHistory = JSON.parse(savedHistory);
        updateHistoryDisplay();
    }

    if (savedTheme) {
        setTheme(savedTheme);
    }
}

// Save memory and history to localStorage
function saveMemoryAndHistory() {
    localStorage.setItem('calculatorMemory', memoryValue.toString());
    localStorage.setItem('calculationHistory', JSON.stringify(calculationHistory));
}

// Voice Recognition Setup
function initializeVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = function() {
            isListening = true;
            voiceBtn.classList.add('listening');
            voiceStatus.style.display = 'block';
            voiceStatus.innerHTML = '<span class="listening-indicator">🎤 Listening... Speak your calculation</span>';
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript.toLowerCase();
            processVoiceInput(transcript);
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            stopListening();
            showVoiceMessage('❌ Voice recognition error. Please try again.');
        };

        recognition.onend = function() {
            stopListening();
        };
    } else {
        // Hide voice buttons if not supported
        if (voiceBtn) voiceBtn.style.display = 'none';
        if (speakBtn) speakBtn.style.display = 'none';
    }
}

function toggleVoiceInput() {
    if (!recognition) {
        showVoiceMessage('❌ Voice recognition not supported in this browser');
        return;
    }

    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function stopListening() {
    isListening = false;
    if (voiceBtn) voiceBtn.classList.remove('listening');
    if (voiceStatus) voiceStatus.style.display = 'none';
}

function showVoiceMessage(message) {
    if (voiceStatus) {
        voiceStatus.style.display = 'block';
        voiceStatus.innerHTML = `<span class="listening-indicator">${message}</span>`;
        setTimeout(() => {
            voiceStatus.style.display = 'none';
        }, 3000);
    }
}

function processVoiceInput(transcript) {
    console.log('Voice input:', transcript);

    // Convert spoken words to mathematical expressions
    let expression = transcript
        .replace(/\bplus\b|\badd\b/g, '+')
        .replace(/\bminus\b|\bsubtract\b/g, '-')
        .replace(/\btimes\b|\bmultiplied by\b|\bmultiply\b/g, '*')
        .replace(/\bdivided by\b|\bdivide\b/g, '/')
        .replace(/\bsquare root of\b|\bsqrt\b/g, 'sqrt(')
        .replace(/\bsine of\b|\bsin\b/g, 'sin(')
        .replace(/\bcosine of\b|\bcos\b/g, 'cos(')
        .replace(/\btangent of\b|\btan\b/g, 'tan(')
        .replace(/\blog of\b|\blogarithm of\b/g, 'log(')
        .replace(/\bnatural log of\b|\bln of\b/g, 'ln(')
        .replace(/\bpi\b/g, 'π')
        .replace(/\be\b(?!\w)/g, 'e')
        .replace(/\bto the power of\b|\bpower\b|\braise to\b/g, '^')
        .replace(/\bfactorial\b/g, '!')
        .replace(/\bpercent\b|\bpercentage\b/g, '%')
        .replace(/\bopen parenthesis\b|\bopen bracket\b/g, '(')
        .replace(/\bclose parenthesis\b|\bclose bracket\b/g, ')')
        .replace(/\bpoint\b|\bdot\b/g, '.')
        .replace(/\bequals\b|\bcalculate\b|\bcompute\b/g, '')
        .replace(/\bzero\b/g, '0')
        .replace(/\bone\b/g, '1')
        .replace(/\btwo\b/g, '2')
        .replace(/\bthree\b/g, '3')
        .replace(/\bfour\b/g, '4')
        .replace(/\bfive\b/g, '5')
        .replace(/\bsix\b/g, '6')
        .replace(/\bseven\b/g, '7')
        .replace(/\beight\b/g, '8')
        .replace(/\bnine\b/g, '9')
        .replace(/\s+/g, ''); // Remove spaces

    // Handle special commands
    if (transcript.includes('clear') || transcript.includes('reset')) {
        clearDisplay();
        showVoiceMessage('✅ Calculator cleared');
        return;
    }

    if (expression) {
        display.value = expression;
        showVoiceMessage(`✅ Input: ${expression}`);

        // Auto-calculate if it seems complete
        if (!expression.includes('(') || (expression.split('(').length === expression.split(')').length)) {
            setTimeout(() => {
                calculate();
                if (lastResult !== null) {
                    speakResult();
                }
            }, 1000);
        }
    } else {
        showVoiceMessage('❌ Could not understand. Try saying something like "two plus three"');
    }
}

function speakResult() {
    if (!speechSynthesis) {
        showVoiceMessage('❌ Speech synthesis not supported');
        return;
    }

    const result = display.value;
    if (result && result !== 'Error') {
        const utterance = new SpeechSynthesisUtterance(`The result is ${result}`);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.8;

        speechSynthesis.speak(utterance);
        showVoiceMessage('🔊 Speaking result...');
    } else {
        const utterance = new SpeechSynthesisUtterance('Error in calculation');
        speechSynthesis.speak(utterance);
    }
}

// Mathematical constants
const CONSTANTS = {
    'π': Math.PI,
    'e': Math.E
};

// Scientific functions
const FUNCTIONS = {
    'sin': Math.sin,
    'cos': Math.cos,
    'tan': Math.tan,
    'asin': Math.asin,
    'acos': Math.acos,
    'atan': Math.atan,
    'log': Math.log10,
    'ln': Math.log,
    'sqrt': Math.sqrt,
    'abs': Math.abs
};

// Navigation functions
function showCalculator(mode) {
    currentMode = mode;
    mainMenu.style.display = 'none';
    calculatorContainer.style.display = 'flex';

    if (mode === 'scientific') {
        calculatorTitle.textContent = 'Scientific Calculator';
        scientificPanel.style.display = 'grid';
        leftParen.style.display = 'block';
        rightParen.style.display = 'block';
    } else {
        calculatorTitle.textContent = 'Basic Calculator';
        scientificPanel.style.display = 'none';
        leftParen.style.display = 'none';
        rightParen.style.display = 'none';
    }

    initializeDisplay();

    // Add button effects after calculator is shown
    setTimeout(addButtonEffects, 100);
}

function showMainMenu() {
    mainMenu.style.display = 'block';
    calculatorContainer.style.display = 'none';
    clearDisplay();
}

function appendToDisplay(value) {
    if (shouldResetDisplay) {
        display.value = '';
        shouldResetDisplay = false;
    }

    if (display.value === '0' && value !== '.') {
        display.value = value;
    } else {
        display.value += value;
    }
}

function appendFunction(func) {
    if (shouldResetDisplay) {
        display.value = '';
        shouldResetDisplay = false;
    }

    if (display.value === '0') {
        display.value = func;
    } else {
        display.value += func;
    }
}

function appendConstant(constant) {
    if (shouldResetDisplay) {
        display.value = '';
        shouldResetDisplay = false;
    }

    if (display.value === '0') {
        display.value = constant;
    } else {
        display.value += constant;
    }
}

function appendOperator(op) {
    if (shouldResetDisplay) {
        shouldResetDisplay = false;
    }

    display.value += op;
}

function clearDisplay() {
    if (display) {
        display.value = '0';
    }
    if (history) {
        history.textContent = '';
    }
    shouldResetDisplay = false;
    lastResult = null;
}

function clearEntry() {
    if (display) {
        display.value = '0';
    }
}

function deleteLast() {
    if (display && display.value.length > 1) {
        display.value = display.value.slice(0, -1);
    } else if (display) {
        display.value = '0';
    }
}

function calculate() {
    try {
        let expression = display.value;
        let originalExpression = expression;

        // Store the expression in history
        history.textContent = originalExpression + ' =';

        // Replace display symbols with JavaScript operators
        expression = expression.replace(/×/g, '*');
        expression = expression.replace(/÷/g, '/');
        expression = expression.replace(/\^/g, '**');

        // Replace constants
        for (let constant in CONSTANTS) {
            expression = expression.replace(new RegExp(constant, 'g'), CONSTANTS[constant]);
        }

        // Handle factorial
        expression = expression.replace(/(\d+(?:\.\d+)?)!/g, (match, num) => {
            return factorial(parseFloat(num));
        });

        // Handle percentage
        expression = expression.replace(/(\d+(?:\.\d+)?)%/g, (match, num) => {
            return parseFloat(num) / 100;
        });

        // Process scientific functions
        expression = processScientificFunctions(expression);

        // Validate and calculate
        if (isValidExpression(expression)) {
            let result = eval(expression);

            // Handle special cases
            if (!isFinite(result)) {
                display.value = 'Error';
                shouldResetDisplay = true;
                return;
            }

            // Format the result
            lastResult = result;
            if (Math.abs(result) < 1e-10) {
                result = 0; // Handle floating point precision issues
            }

            let formattedResult;
            if (result % 1 === 0 && Math.abs(result) < 1e15) {
                formattedResult = result.toString();
            } else {
                formattedResult = parseFloat(result.toPrecision(12)).toString();
            }

            display.value = formattedResult;

            // Add to calculation history
            addToHistory(originalExpression, formattedResult);

            shouldResetDisplay = true;
        } else {
            display.value = 'Error';
            shouldResetDisplay = true;
        }
    } catch (error) {
        display.value = 'Error';
        shouldResetDisplay = true;
    }
}

function processScientificFunctions(expression) {
    // Process functions that need special handling
    for (let func in FUNCTIONS) {
        const regex = new RegExp(`${func}\\(([^)]+)\\)`, 'g');
        expression = expression.replace(regex, (match, arg) => {
            try {
                let argValue = eval(arg);
                let result = FUNCTIONS[func](argValue);
                return result;
            } catch (e) {
                return 'NaN';
            }
        });
    }
    return expression;
}

function factorial(n) {
    if (n < 0 || n !== Math.floor(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity; // Prevent overflow

    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function isValidExpression(expression) {
    // More comprehensive validation for scientific calculator
    const validChars = /^[0-9+\-*/.()e\s]+$/;
    if (!validChars.test(expression)) {
        return false;
    }

    // Check for balanced parentheses
    let parenthesesCount = 0;
    for (let char of expression) {
        if (char === '(') parenthesesCount++;
        if (char === ')') parenthesesCount--;
        if (parenthesesCount < 0) return false;
    }

    return parenthesesCount === 0;
}

// Enhanced keyboard support for scientific calculator
document.addEventListener('keydown', function(event) {
    const key = event.key;

    if (key >= '0' && key <= '9') {
        appendToDisplay(key);
    } else if (key === '.') {
        appendToDisplay('.');
    } else if (key === '+') {
        appendToDisplay('+');
    } else if (key === '-') {
        appendToDisplay('-');
    } else if (key === '*') {
        appendToDisplay('*');
    } else if (key === '/') {
        event.preventDefault(); // Prevent browser search
        appendToDisplay('/');
    } else if (key === '(' || key === ')') {
        appendToDisplay(key);
    } else if (key === '^') {
        appendOperator('^');
    } else if (key === '%') {
        appendOperator('%');
    } else if (key === 'Enter' || key === '=') {
        calculate();
    } else if (key === 'Escape') {
        clearDisplay();
    } else if (key === 'Backspace') {
        deleteLast();
    } else if (key.toLowerCase() === 's' && event.ctrlKey) {
        event.preventDefault();
        toggleMode();
    }
});

// Enhanced appendToDisplay with decimal point validation
function appendToDisplay(value) {
    if (shouldResetDisplay) {
        display.value = '';
        shouldResetDisplay = false;
    }

    // Prevent multiple decimal points in a single number
    if (value === '.') {
        const parts = display.value.split(/[+\-*/()^%]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) {
            return;
        }
    }

    if (display.value === '0' && value !== '.') {
        display.value = value;
    } else {
        display.value += value;
    }
}

// Memory Functions
function memoryClear() {
    memoryValue = 0;
    updateMemoryDisplay();
    saveMemoryAndHistory();
}

function memoryRecall() {
    display.value = memoryValue.toString();
    shouldResetDisplay = true;
}

function memoryAdd() {
    const currentValue = parseFloat(display.value) || 0;
    memoryValue += currentValue;
    updateMemoryDisplay();
    saveMemoryAndHistory();
}

function memorySubtract() {
    const currentValue = parseFloat(display.value) || 0;
    memoryValue -= currentValue;
    updateMemoryDisplay();
    saveMemoryAndHistory();
}

function memoryStore() {
    memoryValue = parseFloat(display.value) || 0;
    updateMemoryDisplay();
    saveMemoryAndHistory();
}

function updateMemoryDisplay() {
    const memoryDisplay = document.getElementById('memoryValue');
    if (memoryDisplay) {
        memoryDisplay.textContent = memoryValue.toString();
    }
}

// History Functions
function addToHistory(expression, result) {
    const historyItem = {
        expression: expression,
        result: result,
        timestamp: new Date().toLocaleTimeString()
    };

    calculationHistory.unshift(historyItem); // Add to beginning

    // Keep only last 50 calculations
    if (calculationHistory.length > 50) {
        calculationHistory = calculationHistory.slice(0, 50);
    }

    updateHistoryDisplay();
    saveMemoryAndHistory();
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    if (calculationHistory.length === 0) {
        historyList.innerHTML = '<p class="no-history">No calculations yet</p>';
        return;
    }

    historyList.innerHTML = calculationHistory.map(item => `
        <div class="history-item" onclick="useHistoryItem('${item.expression}', '${item.result}')">
            <div class="history-expression">${item.expression} = ${item.result}</div>
            <div class="history-timestamp">${item.timestamp}</div>
        </div>
    `).join('');
}

function useHistoryItem(expression, result) {
    display.value = result;
    shouldResetDisplay = true;
}

function clearHistory() {
    calculationHistory = [];
    updateHistoryDisplay();
    saveMemoryAndHistory();
}

function toggleHistory() {
    const historyPanel = document.getElementById('historyPanel');
    const memoryPanel = document.getElementById('memoryPanel');
    const themePanel = document.getElementById('themePanel');

    if (!historyPanel || !memoryPanel) return;

    // Hide theme panel if visible
    if (isThemeSelectorVisible) {
        themePanel.style.display = 'none';
        isThemeSelectorVisible = false;
    }

    isHistoryVisible = !isHistoryVisible;

    if (isHistoryVisible) {
        historyPanel.style.display = 'block';
        memoryPanel.style.display = 'block';
        updateHistoryDisplay();
        updateMemoryDisplay();
    } else {
        historyPanel.style.display = 'none';
        memoryPanel.style.display = 'none';
    }
}

// Theme Functions
function toggleThemeSelector() {
    const themePanel = document.getElementById('themePanel');
    const historyPanel = document.getElementById('historyPanel');
    const memoryPanel = document.getElementById('memoryPanel');

    if (!themePanel) return;

    // Hide history panel if visible
    if (isHistoryVisible) {
        historyPanel.style.display = 'none';
        memoryPanel.style.display = 'none';
        isHistoryVisible = false;
    }

    isThemeSelectorVisible = !isThemeSelectorVisible;

    if (isThemeSelectorVisible) {
        themePanel.style.display = 'block';
        updateThemeSelector();
    } else {
        themePanel.style.display = 'none';
    }
}

function setTheme(themeName) {
    currentTheme = themeName;
    document.body.setAttribute('data-theme', themeName);

    // Save theme preference
    localStorage.setItem('calculatorTheme', themeName);

    // Update theme selector
    updateThemeSelector();
}

function updateThemeSelector() {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        if (option.dataset.theme === currentTheme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// Visual Effects and Sound Functions
function initializeParticles() {
    particleCanvas = document.getElementById('particleCanvas');
    if (!particleCanvas) return;

    particleCtx = particleCanvas.getContext('2d');
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    animateParticles();
}

function resizeCanvas() {
    if (!particleCanvas) return;
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}

function createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            decay: Math.random() * 0.02 + 0.01,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

function animateParticles() {
    if (!particleCtx) return;

    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= particle.decay;
        particle.vy += 0.1; // gravity

        if (particle.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        particleCtx.save();
        particleCtx.globalAlpha = particle.life;
        particleCtx.fillStyle = particle.color;
        particleCtx.beginPath();
        particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        particleCtx.fill();
        particleCtx.restore();
    }

    requestAnimationFrame(animateParticles);
}

function playSound(type) {
    if (!soundEnabled) return;

    // Create audio context for sound synthesis
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    let frequency, duration;

    switch (type) {
        case 'number':
            frequency = 800;
            duration = 0.1;
            break;
        case 'operator':
            frequency = 600;
            duration = 0.15;
            break;
        case 'equals':
            frequency = 1000;
            duration = 0.3;
            break;
        case 'clear':
            frequency = 400;
            duration = 0.2;
            break;
        default:
            frequency = 700;
            duration = 0.1;
    }

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function addButtonEffects() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = button.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            // Add visual effects based on button type
            if (button.classList.contains('number')) {
                button.classList.add('number-clicked');
                createParticles(x, y, '#3498db', 6);
                playSound('number');
                setTimeout(() => button.classList.remove('number-clicked'), 300);
            } else if (button.classList.contains('operator')) {
                button.classList.add('operator-clicked');
                createParticles(x, y, '#e67e22', 8);
                playSound('operator');
                setTimeout(() => button.classList.remove('operator-clicked'), 400);
            } else if (button.classList.contains('equals')) {
                button.classList.add('equals-clicked');
                createParticles(x, y, '#27ae60', 12);
                playSound('equals');
                setTimeout(() => button.classList.remove('equals-clicked'), 500);

                // Add calculator pulse effect
                const calculator = document.querySelector('.calculator');
                if (calculator) {
                    calculator.classList.add('calculating');
                    setTimeout(() => calculator.classList.remove('calculating'), 600);
                }
            } else if (button.classList.contains('clear')) {
                button.classList.add('clicked');
                createParticles(x, y, '#e74c3c', 10);
                playSound('clear');
                setTimeout(() => button.classList.remove('clicked'), 200);
            } else {
                button.classList.add('clicked');
                createParticles(x, y, '#9b59b6', 5);
                playSound('default');
                setTimeout(() => button.classList.remove('clicked'), 200);
            }
        });
    });
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundIcon = document.getElementById('soundIcon');
    const soundToggle = document.getElementById('soundToggle');

    if (soundEnabled) {
        soundIcon.textContent = '🔊';
        soundToggle.classList.remove('muted');
    } else {
        soundIcon.textContent = '🔇';
        soundToggle.classList.add('muted');
    }

    localStorage.setItem('soundEnabled', soundEnabled);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Show main menu by default
    if (mainMenu) {
        mainMenu.style.display = 'block';
    }
    if (calculatorContainer) {
        calculatorContainer.style.display = 'none';
    }

    // Load sound preference
    const savedSound = localStorage.getItem('soundEnabled');
    if (savedSound !== null) {
        soundEnabled = savedSound === 'true';
        toggleSound();
        toggleSound(); // Toggle twice to set correct state
    }

    // Initialize particles
    initializeParticles();
});
