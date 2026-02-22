import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from "react-redux"; // Import useSelector and useDispatch
import Editor from '@monaco-editor/react';
import './CodeView.css';
import { setCode } from '../store/codeSlice';
import { RootState } from '../store';
import { trackCodeEdited } from '../store/userTrackingSlice';

export const CodeView = () => {
  // const [codeContent, setCodeContent] = useState(code);
  const [isLoading, setIsLoading] = useState(true);
  const editorRef = useRef(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  const previousCodeRef = useRef<string>('');
  const code = useSelector((state: RootState) => state.code.code); // Get code from Redux stor
  const dispatch = useDispatch();
  
  useEffect(() => {
    loadingTimeoutRef.current = window.setTimeout(() => {
      if (isLoading) {
        console.warn('Editor load timed out; forcing render.');
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      const previousValue = previousCodeRef.current;
      
      if (previousValue !== value && previousValue !== '') {
        dispatch(trackCodeEdited({
          previousValue: previousValue,
          newValue: value,
        }));
      }
      
      previousCodeRef.current = value;
      dispatch(setCode(value));
    }
  };

  const handleEditorDidMount = (editor: any, _monaco: any) => {
    editorRef.current = editor;
    setIsLoading(false);
    
    previousCodeRef.current = code;
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  };

  return (
    <div className="code-view-container">
      {isLoading ? (
        <div className="loading-indicator">loading...</div>
      ) : null}
      
      <div 
        className={`monaco-editor-container ${isLoading ? 'hidden' : 'visible'}`}
      >
        <Editor
          height="100%"
          defaultLanguage={'html'}
          defaultValue={code}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            scrollBeyondLastLine: true,
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            lineNumbers: 'on',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
            },
            renderLineHighlight: 'all',
            cursorBlinking: 'blink',
            theme: 'vs-light',
            padding: {
              top: 8,
              bottom: 8
            }
          }}
          loading={<div className="loading-indicator">Editor is loading...</div>}
        />
      </div>
    </div>
  );
};