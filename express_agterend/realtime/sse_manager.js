const EventEmitter = require('events');

class SSEManager {
    constructor() {
        this.clients = [];
        this.events = new EventEmitter();
    }

    addClient(res) {
        // Set SSE headers
        res.setHeader("Access-Control-Allow-Origin", "http://localhost");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // Add client to the list
        this.clients.push(res);
        console.log("New SSE client connected, total:", this.clients.length);

        // Handle client disconnection
        res.on("close", () => {
            this.clients = this.clients.filter(c => c !== res);
            console.log("SSE client disconnected, total:", this.clients.length);
        });
    }

    broadcast(eventType, data) {
        const eventData = JSON.stringify({ type: eventType, data });
        this.clients.forEach(client => {
            client.write(`data: ${eventData}\n\n`);
        });
    }

    // Subscribe to specific event types
    on(eventType, callback) {
        this.events.on(eventType, callback);
    }

    // Emit events that will be broadcasted
    emit(eventType, data) {
        this.events.emit(eventType, data);
        this.broadcast(eventType, data);
    }
}

// Create a singleton instance
const sseManager = new SSEManager();

module.exports = sseManager;