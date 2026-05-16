import { Room, Client } from "colyseus";

/**
 * ChatRoom handles Global Chat for Project TRINITY.
 * Ensures low latency via Colyseus broadcasting.
 */
export class ChatRoom extends Room {
    onCreate(options: any) {
        console.log("Global ChatRoom created");

        this.onMessage("CHAT_MESSAGE", (client: Client, message: { text: string }) => {
            if (!message.text || message.text.length > 200) return;

            const chatMessage = {
                senderId: client.auth.userId,
                username: client.auth.username || "Anonymous",
                text: message.text,
                timestamp: Date.now()
            };

            // Broadcast to all clients in the global chat
            this.broadcast("CHAT_MESSAGE", chatMessage);
        });
    }

    async onAuth(client: Client, options: any) {
        // Simple auth for demo; in production use JWT validation
        if (!options.token) return false;
        
        return { 
            userId: options.token, 
            username: options.username || "Player" 
        };
    }

    onJoin(client: Client, options: any) {
        console.log(`User ${client.auth.userId} joined global chat`);
    }

    onLeave(client: Client, consented: boolean) {
        console.log(`User ${client.auth.userId} left global chat`);
    }
}
