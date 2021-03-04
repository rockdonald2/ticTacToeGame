'use strict';

// GAME
let displayController = (function () {
    const cellsLogical = [
        [null, null, null],
        [null, null, null],
        [null, null, null]
    ];
    const cellsDom = document.querySelectorAll('.board--cell');

    function setCell(i, j, sign) {
        if (sign === 'x' || sign === 'o' || sign === null) {
            cellsLogical[i][j] = sign;
        }
    }

    function isCellEmpty(i, j) {
        return cellsLogical[i][j] === null;
    }

    function printLogical() {
        console.log(cellsLogical);
    }

    function setDomCell(i, j, sign) {
        if ((sign === 'x' || sign === 'o') && isCellEmpty(i, j)) {
            cellsDom[i * 3 + j].innerText = sign;
            cellsDom[i * 3 + j].classList.add('occupied');
            setCell(i, j, sign);
            return hasWon(sign);
        } else if (sign === null) {
            cellsDom[i * 3 + j].innerText = null;
            cellsDom[i * 3 + j].classList.remove('occupied');
            setCell(i, j, sign);
        }
    }

    function hasWon(sign) {
        if (cellsLogical[0][0] === sign && cellsLogical[1][1] === sign && cellsLogical[2][2] === sign) {
            return true;
        } else if (cellsLogical[2][0] === sign && cellsLogical[1][1] === sign && cellsLogical[0][2] === sign) {
            return true;
        } else {
            for (let i = 0; i < 3; ++i) {
                if (cellsLogical[i][0] === sign && cellsLogical[i][1] === sign && cellsLogical[i][2] === sign) {
                    return true;
                }
            }

            for (let i = 0; i < 3; ++i) {
                if (cellsLogical[0][i] === sign && cellsLogical[1][i] === sign && cellsLogical[2][i] === sign) {
                    return true;
                }
            }
        }

        return false;
    }

    function getDomCells() {
        return cellsDom;
    }

    function areAllCellsOccupied() {
        return cellsLogical.every((c) => {
            return c.every((s) => s !== null)
        });
    }

    function emptyCells() {
        let empty = [];

        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
                if (cellsLogical[i][j] === null) {
                    empty.push([i, j]);
                }
            }
        }

        return empty;
    }

    return {setCell, setDomCell, isCellEmpty, hasWon, getDomCells, areAllCellsOccupied, emptyCells};
})();

let gameController = (function () {
    let playerSign = document.querySelector('#cross').checked ? 'x' : 'o';
    let opponentSign = playerSign === 'x' ? 'o' : 'x';
    let aiOpponent = false;
    let aiDifficulty = document.querySelector('#difficulty').value;
    let playerTurn = true;
    const menuForm = document.querySelector('.modal--form');
    const turnDisplay = document.querySelector('#currentTurn');
    let gameRunning = true;

    function generateRandomNumber(x, y) {
        // generates a random int between [x, y)
        return Math.floor(x + Math.random() * (y - x));
    }

    function shuffleMoves(moves) {
        for (let i = moves.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = moves[i];
            moves[i] = moves[j];
            moves[j] = temp;
        }
    }

    function setSettings(e) {
        e.preventDefault();
        const form = this;
        modalController.hideOverlay({type: 'click'});
        playerSign = form.querySelector('#cross').checked ? 'x' : 'o';
        opponentSign = playerSign === 'x' ? 'o' : 'x';
        aiOpponent = form.querySelector('#aiOpponent').checked;
        aiDifficulty = form.querySelector('#difficulty').value;
        restartGame(e);
    }

    function restartGame(e) {
        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
                displayController.setDomCell(i, j, null);
            }
        }

        turnDisplay.innerText = 'x';
        playerTurn = playerSign === 'x';
        gameRunning = true;

        if (aiOpponent && opponentSign === 'x') {
            playGame(null, 0, {});
        }

        setTimeout(() => {
            document.activeElement.blur();
        }, 250);
    }

    function miniMax(player) {
        const availableCells = displayController.emptyCells();

        if (displayController.hasWon(playerSign)) {
            return {score: -10};
        } else if (displayController.hasWon(opponentSign)) {
            return {score: 10};
        } else if (availableCells.length === 0) {
            return {score: 0};
        }

        let moves = [];
        availableCells.forEach((cell) => {
            let move = {index: cell};

            displayController.setCell(cell[0], cell[1], player);

            if (player === opponentSign) {
                const result = miniMax(playerSign);
                move.score = result.score;
            } else {
                const result = miniMax(opponentSign);
                move.score = result.score;
            }

            displayController.setCell(move.index[0], move.index[1], null);

            moves.push(move);
        });

        let bestMove;
        if (player === opponentSign) {
            let bestScore = -10000;
            moves.forEach((m, i) => {
                if (m.score > bestScore) {
                    bestScore = m.score;
                    bestMove = i;
                }
            });
        } else {
            let bestScore = 10000;
            moves.forEach((m, i) => {
                if (m.score < bestScore) {
                    bestScore = m.score;
                    bestMove = i;
                }
            });
        }

        if (aiDifficulty !== 'unbeatable') {
            let possibleMoves = [];

            switch (aiDifficulty) {
                case 'easy': {
                    // 70% possibility of getting bestMove
                    for (let i = 0; i < 7; ++i) {
                        possibleMoves.push(bestMove);
                    }

                    for (let i = 0; i < 3; ++i) {
                        possibleMoves.push(generateRandomNumber(0, moves.length));
                    }

                    break;
                }
                case 'medium': {
                    // 80% possibility of getting bestMove
                    for (let i = 0; i < 8; ++i) {
                        possibleMoves.push(bestMove);
                    }

                    for (let i = 0; i < 2; ++i) {
                        possibleMoves.push(generateRandomNumber(0, moves.length));
                    }

                    break;
                }
                case 'hard': {
                    // 90% possibility of getting bestMove
                    // ! on each recursive branch
                    for (let i = 0; i < 9; ++i) {
                        possibleMoves.push(bestMove);
                    }

                    for (let i = 0; i < 1; ++i) {
                        possibleMoves.push(generateRandomNumber(0, moves.length));
                    }

                    break;
                }
            }

            shuffleMoves(possibleMoves);

            bestMove = possibleMoves[generateRandomNumber(0, possibleMoves.length)];
        }

        return moves[bestMove];
    }

    function playGame(cell, i, e) {
        if (!displayController.isCellEmpty(Math.floor(i / 3), i % 3)) return;

        if (gameRunning && !aiOpponent) {
            if (playerTurn) {
                if (displayController.setDomCell(Math.floor(i / 3), i % 3, playerSign)) {
                    turnDisplay.innerText = "Player1 has won";
                    gameRunning = false;
                    return;
                }
            } else {
                if (displayController.setDomCell(Math.floor(i / 3), i % 3, opponentSign)) {
                    turnDisplay.innerText = "Player2 has won";
                    gameRunning = false;
                    return;
                }
            }

        } else if (gameRunning && aiOpponent) {
            if (playerTurn) {
                if (displayController.setDomCell(Math.floor(i / 3), i % 3, playerSign)) {
                    turnDisplay.innerText = "Player has won";
                    gameRunning = false;
                    return;
                }
            }

            const aiMove = miniMax(opponentSign).index;
            if (!playerTurn) {
                playerTurn = true;
            }

            if (aiMove && displayController.setDomCell(aiMove[0], aiMove[1], opponentSign)) {
                turnDisplay.innerText = "AI has won";
                gameRunning = false;
                return;
            }
        }

        if (displayController.areAllCellsOccupied()) {
            turnDisplay.innerText = 'It\'s a tie';
        } else {
            if (!aiOpponent) {
                playerTurn = !playerTurn;
            }

            turnDisplay.innerText = playerTurn ? playerSign : opponentSign;
        }
    }

    menuForm.addEventListener('submit', setSettings);
    displayController.getDomCells().forEach((cell, i) => {
        cell.addEventListener('click', playGame.bind(cell, cell, i));
    });

    return {restartGame};
})();

// button behaviour
let modalController = (function () {
    'use strict';

    const btnMenu = document.querySelector('#btnMenu');
    const btnRestart = document.querySelector('#btnRestart');
    const overlay = document.querySelector('#overlay');
    const modal = document.querySelector('#modal');
    const aiSelector = document.querySelector('#aiOpponent');
    const difficultySelector = document.querySelector('#difficulty');

    function toggleText(e) {
        const text = this.querySelector('.btn--menu__text') || this.querySelector('.btn--restart__text');
        if (e.type === 'mouseleave') {
            text.classList.toggle('hidden');
        } else {
            setTimeout(() => {
                text.classList.toggle('hidden');
            }, 25);
        }
    }

    function toggleMenu(e) {
        overlay.classList.add('show');
        modal.classList.add('show');
        document.activeElement.blur();
    }

    function hideOverlay(e) {
        if (e.type === 'click' ||
            (e.type === 'keydown' && e.key === 'Escape')) {
            overlay.classList.remove('show');
            modal.classList.remove('show');
        }
    }

    function refreshPage(e) {
        setTimeout(() => {
            location.reload();
        }, 150);
    }

    function toggleDifficultySelector(e) {
        difficultySelector.disabled = !difficultySelector.disabled;
    }

    btnMenu.addEventListener('mouseenter', toggleText);
    btnRestart.addEventListener('mouseenter', toggleText);
    btnMenu.addEventListener('mouseleave', toggleText);
    btnRestart.addEventListener('mouseleave', toggleText);
    btnMenu.addEventListener('click', toggleMenu);
    btnRestart.addEventListener('click', gameController.restartGame);
    overlay.addEventListener('click', hideOverlay);
    document.addEventListener('keydown', hideOverlay);
    aiSelector.addEventListener('change', toggleDifficultySelector);

    return {hideOverlay};
})();