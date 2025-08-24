// // stores/atoms.js

// import { atom, atomFamily } from 'recoil'

// // Messages atom for each conversation 
// export const conversationMessagesAtomFamily = atomFamily({
//     key: 'conversationMessages',
//     default: [], // Fixed typo: defualt -> default
// });

// // Conversation Status (new vs existing) - keeps a track if it is a new or old conversation
// export const conversationStatusAtom = atom({
//     key: 'conversationStatus',
//     default: { // Fixed typo: defualt -> default
//         newConversations: new Set(),
//         existingConversations: new Set()
//     }
// });

// // Keeps a track of conversations that have been loaded
// export const loadedConversationsAtom = atom({
//     key: "loadedConversations",
//     default: []
// })

// // List of conversations in the sidebar 
// export const conversationsListAtom = atom({
//     key: "conversationsList",
//     default: []
// })

// // Currently selected conversation
// export const selectedConversationAtom = atom({
//     key: "conversationAtom",
//     default: null,
// })

// // Streaming state for SSE
// export const streamingStateAtom = atom({
//     key: "streamingState",
//     default: { // Fixed typo: defualt -> default
//         isStreaming: false, 
//         streamingMessageId: null
//     }
// })

import { atom, atomFamily } from "recoil";

// Currently selected conversation ID
export const selectedConversationAtom = atom({
  key: "selectedConversation",
  default: null,
});

// Messages for each conversation (keyed by conversation ID)
export const conversationMessagesAtomFamily = atomFamily({
  key: "conversationMessages",
  default: [], // Each conversation starts with empty messages array
});

// List of all conversations (from sidebar)
export const conversationsListAtom = atom({
  key: "conversationsList",
  default: [],
});

// Track which conversations have been loaded from backend
export const loadedConversationsAtom = atom({
  key: "loadedConversations",
  default: new Set(),
});

// Streaming state
export const streamingStateAtom = atom({
  key: "streamingState",
  default: {
    isStreaming: false,
    streamingMessageId: null,
  },
});

// Conversation status tracking
export const conversationStatusAtom = atom({
  key: "conversationStatus",
  default: {
    newConversations: new Set(), // Conversations that are newly created locally
    existingConversations: new Set(), // Conversations that exist in backend
  },
});

// UI state atoms
export const sidebarCollapsedAtom = atom({
  key: "sidebarCollapsed",
  default: false,
});

// App-level loading state
export const appLoadingAtom = atom({
  key: "appLoading",
  default: false,
});