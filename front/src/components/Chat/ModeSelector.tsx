import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { setMode, setShowRetrievalPanel } from "../../store/statusSlice"; // Import setMode action
import { HighlightOutlined, MessageOutlined, SearchOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { InputMode } from "../../types";
import { setSelectedExample, setSelectedTag } from "../../store/selectionSlice";
import { Button, Tooltip } from "antd";
import { setRetrievedWebData, setSearchQuery } from "../../store/retrievalSlice";



export const ModeSelector: React.FC = () => {
  const dispatch = useDispatch();

  // Get the current mode and loading state from Redux
  const mode = useSelector((state: RootState) => state.status.mode);
  const isLoading = useSelector((state: RootState) => state.status.loading);
  const condition = useSelector((state: RootState) => state.status.condition);
  const messages = useSelector((state: RootState) => state.messages.messages);
  const selectedExample = useSelector((state: RootState) => state.selection.selectedExample);
  const selectedTag = useSelector((state: RootState) => state.selection.selectedTag);


  const handleModeSelect = (mode: InputMode) => {
    dispatch(setMode(mode)); // Dispatch the mode change to the Redux store

    if (mode === "retrieve") {
      dispatch(setSelectedExample(null));
      // dispatch(setShowRetrievalPanel(true));
    } else if (mode === "apply") {
      dispatch(setSelectedTag(null));
    } else {
      dispatch(setSelectedTag(null));
      dispatch(setSelectedExample(null));
      dispatch(setSearchQuery(undefined)); // Reset search query when switching modes
      dispatch(setRetrievedWebData([])); // Reset retrieved web data when switching modes
      dispatch(setShowRetrievalPanel(false)); // Hide retrieval panel when switching modes
    }
  };
  if (condition !== "experiment" || messages.length === 0) {
    return null; // If condition is not "experiment", do not render the mode selector
  }

  return (
<div className="mode-selector-area" style={selectedTag ? { backgroundColor: "#f6d9fc" } : {backgroundColor: "#f9fafb"}}>
  <div className="mode-buttons-left">
    <Tooltip placement="bottom" title="Describe your design and refine it with AI suggestions">
      <button
        className={`mode-button ${mode === "chat" ? "active" : ""}`}
        onClick={() => handleModeSelect("chat")}
        disabled={isLoading}
      >
        <MessageOutlined /> Chat
      </button>
    </Tooltip>

    <Tooltip placement="bottom" title="Find real-world UI examples for inspiration">
      <button
        className={`mode-button ${mode === "retrieve" ? "active" : ""}`}
        onClick={() => handleModeSelect("retrieve")}
        disabled={isLoading}
      >
        <SearchOutlined /> Search
      </button>
    </Tooltip>

    {selectedExample && (
      <Tooltip placement="bottom" title="Apply a selected example to your current design">
        <button
          className={`mode-button ${mode === "apply" ? "active" : ""}`}
          onClick={() => handleModeSelect("apply")}
          disabled={isLoading}
        >
          <ThunderboltOutlined /> Apply
        </button>
      </Tooltip>
    )}
  </div>
  
  {selectedExample && (
  <div className="mode-button-right">
    <Tooltip placement="bottom" title="Select a UI element in the preview to apply changes">
      <Button
        type={selectedTag !== null ? "primary" : "default"}
        shape="circle"
        icon={<HighlightOutlined />}
        // onClick={toggleMode}
        style={{
          backgroundColor: selectedTag !== null ? "#971ac4" : "transparent",
          borderColor: "#971ac4",
          color: selectedTag !== null ? "#fff" : "#971ac4",
        }}
      />
    </Tooltip>
  </div>
  )}
</div>
  );
};