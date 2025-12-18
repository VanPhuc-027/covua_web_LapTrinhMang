package websocket;

import java.io.*;
import java.net.Socket;
import java.security.MessageDigest;
import java.util.Base64;
import game.GameRoom;
import game.RoomManager;


public class WebSocketClientHandler extends Thread {

    private Socket socket;
    private InputStream in;
    private OutputStream out;
    private GameRoom room;
    private String color;

    public WebSocketClientHandler(Socket socket) throws IOException {
        this.socket = socket;
        this.in = socket.getInputStream();
        this.out = socket.getOutputStream();
    }

    @Override
    public void run() {
        try {
            handshake();
            System.out.println("Client connected");

            while (true) {
                String msg = WebSocketUtil.readText(in);
                System.out.println("Received: " + msg);

                handleMessage(msg);
            }
        } catch (Exception e) {
            System.out.println("Client disconnected");
        }
    }

    private void handshake() throws Exception {
    StringBuilder req = new StringBuilder();
    int c;
    while ((c = in.read()) != -1) {
        req.append((char) c);
        if (req.toString().endsWith("\r\n\r\n")) break;
    }

    String request = req.toString();

    String key = null;
    for (String line : request.split("\r\n")) {
        if (line.startsWith("Sec-WebSocket-Key")) {
            key = line.split(": ")[1].trim();
            break;
        }
    }

    String acceptKey = Base64.getEncoder().encodeToString(
        MessageDigest.getInstance("SHA-1")
            .digest((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").getBytes())
    );

    String response =
        "HTTP/1.1 101 Switching Protocols\r\n" +
        "Upgrade: websocket\r\n" +
        "Connection: Upgrade\r\n" +
        "Sec-WebSocket-Accept: " + acceptKey + "\r\n\r\n";

    out.write(response.getBytes());
    out.flush();
}


    public void send(String msg) {
    try {
        WebSocketUtil.sendText(out, msg);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    

    public void setRoom(GameRoom room) {
        this.room = room;
    }
    public void setColor(String color) {
        this.color = color;
    }

    private void handleMessage(String msg) {
        if (msg.equals("JOIN")) {
            RoomManager.getInstance().joinRoom(this);
        } 
        else if (msg.startsWith("MOVE")) {
            if (room != null) {
                room.forwardMove(this, msg.substring(5));
            }
        }
    }
    public String getColor() {
        return color;
    }


}
