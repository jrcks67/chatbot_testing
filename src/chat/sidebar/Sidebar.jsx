import React, { useEffect } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { conversationsListAtom } from "../stores/atoms";
import SidebarItem from "./SidebarItem";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const conversations = useRecoilValue(conversationsListAtom);
  const setConversations = useSetRecoilState(conversationsListAtom);
  const navigate = useNavigate();

  // 🔥 LOAD: Fetch conversations on app start
  useEffect(() => {
    fetch('/api/v1/conversations')
      .then(res => res.json())
      .then(data => setConversations(data))
      .catch(console.error);
  }, [setConversations]);

  const handleNewConversation = () => {
    navigate("/chat/new");
  };

  return (
    <div className="flex flex-col w-64 border-r border-gray-300 h-full">
      <button
        onClick={handleNewConversation}
        className="m-2 p-2 bg-blue-500 text-white rounded"
      >
        New Chat
      </button>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-2 text-gray-400">No conversations yet</div>
        ) : (
          conversations.map((c) => (
            <SidebarItem key={c.id} conversation={c} />
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;