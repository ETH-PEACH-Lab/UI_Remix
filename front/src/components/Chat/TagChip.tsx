import React from "react";
import { CloseOutlined, LinkOutlined } from "@ant-design/icons";

// Props interface for the TagChip component
interface TagChipProps {
  tag: string | null; // The tag to display inside the chip
  canClose: boolean; // Determines if the chip can be closed
  onRemove?: () => void; // Optional callback for removing the chip
}

export const TagChip: React.FC<TagChipProps> = ({ tag, canClose, onRemove }) => {
  // If no tag is provided, do not render the component
  if (!tag) return null;

  return (
    <div
      className="tag-chip"
      style={{
        borderColor: "#971ac4ff", // Purple border color
        backgroundColor: "#f6d9fdff", // Light purple background
      }}
    >
      {/* Content container for the chip */}
      <div className="tag-chip-content">
        {/* Display the tag with an icon */}
        <span className="tag-chip-title">
          <LinkOutlined style={{ marginRight: "4px" }} /> {/* Icon for visual representation */}
          {tag}
        </span>

        {/* Render the close button if canClose is true and onRemove is provided */}
        {canClose && onRemove && (
          <button
            className="tag-chip-remove"
            onClick={onRemove} // Trigger the onRemove callback when clicked
            aria-label="Remove tag" // Accessibility label for screen readers
          >
            <CloseOutlined /> {/* Close icon */}
          </button>
        )}
      </div>
    </div>
  );
};