import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

const db = new Database("data.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS app_data (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' })); // Allow large payloads for all data

  // API: Get all data
  app.get("/api/data", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM app_data").all();
      const data: Record<string, any> = {};
      rows.forEach((row: any) => {
        data[row.key] = JSON.parse(row.value);
      });
      res.json(data);
    } catch (error: any) {
      console.error("Get data error:", error.message);
      res.status(500).json({ error: "Failed to load data" });
    }
  });

  // API: Save data
  app.post("/api/data", (req, res) => {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: "Key is required" });

    try {
      const stmt = db.prepare("INSERT OR REPLACE INTO app_data (key, value) VALUES (?, ?)");
      stmt.run(key, JSON.stringify(value));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Save data error:", error.message);
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  // API: Save multiple keys at once
  app.post("/api/data/batch", (req, res) => {
    const data = req.body; // Expecting an object { key1: value1, key2: value2 }
    
    try {
      const insert = db.prepare("INSERT OR REPLACE INTO app_data (key, value) VALUES (?, ?)");
      const transaction = db.transaction((items) => {
        for (const [key, value] of Object.entries(items)) {
          insert.run(key, JSON.stringify(value));
        }
      });
      transaction(data);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Batch save error:", error.message);
      res.status(500).json({ error: "Failed to save batch data" });
    }
  });

  // Vite setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(process.cwd(), "dist", "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FiberQC Server running on port ${PORT}`);
  });
}

startServer();
