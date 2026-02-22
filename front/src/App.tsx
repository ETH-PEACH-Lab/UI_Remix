// React and React Router imports
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Redux imports
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "./store";
import { fetchCodeContent } from "./store/codeSlice";
import { initializeHistory } from "./store/codeHistorySlice";
import { startTracking, setUserName } from "./store/userTrackingSlice";

// Component imports
import { Chat } from "./components/Chat/Chat";
import { Preview } from "./components/Preview";
import { Header } from "./components/Header";
import { Welcome } from "./components/Welcome";
import { Panel } from "./components/Panel/Panel";

// Hook imports
import { useAuth } from "./hooks/useAuth";

// UI library imports
import { Splitter, Layout } from "antd";

// Style imports
import "./App.css";

const { Content } = Layout;

function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { userEmail, handleLogout } = useAuth();

  // Redux state selectors
  const showRetrievalPanel = useSelector((state: RootState) => state.status.showRetrievalPanel);
  const condition = useSelector((state: RootState) => state.status.condition);
  const messages = useSelector((state: RootState) => state.messages.messages);
  const currentCode = useSelector((state: RootState) => state.code.code);
  const isTracking = useSelector((state: RootState) => state.userTracking.isTracking);

  // Check user authentication on component mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (!isAuthenticated) {
      navigate("/login"); // Redirect to login if not authenticated
    }
  }, [navigate]);

  // Load initial code on component mount
  useEffect(() => {
    const initialUrl = "/test/test.html";
    dispatch(fetchCodeContent(initialUrl)); // Fetch and initialize code
  }, [dispatch]);

  // Initialize code history when code is loaded
  useEffect(() => {
    if (currentCode && currentCode !== "// Loading code..." && currentCode.trim() !== "") {
      dispatch(initializeHistory(currentCode));
    }
  }, [currentCode, dispatch]);

  // Auto-start tracking when user is authenticated and about to send first message
  useEffect(() => {
    if (messages.length >= 1 && !isTracking && userEmail) {
      // Auto-start tracking on the first user message so it gets included.
      dispatch(setUserName(userEmail));
      dispatch(startTracking({ userName: userEmail }));
    }
  }, [messages.length, isTracking, userEmail, dispatch]);

  return (
    <div className="App">
      <div>
        {/* If there are no messages, show the Welcome screen */}
        {messages.length === 0 ? (
          <Layout>
            {/* Header with user email and logout functionality */}
            <Header
              userEmail={userEmail}
              onLogout={handleLogout}
              messagesLength={messages.length}
            />
            {/* Welcome screen */}
            <Welcome />
          </Layout>
        ) : (
          // If there are messages, show the main application layout
          <Splitter>
            {/* Left panel: Chat section */}
            <Splitter.Panel defaultSize="30%" min="20%" max="30%">
              <Layout className="chat-layout">
                <Content>
                  <Chat />
                </Content>
              </Layout>
            </Splitter.Panel>

            {/* Right panel: View container */}
            <Splitter.Panel>
              <div className="view-container">
                <Layout>
                  {/* Header with user email and logout functionality */}
                  <Header
                    userEmail={userEmail}
                    onLogout={handleLogout}
                    messagesLength={messages.length}
                  />
                  <Content>
                    <Splitter>
                      {/* Conditional rendering of the RetrievalPanel - only show in experiment mode */}
                      {showRetrievalPanel && condition === "experiment" && (
                        <Splitter.Panel defaultSize="60%" min="25%" max="60%">
                          <Panel />
                        </Splitter.Panel>
                      )}
                      {/* Preview panel */}
                      <Splitter.Panel>
                        <Preview />
                      </Splitter.Panel>
                    </Splitter>
                  </Content>
                </Layout>
              </div>
            </Splitter.Panel>
          </Splitter>
        )}
      </div>
    </div>
  );
}

export default App;