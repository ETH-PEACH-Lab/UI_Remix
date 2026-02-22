import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { ChatInput } from "./ChatInput";
import { Message } from "./Message";
import LoadingMessage from "../common/LoadingMessage/LoadingMessage";
import { ChatHeader } from "./ChatHeader";
import "./Chat.css";

export function Chat() {
  // Refs for managing scrolling and container references
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Local state for drag-and-drop and image modal
  const [isDragging, setIsDragging] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // Redux state selectors
  const isLoading = useSelector((state: RootState) => state.status.loading); // Loading state
  const loadingType = useSelector((state: RootState) => state.status.loadingType); // Type of loading
  const messages = useSelector((state: RootState) => state.messages.messages); // Chat messages

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    // TODO: Implement file drop logic here
  };

  return (
    <div
      className="chat-main"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Chat header */}
      <ChatHeader />

      {/* Image modal for enlarged images */}
      {enlargedImage && (
        <div className="image-modal-overlay" onClick={() => setEnlargedImage(null)}>
          <div className="image-modal-content">
            <img src={enlargedImage} alt="Enlarged" className="enlarged-image" />
            <button className="close-modal-btn" onClick={() => setEnlargedImage(null)}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* Drag-and-drop overlay */}
      <div className={`drop-overlay ${isDragging ? "active" : ""}`}>
        <div className="drop-message">Drop files here</div>
      </div>

      {/* Messages container */}
      <div className="messages-container" ref={messagesContainerRef}>
        {/* Render chat messages */}
        {messages
          .filter((message) => message.type !== "file") // Exclude file messages
          .map((message) => (
            <Message key={message.messageId} message={message} onImageClick={setEnlargedImage} />
          ))}

        {/* Render loading message if applicable */}
        {isLoading && loadingType && (
          <div className="message bot-message">
            <LoadingMessage message={`${loadingType}`} className={`in-chat ${loadingType}`} />
          </div>
        )}

        {/* Scroll anchor for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <ChatInput />
    </div>
  );
}

