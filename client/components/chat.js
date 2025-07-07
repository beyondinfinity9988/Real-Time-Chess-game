"use client";

import React, { useState, useEffect, useRef } from "react";
import socketManager from "@/components/utils/socketManager";
import { Send } from "lucide-react";

export default function Chat({
  gameId,
  playerName,
  gameEnded,
  isSpectator = false,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    console.log("Chat component mounted for game:", gameId);
    if (!gameId) return;

    // Set up chat event listeners
    socketManager.on(
      "loadChat",
      (chatMessages) => {
        console.log("Loading previous chat messages:", chatMessages);
        const formatted = chatMessages.map(
          ({ sender, message, created_at }) => ({
            user: sender,
            text: message,
            timestamp: created_at,
          })
        );
        setMessages(formatted);
      },
      "loadChat"
    );

    socketManager.on(
      "chatMessage",
      (msg) => {
        console.log("Received new chat message:", msg);
        setMessages((prev) => [
          ...prev,
          { ...msg, timestamp: new Date().toISOString() },
        ]);
      },
      "chatMessage"
    );

    // Cleanup function
    return () => {
      // Remove only chat-specific listeners
      socketManager.off("loadChat");
      socketManager.off("chatMessage");
    };
  }, [gameId]);

  // useEffect(() => {
  //   // Scroll to bottom on new message
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);
  // Scroll chat to bottom on new message
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (!scrollContainerRef.current) return;

    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() === "" || !gameId) return;

    const messageData = {
      gameId,
      user: playerName || "Anonymous",
      text: input.trim(),
    };

    console.log("Sending message:", messageData);
    socketManager.sendChatMessage(gameId, messageData.user, messageData.text);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-700/50 backdrop-blur-sm">
      <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2 border-b border-gray-700/50 pb-3">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        Game Chat
      </h3>
      <div
        className="flex-grow overflow-y-auto mb-6 space-y-3 max-h-96 scroll-container pr-2 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500"
        ref={scrollContainerRef}
      >
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center py-8 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl break-words shadow-lg transition-all duration-200 hover:shadow-xl ${
                msg.user === "System"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-center mx-auto max-w-full border border-yellow-400/30 shadow-yellow-500/20"
                  : msg.user === playerName || msg.user === "You"
                  ? "bg-gradient-to-r from-green-600 to-green-500 text-white self-end ml-auto max-w-xs shadow-green-500/20 transform hover:scale-[1.02]"
                  : "bg-gradient-to-r from-gray-700 to-gray-600 text-gray-100 self-start mr-auto max-w-xs shadow-gray-700/30 border border-gray-600/30"
              }`}
            >
              {msg.user !== "System" && (
                <div className="text-xs opacity-80 mb-2 font-medium tracking-wide">
                  {msg.user}
                </div>
              )}
              <div
                className={msg.user === "System" ? "font-semibold text-sm" : ""}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative flex bg-gray-800/50 p-3 rounded-xl border border-gray-700/50 backdrop-blur-sm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-grow rounded-xl px-4 py-3 bg-gray-900/80 text-white outline-none border border-gray-600/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 placeholder-gray-400 backdrop-blur-sm"
          disabled={!gameId || gameEnded || isSpectator}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !gameId || gameEnded || isSpectator}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-white bg-gradient-to-r from-green-600 to-green-500 rounded-full hover:from-green-700 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-green-500/25"
        >
          <Send width={20} height={20} />
        </button>
      </div>
    </div>
  );
}
