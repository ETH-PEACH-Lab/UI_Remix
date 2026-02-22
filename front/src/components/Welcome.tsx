import React from "react";
import { ChatInput } from "./Chat/ChatInput"; // Import ChatInput component
import { ExperimentTwoTone } from "@ant-design/icons";
import "./Welcome.css"; // Import styles for the Welcome component

// Welcome component
export const Welcome: React.FC = () => {

  return (
    <div className="welcome-page">
      {/* Main content container */}
      <div className="welcome-content">
        {/* Application title */}
        <h1>
          <ExperimentTwoTone style={{ marginRight: 8 }} />
          UI Remix
        </h1>
        {/* Description of the application */}
        <p className="welcome-description">
          Sketch your UI ideas with words. Try something like:
        </p>

        {/* Example prompt for the user */}
        <div className="example-prompt">
          <span className="quote">"</span>
          <em>Design a mobile checkout screen with delivery time and coupon</em>
          <span className="quote">"</span>
        </div>

        {/* Footer message */}
        <p className="welcome-footer">— and watch it come to life.</p>
      </div>

      {/* Chat input for user interaction */}
      <ChatInput />
    </div>
  );
};