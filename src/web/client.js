const ws = new WebSocket("ws://localhost:8080");

let selected = null;
let myTurn = false;
let myColor = null;

const board = document.getElementById("board");
const status = document.getElementById("status");
const ICON = {
  WP:"img/wp.png", WR:"img/wr.png", WN:"img/wn.png",
  WB:"img/wb.png", WQ:"img/wq.png", WK:"img/wk.png",
  BP:"img/bp.png", BR:"img/br.png", BN:"img/bn.png",
  BB:"img/bb.png", BQ:"img/bq.png", BK:"img/bk.png"
};

let pieces = {}; 
let legalMoves = [];
let hasMoved = {}; 
let enPassantTarget = null;

ws.onopen = () => {
  console.log("Connected");
  ws.send("JOIN");
};

ws.onmessage = e => handleServer(e.data);

function handleServer(msg) {
  console.log("Server:", msg);

  if (msg.startsWith("JOINED")) {
    myColor = msg.split(" ")[1];
    status.innerText = `You are ${myColor}`;
  }

  if (msg.startsWith("INIT_BOARD")) {
    pieces = {};
    msg.substring(11).split(" ").forEach(p => {
      const pos = p.substring(0,2);
      const code = p.substring(2);
      pieces[pos] = code; 
    });
    drawBoard();
  }


  if (msg.startsWith("TURN")) {
    const turn = msg.split(" ")[1];
    myTurn = (turn === myColor);
    status.innerText = myTurn ? "Your turn" : "Opponent turn";
  }

  if (msg.startsWith("OPPONENT_MOVE") || msg.startsWith("MOVE_OK")) {
    const [, from, to] = msg.split(" ");
    applyMove(from, to);
  }

  if (msg === "INVALID_MOVE") {
    alert("Invalid move or not your turn!");
  }
}

function drawBoard() {
  board.innerHTML = "";

  for (let r = 8; r >= 1; r--) {
    for (let c = 0; c < 8; c++) {
      const col = String.fromCharCode(97 + c);
      const pos = col + r;

      const cell = document.createElement("div");
      cell.className = "cell " + ((r + c) % 2 ? "black" : "white");

      // highlight ô đang chọn
      if (pos === selected) {
        cell.classList.add("selected");
      }

      // highlight nước đi hợp lệ
      if (legalMoves.includes(pos)) {
        cell.classList.add(pieces[pos] ? "capture" : "move");
      }

      if (pieces[pos]) {
      const img = document.createElement("img");
      img.src = ICON[pieces[pos]];
      img.width = 50;
      img.height = 50;
      img.draggable = false;
      cell.appendChild(img);
    }

      cell.onclick = () => clickCell(pos);

      board.appendChild(cell);
    }
  }
}

function clickCell(pos) {
  if (!myTurn) return;

  // Hủy chọn nếu click vào ô đã chọn
  if (selected === pos) {
    selected = null;
    legalMoves = [];
    drawBoard();
    return;
  }

  // Chọn quân cờ của mình
  if (!selected && pieces[pos] && pieces[pos][0] === (myColor[0])) {
    selected = pos;
    calcLegalMoves(pos);
    drawBoard();
  } 
  else if (selected && legalMoves.includes(pos)) {
    ws.send(`MOVE ${selected} ${pos}`);
    selected = null;
    legalMoves = [];
    drawBoard();
  }
}



function applyMove(from, to) {
  let piece = pieces[from];
  const color = piece[0] === "W" ? "WHITE" : "BLACK";

  // En passant
  if (piece[1] === "P" && to === enPassantTarget) {
    const capRow = parseInt(to[1]) - (color === "WHITE" ? 1 : -1);
    const capPos = to[0] + capRow;
    delete pieces[capPos];
  }

  pieces[to] = piece;
  delete pieces[from];

  // Pawn promotion
  if (piece[1] === "P" && (to[1] === "8" || to[1] === "1")) {
    // tự động Queen (hoặc có thể hiển thị UI chọn)
    pieces[to] = piece[0] + "Q";
  }

  // Lưu trạng thái di chuyển cho King/Rook
  if (piece[1] === "K" || piece[1] === "R") {
    hasMoved[to] = true;
  }

  // Cập nhật en passant target
  enPassantTarget = null;
  if (piece[1] === "P" && Math.abs(parseInt(to[1]) - parseInt(from[1])) === 2) {
    const epRow = (parseInt(to[1]) + parseInt(from[1])) / 2;
    enPassantTarget = to[0] + epRow;
  }

  if (piece[1] === "K" && Math.abs(parseInt(to[0].charCodeAt(0)) - parseInt(from[0].charCodeAt(0))) === 2) {
    const row = from[1];
    if (to[0] === 'g') { // King-side
      pieces['f' + row] = pieces['h' + row];
      delete pieces['h' + row];
    } else if (to[0] === 'c') { // Queen-side
      pieces['d' + row] = pieces['a' + row];
      delete pieces['a' + row];
    }
  }
  selected = null;
  drawBoard();
}


function getPieceType(pos) {
  return pieces[pos] || null;
}

function pawnMoves(pos, color) {
  const moves = [];
  const col = pos.charCodeAt(0);
  const row = parseInt(pos[1]);
  const dir = color === "WHITE" ? 1 : -1;
  const startRow = color === "WHITE" ? 2 : 7;
  const promotionRow = color === "WHITE" ? 8 : 1;

  // 1 ô phía trước
  const one = String.fromCharCode(col) + (row + dir);
  if (!pieces[one]) {
    moves.push(one);

    // 2 ô phía trước nếu chưa đi lần nào
    const two = String.fromCharCode(col) + (row + dir * 2);
    if (row === startRow && !pieces[two]) {
      moves.push(two);
    }
  }

  // ăn chéo
  for (let dc of [-1, 1]) {
    const p = String.fromCharCode(col + dc) + (row + dir);
    if (pieces[p] && pieces[p][0] !== color[0]) {
      moves.push(p);
    }
    // en passant
    if (enPassantTarget === p) {
      moves.push(p);
    }
  }

  return moves;
}

function knightMoves(pos, color) {
  const moves = [];
  const col = pos.charCodeAt(0);
  const row = parseInt(pos[1]);
  const deltas = [
    [1, 2], [2, 1], [2, -1], [1, -2],
    [-1, -2], [-2, -1], [-2, 1], [-1, 2]
  ];

  for (let [dc, dr] of deltas) {
    const newCol = col + dc;
    const newRow = row + dr;
    if (newCol >= 97 && newCol <= 104 && newRow >= 1 && newRow <= 8) {
      const targetPos = String.fromCharCode(newCol) + newRow;
      if (!pieces[targetPos] || pieces[targetPos][0] !== color[0]) {
        moves.push(targetPos);
      }
    }
  }

  return moves;
}


function kingMoves(pos, color) {
  const moves = [];
  const col = pos.charCodeAt(0);
  const row = parseInt(pos[1]);

  const deltas = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1]
  ];

  for (let [dc, dr] of deltas) {
    const newCol = col + dc;
    const newRow = row + dr;
    if (newCol >= 97 && newCol <= 104 && newRow >= 1 && newRow <= 8) {
      const targetPos = String.fromCharCode(newCol) + newRow;
      if (!pieces[targetPos] || pieces[targetPos][0] !== color[0]) {
        moves.push(targetPos);
      }
    }
  }

  // Castling
  if (!hasMoved[pos]) {
    // King-side
    const kingSideRook = String.fromCharCode(104) + row; // h1/h8
    if (pieces[kingSideRook] && pieces[kingSideRook][1] === "R" && !hasMoved[kingSideRook]) {
      if (!pieces[String.fromCharCode(102) + row] && !pieces[String.fromCharCode(103) + row]) {
        moves.push(String.fromCharCode(103) + row); // di chuyển King 2 ô
      }
    }
    // Queen-side
    const queenSideRook = String.fromCharCode(97) + row; // a1/a8
    if (pieces[queenSideRook] && pieces[queenSideRook][1] === "R" && !hasMoved[queenSideRook]) {
      if (!pieces[String.fromCharCode(98) + row] && !pieces[String.fromCharCode(99) + row] && !pieces[String.fromCharCode(100) + row]) {
        moves.push(String.fromCharCode(99) + row); // di chuyển King 2 ô
      }
    }
  }

  return moves;
}

// ---------- ROOK ----------
function rookMoves(pos, color) {
  const moves = [];
  const col = pos.charCodeAt(0);
  const row = parseInt(pos[1]);

  const directions = [
    [1, 0], [-1, 0], [0, 1], [0, -1] // phải, trái, lên, xuống
  ];

  for (let [dc, dr] of directions) {
    let newCol = col;
    let newRow = row;
    while (true) {
      newCol += dc;
      newRow += dr;
      if (newCol < 97 || newCol > 104 || newRow < 1 || newRow > 8) break;

      const targetPos = String.fromCharCode(newCol) + newRow;
      if (!pieces[targetPos]) {
        moves.push(targetPos);
      } else {
        if (pieces[targetPos][0] !== color[0]) moves.push(targetPos);
        break;
      }
    }
  }

  return moves;
}

// ---------- BISHOP ----------
function bishopMoves(pos, color) {
  const moves = [];
  const col = pos.charCodeAt(0);
  const row = parseInt(pos[1]);

  const directions = [
    [1, 1], [1, -1], [-1, 1], [-1, -1] // 4 đường chéo
  ];

  for (let [dc, dr] of directions) {
    let newCol = col;
    let newRow = row;
    while (true) {
      newCol += dc;
      newRow += dr;
      if (newCol < 97 || newCol > 104 || newRow < 1 || newRow > 8) break;

      const targetPos = String.fromCharCode(newCol) + newRow;
      if (!pieces[targetPos]) {
        moves.push(targetPos);
      } else {
        if (pieces[targetPos][0] !== color[0]) moves.push(targetPos);
        break;
      }
    }
  }

  return moves;
}

// ---------- QUEEN ----------
function queenMoves(pos, color) {
  // Queen = Rook + Bishop
  return [...rookMoves(pos, color), ...bishopMoves(pos, color)];
}

// ---------- KING ----------
function kingMoves(pos, color) {
  const moves = [];
  const col = pos.charCodeAt(0);
  const row = parseInt(pos[1]);

  const deltas = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1]
  ];

  for (let [dc, dr] of deltas) {
    const newCol = col + dc;
    const newRow = row + dr;
    if (newCol >= 97 && newCol <= 104 && newRow >= 1 && newRow <= 8) {
      const targetPos = String.fromCharCode(newCol) + newRow;
      if (!pieces[targetPos] || pieces[targetPos][0] !== color[0]) {
        moves.push(targetPos);
      }
    }
  }

  return moves;
}

function calcLegalMoves(pos) {
  legalMoves = [];
  const type = getPieceType(pos);
  if (!type) return;

  const color = type[0] === "W" ? "WHITE" : "BLACK";

  switch (type[1]) {
    case "P":
      legalMoves = pawnMoves(pos, color);
      break;
    case "N":
      legalMoves = knightMoves(pos, color);
      break;
    case "R":
      legalMoves = rookMoves(pos, color);
      break;
    case "B":
      legalMoves = bishopMoves(pos, color);
      break;
    case "Q":
      legalMoves = queenMoves(pos, color);
      break;
    case "K":
      legalMoves = kingMoves(pos, color);
      break;
  }
}

