var BOARD = [];
var TURN = 0;
var GAME = true;
var YELLOW = 0;
var RED = 0;
var socket;


function createBoard() {
  var row = [];
  var board = []
  for(var i = 0; i < 6; i++) {
    row = [];
    for(var j = 0; j < 7; j++) {
      row.push(0);
    }
    board.push(row);
  }
  return board;
}


function identifyCol(x) {
  for (var i = 0; i < 7; i++) {
    if (x < 25 + (i+1)*100) {
      return i;
    }
  }
}


function dropPiece(col) {
  for(var i = 0; i < 6; i++) {
    var row = 5 - i;
    if (BOARD[row][col] === 0) {
      BOARD[row][col] = TURN+1;
      return row;
    }
  }
  return 6;
}


function checkRow(row) {
  var streak = 0;
  for(var j = 0; j < 7; j++) {
    var piece = BOARD[row][j];
    if (piece === TURN+1) {
      streak += 1;
    } else {
      streak = 0;
    }
    if (streak === 4) {
      return true;
    }
  }
  return false;
}


function checkCol(col) {
  var streak = 0;
  for (var i = 0; i < 6; i++) {
    var piece = BOARD[i][col];
    if (piece === TURN+1) {
      streak += 1;
    } else {
      streak = 0;
    }
    if (streak === 4) {
      return true;
    }
  }
  return false;
}


function checkDiagonal(row, col) {
  // Forward Diagonal / -row + col
  var streak = 0;
  for (var i = -5; i < 6; i++) {
    if (0 <= row-i && row-i < 6 && 0 <= col+i && col+i < 7){
      var piece = BOARD[row-i][col+i];
      if (piece === TURN+1) {
        streak += 1;
      } else {
        streak = 0;
      }
      if (streak === 4) {
        return true;
      }
    }
  }
  // Backward Diagonal \ + row + col
  streak = 0;
  for (var i = -5; i < 6; i++) {
    if (0 <= row+i && row+i < 6 && 0 <= col+i && col+i < 7){
      var piece = BOARD[row+i][col+i];
      if (piece === TURN+1) {
        streak += 1;
      } else {
        streak = 0;
      }
      if (streak === 4) {
        return true;
      }
    }
  }
  return false;
}


function checkWin(row, col) {
  return (checkRow(row) || checkCol(col) || checkDiagonal(row, col));
}


function setup() {
  createCanvas(750, 700);
  BOARD = createBoard();
  socket = io.connect('http://localhost:3000');
  socket.on('game', newGame);
}


function newGame(data) {
  BOARD = data.board;
  TURN = data.turn;
  GAME = data.game;
  RED = data.red;
  YELLOW = data.yellow;
}


function draw() {
  background(225);
  // Draw Board
  noStroke()
  fill(0, 150, 255);
  rect(25, 75, 700, 600);
  for(var i = 0; i < 6; i++) {
    for(var j = 0; j < 7; j++) {
      if (BOARD[i][j] === 1) {
        fill(255, 0, 0);
      } else if (BOARD[i][j] === 2) {
        fill(255, 255, 0);
      } else {
        fill(255);
      }
      ellipse(75 + 100*j, 125 + 100*i, 50, 50);
    }
  }
  // Draw Winners pop up and play again button
  if (!GAME) {
    strokeWeight(5);
    stroke(0, 100, 205);
    //fill(0, 120, 225);
    noFill();
    rect(125, 225, 500, 300, 50);
    textFont('Cursive');
    textSize(100);
    textAlign(CENTER, CENTER);
    var winner;
    noStroke();
    if (TURN+1 === 1) {
      fill(255, 0, 0);
      winner = 'RED';
    } else {
      fill(255, 255, 0);
      winner = 'YELLOW';
    }
    fill(0); // Overrides color coded winner
    text(winner, 375, 325);
    fill(0);
    text('WINS', 375, 450);

    strokeWeight(5);
    stroke(0, 100, 205);
    //fill(0, 120, 225);
    noFill();
    rect(225, 550, 300, 75, 25);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(40);
    fill(0);
    text('PLAY AGAIN', 375, 590);

  }
  // Draw Score
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(48);
  text('-', 375, 40);
  fill(255, 0, 0);
  textAlign(RIGHT, CENTER);
  text(RED, 355, 40);
  fill(255, 255, 0);
  textAlign(LEFT, CENTER);
  text(YELLOW, 395, 40);
}


function mouseClicked() {
  if (GAME && 75 <= mouseY && mouseY <= 675 && 25 <= mouseX && mouseX <= 725) {
    var col = identifyCol(mouseX);
    var row = dropPiece(col);
    if (row < 6) {
      if (checkWin(row, col)) {
        GAME = false;
        if (TURN+1 === 1) {
          RED += 1;
        } else {
          YELLOW += 1;
        }
        var gameData = {game:GAME, yellow:YELLOW, red:RED};
        socket.emit('game', gameData)
      } else {
        TURN = (TURN+1)%2;
      }
    }
    var gameData = {board:BOARD, turn:TURN, game:GAME, yellow:YELLOW, red:RED};
    socket.emit('game', gameData)
    // var boardData = {board:BOARD, turn:TURN};
    // socket.emit('board', boardData)
  } else if (!GAME) {
    var clicked = false;
    // Curved corners Rect click checker (kinda smurfed it)
    var startX = 225;
    var startY = 550;
    var width = 300;
    var height = 75;
    var radius = 25;
    if (startX+radius <= mouseX && mouseX <= startX+width-radius) {
      if (startY <= mouseY && mouseY <= startY+height) {
        clicked = true;
      }
    } else if (startY+radius <= mouseY && mouseY <= startY+height-radius) {
      if (startX <= mouseX && mouseX <= startX+width) {
        clicked = true;
      }
    } else if (startX <= mouseX && mouseX <= startX+radius){
      if (startY <= mouseY && mouseY <= startY+radius) {
        if ((pow(mouseX-startX-radius, 2) + pow(mouseY-startY, 2)) <= pow(radius, 2)) {
          clicked = true;
        }
      } else if (startY+height-radius <= mouseY && mouseY <= startY+height) {
        if ((pow(mouseX-startX-radius, 2) + pow(mouseY-(startY+height-radius)-radius, 2)) <= pow(radius, 2)) {
          clicked = true;
        }
      }
    } else if (startX+width-radius <= mouseX && mouseX <= startX+width) {
      if (startY <= mouseY && mouseY <= startY+radius) {
        if ((pow(mouseX-(startX+width-radius), 2) + pow(mouseY-startY, 2)) <= pow(radius, 2)) {
          clicked = true;
        }
      } else if (startY+height-radius <= mouseY && mouseY <= startY+height) {
        if ((pow(mouseX-(startX+width-radius), 2) + pow(mouseY-(startY+height-radius)-radius, 2)) <= pow(radius, 2)) {
          clicked = true;
        }
      }
    }
    if (clicked) {
      BOARD = createBoard();
      TURN = (TURN+1)%2;
      GAME = true;
      var gameData = {board:BOARD, turn:TURN, game:GAME, yellow:YELLOW, red:RED};
      socket.emit('game', gameData)
    }
  }
}

