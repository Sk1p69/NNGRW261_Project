// Central event emitter for client-side events
const eventEmitter = {
    listeners: {},
    
    // Subscribe to events
    on(eventType, callback) {
        if (!this.listeners[eventType]) {
            this.listeners[eventType] = new Set();
        }
        this.listeners[eventType].add(callback);
        
        // Return unsubscribe function
        return () => {
            if (this.listeners[eventType]) {
                this.listeners[eventType].delete(callback);
            }
        };
    },
    
    // Emit events to subscribers
    emit(eventType, data) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].forEach(callback => callback(data));
        }
    }
};