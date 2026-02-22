// Import necessary modules and components
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../store";
import { setShowRetrievalPanel } from "../../store/statusSlice";
import { saveDrawingToCache } from "../../store/drawingCacheSlice";

import { PanelDisplay } from "./PanelDisplay";
import { ImageViewer } from "../common/ImageViewer/ImageViewer"; // Image viewer component

import { PreAppMetadata } from "../../types";
import "./Panel.css";



// Panel component definition
export const Panel: React.FC = () => {
  const dispatch = useDispatch();

  // Redux state selectors
  const retrievedWebData = useSelector((state: RootState) => state.retrieval.retrievedWebData); // Retrieved web data
  const searchQuery = useSelector((state: RootState) => state.retrieval.searchQuery); // Search query for filtering
  // Local state for managing enlarged image viewer
  const [enlargedImage, setEnlargedImage] = useState<{
    url: string;
    title: string;
    box?: number[][];
    metadata: PreAppMetadata;
    id?: string;
  } | null>(null);

const handleEnlargeImage = (
    e: React.MouseEvent,
    url: string,
    title: string,
    metadata: PreAppMetadata,
    id?: string
  ) => {
    e.stopPropagation(); // Prevent event propagation
    setEnlargedImage({ url, title, metadata, id }); // Update state for enlarged image
  };

  const handleSaveDrawing = (drawingBlob: Blob, appId: string) => {
    dispatch(saveDrawingToCache({ appId, drawingBlob }));
  };

  return (
    <div className="retrieval-panel-container">
      {/* Panel header with title and close button */}
      <div className="panel-header">
        <h2 className="panel-title" style={{ fontSize: "14px", color: "#595959" }}>
          UI Reference Gallery
        </h2>
        <button
          className="close-panel-button"
          onClick={() => dispatch(setShowRetrievalPanel(false))}
        >
          ×
        </button>
      </div>

      {/* Main panel content */}
      <div className="retrieval-panel">
        {/* Display search query */}
        {searchQuery ? (
          <div className="search-query-display">
            <span className="search-query-label">Search Query:</span>
            <span className="search-query-text">{searchQuery}</span>
          </div>
        ) : (
          <div className="search-query-display">
            <div className="search-query-helper" style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
              Please type your search query in the chat window.
            </div>
          </div>
        )}

        {/* Panel display for retrieved web data */}
        <PanelDisplay webPageData={retrievedWebData || []} onEnlargeImage={handleEnlargeImage} />

        {/* Image viewer for enlarged images */}
        <ImageViewer
          isOpen={!!enlargedImage}
          imageUrl={enlargedImage?.url || ""}
          imageTitle={enlargedImage?.title || ""}
          metadata={enlargedImage?.metadata}
          id={enlargedImage?.id}
          onClose={() => setEnlargedImage(null)}
          showMetadata={true}
          onSaveDrawing={handleSaveDrawing}
        />
      </div>
    </div>
  );
};