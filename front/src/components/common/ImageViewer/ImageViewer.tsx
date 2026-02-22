import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { PreAppMetadata } from '../../Panel/types';
import { RootState } from '../../../store';
import { removeDrawingFromCache } from '../../../store/drawingCacheSlice';
import './ImageViewer.css';
import { EditOutlined } from '@ant-design/icons';
import { trackDrawingAction } from '../../../store/userTrackingSlice';

interface ImageViewerProps {
  isOpen: boolean;
  imageUrl: string;
  fallbackUrl?: string; // Optional fallback URL.
  imageTitle: string;
  metadata?: PreAppMetadata;
  id?: string; // Unique identifier for canvas annotations.
  onClose: () => void;
  showMetadata?: boolean;
  onSaveDrawing?: (drawingBlob: Blob, appId: string) => void; // Persist annotation layer callback.
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  isOpen,
  imageUrl,
  fallbackUrl,
  imageTitle,
  metadata,
  id,
  onClose,
  showMetadata = true,
  onSaveDrawing
}) => {
  const dispatch = useDispatch();
  
  // Image transformation state
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [hasError, setHasError] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const drawingCache = useSelector((state: RootState) => state.drawingCache.cache);
  
  const cacheKey = React.useMemo(() => {
    if (id) {
      return id;
    }
    return `${imageTitle}_${imageUrl}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }, [id, imageTitle, imageUrl]);
  
  const cachedDrawing = cacheKey ? drawingCache[cacheKey] : null;

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset view
  const resetView = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Zoom is intentionally disabled.
  const zoomIn = useCallback(() => {
    return;
  }, []);

  const zoomOut = useCallback(() => {
    return;
  }, []);

  // Rotation functionality
  const rotateLeft = useCallback(() => {
    setRotation(prev => prev - 90);
  }, []);

  const rotateRight = useCallback(() => {
    setRotation(prev => prev + 90);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Mouse drag handling for image
  const handleImageMouseDown = useCallback((e: React.MouseEvent) => {
    // In annotation mode, only allow right-click drag; otherwise allow left-click drag.
    if ((isAnnotating && e.button === 2) || (!isAnnotating && e.button === 0)) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [position, isAnnotating]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse wheel zoom is intentionally disabled.

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case '=':
      case '+':
        break;
      case '-':
        break;
      // case 'r':
      // case 'R':
      //   rotateRight();
      //   break;
      // case 'l':
      // case 'L':
      //   rotateLeft();
      //   break;
      case '0':
        resetView();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
    }
  }, [onClose, zoomIn, zoomOut, rotateRight, rotateLeft, resetView, toggleFullscreen]);

  // Image error handling
  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    
    // If the primary URL fails and a fallback URL exists, try it automatically.
    if (currentImageUrl === imageUrl && fallbackUrl && currentImageUrl !== fallbackUrl) {
      setCurrentImageUrl(fallbackUrl);
      setHasError(false);
      setIsLoading(true);
    }
  }, [currentImageUrl, imageUrl, fallbackUrl]);

  // Image load success handling
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  // Update currentImageUrl when imageUrl changes
  useEffect(() => {
    setCurrentImageUrl(imageUrl);
    setHasError(false);
    setIsLoading(true);
  }, [imageUrl]);

  // Event listener setup
  useEffect(() => {
    if (isOpen) {
      // document.addEventListener('mousemove', handleMouseMove);
      // document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('keydown', handleKeyDown);
      // containerRef.current?.addEventListener('wheel', handleWheel);

      return () => {
        // document.removeEventListener('mousemove', handleMouseMove);
        // document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
        // containerRef.current?.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isOpen, handleMouseMove, handleMouseUp, handleKeyDown]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      resetView();
      setIsLoading(true);
      setIsFullscreen(false);
      setHasError(false);
      setHasDrawing(false);
      setIsAnnotating(false);
    } else {
      if (!cachedDrawing) {
        setHasDrawing(false);
        setIsAnnotating(false);
      }
    }
  }, [isOpen, resetView, cachedDrawing]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Convert screen coordinates to canvas coordinates.
  const getCanvasCoordinates = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: clientX * scaleX,
      y: clientY * scaleY
    };
  };

  // Drawing handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!isAnnotating) return;
    
    if (e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      setDrawing(true);
      
      dispatch(trackDrawingAction({
        actionType: 'drawing_started',
        cardId: id,
        coordinates: {
          x: e.clientX,
          y: e.clientY,
        }
      }));
      
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        const coords = getCanvasCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        ctx.strokeStyle = '#ff0000'; // Red pen.
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
    else if (e.button === 2) {
      handleImageMouseDown(e);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isAnnotating) return;
    
    if (drawing) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        const coords = getCanvasCoordinates(e);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (!isAnnotating) return;
    
    if (e.button === 0) {
      setDrawing(false);
      setHasDrawing(true);
      
      dispatch(trackDrawingAction({
        actionType: 'drawing_ended',
        cardId: id,
        coordinates: {
          x: e.clientX,
          y: e.clientY,
        }
      }));
    }
  };

  // Sync canvas size with the rendered image size.
  useEffect(() => {
    if ((isAnnotating || hasDrawing || cachedDrawing) && imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const container = img.parentElement;
      
      if (container) {
        const imgRect = img.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const offsetX = imgRect.left - containerRect.left;
        const offsetY = imgRect.top - containerRect.top;
        
        canvas.style.width = imgRect.width + 'px';
        canvas.style.height = imgRect.height + 'px';
        canvas.style.left = offsetX + 'px';
        canvas.style.top = offsetY + 'px';
        
        console.debug('Canvas layout:', {
          imgRect: { width: imgRect.width, height: imgRect.height, left: imgRect.left, top: imgRect.top },
          containerRect: { left: containerRect.left, top: containerRect.top },
          canvasOffset: { x: offsetX, y: offsetY },
          canvasSize: { width: imgRect.width, height: imgRect.height }
        });
        
        const needsResize = canvas.width !== img.naturalWidth || 
                           canvas.height !== img.naturalHeight ||
                           canvas.width === 0;
        
        if (needsResize) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
          }
          
          if (cachedDrawing) {
            setTimeout(() => {
              const drawingImg = new Image();
              
              drawingImg.onload = () => {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(drawingImg, 0, 0, canvas.width, canvas.height);
                  setHasDrawing(true);
                }
              };
              
              drawingImg.onerror = () => {
                console.error('Failed to load cached drawing');
              };
              
              drawingImg.src = cachedDrawing.drawingUrl;
            }, 10);
          }
        }
        
        if (isAnnotating) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
          }
        }
      }
    }
  }, [isAnnotating, hasDrawing, currentImageUrl, isLoading, cachedDrawing, scale, position, rotation]);

  // Load cached drawing layer (independent of annotation mode).
  useEffect(() => {
    if (isOpen && cachedDrawing && imageRef.current && !isLoading) {
      const loadCachedDrawing = async () => {
        try {
          if (!canvasRef.current) return;
          
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (!canvas || !ctx) return;

          const drawingImg = new Image();
          
          drawingImg.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.drawImage(drawingImg, 0, 0, canvas.width, canvas.height);
            
            setHasDrawing(true);
          };
          
          drawingImg.onerror = () => {
            console.error('Failed to load cached drawing from URL');
          };
          
          drawingImg.src = cachedDrawing.drawingUrl;
        } catch (error) {
        }
      };

      setTimeout(() => {
        loadCachedDrawing();
      }, 100);
    }
  }, [isOpen, cachedDrawing, isLoading, cacheKey]);

  // useEffect(() => {
  //   if (isOpen && cachedDrawing && !isLoading && !isAnnotating) {
  //     setIsAnnotating(true);
  //   }
  // }, [isOpen, cachedDrawing, isLoading, isAnnotating]);

  // If annotation mode is enabled and we have a cache, ensure the canvas is ready before loading.
  useEffect(() => {
    if (isOpen && cachedDrawing && canvasRef.current && imageRef.current && !isLoading && isAnnotating) {
      const timer = setTimeout(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        
        if (canvas && ctx && canvas.width > 0 && canvas.height > 0) {
          try {
            const drawingImg = new Image();
            
            drawingImg.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(drawingImg, 0, 0, canvas.width, canvas.height);
              setHasDrawing(true);
            };
            
            drawingImg.onerror = () => {
              console.error('Failed to load cached drawing from URL');
            };
            
            drawingImg.src = cachedDrawing.drawingUrl;
          } catch (error) {
          }
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isOpen, cachedDrawing, isLoading, cacheKey, isAnnotating]);

  // Save the annotation layer only.
  const saveDrawing = useCallback(async () => {
    if (!hasDrawing || !canvasRef.current || !onSaveDrawing || !cacheKey) {
      return;
    }

    try {
      const canvas = canvasRef.current;
      
      console.log('Save the canvas info', {
        canvasResolution: { width: canvas.width, height: canvas.height },
        canvasDisplaySize: { width: canvas.style.width, height: canvas.style.height },
        canvasPosition: { left: canvas.style.left, top: canvas.style.top },
        imageSize: imageRef.current ? { 
          naturalWidth: imageRef.current.naturalWidth, 
          naturalHeight: imageRef.current.naturalHeight 
        } : null,
        imageDisplaySize: imageRef.current ? (() => {
          const rect = imageRef.current.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        })() : null
      });
      
      canvas.toBlob((drawingBlob) => {
        if (drawingBlob) {
          dispatch(trackDrawingAction({
            actionType: 'drawing_saved',
            cardId: id,
            drawingData: '[Drawing Blob Data]', // Marker only; do not persist actual blob data.
          }));
          
          onSaveDrawing(drawingBlob, cacheKey);
          setIsAnnotating(false);
        }
      }, 'image/png');
    } catch (error) {
    }
  }, [hasDrawing, onSaveDrawing, cacheKey, id, dispatch]);

  // Clear annotation strokes.
  const clearAllDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawing(false);
      }
    }
    
    if (cacheKey) {
      dispatch(removeDrawingFromCache(cacheKey));
    }
  }, [cacheKey, dispatch]);

  // Toggle annotation mode.
  const handleToggleAnnotation = useCallback(() => {
    const newAnnotatingState = !isAnnotating;
    setIsAnnotating(newAnnotatingState);
    
    if (newAnnotatingState && imageRef.current && canvasRef.current) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        
        if (canvas && img && canvas.width === 0) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
          }
        }
      }, 0);
    }
  }, [isAnnotating]);

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className={`image-viewer-overlay ${isFullscreen ? 'fullscreen' : ''}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Toolbar */}
      <div className="image-viewer-toolbar">
        <div className="toolbar-left">
          <h3 className="image-title">{imageTitle}</h3>
        </div>
        <div className="toolbar-center">
          <button
            className={`toolbar-btn${isAnnotating ? ' active' : ''}`}
            title={isAnnotating ? "Exiting Painting Mode" : "Switch to the Painting Mode"}
            onClick={handleToggleAnnotation}
          >
            <EditOutlined />
          </button>

          {hasDrawing && (
            <>
              <button
                className="toolbar-btn clear-btn"
                title="Wipe Painting"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearAllDrawing();
                }}
              >
                🗑️
              </button>
              <button
                className="toolbar-btn save-btn"
                title="Save Canvas "
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  saveDrawing();
                }}
              >
                💾
              </button>
            </>
          )}
        </div>
        <div className="toolbar-right">
          <button
            className="close-btn"
            onClick={onClose}
            title="Close (Esc)"
          >
            ×
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="image-viewer-content" style={{ position: 'relative' }}>
        {/* Image container */}
        <div 
          className="image-container-zoom" 
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            cursor: isDragging ? 'grabbing' : (isAnnotating ? 'crosshair' : 'grab'),
          }}
          onMouseDown={handleImageMouseDown}
          onContextMenu={(e) => e.preventDefault()} // Disable native context menu.
        >
          {isLoading && (
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <span>Loading...</span>
            </div>
          )}
          {hasError && (
            <div className="error-indicator">
              <p>Failed to load image.</p>
              {fallbackUrl && (
                <button onClick={() => setCurrentImageUrl(fallbackUrl)}>
                  Try again with fallback
                </button>
              )}
            </div>
          )}
          <img
            ref={imageRef}
            src={currentImageUrl}
            alt={imageTitle}
            className="viewer-image"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              display: 'block',
              maxWidth: '100%',
              maxHeight: '100%',
              position: 'relative',
              zIndex: 1,
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {(isAnnotating || hasDrawing || cachedDrawing) && (
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                // top/left/width/height are set via JS to match the image precisely.
                pointerEvents: isAnnotating ? 'auto' : 'none',
                zIndex: 2,
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                cursor: isAnnotating ? 'crosshair' : 'default',
              }}
              onMouseDown={isAnnotating ? handleCanvasMouseDown : undefined}
              onMouseMove={isAnnotating ? handleCanvasMouseMove : undefined}
              onMouseUp={isAnnotating ? handleCanvasMouseUp : undefined}
              onMouseLeave={isAnnotating ? handleCanvasMouseUp : undefined}
            />
          )}
        </div>

        {/* Metadata panel */}
        {showMetadata && metadata && (
          <div className="metadata-panel">
            <h4>App Information</h4>
            <div className="metadata-content">
              <div className="metadata-row">
                <span className="metadata-label">App Name:</span>
                <span className="metadata-value">{metadata.title}</span>
              </div>
              <div className="metadata-row">
                <span className="metadata-label">Installs:</span>
                <span className="metadata-value">{metadata.installs}</span>
              </div>
              <div className="metadata-row">
                <span className="metadata-label">Rating:</span>
                <span className="metadata-value">{metadata.score}/5.0</span>
              </div>
              <div className="metadata-row">
                <span className="metadata-label">Reviews:</span>
                <span className="metadata-value">{metadata.reviews}</span>
              </div>
              <div className="metadata-row">
                <span className="metadata-label">Price:</span>
                <span className={`metadata-value ${metadata.price === 0 ? 'free' : 'paid'}`}>
                  {metadata.price === 0 ? 'Free' : `$${metadata.price}`}
                </span>
              </div>
              <div className="metadata-row">
                <span className="metadata-label">Category:</span>
                <span className="metadata-value">{metadata.genre}</span>
              </div>
              <div className="metadata-row">
                <span className="metadata-label">Developer:</span>
                <span className="metadata-value">{metadata.developer}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="shortcuts-hint">
        <div className="hint-item">Esc: Close</div>
        {/* <div className="hint-item">+/-: Zoom</div> */}
        {/* <div className="hint-item">L/R: Rotate</div> */}
        <div className="hint-item">0: Reset</div>
        <div className="hint-item">F: Fullscreen</div>
        {/* <div className="hint-item">Mouse wheel: Zoom</div> */}
        {/* <div className="hint-item">Drag: Move</div> */}
      </div>
    </div>
  );
};