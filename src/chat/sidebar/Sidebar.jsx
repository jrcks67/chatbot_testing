// import React, { useEffect } from "react";
// import { useRecoilValue, useSetRecoilState } from "recoil";
// import { conversationsListAtom } from "../../stores/atoms";
// import SidebarItem from "./SidebarItem";
// import { useNavigate } from "react-router-dom";

// const Sidebar = () => {
//   const conversations = useRecoilValue(conversationsListAtom);
//   const setConversations = useSetRecoilState(conversationsListAtom);
//   const navigate = useNavigate();

//   // LOAD: Fetch conversations on app start
//   useEffect(() => {
//     fetch('/conversations')
//       .then(res => res.json())
//       .then(data => setConversations(data))
//       .catch(console.error);
//   }, [setConversations]);

//   const handleNewConversation = () => {
//     navigate("/chat/new");
//   };

//   return (
//     <div className="flex flex-col w-64 border-r border-gray-300 h-full">
//       <button
//         onClick={handleNewConversation}
//         className="m-2 p-2 bg-blue-500 text-white rounded"
//       >
//         New Chat
//       </button>

//       <div className="flex-1 overflow-y-auto">
//         {conversations.length === 0 ? (
//           <div className="p-2 text-gray-400">No conversations yet</div>
//         ) : (
//           conversations.map((c) => (
//             <SidebarItem key={c.id} conversation={c} />
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default Sidebar;

import React, { useEffect } from "react";
import { useRecoilValue, useSetRecoilState, useRecoilState } from "recoil";
import { conversationsListAtom, selectedConversationAtom } from "../../stores/atoms";
import SidebarItem from "./SidebarItem";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const [conversations, setConversations] = useRecoilState(conversationsListAtom);
  const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch conversations on app start
  useEffect(() => {
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => setConversations(data))
      .catch(console.error);
  }, [setConversations]);

  const handleNewConversation = () => {
    // Clear current selection
    setSelectedConversation(null);
    
    // Navigate to /chat/new (no optimistic sidebar update)
    navigate("/chat/new");
  };

  const isNewChatActive = location.pathname === "/chat/new";

  return (
    <div className="flex flex-col w-64 border-r border-gray-300 h-full bg-gray-50">
      <div className="p-2">
        <button
          onClick={handleNewConversation}
          className={`w-full p-3 rounded-lg font-medium transition-colors ${
            isNewChatActive
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          + New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p>No conversations yet.</p>
            <p className="mt-1">Start a new chat to see your history here.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations
              .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
              .map((conversation) => (
                <SidebarItem 
                  key={conversation.id} 
                  conversation={conversation}
                  isActive={selectedConversation === conversation.id}
                />
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;