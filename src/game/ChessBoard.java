package game;

import java.util.HashMap;
import java.util.Map;

public class ChessBoard {

    private Map<String, Piece> board = new HashMap<>();

    public ChessBoard() {
        init();
    }

    private void init() {
        // White
        board.put("a1", Piece.WR); board.put("b1", Piece.WN);
        board.put("c1", Piece.WB); board.put("d1", Piece.WQ);
        board.put("e1", Piece.WK); board.put("f1", Piece.WB);
        board.put("g1", Piece.WN); board.put("h1", Piece.WR);
        for (char c = 'a'; c <= 'h'; c++) board.put(c + "2", Piece.WP);

        // Black
        board.put("a8", Piece.BR); board.put("b8", Piece.BN);
        board.put("c8", Piece.BB); board.put("d8", Piece.BQ);
        board.put("e8", Piece.BK); board.put("f8", Piece.BB);
        board.put("g8", Piece.BN); board.put("h8", Piece.BR);
        for (char c = 'a'; c <= 'h'; c++) board.put(c + "7", Piece.BP);
    }

    public boolean isValidMove(String from, String to, String color) {
        if (!board.containsKey(from)) return false;

        Piece p = board.get(from);
        if (!p.color.equals(color)) return false;

        if (board.containsKey(to) && board.get(to).color.equals(color))
            return false;

        int fx = from.charAt(0) - 'a';
        int fy = from.charAt(1) - '1';
        int tx = to.charAt(0) - 'a';
        int ty = to.charAt(1) - '1';

        int dx = tx - fx;
        int dy = ty - fy;

        switch (p) {
            case WP: return pawnMove(dx, dy, from, to, 1);
            case BP: return pawnMove(dx, dy, from, to, -1);
            case WR: case BR: return straight(dx, dy, from, to);
            case WB: case BB: return diagonal(dx, dy, from, to);
            case WQ: case BQ: return straight(dx, dy, from, to) || diagonal(dx, dy, from, to);
            case WN: case BN: return knight(dx, dy);
            case WK: case BK: return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
        }
        return false;
    }

    private boolean pawnMove(int dx, int dy, String from, String to, int dir) {
        int fy = from.charAt(1) - '1';

        if (dx == 0 && dy == dir && !board.containsKey(to))
            return true;

        if (dx == 0 && dy == 2 * dir &&
            ((fy == 1 && dir == 1) || (fy == 6 && dir == -1)) &&
            !board.containsKey(to))
            return true;

        if (Math.abs(dx) == 1 && dy == dir &&
            board.containsKey(to) &&
            !board.get(to).color.equals(board.get(from).color))
            return true;

        return false;
    }

    private boolean straight(int dx, int dy, String from, String to) {
        if (dx != 0 && dy != 0) return false;
        return clearPath(from, to);
    }

    private boolean diagonal(int dx, int dy, String from, String to) {
        if (Math.abs(dx) != Math.abs(dy)) return false;
        return clearPath(from, to);
    }

    private boolean knight(int dx, int dy) {
        return Math.abs(dx) * Math.abs(dy) == 2;
    }

    private boolean clearPath(String from, String to) {
        int fx = from.charAt(0) - 'a';
        int fy = from.charAt(1) - '1';
        int tx = to.charAt(0) - 'a';
        int ty = to.charAt(1) - '1';

        int sx = Integer.signum(tx - fx);
        int sy = Integer.signum(ty - fy);

        fx += sx; fy += sy;
        while (fx != tx || fy != ty) {
            if (board.containsKey("" + (char)('a'+fx) + (fy+1)))
                return false;
            fx += sx; fy += sy;
        }
        return true;
    }

    public void applyMove(String from, String to) {
        board.put(to, board.remove(from));
    }

    public String serialize() {
        StringBuilder sb = new StringBuilder("INIT_BOARD ");
        for (String pos : board.keySet()) {
            sb.append(pos).append(board.get(pos).code).append(" ");
        }
        return sb.toString().trim();
    }
}
