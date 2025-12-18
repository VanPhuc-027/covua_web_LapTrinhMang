package websocket;

import java.net.ServerSocket;
import java.net.Socket;

public class WebSocketServer {

    private int port;

    public WebSocketServer(int port) {
        this.port = port;
    }

    public void start() throws Exception {
        ServerSocket serverSocket = new ServerSocket(port);
        System.out.println("WebSocket Server running on port " + port);

        while (true) {
            Socket client = serverSocket.accept();
            new WebSocketClientHandler(client).start();
        }
    }
}

