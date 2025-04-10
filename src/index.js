import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";
import session from "express-session";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import connectDB from "./config/database.js";
import routes from "./routes/index.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import winston from "winston";
import http from "http";
import { Server } from "socket.io";
import errorHandler from "./middleware/errorMiddleware.js";
import setupSocket, { userSockets } from "./utils/socket.js";

dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const redisClient = createClient({
  url: "redis://127.0.0.1:6379",
});
await redisClient.connect();

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

const redisStore = new RedisStore({ client: redisClient });

app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", maxAge: 86400000 },
  })
);

// Middlewares
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://apis.google.com",
        ],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        frameSrc: ["'self'"],
      },
    },
  })
);

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(mongoSanitize());
app.use(xss());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
    console.log(`Serving file: ${req.path}`);
  },
  express.static(path.join(__dirname, "..", "uploads"))
);

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "Documentation for API endpoints",
    },
    servers: [
      {
        url: "http://localhost:8080/api",
      },
    ],
  },
  apis: ["./routes/*.js"],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/api", routes);

app.use(errorHandler);
app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" });
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// app.use((err, req, res, next) => {
//   const status = err.status || 500;
//   logger.error(err.message);
//   res
//     .status(status)
//     .json({ error: status === 500 ? "Internal Server Error" : err.message });
// });

const server = http.createServer(app);

const io = setupSocket(server);

io.on("connection", (socket) => {
  console.log("New socket connection:", socket.id);

  socket.on("userOnline", (userId) => {
    if (userId) {
      console.log(`User ${userId} is online`);
      socket.userId = userId;
      userSockets[userId] = socket;
      socket.broadcast.emit("userOnline", userId);
    }
  });

  socket.on("sendMessage", ({ recipientId, message }) => {
    console.log(`Received message for ${recipientId}: ${message}`);
    const recipientSocket = onlineUsers.get(recipientId);
    if (recipientSocket) {
      recipientSocket.emit("receiveMessage", {
        senderId: socket.userId,
        message,
      });
      console.log(`Message sent to ${recipientId}`);
    } else {
      console.log(`User ${recipientId} is not online`);
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing server...");
  server.close(async () => {
    await redisClient.quit();
    console.log("Server closed.");
    process.exit(0);
  });
});
