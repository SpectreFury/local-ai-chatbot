import { Router } from "express";
const chatRouter = Router();

import {
  getChatHandler,
  getChatsHandler,
  createChatHandler,
  createMessageHandler,
  stopChatHandler,
  updateChatHandler,
  deleteChatHandler,
} from "../handlers/chat.handlers.js";

chatRouter.get("/chats", getChatsHandler);
chatRouter.get("/chats/:id", getChatHandler);

chatRouter.post("/chat", createChatHandler);
chatRouter.put("/chats/:id", updateChatHandler);
chatRouter.delete("/chats/:id", deleteChatHandler);

chatRouter.post("/chat/:chatId/message", createMessageHandler);
chatRouter.post("/chat/:chatId/stop", stopChatHandler);

export { chatRouter };
