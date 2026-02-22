import { useEffect, useState } from "react";
import "./LoadingMessage.css";

interface LoadingMessageProps {
  message: string;
  className?: string;
}

export default function LoadingMessage({ message, className = "" }: LoadingMessageProps) {
  const [dots, setDots] = useState(".");
  const loadingMode = message;
  if (loadingMode === "searching") {
    message = "Searching";
  } else if (loadingMode === "generating") {
    message = "Generating";
  } else if (loadingMode === "applying") {
    message = "Applying";
  } else if (loadingMode === "thinking") {
    message = "Thinking (It may take up to 90 seconds to generate your design)";
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        switch (prev) {
          case ".":
            return "..";
          case "..":
            return "...";
          case "...":
            return ".";
          default:
            return ".";
        }
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`loading-message ${className}`}>
      <span className="loading-text">{message}
        <span className="loading-dots">{dots}</span>
      </span>
      
    </div>
  );
} 