package game;

import websocket.WebSocketClientHandler;
import java.util.ArrayList;
import java.util.List;

public class RoomManager {

    private static RoomManager instance = new RoomManager();
    private List<GameRoom> rooms = new ArrayList<>();

    private RoomManager() {}

    public static RoomManager getInstance() {
        return instance;
    }

    public synchronized void joinRoom(WebSocketClientHandler player) {
        for (GameRoom room : rooms) {
            if (!room.isFull()) {
                String color = room.addPlayer(player);
                player.send("JOINED " + color);

                if (room.isFull()) {
                    room.startGame(); // ⭐ CHỈ Ở ĐÂY
                }
                return;
            }
        }

        GameRoom newRoom = new GameRoom();
        rooms.add(newRoom);
        String color = newRoom.addPlayer(player);
        player.send("JOINED " + color);
    }
}
