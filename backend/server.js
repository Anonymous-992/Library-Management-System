import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
/* ENV VARIABLES */
import { APP_PORT, MONGO_DB_URI } from "./config/index.js";
import { runOverdueReminderJob } from "./controllers/transactionControllers.js";
/* IMPORT ALL ROUTES */
import {
  almirahRouter,
  authRouter,
  batchRouter,
  bookRouter,
  categoryRouter,
  clearanceRouter,
  departementRouter,
  eBookRouter,
  genralRouter,
  studentRouter,
  teacherRouter,
  transactionRouter,
} from "./routes/index.js";
import { errorHandlerMiddleware } from "./middlewares/index.js";

/* CONFIGURATION */
const app = express();
app.use(express.json({ limit: "5mb" }));

const corsOptions = {
  credentials: true,
  origin: ["http://localhost:5173"],
};
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/* ABSOLUTE PATH OF BACKEND FOLDER */
const __filename = fileURLToPath(import.meta.url);
export const ROOT_PATH = path.dirname(__filename);
// console.log(ROOT_PATH);

/* STATIC FOLDER */
app.use("/public", express.static("./public"));
app.use("/uploads", express.static("./uploads"));
app.use("/documents", express.static("./documents"));

// Schedule automatic overdue reminder emails once per day
const startOverdueReminderScheduler = () => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const runJob = async () => {
    try {
      const result = await runOverdueReminderJob();
      console.log(
        `Overdue reminder job: ${result.totalUsers} users, ${result.totalTransactions} transactions`
      );
    } catch (error) {
      console.error("Error in overdue reminder job", error);
    }
  };

  // Run once on startup
  runJob();
  // Then run daily
  setInterval(runJob, ONE_DAY_MS);
};

/* MONGOOSE SETUP */
mongoose
  .connect(MONGO_DB_URI)
  .then(() => {
    console.log("MONGO DB CONNECTED SUCCESSFULLY 😍😍");
    /* CREATE SERVER */
    app.listen(APP_PORT, () => {
      console.log(`SERVER IS LISTNING ON PORT ${APP_PORT}`);
      startOverdueReminderScheduler();
    });
  })
  .catch((err) => {
    console.log("SOMETHING WENT WRONG WHILE CONNECTING TO MONGO DB 😢😢");
    console.log("====================================");
    console.log(err);
    console.log("====================================");
  });

/* ROUTES */
app.use("/api/auth", authRouter);
app.use("/api/batches", batchRouter);
app.use("/api/teachers", teacherRouter);
app.use("/api/departements", departementRouter);
app.use("/api/students", studentRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/almirahs", almirahRouter);
app.use("/api/books", bookRouter);
app.use("/api/ebooks", eBookRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/genral", genralRouter);
app.use("/api/clearance", clearanceRouter);

/* ERROR HANLDER MIDDLEWARE */
app.use(errorHandlerMiddleware);
