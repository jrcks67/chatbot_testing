1. conversationMessagesAtomFamily
export const conversationMessagesAtomFamily = atomFamily({
  key: 'conversationMessages',
  default: [],
});


Purpose: Store the messages for each conversation separately.

Why atomFamily? → Each conversation ID maps to its own independent state slice.

Usage:

When you open /chat/:conversationId, you load messages into conversationMessagesAtomFamily(conversationId).

When user/AI sends new messages, you append them to this atom.

Initialization:

Default is empty array [].

When conversation loads from backend, you overwrite it with messagesFromApi.

2. conversationStatusAtom
export const conversationStatusAtom = atom({
  key: 'conversationStatus',
  default: {
    newConversations: new Set(),
    existingConversations: new Set(),
  },
});


Purpose: Track whether a conversation is new (created locally, not saved yet) or existing (persisted in backend).

Why Set?

Fast membership check: set.has(conversationId) → O(1).

No duplicates (you don’t want to accidentally mark the same conversation as "new" twice).

Usage:

When creating a new conversation:
→ add conversationId to newConversations.

Once the conversation is saved to backend:
→ move conversationId from newConversations → existingConversations.

3. loadedConversationsAtom
export const loadedConversationsAtom = atom({
  key: 'loadedConversations',
  default: new Set(),
});


Purpose: Track which conversations’ messages you have already fetched from API.

Why Set?

Efficient check: prevents redundant fetches when switching between chats.

Usage:

When navigating to /chat/:conversationId:

If conversationId is not in loadedConversations → fetch messages from API and mark as loaded.

If conversationId is already in set → just read from conversationMessagesAtomFamily.

Trigger point:
→ Immediately after API call completes for an existing conversation.

4. conversationsListAtom
export const conversationsListAtom = atom({
  key: 'conversationsList',
  default: [],
});


Purpose: Stores sidebar conversation metadata (id, title, last updated).

Usage:

Display in sidebar (map(conversationsListAtom)).

Update when new conversation is created or backend sends updated list.

Initialization:

On app mount → fetch /api/v1/conversations → update atom.

5. selectedConversationAtom
export const selectedConversationAtom = atom({
  key: 'selectedConversation',
  default: null,
});


Purpose: Track the currently active conversation.

Usage:

When user clicks on sidebar → set selectedConversationAtom = conversationId.

Components can subscribe to it to know which conversation to display.

6. streamingStateAtom
export const streamingStateAtom = atom({
  key: 'streamingState',
  default: {
    isStreaming: false,
    streamingMessageId: null,
  },
});


Purpose: Track if AI response is streaming via SSE.

Usage:

On user message send → isStreaming = true and create a placeholder message.

As SSE events arrive → append chunks to streamingMessageId.

When stream ends → isStreaming = false.


1. conversationMessagesAtomFamily

Where used: ChatWindow / ChatMessages component

When set:

After fetching messages from backend:

setConversationMessages(conversationId, fetchedMessages);


When you receive a new message via SSE:

setConversationMessages(conversationId, prev => [...prev, newMessage]);

🔹 2. conversationStatusAtom

Where used: Sidebar + ChatWindow

When set:

When you create a new conversation → add to newConversations.

When you fetch an existing conversation from backend → add to existingConversations.

setConversationStatus(prev => ({
  ...prev,
  newConversations: new Set(prev.newConversations).add(newId),
}));


Why a Set: ensures uniqueness (no duplicates).

🔹 3. loadedConversationsAtom

Where used: ChatWindow

When set:

After you first load messages for a conversation (from API).

setLoadedConversations(prev => new Set(prev).add(conversationId));


Purpose: Prevents duplicate API calls — if a conversation is already loaded, don’t fetch again.

🔹 4. conversationsListAtom

Where used: Sidebar

When set:

On initial fetch of all conversations (mount of Sidebar).

When you create a new conversation → append it to the list.

setConversationsList(fetchedConversations);

🔹 5. selectedConversationAtom

Where used: Sidebar (on click), ChatWindow (to display).

When set:

When user clicks a conversation in sidebar:

setSelectedConversation(conversationId);

🔹 6. streamingStateAtom

Where used: ChatWindow (input + streaming renderer)

When set:

When SSE connection starts:

setStreamingState({ isStreaming: true, streamingMessageId });


While streaming chunks: update the message in conversationMessagesAtomFamily.

When SSE ends:

setStreamingState({ isStreaming: false, streamingMessageId: null });
