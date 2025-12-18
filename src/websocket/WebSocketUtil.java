package websocket;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class WebSocketUtil {

    public static String readText(InputStream in) throws Exception {
        int b1 = in.read();
        if (b1 == -1) throw new IOException("Client closed");

        int opcode = b1 & 0x0F;
        if (opcode == 8) throw new IOException("Client closed"); // CLOSE frame

        int b2 = in.read();
        boolean masked = (b2 & 0x80) != 0;
        int len = b2 & 0x7F;

        if (len == 126) {
            len = (in.read() << 8) | in.read();
        } else if (len == 127) {
            throw new RuntimeException("Payload too large");
        }

        byte[] mask = new byte[4];
        if (masked) in.read(mask);

        byte[] data = new byte[len];
        int read = 0;
        while (read < len) {
            read += in.read(data, read, len - read);
        }

        if (masked) {
            for (int i = 0; i < len; i++) {
                data[i] ^= mask[i % 4];
            }
        }

        return new String(data);
    }


    public static void sendText(OutputStream out, String msg) throws Exception {
        byte[] data = msg.getBytes("UTF-8");

        out.write(0x81); 

        if (data.length <= 125) {
            out.write(data.length);
        } else if (data.length <= 65535) {
            out.write(126);
            out.write((data.length >> 8) & 0xFF);
            out.write(data.length & 0xFF);
        } else {
            throw new RuntimeException("Message too large");
        }

        out.write(data);
        out.flush();
    }

}
