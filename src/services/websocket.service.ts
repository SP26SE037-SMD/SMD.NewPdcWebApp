// /**
//  * WebSocket/STOMP Service
//  *
//  * Manages the STOMP connection over SockJS and provides
//  * subscribe/unsubscribe helpers for notification topics.
//  *
//  * Usage:
//  *  1. Call `connect()` after login with the user context.
//  *  2. Subscribe to topics via `subscribe(topic, callback)`.
//  *  3. Call `disconnect()` on logout.
//  */

// import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
// import SockJS from 'sockjs-client';
// import { RealtimePayload } from '@/types/notification';

// // Backend WebSocket handshake endpoint (SockJS fallback for web)
// const WS_ENDPOINT = '/ws';

// // Resolve the full WebSocket URL based on environment
// function getWsUrl(): string {
//   // In production, use the BACKEND_URL or same origin.
//   // NEXT_PUBLIC_WS_URL can be set explicitly, otherwise derive from BACKEND_URL.
//   const explicit = process.env.NEXT_PUBLIC_WS_URL;
//   if (explicit) return explicit;

//   // Fallback: use the backend URL from env (available client-side via NEXT_PUBLIC_)
//   const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://43.207.156.116';
//   return `${backendUrl}${WS_ENDPOINT}`;
// }

// class WebSocketService {
//   private client: Client | null = null;
//   private subscriptions: Map<string, StompSubscription> = new Map();
//   private _connected = false;
//   private reconnectAttempts = 0;
//   private maxReconnectAttempts = 10;
//   private onConnectCallbacks: Array<() => void> = [];

//   get connected(): boolean {
//     return this._connected;
//   }

//   /**
//    * Establish the STOMP connection.
//    * `token` is the JWT if the backend requires auth headers on upgrade.
//    */
//   connect(token?: string): void {
//     if (this.client?.connected) {
//       console.log('[WS] Already connected');
//       return;
//     }

//     const wsUrl = getWsUrl();
//     console.log(`[WS] Connecting to ${wsUrl}...`);

//     this.client = new Client({
//       // SockJS factory for fallback transports
//       webSocketFactory: () => new SockJS(wsUrl) as any,

//       // Optional STOMP connect headers (e.g. for auth)
//       connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},

//       // Debug logging (disable in production)
//       debug: (str) => {
//         if (process.env.NODE_ENV === 'development') {
//           console.log(`[STOMP] ${str}`);
//         }
//       },

//       // Heartbeat (ms)
//       heartbeatIncoming: 10000,
//       heartbeatOutgoing: 10000,

//       // Auto-reconnect settings
//       reconnectDelay: 5000,

//       onConnect: () => {
//         console.log('[WS] Connected ✓');
//         this._connected = true;
//         this.reconnectAttempts = 0;
//         // Fire queued callbacks
//         this.onConnectCallbacks.forEach((cb) => cb());
//         this.onConnectCallbacks = [];
//       },

//       onDisconnect: () => {
//         console.log('[WS] Disconnected');
//         this._connected = false;
//       },

//       onStompError: (frame) => {
//         console.error('[WS] STOMP error:', frame.headers['message'], frame.body);
//         this._connected = false;
//       },

//       onWebSocketClose: () => {
//         console.warn('[WS] WebSocket closed');
//         this._connected = false;
//         this.reconnectAttempts++;
//       },
//     });

//     this.client.activate();
//   }

//   /**
//    * Wait until connected, then execute callback.
//    */
//   private whenConnected(fn: () => void): void {
//     if (this._connected && this.client?.connected) {
//       fn();
//     } else {
//       this.onConnectCallbacks.push(fn);
//     }
//   }

//   /**
//    * Subscribe to a STOMP topic.
//    * Returns an unsubscribe function.
//    */
//   subscribe(
//     topic: string,
//     callback: (payload: RealtimePayload) => void,
//   ): () => void {
//     const doSubscribe = () => {
//       if (!this.client) return;

//       // Avoid duplicate subscriptions
//       if (this.subscriptions.has(topic)) {
//         console.log(`[WS] Already subscribed to ${topic}`);
//         return;
//       }

//       const subscription = this.client.subscribe(topic, (message: IMessage) => {
//         try {
//           const payload: RealtimePayload = JSON.parse(message.body);
//           callback(payload);
//         } catch (e) {
//           console.error('[WS] Failed to parse message:', e, message.body);
//         }
//       });

//       this.subscriptions.set(topic, subscription);
//       console.log(`[WS] Subscribed to ${topic}`);
//     };

//     this.whenConnected(doSubscribe);

//     // Return unsubscribe handle
//     return () => this.unsubscribe(topic);
//   }

//   /**
//    * Unsubscribe from a topic.
//    */
//   unsubscribe(topic: string): void {
//     const sub = this.subscriptions.get(topic);
//     if (sub) {
//       sub.unsubscribe();
//       this.subscriptions.delete(topic);
//       console.log(`[WS] Unsubscribed from ${topic}`);
//     }
//   }

//   /**
//    * Send (publish) a message to a destination.
//    * Destination should include the `/app` prefix.
//    */
//   send(destination: string, body: string = ''): void {
//     if (!this.client?.connected) {
//       console.warn('[WS] Cannot send – not connected');
//       return;
//     }
//     this.client.publish({ destination, body });
//   }

//   /**
//    * Disconnect and clean up.
//    */
//   disconnect(): void {
//     // Unsubscribe all
//     this.subscriptions.forEach((sub) => sub.unsubscribe());
//     this.subscriptions.clear();

//     if (this.client) {
//       this.client.deactivate();
//       this.client = null;
//     }

//     this._connected = false;
//     this.onConnectCallbacks = [];
//     console.log('[WS] Disconnected & cleaned up');
//   }
// }

// // Singleton instance
// export const wsService = new WebSocketService();
