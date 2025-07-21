import express from "express";
import cors from "cors";
const app = express();

import { chatRouter } from "./routes/chat.routes.js";

const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api", chatRouter);

app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`)
})
