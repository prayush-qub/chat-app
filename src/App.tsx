import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  ArrowUpIcon, 
  MoreVertical, 
  Search, 
  MessageSquare, 
  LogOut, 
  Circle,
  Hash
} from "lucide-react";
import type { Message, WebSocketData } from './types';


function App() {
  // ---------------------------------------------------------------------------
  // REACT STATE MANAGEMENT
  // State variables trigger a re-render of the UI whenever they change.
  // ---------------------------------------------------------------------------
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [username, setUserName] = useState('');
  const [roomId, setRoomId] = useState('room-1');
  const [joined, setJoined] = useState(false);
  const [isOtherUserTyping, setOtherUserTyping] = useState(false);

  // ---------------------------------------------------------------------------
  // REFS (REFERENCES)
  // Refs hold values that persist across renders but DO NOT trigger re-renders 
  // when they change. They are perfect for timers, direct DOM access, and mutable objects.
  // ---------------------------------------------------------------------------

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const lastTypedRef = useRef<number>(0);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherUserTyping]);

  useEffect(() => {
    if (!joined) return;
    const socket = new WebSocket(`ws://localhost:3001/?roomId=${roomId}`);
    socketRef.current = socket;
    socket.onopen = () => {
      console.log('Connected to chat server');
    };

    socket.onmessage = (event) => {
      try {
        const data: WebSocketData = JSON.parse(event.data);
        if (data.type === 'typing') {
          setOtherUserTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(false);
          }, 1000);
        } else {
          setMessages((prev) => [
            ...prev, 
            { 
              text: data.text || '', 
              senderName: data.senderName || 'Anonymous', 
              timestamp: data.timestamp || new Date().toISOString(), 
              isMe: false 
            }
          ]);
          setOtherUserTyping(false);
        }
      } catch (error) {
        console.error("Failed to parse websocket message", error);
      }
    };
    return () => {
      socket.close();
    };
  }, [joined, roomId]);

  // ---------------------------------------------------------------------------
  // EVENT HANDLERS
  // ---------------------------------------------------------------------------

  const sendMessage = () => {
    if (!socketRef.current || messageInput.trim() === '') return;

    const messagePayload = {
      text: messageInput,
      senderName: username,
      timestamp: new Date().toISOString(),
    };
    socketRef.current.send(JSON.stringify(messagePayload));
    setMessages((prev) => [...prev, { ...messagePayload, isMe: true }]);
    
    setMessageInput("");
  };

  const handleTyping = () => {
    if (!socketRef.current) return;
    const now = Date.now();


    if (now - lastTypedRef.current > 2000) {
      socketRef.current.send(JSON.stringify({ type: 'typing' }));
      lastTypedRef.current = now;
    }
  };

  // ---------------------------------------------------------------------------
  // LOGIN SCREEN
  // If the user hasn't joined, show the entry form.
  // ---------------------------------------------------------------------------
  if (!joined) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

        <Card className="w-full max-w-md p-8 bg-white/80 backdrop-blur-sm border-zinc-200 shadow-2xl relative z-10">
          <div className="flex flex-col space-y-2 text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tighter text-zinc-900">Welcome Back</h1>
            <p className="text-zinc-500 text-sm">Enter your details to join the secure channel.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username</label>
              <Input 
                placeholder="e.g. Alice"
                value={username}
                onChange={(e) => setUserName(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Room ID</label>
              <Input 
                placeholder="e.g. room-1"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="bg-white"
              />
            </div>
            
            <Button 
              className="w-full mt-4" 
              size="lg"
              disabled={!username || !roomId}
              onClick={() => setJoined(true)}
            >
              Enter Room
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN CHAT INTERFACE
  // The structure is a Sidebar (Left) and Chat Area (Right).
  // ---------------------------------------------------------------------------
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-zinc-950 font-sans">
      
      {/* 
        SIDEBAR 
      */}
      <aside className="hidden md:flex w-[80px] lg:w-[320px] flex-col border-r bg-zinc-50/50 dark:bg-zinc-900/50">
        
        {/* Sidebar Header */}
        <header className="h-16 flex items-center justify-between px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              C
            </div>
            <span className="font-semibold hidden lg:block">ChatGenius</span>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground hidden lg:flex">
            <MessageSquare className="h-5 w-5" />
          </Button>
        </header>

        {/* Search Area */}
        <div className="p-4 hidden lg:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search chats..." 
              className="pl-9 bg-background border-zinc-200" 
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto p-2 lg:p-4 space-y-2">
           <div className="text-xs font-semibold text-muted-foreground px-2 mb-2 hidden lg:block uppercase tracking-wider">
             Active Rooms
           </div>
           
           {/* Active Room Card */}
           <button className="w-full flex items-center gap-3 p-3 bg-white border border-zinc-200 shadow-sm rounded-xl transition-all hover:bg-zinc-100 group">
             <div className="relative">
                <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-zinc-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                   <Hash className="h-5 w-5 text-zinc-500" />
                </div>
                {/* Online Status Dot */}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
             </div>
             
             {/* Text info hidden on tablet, visible on desktop */}
             <div className="hidden lg:block flex-1 text-left">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-semibold text-sm text-zinc-900">{roomId}</span>
                  <span className="text-[10px] text-muted-foreground">Now</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                   {isOtherUserTyping 
                    ? <span className="text-primary font-medium animate-pulse">Someone is typing...</span> 
                    : messages.length > 0 ? messages[messages.length-1].text : "No messages yet"}
                </p>
             </div>
           </button>
        </div>

        <div className="p-4 border-t bg-background mt-auto">
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium">{username}</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto hidden lg:flex" onClick={() => window.location.reload()}>
               <LogOut className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </aside>

      {/* 
        CHAT AREA 
      */}
      <main className="flex-1 flex flex-col relative bg-zinc-50/30">
        <header className="h-16 min-h-[64px] flex items-center justify-between px-6 border-b bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 md:hidden">
               <Hash className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base flex items-center gap-2">
                {roomId}
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide">Live</span>
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                 {isOtherUserTyping ? (
                   <>
                     <span className="flex h-2 w-2 relative">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                     </span>
                     Typing...
                   </>
                 ) : "Online"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </header>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Welcome Message Divider */}
          <div className="flex items-center justify-center gap-4 my-6 opacity-50">
             <div className="h-[1px] bg-zinc-200 w-24"></div>
             <span className="text-xs font-medium text-zinc-400">Today</span>
             <div className="h-[1px] bg-zinc-200 w-24"></div>
          </div>

          {messages.map((msg, i) => {
            const isSequence = i > 0 && messages[i - 1].senderName === msg.senderName;
            
            return (
              <div 
                key={i} 
                className={`flex gap-3 w-full ${msg.isMe ? "justify-end" : "justify-start"} group animate-in slide-in-from-bottom-2 duration-300`}
              >
                {!msg.isMe && (
                  <div className={`h-8 w-8 rounded-full flex-shrink-0 bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600 ${isSequence ? "opacity-0" : "opacity-100"}`}>
                    {msg.senderName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className={`flex flex-col max-w-[75%] md:max-w-[60%] ${msg.isMe ? "items-end" : "items-start"}`}>
                  
                  {!msg.isMe && !isSequence && (
                    <span className="text-[11px] text-zinc-500 ml-1 mb-1">{msg.senderName}</span>
                  )}

                  <div 
                    className={`
                      px-4 py-2.5 rounded-2xl text-sm shadow-sm relative leading-relaxed
                      ${msg.isMe 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-white border border-zinc-200 text-zinc-800 rounded-tl-none" 
                      }
                    `}
                  >
                    {msg.text}
                    
                    <div className={`text-[9px] mt-1 text-right w-full opacity-70 ${msg.isMe ? "text-primary-foreground" : "text-muted-foreground"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {msg.isMe && (
                   <div className="h-8 w-8 opacity-0"></div>
                )}
              </div>
            );
          })}
          
          {isOtherUserTyping && (
             <div className="flex gap-3 w-full justify-start animate-in fade-in duration-300">
               <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs">
                 <Circle className="h-3 w-3 animate-pulse" />
               </div>
               <div className="bg-zinc-100 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                 <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
               </div>
             </div>
          )}

          <div ref={scrollRef} className="h-px" />
        </div>

        <footer className="p-4 bg-background border-t">
          <div className="max-w-4xl mx-auto flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-3xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            
            <input
              className="flex-1 bg-transparent border-none px-4 py-3 max-h-32 text-sm focus:outline-none placeholder:text-zinc-400 resize-none"
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              autoComplete="off"
            />

            <Button 
              onClick={sendMessage} 
              disabled={!messageInput.trim()}
              size="icon"
              className={`rounded-full h-10 w-10 shrink-0 transition-all duration-200 ${messageInput.trim() ? 'bg-primary scale-100' : 'bg-zinc-200 text-zinc-400 scale-90'}`}
            >
              <ArrowUpIcon className="h-5 w-5" />
            </Button>
          </div>
          <div className="text-center mt-2 text-[10px] text-muted-foreground">
             Press <strong>Enter</strong> to send
          </div>
        </footer>

      </main>
    </div>
  );
}

export default App;