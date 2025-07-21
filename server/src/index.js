import express from "express";
const app = express();

import { chatRouter } from "./routes/chat.routes.js";

const PORT = process.env.PORT || 4000;

app.use("/api", chatRouter);

app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`)
})
