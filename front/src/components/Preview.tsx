import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux"; // Import useSelector and useDispatch
import { RootState } from "../store"; // Import RootState for type safety
import { setSelectedTag } from "../store/selectionSlice"; // Import setSelectedTag action
import { injectHighlighter } from "./InitialHTML";
import { CodeView } from "./CodeView";
import { IPhone15Frame } from "./iPhone15Frame";
import { setIsSpecific } from "../store/selectionSlice";
import "./Preview.css";
import { setMode } from "../store/statusSlice";
import { trackIframeElementClicked } from "../store/userTrackingSlice";


export function Preview() {
  const dispatch = useDispatch(); // Initialize Redux dispatch
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeSrcDoc, setIframeSrcDoc] = useState<string>("");

  // Get selectedTag from Redux store
  const selectedTag = useSelector((state: RootState) => state.selection.selectedTag);
  // Get showPreview from Redux store
  const showPreview = useSelector((state: RootState) => state.status.showPreview);
  const selectedExample = useSelector((state: RootState) => state.selection.selectedExample); // Get selectedExample from Redux store
  const code = useSelector((state: RootState) => state.code.code); // Get code from Redux store
  const condition = useSelector((state: RootState) => state.status.condition); // Get condition from Redux store
  const [isDragging, _setIsDragging] = useState(false);

  useEffect(() => {
    if (condition === "baseline") {
      sendMessageToIframe("", "clean");
      return;
    }
  }, [condition]);

  // When selectedTag changes, notify the iframe.
  useEffect(() => {
    if (selectedTag) {
      sendMessageToIframe(selectedTag, "highlight");
    } else {
      sendMessageToIframe("", "clearSelection");
    }
  }, [selectedTag]);

  const updateIframeContent = () => {
    if (code) {
      const injected_code: string = injectHighlighter(code);
      setIframeSrcDoc(injected_code);
    }
  };

  const updateIframeContentDirectly = () => {
    if (code) {
      updateIframeContent();
    }
  };


  useEffect(() => {
    updateIframeContentDirectly();
  }, [code]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // if (event.origin !== "your-trusted-origin") return;
      if (condition === "baseline" || !selectedExample) {
        sendMessageToIframe("", "clean");
        return;
      }
      const { type, tagId } = event.data;

      if (type === "mouseEnter") {
        sendMessageToIframe(tagId, "highlight");
      } else if (type === "mouseLeave") {
        sendMessageToIframe(tagId, "unhighlight");
      } else if (type === "elementClicked") {
        const { xpath } = event.data;
        
        dispatch(trackIframeElementClicked({
          elementXPath: xpath,
          elementTag: tagId,
        }));
        
        sendMessageToIframe(tagId, "highlight");
        dispatch(setSelectedTag(xpath)); // Use Redux to set selectedTag
        dispatch(setIsSpecific(true));
        dispatch(setMode("retrieve")); // Auto-switch to retrieve mode after selecting an element.
      } else if (type === "elementUnselected") {
        dispatch(setSelectedTag(null)); // Use Redux to reset selectedTag
        dispatch(setIsSpecific(false));
        dispatch(setMode("chat")); // Switch back to chat mode after clearing selection.
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [dispatch, selectedExample, condition]);

  const sendMessageToIframe = (tagId: string, action: string) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          tagId,
          action,
        },
        "*"
      ); // In production, prefer a strict targetOrigin instead of '*'.
    }
  };

  return (
    <div className="main-content">
      <div className={`frame-view ${showPreview ? "visible" : "hidden"}`}>
        <IPhone15Frame color="black">
          <div className="preview-view-container top-padding visible">
            <iframe
              ref={iframeRef}
              title="Preview"
              className={`preview-iframe ${isDragging ? "dragging" : ""}`}
              sandbox="allow-same-origin allow-scripts"
              srcDoc={iframeSrcDoc}
            ></iframe>
          </div>
        </IPhone15Frame>
      </div>

      <div className={`code-view ${showPreview ? "hidden" : "visible"}`}>
        <div className="preview-view-container visible">
          <CodeView />
        </div>
      </div>
    </div>
  );
}
