import React from 'react';
import { useSelector, useDispatch } from 'react-redux'; // Import useDispatch

import { RootState } from '../../store'; // Import RootState for type safety
import { setSelectedExample } from '../../store/selectionSlice'; // Import setSelectedExample action
import { ExampleUnit } from './ExampleUnit';
import { WebpageData, PreAppMetadata } from './types';

export interface PanelControlsProps {
  webPageData: WebpageData[];
  onEnlargeImage: (e: React.MouseEvent, url: string, title: string, metadata: PreAppMetadata, id?: string, fallbackUrl?: string) => void;
}

export const PanelDisplay: React.FC<PanelControlsProps> = ({
  webPageData,
  onEnlargeImage,
}) => {
  const dispatch = useDispatch(); // Initialize Redux dispatch

  // Access selectedExample from the Redux store
  const selectedExample = useSelector((state: RootState) => state.selection.selectedExample);
  const handleSelectWebpage = (webpage: WebpageData) => {
    dispatch(setSelectedExample(webpage)); // Dispatch setSelectedExample with the selected webpage
  };

  return (
    <div className="panel-controls">
      <div className="panel-top-section">
        <div className="image-grid-container">
          {webPageData.map((webpage) => (
            <ExampleUnit
              key={webpage.id}
              {...webpage}
              isSelected={selectedExample?.id === webpage.id} // Updated for clarity
              onSelect={() => handleSelectWebpage(webpage)} // Call handleSelectWebpage
              onEnlarge={onEnlargeImage}
            />
          ))}
        </div>
      </div>
    </div>
  );
};