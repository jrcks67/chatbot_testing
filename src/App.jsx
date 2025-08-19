import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Chat from "./chat/Chat";
import ConversationView from "./chat/conversations-view/ConversationsView";

function App() {
  return (
    <RecoilRoot>
    <BrowserRouter>
      <Routes>
        <Route path="/chat" element={<Chat />}>
          {/* Default to /chat/new */}
          <Route index element={<Navigate to="new" replace />} />

          {/* Routes for new and existing conversations */}
          <Route path="new" element={<ConversationView />} />
          <Route path=":conversationId" element={<ConversationView />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </RecoilRoot>
  );
}

export default App;
