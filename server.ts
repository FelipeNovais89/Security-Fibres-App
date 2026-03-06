import express from "express";
import cors from "cors";
import ytdl from "@distube/ytdl-core";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API: Get YouTube Audio Info
  app.get("/api/info", async (req, res) => {
    const videoUrl = req.query.url as string;
    if (!videoUrl) return res.status(400).json({ error: "URL is required" });

    // Basic validation
    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({ error: "Invalid YouTube URL. Please provide a valid link." });
    }

    try {
      const info = await ytdl.getInfo(videoUrl, {
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          }
        }
      });
      
      res.json({
        title: info.videoDetails.title,
        author: info.videoDetails.author.name,
        thumbnail: info.videoDetails.thumbnails[0].url,
        duration: info.videoDetails.lengthSeconds,
      });
    } catch (error: any) {
      console.error("Info error:", error.message);
      let message = "YouTube blocked the request. This often happens with restricted videos.";
      if (error.message.includes("403")) message = "YouTube access forbidden (403). Try another link or a local file.";
      if (error.message.includes("404")) message = "Video not found (404). Check the link.";
      if (error.message.includes("age-restricted")) message = "This video is age-restricted and cannot be processed.";
      
      res.status(500).json({ error: message });
    }
  });

  // API: Stream YouTube Audio
  app.get("/api/stream", async (req, res) => {
    const videoUrl = req.query.url as string;
    if (!videoUrl || !ytdl.validateURL(videoUrl)) {
      return res.status(400).json({ error: "Valid YouTube URL is required" });
    }

    try {
      const info = await ytdl.getInfo(videoUrl);
      const format = ytdl.chooseFormat(info.formats, { 
        quality: "highestaudio", 
        filter: "audioonly" 
      });
      
      if (!format) throw new Error("No audio format found");

      res.setHeader("Content-Type", "audio/mpeg");
      ytdl(videoUrl, { 
        format,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          }
        }
      }).pipe(res);
    } catch (error: any) {
      console.error("Stream error:", error.message);
      res.status(500).json({ error: "Streaming failed: " + error.message });
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
    console.log(`SonicSplit Server running on port ${PORT}`);
  });
}

startServer();
