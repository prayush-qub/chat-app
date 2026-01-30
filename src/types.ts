// types.ts

// This interface defines the structure of a message stored in React state
export interface Message {
  text: string;
  senderName: string;
  timestamp: string;
  isMe: boolean;
}

// This interface defines the shape of data traveling over the WebSocket
// Using a "type" field allows the client to distinguish between 
// actual chat messages and system events like 'typing'.
export interface WebSocketData {
  type?: 'chat' | 'typing'; 
  text?: string;
  senderName?: string;
  timestamp?: string;
}