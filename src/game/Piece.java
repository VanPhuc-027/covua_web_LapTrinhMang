package game;

public enum Piece {
    WP("WP","WHITE"), WR("WR","WHITE"), WN("WN","WHITE"),
    WB("WB","WHITE"), WQ("WQ","WHITE"), WK("WK","WHITE"),

    BP("BP","BLACK"), BR("BR","BLACK"), BN("BN","BLACK"),
    BB("BB","BLACK"), BQ("BQ","BLACK"), BK("BK","BLACK");

    public final String code;
    public final String color;

    Piece(String code, String color) {
        this.code = code;
        this.color = color;
    }
}
