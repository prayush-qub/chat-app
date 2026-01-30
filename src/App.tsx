import { useState, useEffect, useRef } from 'react'
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ArrowUpIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import './App.css'

function App() {
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [username, setUserName] = useState('');
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('room-1');
  const [isOtherUserTyping, setOtherUserTyping] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  //connecting to websocket server
  // useEffect is used when the site wants to load things like subscription models, Dom manipulation, Web socket connection
  // then that is done only once the mounting of the site is complete as react believes in pure rendering

  //Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({behavior: 'smooth'})
  }, [messages, isOtherUserTyping]);

  useEffect(() => {
    if(!joined) return

    // ? -> Query Params
    const socket = new WebSocket(`ws://localhost:3001/?roomId=${roomId}`)
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if(data.type === 'typing'){
        setOtherUserTyping(true);
        if(typingTimeoutRef.current )
      }
    }
  }, [joined])

  const sendMessage = () => {
      if(socketRef.current == null){ return }
      if(messageInput.trim() === ''){ return }
        const message = {
          text: messageInput,
          timestamp: new Date().toISOString(),
        };
        
        socketRef.current.send(JSON.stringify(message));
        setMessages(prev => [...prev, { ...message, isMe: true }]);
        setMessageInput("")
    }

  function handleTyping() {
    if(!socketRef.current) return
    socketRef.current.send(JSON.stringify({type: 'typing'}))
  }

  return (  
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4 gap-4 bg-white">
      <header className="flex justify-between items-center border-b pb-2">
        <h1 className="text-xl font-bold tracking-tight">Room: {roomId}</h1>
        <div className="flex items-center gap-2">
           <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
           <span className="text-xs text-gray-500">Live</span>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4 border rounded-xl bg-slate-50/30">
        {isOtherUserTyping && (
          <div className="flex items-center gap-2 mb-4 animate-pulse">
            <div className="bg-slate-200 px-4 py-2 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                msg.isMe 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-white border text-slate-800 rounded-tl-none"
              }`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex items-end gap-2 bg-white p-2 border rounded-xl shadow-sm">
        <Textarea
          value={messageInput}
          onChange={(e) => {
            setMessageInput(e.target.value)
            handleTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Message..."
          className="flex-1 min-h-[40px] max-h-[120px] border-none focus-visible:ring-0 resize-none p-2"
        />
        <Button 
          onClick={sendMessage} 
          disabled={!messageInput.trim()}
          size="icon" 
          className="rounded-full h-9 w-9 bg-blue-600 hover:bg-blue-700 shrink-0"
        >
          <ArrowUpIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
export default App
