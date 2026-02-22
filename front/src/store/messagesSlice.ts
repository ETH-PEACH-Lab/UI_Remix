import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message } from "../types"; // Adjust the import path as necessary

// Load messages from localStorage
const loadMessagesFromStorage = (): Message[] => {
  try {
    const savedMessages = localStorage.getItem("chat_messages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  } catch (error) {
    console.error("Error loading messages from localStorage:", error);
    return [];
  }
};

// Save messages to localStorage
const saveMessagesToStorage = (messages: Message[]) => {
  try {
    localStorage.setItem("chat_messages", JSON.stringify(messages));
  } catch (error) {
    console.error("Error saving messages to localStorage:", error);
  }
};

interface MessagesState {
  messages: Message[];
}

const initialState: MessagesState = {
  messages: loadMessagesFromStorage(),
};

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    setMessages(state, action: PayloadAction<Message[]>) {
      state.messages = action.payload;
      saveMessagesToStorage(state.messages);
    },
    addMessage(state, action: PayloadAction<Message>) {
      state.messages.push(action.payload);
      saveMessagesToStorage(state.messages);
    },
    clearMessages(state) {
      state.messages = [];
      saveMessagesToStorage(state.messages);
    },
  },
});

export const { setMessages, addMessage, clearMessages } = messagesSlice.actions;
export default messagesSlice.reducer;