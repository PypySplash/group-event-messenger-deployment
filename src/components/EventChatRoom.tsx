"use client";

import { useEffect, useState, useRef } from "react";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { socket } from "@/lib/socket"; // Import local socket instance
import { getAvatar } from "@/lib/utils";

type Message = {
  id: number;
  content: string;
  createdAt: string;
  userHandle: string;
  displayName: string;
};

type EventChatRoomProps = {
  eventId: number;
  currentUserHandle?: string;
  currentUserName?: string;
  isJoined: boolean;
};

export default function EventChatRoom({
  eventId,
  currentUserHandle,
  currentUserName,
  isJoined,
}: EventChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Load history & Setup Socket
  useEffect(() => {
    if (!eventId) return;

    // Connect to socket
    if (!socket.connected) {
      console.log("Connecting to socket...");
      socket.connect();
    }

    socket.on("connect", () => {
      console.log("✅ Socket Connected!", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket Connection Error:", err);
    });

    // Join room
    const roomId = eventId.toString();
    console.log("Joining room:", roomId);
    socket.emit("join_room", roomId);

    // Listen for incoming messages
    const handleReceiveMessage = (newComment: Message) => {
      console.log("📩 Received message:", newComment);
      setMessages((prev) => [...prev, newComment]);
    };

    socket.on("receive_message", handleReceiveMessage);

    // Initial Load
    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}/comments`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.comments);
            }
        } catch (e) {
            console.error("Failed to load messages", e);
        }
    };

    fetchMessages();

    return () => {
        socket.off("receive_message", handleReceiveMessage);
        // We don't disconnect here necessarily if we want to keep connection alive across pages, 
        // but for this specific component logic, maybe we leave room?
        // socket.emit("leave_room", roomId); // if server implemented it
    };
  }, [eventId]);

  // 2. Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 3. Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !currentUserHandle) return;
    if (loading) return;

    setLoading(true);
    const content = inputText;
    // Optimistic UI? Maybe later. For now safe API call.

    try {
        const res = await fetch(`/api/events/${eventId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content,
                userHandle: currentUserHandle
            })
        });

        if (res.ok) {
            setInputText("");
            const data = await res.json();
            const newComment = data.comment;
            
            // 1. Add to local list immediately
            // Note: The API should return the full comment object with displayName
            // If API doesn't return displayName, we might need to patch it client-side temporarily
            // or update the API to return relation.
            // Let's assume API returns basic info, we might miss displayName here.
            // Simplified fix: Just refetch or append what we have.
            
            // Let's trust the API returns the inserted row. 
            // We need to inject displayName manually since Drizzle insert return won't include join
            // Or we just fetch the latest list? Fetching is safer but slower.
            // Broadcasting via socket:
            
            // We need to shape the message for the socket
            // The socket expects what `messages` state expects
            const messageForSocket = {
                ...newComment,
                // fallback if API doesn't return joined fields
                displayName: newComment.displayName || currentUserName || currentUserHandle, 
            };

            setMessages((prev) => [...prev, messageForSocket]);
            
            // 2. Emit to Socket Server
            socket.emit("send_message", {
                eventId: eventId.toString(),
                comment: messageForSocket
            });
        }
    } catch (e) {
        console.error("Failed to send", e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
        <div className="p-4 border-b bg-white shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="text-blue-500" />
            <h2 className="font-bold text-lg text-slate-800">Event Chat</h2>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4" ref={scrollRef}>
          {messages.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageCircle size={48} className="mb-2 opacity-20" />
                <p>No messages yet.</p>
                {!isJoined && (
                    <p className="text-sm text-red-400 mt-2">Join event to start chatting</p>
                )}
             </div>
          ) : (
            messages.map((msg) => {
                const isMe = msg.userHandle === currentUserHandle;
                return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            {/* Avatar using DiceBear */}
                            <img 
                                src={getAvatar(msg.displayName || msg.userHandle)}
                                alt={msg.displayName}
                                className="w-8 h-8 rounded-full bg-slate-200 shrink-0 object-cover"
                            />
                            
                            <div className={`px-4 py-2 rounded-2xl text-sm ${
                                isMe 
                                ? "bg-blue-500 text-white rounded-br-none" 
                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                            {msg.displayName} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                )
            })
          )}
        </div>

        {/* Chat Input Area */}
        <div className="p-4 bg-white border-t">
          <form 
            onSubmit={handleSendMessage}
            className="relative flex items-center gap-2"
          >
            <Input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                type="text" 
                placeholder={isJoined ? "Type a message..." : "Join event to chat"} 
                disabled={!isJoined || loading}
                className="flex-1 rounded-full bg-slate-100 border-none focus-visible:ring-blue-500"
            />
            <Button 
                type="submit"
                disabled={!isJoined || loading || !inputText.trim()}
                size="icon"
                className="rounded-full bg-blue-500 hover:bg-blue-600 w-10 h-10 shrink-0"
            >
                <Send size={18} className="ml-0.5" />
            </Button>
          </form>
        </div>
    </div>
  );
}
