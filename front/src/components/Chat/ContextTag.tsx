import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { setSelectedTag, setSelectedExample } from "../../store/selectionSlice";
import { ExampleChip } from "./ExampleChip";
import { TagChip } from "./TagChip";

export const ContextTag: React.FC = () => {
  const dispatch = useDispatch();

  // Get selected example and tag from Redux
  const selectedExample = useSelector((state: RootState) => state.selection.selectedExample);
  const selectedTag = useSelector((state: RootState) => state.selection.selectedTag);

  return (
    <div className="context-tags-container">
      {/* Render ExampleChip if selectedExample exists */}
      {selectedExample && (
        <ExampleChip
          title={selectedExample.title} // Pass the title of the selectedExample
          canClose={true} // Allow closing the chip
          onRemove={() => dispatch(setSelectedExample(null))} // Reset selectedExample using Redux
        />
      )}
      {/* Render TagChip if selectedTag exists */}
      {selectedTag && (
        <TagChip
          tag={selectedTag} // Pass the selected tag
          canClose={true} // Allow closing the chip
          onRemove={() => {
            dispatch(setSelectedTag(null))
            // dispatch(setSearchQuery(undefined)); // Reset search query when tag is removed
            // dispatch(setRetrievedWebData([])); // Reset retrieved web data when tag is removed
            // dispatch(setSelectedExample(null)); // Reset selectedExample when tag is removed
          }} // Reset selectedTag using Redux
        />
      )}
    </div>
  );
};