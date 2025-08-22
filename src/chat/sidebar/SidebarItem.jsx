// import React from "react";
// import { useSetRecoilState } from "recoil";
// import { useNavigate } from "react-router-dom";
// import { selectedConversationAtom } from "../../stores/atoms";

// const SidebarItem = ({ conversation }) => {
//   const setSelectedConversation = useSetRecoilState(selectedConversationAtom);
//   const navigate = useNavigate();

//   const handleClick = () => {
//     setSelectedConversation(conversation.id);
//     navigate(`/chat/${conversation.id}`);
//   };

//   return (
//     <div
//       onClick={handleClick}
//       className="p-2 cursor-pointer hover:bg-gray-200 rounded"
//     >
//       {conversation.title || "Untitled"}
//     </div>
//   );
// };

// export default SidebarItem;


import React from "react";
import { useSetRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import { selectedConversationAtom } from "../../stores/atoms";

const SidebarItem = ({ conversation, isActive }) => {
  const setSelectedConversation = useSetRecoilState(selectedConversationAtom);
  const navigate = useNavigate();

  const handleClick = () => {
    setSelectedConversation(conversation.id);
    navigate(`/chat/${conversation.id}`);
  };

  // Truncate title if too long
  const displayTitle = conversation.title && conversation.title.length > 30 
    ? conversation.title.slice(0, 30) + "..." 
    : conversation.title || "Untitled Conversation";

  return (
    <div
      onClick={handleClick}
      className={`p-3 cursor-pointer rounded-lg transition-colors group ${
        isActive
          ? "bg-blue-100 border border-blue-200"
          : "hover:bg-gray-100 border border-transparent"
      }`}
    >
      <div className={`font-medium text-sm ${
        isActive ? "text-blue-900" : "text-gray-900"
      }`}>
        {displayTitle}
      </div>
      
      {conversation.lastMessage && (
        <div className={`text-xs mt-1 truncate ${
          isActive ? "text-blue-700" : "text-gray-500"
        }`}>
          {conversation.lastMessage}
        </div>
      )}
      
      {conversation.updatedAt && (
        <div className={`text-xs mt-1 ${
          isActive ? "text-blue-600" : "text-gray-400"
        }`}>
          {new Date(conversation.updatedAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default SidebarItem;