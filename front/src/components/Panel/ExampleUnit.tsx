// Import necessary modules and components
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DownloadOutlined, StarFilled, ZoomInOutlined, MessageOutlined, EditOutlined } from "@ant-design/icons";
import { formatDownloads } from '../../utils/panelUtils'; // Import utility function to get webpage title
import { PreAppMetadata } from '../../types';
import { RootState } from '../../store';
import { trackUICardClicked } from '../../store/userTrackingSlice';

// Define the props interface for the ExampleUnit component
interface ExampleUnitProps {
    id: number;
    title: string;
    thumbnail: string;
    metadata: PreAppMetadata;
    isSelected: boolean;
    onSelect: (id: number) => void;
    onEnlarge: (e: React.MouseEvent, url: string, title: string, metadata: PreAppMetadata, id?: string) => void;
}

// ExampleUnit functional component
export const ExampleUnit: React.FC<ExampleUnitProps> = ({
    id,
    title,
    thumbnail,
    metadata,
    isSelected,
    onSelect,
    onEnlarge,
}) => {
    const dispatch = useDispatch();
    
    const drawingCache = useSelector((state: RootState) => state.drawingCache.cache);
    const cacheKey = id.toString();
    const hasDrawing = !!drawingCache[cacheKey];

    // Helper function to convert binary data to object URL
    const getBlobUrl = (data: string | Blob): string => {
        if (typeof data === "string") {
            return data; // Return as is if it's already a URL string
        }
        return URL.createObjectURL(data); // Create object URL from blob
    };

    const handleCardClick = (event: React.MouseEvent) => {
        dispatch(trackUICardClicked({
            cardId: id.toString(),
            cardTitle: title,
            actionType: 'ui_card_clicked',
            coordinates: {
                x: event.clientX,
                y: event.clientY,
            },
            metadata: {
                genre: metadata.genre,
                developer: metadata.developer,
                score: metadata.score,
                installs: metadata.installs,
                reviews: metadata.reviews,
            }
        }));
        
        onSelect(id);
    };

    const handleEnlargeClick = (e: React.MouseEvent) => {
        dispatch(trackUICardClicked({
            cardId: id.toString(),
            cardTitle: title,
            actionType: 'ui_card_enlarged',
            coordinates: {
                x: e.clientX,
                y: e.clientY,
            },
            metadata: {
                genre: metadata.genre,
                developer: metadata.developer,
            }
        }));
        
        onEnlarge(e, getBlobUrl(thumbnail), title, metadata, id.toString());
    };

    return (
        <div
            className={`image-item ${isSelected ? "selected" : ""}`}
            onClick={handleCardClick}
        >
            {/* Image container with magnify button */}
            <div className="image-container">
                <img src={thumbnail} alt={title} />
                {hasDrawing && (
                    <div className="drawing-indicator" title="This app has annotations">
                        <EditOutlined />
                    </div>
                )}
                <button
                    className="magnify-button"
                    onClick={handleEnlargeClick}
                    title="Enlarge image"
                >
                    <ZoomInOutlined />
                </button>
            </div>

            {/* Application information section */}
            <div className="app-info">
                {/* Header with title */}
                <div className="app-header">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <img
                            src={metadata.icon}
                            alt={title}
                            className="app-icon"
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '5px',
                                objectFit: 'cover',
                                border: '1px solid #eee',
                                background: '#fff'
                            }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <h4 style={{ margin: 0 }}>{title}</h4>
                            <div className="stat-item" style={{ marginTop: '2px' }}>
                                {/* <UserOutlined className="meta-icon" /> */}
                                <span className="developer">{metadata.developer || 'Unknown'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics section */}
                <div className="app-stats">
                    <div className="stat-item" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <StarFilled className="stat-icon" />
                        <span>{metadata.score}</span>
                    </div>
                    <div className="stat-item" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DownloadOutlined className="stat-icon" />
                        <span>{formatDownloads(metadata.installs)}</span>
                    </div>
                    <div className="stat-item" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageOutlined className="stat-icon" />
                        <span>{metadata.reviews}</span>
                    </div>
                </div>

                {/* Metadata section */}
                <div className="app-meta">
                    <span className="genre-tag">{metadata.genre || 'Unknown'}</span>
                    <div className="meta-info" />
                </div>
            </div>
        </div>
    );
};