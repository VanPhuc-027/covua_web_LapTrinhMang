import websocket.WebSocketServer;

public class Main {
    public static void main(String[] args) throws Exception {
        WebSocketServer server = new WebSocketServer(8080);
        server.start();
    }
}

