// --- 1. DOM ELEMENTS ---
const menuScreen = document.getElementById('menu-screen');
const terminalScreen = document.getElementById('terminal-screen');
const btnStart = document.getElementById('btn-start');
const playerInput = document.getElementById('player-input');
const terminalOutput = document.getElementById('terminal-output');
const menuOptions = document.getElementById('menu-options');
const manualSection = document.getElementById('manual-section');
const btnManual = document.getElementById('btn-manual');
const btnBack = document.getElementById('btn-back');

const signalPulse = document.getElementById('signal-pulse');
const signalTimer = document.getElementById('signal-timer');
const depthMeter = document.getElementById('depth-meter');

// --- 2. AUDIO ELEMENTS ---
const audioMenu = document.getElementById('audio-menu');
const audioDrone = document.getElementById('audio-drone');
const audioSuccess = document.getElementById('audio-success');
const audioError = document.getElementById('audio-error');
const audioKey = document.getElementById('audio-key');

audioMenu.volume = 0.5;
audioDrone.volume = 0.15;
audioSuccess.volume = 0.7;
audioError.volume = 0.7;
audioKey.volume = 0.3;

// --- 3. GAME DATA ---
const gameLevels = [
    { word: "BREACH", hint: "1 syllable", text: "> INITIATING DECRYPTION... SIGNAL INTERCEPTED." },
    { word: "SEISMIC", hint: "SEIS - MIC (2 syllables)", text: "> ANOMALY DETECTED AT SECTOR 4 QUARRY." },
    { word: "TRENCH", hint: "1 syllable", text: "> EXCAVATION TEAMS HAVE BROKEN THROUGH THE BEDROCK." },
    { word: "OBSIDIAN", hint: "OB - SID - I - AN (4 syllables)", text: "> WE HIT A LAYER OF UNKNOWN BLACK GLASS." },
    { word: "RESONANCE", hint: "RES - O - NANCE (3 syllables)", text: "> IT IS EMITTING A LOW FREQUENCY PULSE." },
    { word: "CHTHONIC", hint: "CHTHON - IC (2 syllables)", text: "> IT IS WAKING UP. EVACUATE IMMEDIATELY." }
];

let currentLevel = 0;
let isTyping = false;
let timeLeft = 30;
let currentDepth = 485;
let timerInterval;
let visualizerInterval;

// --- 4. INITIALIZATION & MENU LOGIC ---
document.body.addEventListener('click', () => {
    if (menuScreen.classList.contains('active') && audioMenu.paused) {
        audioMenu.play();
    }
}, { once: true });

btnManual.addEventListener('click', () => {
    menuOptions.classList.add('hidden');
    manualSection.classList.remove('hidden');
});

btnBack.addEventListener('click', () => {
    manualSection.classList.add('hidden');
    menuOptions.classList.remove('hidden');
});

btnStart.addEventListener('click', startGame);

function startGame() {
    menuScreen.classList.remove('active');
    menuScreen.classList.add('hidden');
    terminalScreen.classList.remove('hidden');
    terminalScreen.classList.add('active');

    audioMenu.pause();
    audioDrone.play();

    depthMeter.innerText = `${currentDepth} M`;
    playerInput.focus();
    setTimeout(loadNextWord, 1500);
}

// --- 5. CORE GAME LOOP & TIMER ---
function loadNextWord() {
    if (currentLevel >= gameLevels.length) {
        printToTerminal("> ALL SIGNALS DECRYPTED. CONNECTION TERMINATED.");
        audioDrone.pause();
        clearInterval(timerInterval);
        signalTimer.innerText = "--%";
        terminalScreen.classList.remove('red-alert-active');
        return;
    }

    printToTerminal("> RECEIVING ENCRYPTED TRANSMISSION...");

    setTimeout(() => {
        playTTS(gameLevels[currentLevel].word);
        startTimer(30);
    }, 1500);
}

function startTimer(duration) {
    clearInterval(timerInterval);
    timeLeft = duration;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            triggerError("> SIGNAL LOST. REESTABLISHING CONNECTION...");
        }
    }, 1000);
}

function updateTimerDisplay() {
    const percent = Math.floor((timeLeft / 30) * 100);
    signalTimer.innerText = `${Math.max(0, percent)}%`;

    // EMERGENCY ALARM LOGIC
    if (percent <= 30) {
        signalTimer.classList.add('error-text');
        terminalScreen.classList.add('red-alert-active');
    } else {
        signalTimer.classList.remove('error-text');
        terminalScreen.classList.remove('red-alert-active');
    }
}

// --- 6. TTS & AUDIO VISUALIZER ---
function playTTS(word) {
    const utterance = new SpeechSynthesisUtterance(word);
    const voices = window.speechSynthesis.getVoices();
    const ukVoice = voices.find(voice => voice.lang === 'en-GB');
    if (ukVoice) utterance.voice = ukVoice;

    utterance.rate = 0.8;
    utterance.pitch = 0.9;

    utterance.onstart = () => {
        let frames = ['[ |||     ]', '[  |||    ]', '[   |||   ]', '[    |||  ]', '[     ||| ]', '[    |||  ]', '[   |||   ]', '[  |||    ]'];
        let i = 0;
        visualizerInterval = setInterval(() => {
            signalPulse.innerText = `${frames[i]}`;
            i = (i + 1) % frames.length;
        }, 100);
    };

    utterance.onend = () => {
        clearInterval(visualizerInterval);
        signalPulse.innerText = "[ IDLE ]";
    };

    window.speechSynthesis.speak(utterance);
}

// --- 7. INPUT HANDLING & COMMANDS ---
playerInput.addEventListener('keydown', function (event) {
    // CLONED AUDIO FIX: Allows for rapid, overlapping mechanical keystrokes
    if (event.key !== 'Enter' && !isTyping) {
        let clickSound = audioKey.cloneNode();
        clickSound.volume = 0.3;
        clickSound.play().catch(e => { });
    }

    if (event.key === 'Enter' && !isTyping) {
        const inputVal = playerInput.value.trim().toUpperCase();
        playerInput.value = '';

        if (inputVal === '') return;
        const targetWord = gameLevels[currentLevel].word;

        if (inputVal.startsWith('/')) {
            handleCommand(inputVal, targetWord);
            return;
        }

        if (inputVal === targetWord) {
            clearInterval(timerInterval);
            terminalScreen.classList.remove('red-alert-active'); // Turn off alarms

            audioSuccess.currentTime = 0;
            audioSuccess.play();
            printToTerminal(gameLevels[currentLevel].text, true);

            currentDepth += Math.floor(Math.random() * 50) + 100;
            depthMeter.innerText = `${currentDepth} M`;

            currentLevel++;
        } else {
            triggerError("> ERROR: DECRYPTION FAILED. REBROADCASTING.");
        }
    }
});

function handleCommand(cmd, targetWord) {
    switch (cmd) {
        case '/REPLAY':
            printToTerminal("> REPLAYING TRANSMISSION...");
            setTimeout(() => playTTS(targetWord), 1000);
            break;
        case '/CLEAR':
            terminalOutput.innerHTML = '';
            break;
        case '/HINT':
            printToTerminal(`> AUDIO ANALYSIS: ${gameLevels[currentLevel].hint}`);
            break;
        default:
            printToTerminal(`> UNRECOGNIZED COMMAND: ${cmd}`);
    }
}

function triggerError(msg) {
    audioError.currentTime = 0;
    audioError.play();

    terminalScreen.classList.add('shake');
    setTimeout(() => terminalScreen.classList.remove('shake'), 400);

    printToTerminal(msg, false, true);

    clearInterval(timerInterval);
    setTimeout(() => {
        playTTS(gameLevels[currentLevel].word);
        startTimer(30);
    }, 2000);
}

// --- 8. UI EFFECTS (Matrix Scrambler) ---
function printToTerminal(text, isDecryptedData = false, isError = false) {
    isTyping = true;
    const p = document.createElement('p');

    if (isDecryptedData) {
        p.style.color = "var(--highlight)";
        p.style.textShadow = "0 0 10px var(--highlight)";
    } else if (isError) {
        p.classList.add('error-text');
    }

    terminalOutput.appendChild(p);

    let i = 0;
    const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    function typeWriter() {
        if (i < text.length) {
            if (isDecryptedData && text.charAt(i) !== ' ' && Math.random() > 0.3) {
                let tempStr = p.innerHTML;
                p.innerHTML = tempStr + chars[Math.floor(Math.random() * chars.length)];

                setTimeout(() => {
                    p.innerHTML = tempStr + text.charAt(i);
                    i++;
                    terminalOutput.scrollTop = terminalOutput.scrollHeight;
                    setTimeout(typeWriter, 30);
                }, 50);
            } else {
                p.innerHTML += text.charAt(i);
                i++;
                terminalOutput.scrollTop = terminalOutput.scrollHeight;
                setTimeout(typeWriter, 30);
            }
        } else {
            isTyping = false;
            if (isDecryptedData) {
                setTimeout(loadNextWord, 2000);
            }
        }
    }
    typeWriter();
}

// --- 9. AMBIENT EFFECTS (Bubbles) ---
function createBubbles() {
    const gameEnv = document.getElementById('game-environment');
    setInterval(() => {
        if (!terminalScreen.classList.contains('active')) return;

        const bubble = document.createElement('div');
        bubble.classList.add('bubble');

        const size = Math.random() * 8 + 2;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}vw`;
        bubble.style.animationDuration = `${Math.random() * 10 + 5}s`;

        gameEnv.appendChild(bubble);

        setTimeout(() => {
            bubble.remove();
        }, 15000);
    }, 800);
}

createBubbles();

window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};