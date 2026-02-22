import type React from "react";
import { ExperimentTwoTone } from "@ant-design/icons";
// import { Select } from "antd";
// import { useDispatch, useSelector } from "react-redux";
// import type { RootState } from "../../store";
// import { setSelectedModel } from "../../store/statusSlice";

export const ChatHeader: React.FC = () => {
  // const dispatch = useDispatch();
  // const selectedModel = useSelector((state: RootState) => state.status.selectedModel);
  // const availableModels = useSelector((state: RootState) => state.status.availableModels);

  return (
    <div className="chat-header">
      <span className="chat-header-head">          
        <ExperimentTwoTone style={{ marginRight: 8 }} />
        UI Remix
      </span>
    </div>
  );
};