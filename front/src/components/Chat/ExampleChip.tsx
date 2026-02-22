import React from "react";
import { CloseOutlined, PictureOutlined } from "@ant-design/icons";

// Props interface for the ExampleChip component
interface ExampleChipProps {
  title: string; // The title to display inside the chip
  canClose: boolean; // Determines if the chip can be closed
  onRemove?: () => void; // Optional callback for removing the chip
}

export const ExampleChip: React.FC<ExampleChipProps> = ({ title, canClose, onRemove }) => {
  // If no title is provided, do not render the component
  if (!title) return null;

  return (
    <div
      className="example-chip"
      style={{
        borderColor: "#1890ff", // Blue border color
        backgroundColor: "#e6f7ff", // Light blue background
      }}
    >
      {/* Content container for the chip */}
      <div className="example-chip-content">
        {/* Display the title with an icon */}
        <span className="example-chip-title">
          <PictureOutlined style={{ marginRight: "4px" }} /> {/* Icon for visual representation */}
          {title}
        </span>

        {/* Render the close button if canClose is true and onRemove is provided */}
        {canClose && onRemove && (
          <button
            className="example-chip-remove"
            onClick={onRemove} // Trigger the onRemove callback when clicked
            aria-label="Remove example" // Accessibility label for screen readers
          >
            <CloseOutlined /> {/* Close icon */}
          </button>
        )}
      </div>
    </div>
  );
};