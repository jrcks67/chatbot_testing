# LLM Chat Application

A React-based chat application with lazy conversation creation and real-time streaming responses using Recoil for state management.

## 🏗️ Architecture Overview

```
/chat
├── /new                    → New conversation (lazy creation)
└── /:conversationId        → Existing conversation
```

**Key Components:**
- `Chat` - Main layout with sidebar and conversation view
- `ConversationView` - Handles both new and existing conversations
- `Sidebar` - Lists conversations and "New Chat" button
- `MessageInput` - User input with send functionality
- `Message` - Individual message rendering with streaming support

## 🔄 State Management (Recoil)

### Core Atoms

| Atom | Purpose | Type |
|------|---------|------|
| `selectedConversationAtom` | Currently active conversation ID | `string \| null` |
| `conversationMessagesAtomFamily` | Messages for each conversation | `atomFamily<Message[]>` |
| `conversationsListAtom` | Sidebar conversation list | `Conversation[]` |
| `conversationStatusAtom` | Track new vs existing conversations | `{newConversations: Set, existingConversations: Set}` |
| `loadedConversationsAtom` | Prevent redundant API calls | `string[]` |
| `streamingStateAtom` | Current streaming status | `{isStreaming: boolean, streamingMessageId: string}` |

### Message Structure
```javascript
{
  id: string,           // Unique message ID
  role: "user" | "assistant",
  content: string,      // Message text
  streaming?: boolean   // For assistant messages being streamed
}
```

## 🚀 Flow 1: New Conversation

### User Journey
1. User clicks **"New Chat"** in sidebar
2. Navigate to `/chat/new`
3. Show placeholder: *"Start typing to create a new conversation..."*
4. User types first message → **Lazy conversation creation**
5. Generate UUID, update URL to `/chat/{conversationId}`
6. Stream assistant response
7. Add conversation to sidebar

### Implementation Details

#### Step 1: Navigation to New Chat
```javascript
// Sidebar.js - "New Chat" button
const handleNewConversation = () => {
  navigate("/chat/new");
};
```

#### Step 2: Route Handling
```javascript
// ConversationView.js
const isNewRoute = routeId === "new";

// Sync route with state
useEffect(() => {
  if (isNewRoute) {
    setSelectedConversation(null); // No conversation selected yet
  } else {
    setSelectedConversation(routeId);
  }
}, [routeId]);
```

#### Step 3: Lazy Conversation Creation
```javascript
const handleSend = async (userText) => {
  let convId = selectedConversation;
  let shouldNavigate = false;

  // 🔥 LAZY CREATION: Only create when user sends first message
  if (isNewRoute) {
    convId = crypto.randomUUID();          // Generate conversation ID
    shouldNavigate = true;
    
    setSelectedConversation(convId);       // Set active conversation
    setStatus(old => ({                    // Mark as new conversation
      ...old,
      newConversations: new Set(old.newConversations).add(convId)
    }));
  }

  // Set up optimistic UI FIRST
  const userMsg = { id: crypto.randomUUID(), role: "user", content: userText };
  const assistantMsg = { id: crypto.randomUUID(), role: "assistant", content: "", streaming: true };
  setMessages(old => [...old, userMsg, assistantMsg]);

  // Navigate AFTER UI setup (prevents race conditions)
  if (shouldNavigate) {
    navigate(`/chat/${convId}`, { replace: true });
  }

  // Stream assistant response...
};
```

#### Step 4: Conversation Finalization
```javascript
// After streaming completes:
setStatus(old => {
  const newSet = new Set(old.newConversations);
  newSet.delete(convId);                                    // Remove from new
  const existingSet = new Set(old.existingConversations).add(convId); // Add to existing
  return { ...old, newConversations: newSet, existingConversations: existingSet };
});

// Add to sidebar
setConversations(old => {
  if (!old.find(c => c.id === convId)) {
    return [...old, { id: convId, title: userText.slice(0, 30) }];
  }
  return old;
});
```

## 🗂️ Flow 2: Existing Conversation

### User Journey
1. User selects conversation from sidebar
2. Navigate to `/chat/{conversationId}`
3. **Check if messages already loaded** (prevent redundant API calls)
4. If not loaded → Fetch messages from backend
5. Display conversation history
6. User can continue chatting normally

### Implementation Details

#### Step 1: Sidebar Selection
```javascript
// SidebarItem.js
const handleClick = () => {
  setSelectedConversation(conversation.id);  // Update active conversation
  navigate(`/chat/${conversation.id}`);      // Navigate to conversation
};
```

#### Step 2: Message Loading with Caching
```javascript
// ConversationView.js
useEffect(() => {
  if (!selectedConversation || isNewRoute) return;
  
  // 🚀 OPTIMIZATION: Check if already loaded
  if (loadedConversations.includes(selectedConversation)) return;

  // Fetch messages from backend
  fetch(`/api/v1/messages/${selectedConversation}`)
    .then(res => res.json())
    .then(data => {
      setMessages(data);
      // Mark as loaded to prevent future redundant calls
      setLoadedConversations(old => [...old, selectedConversation]);
    })
    .catch(console.error);
}, [selectedConversation, loadedConversations]);
```

#### Step 3: Continue Chatting
```javascript
// Same handleSend logic, but skips lazy creation:
const handleSend = async (userText) => {
  let convId = selectedConversation; // Use existing conversation ID
  
  // Add messages optimistically
  const userMsg = { id: crypto.randomUUID(), role: "user", content: userText };
  const assistantMsg = { id: crypto.randomUUID(), role: "assistant", content: "", streaming: true };
  setMessages(old => [...old, userMsg, assistantMsg]);

  // Stream response directly (no navigation needed)
  // ... streaming logic
};
```

## 🌊 Streaming Implementation

### Real-time Response Streaming
```javascript
// Start streaming
setStreamingState({
  isStreaming: true,
  streamingMessageId: assistantMsg.id
});

// Stream chunks
const reader = response.body.getReader();
const decoder = new TextDecoder("utf-8");

while (!done) {
  const { value, done: doneReading } = await reader.read();
  if (value) {
    const chunk = decoder.decode(value, { stream: true });
    
    // Update message content incrementally
    setMessages(old =>
      old.map(m =>
        m.id === assistantMsg.id 
          ? { ...m, content: m.content + chunk }
          : m
      )
    );
  }
}

// Finish streaming
setMessages(old =>
  old.map(m =>
    m.id === assistantMsg.id 
      ? { ...m, streaming: false }
      : m
  )
);

setStreamingState({ isStreaming: false, streamingMessageId: null });
```

## 🔧 Key Optimizations

### 1. **Lazy Conversation Creation**
- Conversations are only created when user sends first message
- Prevents empty conversations in database
- URL updates happen after UI setup to prevent race conditions

### 2. **Message Loading Cache**
- `loadedConversationsAtom` tracks which conversations have loaded messages
- Prevents redundant API calls when switching between conversations
- Improves performance and reduces server load

### 3. **Race Condition Prevention**
- Navigation happens AFTER optimistic UI setup
- Uses `replace: true` to avoid back button issues
- Ensures component doesn't unmount during async operations

### 4. **Optimistic UI**
- Messages appear immediately when sent
- Streaming placeholder shows response is incoming
- Provides instant feedback to users

## 📡 API Endpoints

```javascript
// Fetch list of conversations (for sidebar)
GET /api/v1/conversations
Response: [
  {
    id: string,
    title: string,
    created_at: string,
    updated_at: string
  }
]

// Fetch existing messages
GET /api/v1/messages/{conversationId}
Response: Message[]

// Send message with streaming response
POST /api/v1/chat/stream
Body: { message: string, conversation_id: string }
Response: Server-Sent Events (SSE) stream
```

## 🚀 Flow 3: App Initialization

### User Journey
1. User opens/refreshes the app
2. **Fetch conversations list** from backend
3. Populate sidebar with existing conversations
4. Navigate to `/chat/new` by default

### Implementation Details

#### Initial Load in Sidebar
```javascript
// Sidebar.js
useEffect(() => {
  // 🔥 LOAD: Fetch all conversations for sidebar
  fetch('/api/v1/conversations')
    .then(res => res.json())
    .then(data => setConversations(data))
    .catch(console.error);
}, [setConversations]);
```

## 🎯 State Flow Summary

```
App Initialization:
[App loads] → [Fetch conversations] → [Populate sidebar] → [Default to /chat/new]

New Chat Flow:
[Click "New Chat"] → [/chat/new] → [Type message] → [Generate UUID] 
→ [Update URL] → [Stream response] → [Move to existing] → [Add to sidebar]

Existing Chat Flow:
[Click sidebar item] → [/chat/{id}] → [Check cache] → [Load if needed] 
→ [Display messages] → [Continue chatting]
```

This architecture ensures efficient state management, prevents unnecessary API calls, and provides a smooth user experience with real-time streaming responses.