import { API_BASE_URL } from '../merk_services';
import eventEmitter from './event_emitter';

class RealtimeService {
    constructor() {
        this.eventSource = null;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.retryDelay = 3000; // 3 seconds
    }

    connect() {
        if (this.eventSource) {
            return;
        }

        this.eventSource = new EventSource(`${API_BASE_URL}/realtime/stream`, {
            withCredentials: true
        });

        this.eventSource.onmessage = (event) => {
            try {
                const { type, data } = JSON.parse(event.data);
                eventEmitter.emit(type, data);
            } catch (err) {
                console.error('Failed to parse SSE message:', err);
            }
        };

        this.eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            this.eventSource.close();
            this.eventSource = null;

            if (this.retryCount < this.maxRetries) {
                setTimeout(() => {
                    this.retryCount++;
                    console.log(`Retrying SSE connection (${this.retryCount}/${this.maxRetries})...`);
                    this.connect();
                }, this.retryDelay);
            } else {
                console.error('Max SSE reconnection attempts reached');
            }
        };

        this.eventSource.onopen = () => {
            console.log('SSE connection established');
            this.retryCount = 0;
        };
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    // Subscribe to specific event types
    subscribe(eventType, callback) {
        // Ensure connection is established
        this.connect();
        return eventEmitter.on(eventType, callback);
    }
}

// Create singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;