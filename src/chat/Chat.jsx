import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar/Sidebar";

const Chat = () => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-300">
        <Sidebar />
      </div>

      {/* Main conversation view */}
      <div className="flex-1 bg-white">
        <Outlet />
      </div>
    </div>
  );
};

export default Chat;
