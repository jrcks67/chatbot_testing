// stores/atoms.js

import { atom, atomFamily } from 'recoil'

// Messages atom for each conversation 
export const conversationMessagesAtomFamily = atomFamily({
    key: 'conversationMessages',
    defualt: [],
});

// Conversation Status (new vs existing) - keeps a track if it is a new or old conversation
export const conversationStatusAtom = atom({
    key: 'conversationStatus',
    defualt: {
        newConversations: new Set(),
        existingConversations: new Set()
    }
});

// Keeps a track of conversations that have been loaded
export const loadedConversationsAtom = atom({
    key: "loadedConversations",
    default: []
})

// List of conversations in the sidebar 
export const conversationsListAtom = atom({
    key: "conversationsList",
    default: []
})

// Currently selected conversation
export const selectedConversationAtom = atom({
    key: "conversationAtom",
    default: null,
})

// Streaming state for SSE
export const streamingStateAtom = atom({
    key: "streamingState",
    defualt: {
        isStreaming: false, 
        streamingMessageId: null
    }
})