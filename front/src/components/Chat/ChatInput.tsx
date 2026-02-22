// React imports
import { setSelectedTag, setSelectedExample } from "../../store/selectionSlice";
import React, { useEffect, useRef } from "react";

// Redux imports
import { useSelector, useDispatch, useStore } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { setMode, setLoading, setLoadingType, setShowRetrievalPanel } from "../../store/statusSlice";
import { setIsSpecific } from "../../store/selectionSlice";
import { addMessage, setMessages } from "../../store/messagesSlice";
import { setDefaultRetrievedWebData, setGlobalWebs, setRetrievedWebData, setSearchQuery, setSpecificWebs } from "../../store/retrievalSlice";
import { setCodeFromServer } from "../../store/codeSlice";
import { trackMessageSent, trackModeChanged, startTracking, setUserName } from "../../store/userTrackingSlice";

// Component imports
import { ModeSelector } from "./ModeSelector";
import { ContextTag } from "./ContextTag";

// Hook imports
import { useAuth } from "../../hooks/useAuth";

// Service imports
import { formatErrorMessage, formatRetrievedWebData, globalSearch, handleModeRequest, localSearch, sendApplyRequest, sendChatRequest, sendBaselineRequest } from "../../services/chatService";

// Utility imports
import metadata from "../../../metadata.json";
import { Message, MetadataType, SystMessage, UserMessage } from "./types";
import { PreAppMetadata } from "../../types/common"; // TODO: check whether it works

// UI library imports
import { message } from "antd";
import { SendOutlined } from "@ant-design/icons";

// Style imports
import "./ChatInput.css";
import { GlobalWeb } from "../../types";

const typedMetadata = metadata as MetadataType;

export const ChatInput: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { userEmail } = useAuth();

  // Redux state selectors
  const isLoading = useSelector((state: RootState) => state.status.loading);
  const selectedExample = useSelector((state: RootState) => state.selection.selectedExample);
  const selectedTag = useSelector((state: RootState) => state.selection.selectedTag);
  const messages = useSelector((state: RootState) => state.messages.messages);
  const inputMode = useSelector((state: RootState) => state.status.mode);
  const condition = useSelector((state: RootState) => state.status.condition);
  const globalWebs = useSelector((state: RootState) => state.retrieval.globalWebs);
  const isTracking = useSelector((state: RootState) => state.userTracking.isTracking);

  useEffect(() => {
    const previousMode = inputMode;
    if (selectedExample && inputMode !== "apply") {
      dispatch(setMode("apply"));
      dispatch(trackModeChanged({
        previousMode: previousMode,
        newMode: "apply",
      }));
    } else if (!selectedExample && inputMode === "apply") {
      dispatch(setMode("retrieve"));
      dispatch(trackModeChanged({
        previousMode: previousMode,
        newMode: "retrieve",
      }));
    }
  }, [selectedExample, inputMode, dispatch]);

  useEffect(() => {
    if (selectedTag && inputMode === "chat") {
      const previousMode = inputMode;
      dispatch(setMode("retrieve"));
      dispatch(trackModeChanged({
        previousMode: previousMode,
        newMode: "retrieve",
      }));
    }
  }, [selectedTag, inputMode, dispatch]);

  const handleRetrieve = async (newMessages: Message[], currentSelectedTag: string | null) => {
    console.log(inputRef.current?.value);
    dispatch(setSearchQuery(inputRef.current?.value || "")); // Set search query in Redux store
    try {
      if (currentSelectedTag) {
        await handleSpecificRetrieve();
      } else {
        await handleGlobalRetrieve();
      }

      const newSysMessage: SystMessage = {
        messageId: newMessages.length + 1,
        sender: "assistant",
        content: "I have updated the design inspiration explorer. You can select the examples and let me know how you want to remix them!",
        type: "message",
        mode: "retrieve",
      };
      dispatch(addMessage(newSysMessage as Message));
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      message.error(errorMessage);

      const errorChatMessage: SystMessage = {
        messageId: newMessages.length + 1,
        sender: "assistant",
        content: `Retrieve Error: ${errorMessage}`,
        type: "message"
      };
      dispatch(setMessages([...newMessages, errorChatMessage as Message]));
      dispatch(setDefaultRetrievedWebData());
    } finally {
      dispatch(setLoadingType(null));
      dispatch(setLoading(false));
      dispatch(setShowRetrievalPanel(true)); // Show retrieval panel
    }
  };

  const handleGlobalRetrieve = async () => {
    const inputValue = inputRef.current?.value || "";
    const cleanedSearchText = inputValue.trim();
    const retrievedWebs = await globalSearch(cleanedSearchText, globalWebs);
    const globalWebIDs = globalWebs.map((web: GlobalWeb) => String(web.id));
    const uniqueRetrievedWebs = retrievedWebs.filter(
      (id: string) => !globalWebIDs.includes(id)
    );
    const mergedWebIds = [...globalWebIDs, ...uniqueRetrievedWebs];

    if (retrievedWebs.length > 0) {
      const result = formatRetrievedWebData(mergedWebIds, typedMetadata);
      dispatch(setRetrievedWebData(result));
    }
    message.success("Search query updated");
  };

  const handleSpecificRetrieve = async () => {
    const inputValue = inputRef.current?.value || "";
    const cleanedSearchText = inputValue.trim();
    dispatch(setIsSpecific(true));

    const [retrievedWebs, retrievedBoxes] = await localSearch(
      cleanedSearchText,
      String(selectedTag)
    );
    const result = formatRetrievedWebData(retrievedWebs, typedMetadata, {
      boxes: retrievedBoxes,
    });
    dispatch(setRetrievedWebData(result));
    message.success("Specific search completed");
  };

  const handleApply = async (newMessages: Message[], currentSelectedTag: string | null) => {
    if (!selectedExample) {
      message.warning("Please select a design example in the right panel first");
      return;
    }

    await handleModeRequest({
      newMessages,
      requestFn: sendApplyRequest,
      errorPrefix: "",
      dispatch,
      getState: store.getState,
      selectedTag: currentSelectedTag,
      selectedExampleId: selectedExample.id.toString(),
      onSuccess: (res) => {
        dispatch(setMessages(res.newChatHistory));
        dispatch(setCodeFromServer({ code: res.code }));
      },
    });
  };

  const handleChat = async (newMessages: Message[], currentSelectedTag: string | null) => {
    await handleModeRequest({
      newMessages,
      requestFn: sendChatRequest,
      errorPrefix: "",
      dispatch,
      getState: store.getState,
      selectedTag: currentSelectedTag,
      onSuccess: (res) => {
        dispatch(setMessages(res.newChatHistory));
        dispatch(setCodeFromServer({ code: res.code }));
        dispatch(setGlobalWebs(res.globalWebs));
        dispatch(setSpecificWebs(res.specificWebs));
      },
    });
  };

  const handleBaseline = async (newMessages: Message[], currentSelectedTag: string | null) => {
    await handleModeRequest({
      newMessages,
      requestFn: sendBaselineRequest,
      errorPrefix: "",
      dispatch,
      getState: store.getState,
      selectedTag: currentSelectedTag,
      onSuccess: (res) => {
        dispatch(setMessages(res.newChatHistory));
        dispatch(setCodeFromServer({ code: res.code }));
      },
    });
  };

  const handleSendMessage = async () => {
    if (isLoading) return;

    const inputValue = inputRef.current?.value?.trim() || "";
    if (!inputValue) return;

    if (messages.length === 0 && !isTracking) {
      const userName = userEmail || "unknown_user";
      dispatch(setUserName(userName));
      dispatch(startTracking({ userName }));
    }

    const userMessage: UserMessage = {
      messageId: messages.length + 1,
      sender: "user",
      content: inputValue,
      type: "message",
      mode: inputMode ?? "chat",
      tag: selectedTag,
      example: selectedExample ? {
        id: selectedExample.id,
        title: selectedExample.title,
        metadata: selectedExample.metadata as PreAppMetadata,
      } : null,
    };

    const newMessages = [...messages, userMessage as Message];
    dispatch(addMessage(userMessage as Message));

    dispatch(trackMessageSent({
      message: inputValue,
      mode: inputMode ?? "chat",
    }));

    const modeToLoadingType: Record<string, "thinking" | "searching" | "applying"> = {
      chat: "thinking",
      retrieve: "searching",
      apply: "applying",
    };
    dispatch(setLoadingType(modeToLoadingType[inputMode] ?? null));
    dispatch(setLoading(true));

    const currentSelectedTag = selectedTag;

    if (inputMode === "retrieve") {
      dispatch(setSelectedExample(null));
    } else if (inputMode === "apply") {
      dispatch(setSelectedExample(null));
      dispatch(setSelectedTag(null));
      dispatch(setMode("retrieve"));
    } else {
      dispatch(setSelectedTag(null));
      dispatch(setSelectedExample(null));
    }

    try {
      if (condition === "baseline") {
        await handleBaseline(newMessages, currentSelectedTag);
      } else if (inputMode === "retrieve") {
        await handleRetrieve(newMessages, currentSelectedTag);
      } else if (inputMode === "apply") {
        await handleApply(newMessages, currentSelectedTag);
      } else {
        await handleChat(newMessages, currentSelectedTag);
      }
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }

  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="input-container">
      <div className="input-wrapper">
        <ContextTag />
        <div className="input-text-area">
          <textarea
            className="message-input"
            ref={inputRef}
            onKeyDown={handleKeyDown}
            placeholder={
              condition === "baseline"
                ? "Design anything"
                : inputMode === "chat"
                  ? "Design anything"
                  : inputMode === "retrieve"
                    ? "Search for design inspiration"
                    : "How should this design be applied"
            }
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
            rows={1}
            disabled={isLoading}
          />
          <button
            className="send-button-inline"
            title="Send"
            onClick={() => handleSendMessage()}
            disabled={isLoading}
          >
            <SendOutlined />
          </button>
        </div>
        <ModeSelector />
      </div>
    </div>
  );
};