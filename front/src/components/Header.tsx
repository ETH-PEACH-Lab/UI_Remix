import { Button, Select, message } from 'antd';
import { ExperimentTwoTone, UndoOutlined, RedoOutlined, HomeOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setCondition, setShowPreview, setMode, setShowRetrievalPanel } from '../store/statusSlice'; // Import Redux actions
import { undoCode, redoCode } from '../store/codeHistorySlice';
import { setCode, fetchCodeContent } from '../store/codeSlice';
import { clearMessages } from '../store/messagesSlice';
import { setSelectedTag, setSelectedExample } from '../store/selectionSlice';
import { setSearchQuery, setRetrievedWebData } from '../store/retrievalSlice';
import { clearActions, stopTracking } from '../store/userTrackingSlice';
import { clearHistory } from '../store/codeHistorySlice';
import { exportUserActionsToCSV, generateUserActionsCSVString } from '../utils/csvExporter';


// Define the props for the Header component
interface HeaderProps {
    userEmail: string; // User's email address
    onLogout: () => void; // Logout handler function
    messagesLength: number; // Number of messages in the chat
}

// Header component
export const Header = ({
    userEmail,
    onLogout,
    messagesLength,
}: HeaderProps) => {
    const dispatch = useDispatch<AppDispatch>();

    // Get the current condition (baseline or experiment) from Redux
    const condition = useSelector((state: RootState) => state.status.condition);

    // Get the current state of showPreview (true for preview, false for code view) from Redux
    const showPreview = useSelector((state: RootState) => state.status.showPreview);

    // Get code history state
    const codeHistory = useSelector((state: RootState) => state.codeHistory);
    
    // Get user tracking state
    const userTrackingActions = useSelector((state: RootState) => state.userTracking.actions);
    const trackingUserName = useSelector((state: RootState) => state.userTracking.userName);
    


    // Handle condition change (baseline or experiment)
    const handleConditionChange = (value: 'baseline' | 'experiment') => {
        dispatch(setCondition(value)); // Dispatch action to update condition in Redux
    };

    // Toggle between preview and code view
    const handleToggleView = () => {
        dispatch(setShowPreview(!showPreview)); // Dispatch action to toggle showPreview in Redux
    };

    // Handle undo action
    const handleUndo = () => {
        if (codeHistory.currentIndex > 0) {
            dispatch(undoCode());
            const targetCode = codeHistory.history[codeHistory.currentIndex - 1].code;
            dispatch(setCode(targetCode));
        }
    };

    // Handle redo action
    const handleRedo = () => {
        if (codeHistory.currentIndex < codeHistory.history.length - 1) {
            dispatch(redoCode());
            const targetCode = codeHistory.history[codeHistory.currentIndex + 1].code;
            dispatch(setCode(targetCode));
        }
    };

    // Check if undo is available
    const canUndo = codeHistory.currentIndex > 0;

    // Check if redo is available
    const canRedo = codeHistory.currentIndex < codeHistory.history.length - 1;

    // Handle return to home
    const handleReturnHome = () => {
        dispatch(stopTracking());
        
        dispatch(clearActions());
        
        dispatch(clearHistory());
        
        const initialUrl = "/test/test.html";
        dispatch(fetchCodeContent(initialUrl));
        
        dispatch(clearMessages());
        
        dispatch(setMode("chat"));
        
        dispatch(setShowRetrievalPanel(false));
        
        dispatch(setSelectedTag(null));
        dispatch(setSelectedExample(null));
        dispatch(setSearchQuery(undefined));
        dispatch(setRetrievedWebData([]));
    };

    // Handle CSV export
    const handleExportCSV = () => {
        try {
            if (userTrackingActions.length === 0) {
                message.warning('There is no data to export');
                return;
            }
            
            const fileName = `user_behavior_${trackingUserName || userEmail || 'unknown'}_${Date.now()}.csv`;
            exportUserActionsToCSV(userTrackingActions, fileName);
            message.success(`Export ${userTrackingActions.length}`);
        } catch (error) {
            message.error(`Export: ${error instanceof Error ? error.message : 'unknown error'}`);
        }
    };

    // Get current workspace code from Redux store
    const currentCode = useSelector((state: RootState) => state.code.code);

    // Handle send tracking data to server
    const handleSendTrackingData = async () => {
        try {
            if (userTrackingActions.length === 0) {
                message.warning('There is no data to send');
                return;
            }

            const csvData = generateUserActionsCSVString(userTrackingActions);
            
            const sessionName = `session_${Date.now()}`;
            
            const username = trackingUserName || userEmail || 'anonymous';

            const response = await fetch('/api/send-tracking-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    session_name: sessionName,
                    csv_data: csvData,
                    workspace_code: currentCode,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                message.success(`Has sent the data to the server`);
            } else {
                throw new Error(result.message || 'Send failed');
            }
        } catch (error) {
            console.error('Send track data failed:', error);
            message.error(`Send track data failed: ${error instanceof Error ? error.message : 'unknown error'}`);
        }
    };

    return (
        <header className="header view-header">
            <div className="header-content">
                {/* If there are no messages, show the welcome header */}
                {messagesLength === 0 ? (
                    <>
                        {/* Logo */}
                        <h1 className="logo">         
                            <ExperimentTwoTone style={{marginRight: 8}} />
                            UI Remix
                        </h1>

                        {/* Header controls: condition selector, user email, and logout button */}
                        <div className="header-controls right-align">
                            {/* Dropdown to select condition (baseline or experiment) */}
                            <Select
                                className="condition-select"
                                value={condition}
                                onChange={handleConditionChange}
                                options={[
                                    { value: 'baseline', label: 'Alpha' },
                                    { value: 'experiment', label: 'Beta' },
                                ]}
                                style={{ width: 120 }}
                            />
                            {/* Display the user's email */}
                            <span className="user-email">{userEmail}</span>
                            {/* Logout button */}
                            <Button type="link" onClick={onLogout} className="logout-btn">
                                Logout
                            </Button>
                        </div>
                    </>
                ) : (
                    // If there are messages, show the main header
                    <div className="header-content">
                        {/* Left side - Home button */}
                        <div className="header-left">
                            <Button 
                                type="text" 
                                icon={<HomeOutlined />} 
                                onClick={handleReturnHome}
                                title="Home"
                                className="home-btn"
                            >
                                Home
                            </Button>
                        </div>
                        
                        {/* Right side - Controls */}
                        <div className="header-right">
                            {/* History control buttons - always show */}
                            <div className="history-controls">
                                <Button 
                                    type="text" 
                                    icon={<UndoOutlined />} 
                                    onClick={handleUndo}
                                    disabled={!canUndo}
                                    title="Undo"
                                    className="history-btn"
                                />
                                <Button 
                                    type="text" 
                                    icon={<RedoOutlined />} 
                                    onClick={handleRedo}
                                    disabled={!canRedo}
                                    title="Redo"
                                    className="history-btn"
                                />
                            </div>
                            
                            {/* Button to toggle between preview and code view */}
                            <Button className="view-toggle-btn" onClick={handleToggleView}>
                                {showPreview ? 'Code' : 'Preview'}
                            </Button>
                            
                            {/* Export CSV button */}
                            <Button 
                                type="text"
                                icon={<DownloadOutlined />}
                                onClick={handleExportCSV}
                                disabled={userTrackingActions.length === 0}
                                title={`Export`}
                                className="export-csv-btn"
                            >
                                Export Tracking Data
                            </Button>
                            
                            {/* Send tracking data button */}
                            <Button 
                                type="text"
                                icon={<UploadOutlined />}
                                onClick={handleSendTrackingData}
                                disabled={userTrackingActions.length === 0}
                                title={`Send to server`}
                                className="send-tracking-btn"
                            >
                                Send Track Data
                            </Button>
                            
                            {/* Display the user's email */}
                            <span className="user-email">{userEmail}</span>
                            {/* Logout button */}
                            <Button type="link" onClick={onLogout} className="logout-btn">
                                Logout
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};