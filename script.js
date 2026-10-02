const cells = document.querySelectorAll(".cell");

const turn = document.getElementById("turn");
const message = document.getElementById("message");

const xScore = document.getElementById("xScore");
const oScore = document.getElementById("oScore");

const winsText = document.getElementById("wins");
const lossesText = document.getElementById("losses");
const drawsText = document.getElementById("draws");
const rateText = document.getElementById("rate");

const mode = document.getElementById("mode");
const difficulty = document.getElementById("difficulty");
const difficultyBox = document.getElementById("difficultyBox");
const oName = document.getElementById("oName");

const newGame = document.getElementById("newGame");
const reset = document.getElementById("reset");
const theme = document.getElementById("theme");
const sound = document.getElementById("sound");
const winLine = document.getElementById("winLine");

let board = ["","","","","","","","",""];
let currentPlayer = "X";
let gameOver = false;
let soundOn = true;

let playerWins = 0;
let opponentWins = 0;
let draws = 0;
let games = 0;


/* ALL 8 WINNING COMBINATIONS */

const winningSets = [
    [0,1,2],
    [3,4,5],
    [6,7,8],

    [0,3,6],
    [1,4,7],
    [2,5,8],

    [0,4,8],
    [2,4,6]
];


/* SOUND */

function beep(frequency) {

    if (!soundOn) return;

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContext) return;

    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.frequency.value = frequency;

    oscillator.connect(gain);
    gain.connect(audio.destination);

    gain.gain.value = 0.05;

    oscillator.start();
    oscillator.stop(audio.currentTime + 0.08);
}


/* DISPLAY BOARD */

function updateBoard() {

    cells.forEach((cell, index) => {

        cell.textContent = board[index];

        cell.className = "cell";

        if (board[index]) {

            cell.classList.add(
                board[index].toLowerCase()
            );

            cell.classList.add("filled");
        }
    });
}


/* MAKE MOVE */

function makeMove(index, player) {

    if (gameOver || board[index] !== "")
        return false;

    board[index] = player;

    updateBoard();

    beep(player === "X" ? 650 : 350);

    return true;
}


/* PLAYER CLICK */

cells.forEach((cell, index) => {

    cell.addEventListener("click", () => {

        /* In AI mode only X can be controlled */
        if (
            mode.value === "ai" &&
            currentPlayer !== "X"
        ) {
            return;
        }

        if (
            gameOver ||
            board[index] !== ""
        ) {
            return;
        }


        /* PLAYER X OR PLAYER O */

        makeMove(index, currentPlayer);

        if (finishGame(currentPlayer))
            return;


        /* CHANGE TURN */

        currentPlayer =
            currentPlayer === "X"
                ? "O"
                : "X";


        updateTurn();


        /* AI'S TURN */

        if (
            mode.value === "ai" &&
            currentPlayer === "O"
        ) {

            setTimeout(
                computerMove,
                450
            );
        }

    });

});


/* COMPUTER */

function computerMove() {

    if (gameOver) return;

    let move;

    if (difficulty.value === "easy") {

        move = randomMove();

    }

    else if (difficulty.value === "medium") {

        move = findWinningMove("O");

        if (move === -1)
            move = findWinningMove("X");

        if (
            move === -1 &&
            board[4] === ""
        )
            move = 4;

        if (move === -1)
            move = randomMove();

    }

    else {

        move = bestMove();

    }


    makeMove(move, "O");

    if (finishGame("O"))
        return;


    currentPlayer = "X";

    updateTurn();
}


/* RANDOM AI */

function randomMove() {

    const empty = board
        .map((value, index) =>
            value === "" ? index : -1
        )
        .filter(index => index !== -1);

    return empty[
        Math.floor(
            Math.random() * empty.length
        )
    ];
}


/* FIND WINNING MOVE */

function findWinningMove(player) {

    for (const set of winningSets) {

        const values =
            set.map(index => board[index]);

        const count =
            values.filter(
                value => value === player
            ).length;

        const empty =
            set.find(index =>
                board[index] === ""
            );

        if (
            count === 2 &&
            empty !== undefined
        ) {
            return empty;
        }
    }

    return -1;
}


/* HARD AI */

function bestMove() {

    let bestScore = -Infinity;
    let move = -1;

    for (let i = 0; i < 9; i++) {

        if (board[i] === "") {

            board[i] = "O";

            const score =
                minimax(board, false);

            board[i] = "";

            if (score > bestScore) {

                bestScore = score;
                move = i;
            }
        }
    }

    return move;
}


/* MINIMAX */

function minimax(state, maximizing) {

    if (checkWinnerState(state, "O"))
        return 10;

    if (checkWinnerState(state, "X"))
        return -10;

    if (!state.includes(""))
        return 0;


    if (maximizing) {

        let best = -Infinity;

        for (let i = 0; i < 9; i++) {

            if (state[i] === "") {

                state[i] = "O";

                best = Math.max(
                    best,
                    minimax(state, false)
                );

                state[i] = "";
            }
        }

        return best;

    }


    let best = Infinity;

    for (let i = 0; i < 9; i++) {

        if (state[i] === "") {

            state[i] = "X";

            best = Math.min(
                best,
                minimax(state, true)
            );

            state[i] = "";
        }
    }

    return best;
}


/* WIN CHECK FOR AI */

function checkWinnerState(state, player) {

    return winningSets.some(set =>
        set.every(index =>
            state[index] === player
        )
    );
}


/* FINISH GAME */

function finishGame(player) {

    const winningSet =
        winningSets.find(set =>
            set.every(index =>
                board[index] === player
            )
        );


    /* WINNER */

    if (winningSet) {

        gameOver = true;
        games++;

        winningSet.forEach(index => {
            cells[index].classList.add("win");
        });

        drawWinningLine(winningSet);


        if (player === "X") {

            playerWins++;
            message.textContent =
                "🏆 PLAYER X WINS!";

        } else {

            opponentWins++;

            message.textContent =
                mode.value === "ai"
                    ? "🤖 AI WINS!"
                    : "🏆 PLAYER O WINS!";
        }

        updateStats();

        beep(900);

        return true;
    }


    /* DRAW */

    if (!board.includes("")) {

        gameOver = true;
        draws++;
        games++;

        message.textContent =
            "🤝 IT'S A DRAW!";

        updateStats();

        beep(250);

        return true;
    }

    return false;
}


/* TURN DISPLAY */

function updateTurn() {

    if (currentPlayer === "X") {

        turn.style.color =
            "var(--cyan)";

        turn.innerHTML =
            "<span></span>PLAYER X'S TURN";

    } else {

        turn.style.color =
            "var(--pink)";

        turn.innerHTML =
            mode.value === "ai"
                ? "<span></span>AI IS THINKING..."
                : "<span></span>PLAYER O'S TURN";
    }
}


/* WINNING LINE */

function drawWinningLine(set) {

    const lines = {

        "0,1,2": [4,16.7,0],
        "3,4,5": [4,50,0],
        "6,7,8": [4,83.3,0],

        "0,3,6": [16.7,4,90],
        "1,4,7": [50,4,90],
        "2,5,8": [83.3,4,90],

        "0,4,8": [7,7,45],
        "2,4,6": [93,7,135]
    };

    const data =
        lines[set.join(",")];

    if (!data) return;

    const [left, top, angle] = data;

    winLine.style.display = "block";

    winLine.style.left =
        left + "%";

    winLine.style.top =
        top + "%";

    winLine.style.width =
        "125%";

    winLine.style.transform =
        `rotate(${angle}deg)`;
}


/* STATISTICS */

function updateStats() {

    xScore.textContent =
        playerWins;

    oScore.textContent =
        opponentWins;


    if (mode.value === "ai") {

        winsText.textContent =
            playerWins;

        lossesText.textContent =
            opponentWins;

    } else {

        winsText.textContent =
            playerWins;

        lossesText.textContent =
            opponentWins;
    }


    drawsText.textContent =
        draws;


    const rate =
        games === 0
            ? 0
            : Math.round(
                playerWins /
                games *
                100
            );

    rateText.textContent =
        rate + "%";
}


/* NEW GAME */

newGame.addEventListener("click", () => {

    board = [
        "", "", "",
        "", "", "",
        "", "", ""
    ];

    currentPlayer = "X";

    gameOver = false;

    message.textContent = "";

    winLine.style.display = "none";

    updateBoard();
    updateTurn();
});


/* RESET */

reset.addEventListener("click", () => {

    playerWins = 0;
    opponentWins = 0;
    draws = 0;
    games = 0;

    newGame.click();

    updateStats();
});


/* GAME MODE */

mode.addEventListener("change", () => {

    if (mode.value === "ai") {

        difficultyBox.style.display =
            "block";

        oName.textContent =
            "🤖 AI O";

    } else {

        difficultyBox.style.display =
            "none";

        oName.textContent =
            "PLAYER O";
    }

    newGame.click();
});


/* THEME */

theme.addEventListener("click", () => {

    document.body.classList.toggle("light");

    theme.textContent =
        document.body.classList.contains("light")
            ? "🌙"
            : "☀️";
});


/* SOUND */

sound.addEventListener("click", () => {

    soundOn = !soundOn;

    sound.textContent =
        soundOn
            ? "🔊"
            : "🔇";
});


/* START */

updateBoard();
updateTurn();
updateStats();