import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Ensure uploads directories exist
const uploadsDirInPublic = path.join(process.cwd(), "public", "uploads");
const uploadsDirInDist = path.join(process.cwd(), "dist", "uploads");

if (!fs.existsSync(uploadsDirInPublic)) {
  fs.mkdirSync(uploadsDirInPublic, { recursive: true });
}
if (!fs.existsSync(uploadsDirInDist)) {
  fs.mkdirSync(uploadsDirInDist, { recursive: true });
}

function saveBase64Image(base64Str: string, originalName?: string): string {
  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Format base64 invalide ou corrompu");
  }
  const contentType = matches[1];
  const binaryBuffer = Buffer.from(matches[2], "base64");
  
  let extension = "jpg";
  if (contentType.includes("png")) extension = "png";
  else if (contentType.includes("webp")) extension = "webp";
  else if (contentType.includes("gif")) extension = "gif";
  else if (contentType.includes("jpeg")) extension = "jpg";
  else if (contentType.includes("svg")) extension = "svg";

  const cleanOriginal = originalName 
    ? path.parse(originalName).name.toLowerCase().replace(/[^a-z0-9_-]/g, "") 
    : "upload";
  const filename = `${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}_${cleanOriginal}.${extension}`;

  // Save to public/uploads
  const filePathPublic = path.join(uploadsDirInPublic, filename);
  fs.writeFileSync(filePathPublic, binaryBuffer);

  // Also save to dist/uploads so it is immediately served in production
  try {
    fs.writeFileSync(path.join(uploadsDirInDist, filename), binaryBuffer);
  } catch (err) {
    // Dist might not exist yet during build or dev startup, which is fine
  }

  // Return the web resource URL path
  return `/uploads/${filename}`;
}

// API routes FIRST
app.post("/api/upload", express.json({ limit: "50mb" }), (req: express.Request, res: express.Response) => {
  try {
    const { base64, filename } = req.body;
    if (!base64) {
      return res.status(400).json({ error: "Contenu de fichier manquant" });
    }
    const fileUrl = saveBase64Image(base64, filename);
    return res.json({ url: fileUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: error.message || "Impossible d'enregistrer l'image" });
  }
});

// Serve uploads statically
app.use("/uploads", express.static(uploadsDirInPublic));
app.use("/uploads", express.static(uploadsDirInDist));

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
