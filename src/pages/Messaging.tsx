import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Search, 
  User, 
  CheckCheck, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  Loader2,
  ChevronLeft
} from "lucide-react";

const Messaging: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get("/messages/conversations");
        setConversations(res.data);
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();

    // Initialize Socket.io
    socketRef.current = io();
    
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (activeChat) {
      const fetchMessages = async () => {
        try {
          const res = await api.get(`/messages/${activeChat.id}`);
          setMessages(res.data);
          socketRef.current?.emit("join_room", activeChat.id);
        } catch (err) {
          console.error("Failed to fetch messages", err);
        }
      };
      fetchMessages();
      setIsMobileListOpen(false);
    }
  }, [activeChat]);

  useEffect(() => {
    socketRef.current?.on("receive_message", (message) => {
      if (activeChat && message.roomId === activeChat.id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socketRef.current?.off("receive_message");
    };
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const messageData = {
      roomId: activeChat.id,
      senderId: user?.id,
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    socketRef.current?.emit("send_message", messageData);
    setMessages((prev) => [...prev, messageData]);
    setNewMessage("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-10rem)]">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 flex h-full overflow-hidden">
        {/* Sidebar */}
        <div className={`w-full lg:w-96 border-r border-gray-100 flex flex-col ${!isMobileListOpen ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
              />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto">
            {conversations.length > 0 ? (
              conversations.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`w-full p-4 flex items-center hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                    activeChat?.id === chat.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <User className="w-6 h-6 text-blue-800" />
                    </div>
                    {chat.online && (
                      <div className="absolute bottom-0 right-4 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-grow text-left overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-gray-900 truncate">{chat.name}</h4>
                      <span className="text-xs text-gray-400">{chat.lastTime}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                  </div>
                  {chat.unread > 0 && (
                    <div className="ml-2 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {chat.unread}
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="p-10 text-center text-gray-500">
                <p>No conversations yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-grow flex flex-col bg-gray-50 ${isMobileListOpen ? 'hidden lg:flex' : 'flex'}`}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                  <button 
                    onClick={() => setIsMobileListOpen(true)}
                    className="mr-3 p-2 hover:bg-gray-100 rounded-full lg:hidden"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <User className="w-5 h-5 text-blue-800" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{activeChat.name}</h4>
                    <p className="text-xs text-green-500 font-medium">Online</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button className="p-2 text-gray-400 hover:text-blue-800 transition-colors"><Phone className="w-5 h-5" /></button>
                  <button className="p-2 text-gray-400 hover:text-blue-800 transition-colors"><Video className="w-5 h-5" /></button>
                  <button className="p-2 text-gray-400 hover:text-blue-800 transition-colors"><Info className="w-5 h-5" /></button>
                  <button className="p-2 text-gray-400 hover:text-blue-800 transition-colors"><MoreVertical className="w-5 h-5" /></button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-grow overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
                        msg.senderId === user?.id
                          ? 'bg-blue-800 text-white rounded-tr-none'
                          : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <div className={`flex items-center mt-1 text-[10px] ${msg.senderId === user?.id ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.senderId === user?.id && <CheckCheck className="w-3 h-3 ml-1" />}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white p-4 border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow px-6 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-800 text-white p-3.5 rounded-2xl hover:bg-blue-900 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-10">
              <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                <MessageSquare className="w-12 h-12 text-blue-800" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Inbox</h3>
              <p className="text-gray-500 max-w-xs">
                Select a conversation from the list to start messaging with other banking professionals.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper for icon
import { MessageSquare } from "lucide-react";

export default Messaging;
