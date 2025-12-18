package game;

import websocket.WebSocketClientHandler;

public class GameRoom {

    private WebSocketClientHandler white;
    private WebSocketClientHandler black;
    private String currentTurn = "WHITE";
    private ChessBoard board = new ChessBoard();

    public synchronized boolean isFull() {
        return white != null && black != null;
    }

    public synchronized String addPlayer(WebSocketClientHandler player) {
        if (white == null) {
            white = player;
            player.setRoom(this);
            player.setColor("WHITE");
            return "WHITE";
        } else if (black == null) {
            black = player;
            player.setRoom(this);
            player.setColor("BLACK");
            return "BLACK";
        }
        return null;
    }

    public void startGame() {
        String init = board.serialize();

        System.out.println("START GAME");
        System.out.println(init);

        white.send(init);
        black.send(init);

        white.send("TURN WHITE");
        black.send("TURN WHITE");
    }



    public synchronized void forwardMove(WebSocketClientHandler from, String move) {
        if (!from.getColor().equals(currentTurn)) {
            from.send("INVALID_MOVE");
            return;
        }

        String[] m = move.split(" ");
        String fromPos = m[0];
        String toPos = m[1];

        if (!board.isValidMove(fromPos, toPos, currentTurn)) {
            from.send("INVALID_MOVE");
            return;
        }

        board.applyMove(fromPos, toPos);
        toggleTurn();

        from.send("MOVE_OK " + move);

        if (from == white) {
            black.send("OPPONENT_MOVE " + move);
        } else {
            white.send("OPPONENT_MOVE " + move);
        }

        white.send("TURN " + currentTurn);
        black.send("TURN " + currentTurn);
    }


    private void toggleTurn() {
        currentTurn = currentTurn.equals("WHITE") ? "BLACK" : "WHITE";
    }
}
