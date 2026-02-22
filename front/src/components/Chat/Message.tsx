import React from "react";
import { SearchOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Message as MessageType } from "../../types";
import { ExampleChip } from "./ExampleChip"; // Import ExampleChip
import { TagChip } from "./TagChip"; // Import TagChip
import "./Message.css"; // Import the CSS file for styling

interface MessageProps {
  message: MessageType;
  onImageClick?: (imageSrc: string) => void;
}

// Helper function to process highlight syntax for plain text display
const processHighlightSyntax = (text: string): React.ReactElement => {
  const parts = text.split(/==(.*?)==/g);
  return (
    <>
      {parts.map((part, index) => {
        // Every odd index is a highlighted part
        if (index % 2 === 1) {
          return <mark key={index}>{part}</mark>;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

export const Message: React.FC<MessageProps> = ({ message, onImageClick }) => {
  return (
    <div
      className={`message-wrapper ${message.sender === "user"
        ? "user-message-wrapper"
        : "bot-message-wrapper"
        }`}
    >
      <div
        className={`message ${message.sender === "user" ? "user-message" : "bot-message"
          } ${message.style === "generate" ? "message-generate" : ""}`}
      >
        {/* Render mode label on top */}
        {message.mode === "retrieve" && (
          <div className="message-mode retrieve-mode">
            <SearchOutlined className="mode-icon" />
            <span className="mode-label">Search</span>
          </div>
        )}
        {message.mode === "apply" && (
          <div className="message-mode apply-mode">
            <ThunderboltOutlined className="mode-icon" />
            <span className="mode-label">Apply</span>
          </div>
        )}

        {/* Render message content */}
        <div className="message-content">
          {message.type === "web_image" ? (
            <img
              src={`data/${message.content}/${message.content}.png`}
              alt="Web Image"
              className="web-image"
              onClick={() =>
                onImageClick?.(`data/${message.content}/${message.content}.png`)
              }
            />
          ) : (
            <div className="plain-text-content">
              {processHighlightSyntax(message.content)}
            </div>
          )}
        </div>

        {/* Render ExampleChip and TagChip inline */}
        <div className="message-inline-chips">
          {message.example && (
            <ExampleChip
              title={message.example.title} // Pass the title of the example
              canClose={false} // Disable the close button
            />
          )}
          {message.tag && (
            <TagChip
              tag={message.tag} // Pass the tag
              canClose={false} // Disable the close button
            />
          )}
        </div>
      </div>
    </div>
  );
};