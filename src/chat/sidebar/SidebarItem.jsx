import React from "react";
import { useSetRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import { selectedConversationAtom } from "../../stores/atoms";

const SidebarItem = ({ conversation }) => {
  const setSelectedConversation = useSetRecoilState(selectedConversationAtom);
  const navigate = useNavigate();

  const handleClick = () => {
    setSelectedConversation(conversation.id);
    navigate(`/chat/${conversation.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="p-2 cursor-pointer hover:bg-gray-200 rounded"
    >
      {conversation.title || "Untitled"}
    </div>
  );
};

export default SidebarItem;
