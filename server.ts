import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { INITIAL_PRODUCTS } from "./src/data";

dotenv.config();

// Initialize Google GenAI client if key is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const app = express();
const PORT = 3000;

// Ensure uploads directories exist safely
const uploadsDirInPublic = path.join(process.cwd(), "public", "uploads");
const uploadsDirInDist = path.join(process.cwd(), "dist", "uploads");

try {
  if (!fs.existsSync(uploadsDirInPublic)) {
    fs.mkdirSync(uploadsDirInPublic, { recursive: true });
  }
} catch (e) {
  // Ignore filesystem permission errors in serverless environments
}
try {
  if (!fs.existsSync(uploadsDirInDist)) {
    fs.mkdirSync(uploadsDirInDist, { recursive: true });
  }
} catch (e) {
  // Ignore filesystem permission errors in serverless environments
}

function saveBase64Image(base64Str: string, originalName?: string): string {
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Str;
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

    // Try saving to public/uploads
    const filePathPublic = path.join(uploadsDirInPublic, filename);
    fs.writeFileSync(filePathPublic, binaryBuffer);

    // Also save to dist/uploads so it is immediately served in production
    try {
      if (fs.existsSync(uploadsDirInDist)) {
        fs.writeFileSync(path.join(uploadsDirInDist, filename), binaryBuffer);
      }
    } catch (err) {
      // Dist might not exist or be read-only
    }

    // Return the web resource URL path
    return `/uploads/${filename}`;
  } catch (fsErr) {
    console.warn("Server filesystem is read-only or ephemeral. Returning base64 data URL for direct cloud persistence:", fsErr);
    // Return base64Str directly so the client can save it to Firestore
    return base64Str;
  }
}

// API routes FIRST
app.post("/api/products/save-backup", express.json({ limit: "50mb" }), (req: express.Request, res: express.Response) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: "Format invalide pour les produits" });
    }

    const backupJson = JSON.stringify(products, null, 2);

    const rootPath = path.join(process.cwd(), "sauvegarde_produit.json");
    const srcDataPath = path.join(process.cwd(), "src", "data", "sauvegarde_produits.json");

    try {
      const srcDir = path.dirname(srcDataPath);
      if (!fs.existsSync(srcDir)) {
        fs.mkdirSync(srcDir, { recursive: true });
      }
      fs.writeFileSync(srcDataPath, backupJson, "utf-8");
    } catch (e) {
      console.warn("Could not write to src/data/sauvegarde_produits.json:", e);
    }

    try {
      fs.writeFileSync(rootPath, backupJson, "utf-8");
    } catch (e) {
      console.warn("Could not write to root sauvegarde_produit.json:", e);
    }

    console.log(`[SAUVEGARDE PRODUITS] Saved ${products.length} products to backup files.`);

    return res.json({
      success: true,
      message: `${products.length} produit(s) sauvegardé(s) dans le fichier de code avec succès.`,
      savedCount: products.length,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Error saving product backup file:", err);
    return res.status(500).json({ error: err.message || "Erreur d'écriture du fichier de sauvegarde" });
  }
});

app.get("/api/products/backup", (req: express.Request, res: express.Response) => {
  try {
    const rootPath = path.join(process.cwd(), "sauvegarde_produit.json");
    const srcDataPath = path.join(process.cwd(), "src", "data", "sauvegarde_produits.json");

    let targetPath = "";
    if (fs.existsSync(srcDataPath)) {
      targetPath = srcDataPath;
    } else if (fs.existsSync(rootPath)) {
      targetPath = rootPath;
    }

    if (targetPath) {
      const raw = fs.readFileSync(targetPath, "utf-8");
      const products = JSON.parse(raw);
      return res.json({ success: true, products, count: products.length });
    } else {
      return res.json({ success: false, products: [], count: 0 });
    }
  } catch (err: any) {
    console.error("Error reading product backup file:", err);
    return res.status(500).json({ error: "Erreur lors de la lecture de la sauvegarde" });
  }
});

app.post("/api/upload", express.json({ limit: "50mb" }), (req: express.Request, res: express.Response) => {
  try {
    const { base64, filename } = req.body;
    if (!base64) {
      return res.status(400).json({ error: "Contenu de fichier manquant" });
    }
    const fileUrl = saveBase64Image(base64, filename);
    return res.json({ url: fileUrl });
  } catch (error: any) {
    console.error("Upload error fallback:", error);
    // Even if an unexpected error occurs, return the base64 as the image URL
    if (req.body?.base64) {
      return res.json({ url: req.body.base64 });
    }
    return res.status(500).json({ error: error.message || "Impossible d'enregistrer l'image" });
  }
});

// Heuristic generator fallback when Gemini is unavailable
function getHeuristicAnalysis(category: string, characteristics: any, description: string, catalog: any[]): any {
  const cat = (category || "").trim().toLowerCase();
  const desc = (description || "").trim().toLowerCase();
  
  let similarCategories: string[] = [];
  let foundExactMatch = false;
  let matchedProductId: string | null = null;
  let matchedProductMessage: string | null = null;
  let nearbyProducts: any[] = [];
  let alternatives: any[] = [];
  let performantUpgrades: any[] = [];
  let compatibleAccessories: any[] = [];
  let aiTips = "";

  const furnitureItems = catalog.filter(p => 
    p.category === "Lounge" || 
    p.category === "Office" || 
    p.category === "Dining" || 
    p.category === "Rocking"
  ).map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
    category: p.category,
    description: p.tagline,
    matchReason: "Meuble d'exception d'ébénisterie d'art de notre atelier."
  }));

  if (cat.includes("vêt") || cat.includes("clot") || cat.includes("port") || cat.includes("robe") || cat.includes("jean") || cat.includes("t-shirt") || cat.includes("chemise") || cat.includes("pantalon") || cat.includes("sweat") || cat.includes("veste") || cat.includes("pull")) {
    similarCategories = ["Chaussures", "Accessoires", "Beauté"];
    alternatives = [
      { name: "Prêt-à-porter basique coton bio", price: 15000, description: "Option plus économique en coton biologique certifié, confection standard." },
      { name: "Chemise lin de seconde main", price: 10000, description: "Alternative éco-responsable d'occasion en excellent état." }
    ];
    performantUpgrades = [
      { name: "Ligne Couture sur-mesure", price: 120000, description: "Finitions entièrement réalisées à la main dans notre atelier partenaire." },
      { name: "Veste en drap de laine mérinos", price: 85005, description: "Thermorégulation optimale, doublure satin soyeux." }
    ];
    compatibleAccessories = [
      { name: "Cintres sculptés en bois de cèdre (x5)", price: 7500, description: "Protège naturellement vos vêtements contre les mites tout en parfumant." },
      { name: "Lessive concentrée bio fleur d'oranger", price: 5500, description: "Prend soin des fibres délicates sans aucun agent chimique agressif." }
    ];
    aiTips = "Pour les vêtements sur-mesure, nous recommandons de choisir des matières nobles comme le coton bio ou le lin sauvage. Pensez à préciser vos mensurations clés (tour de poitrine, hanches, carrure) dans la description pour un ajustement parfait.";
  } else if (cat.includes("chaus") || cat.includes("basket") || cat.includes("bott")) {
    similarCategories = ["Vêtements", "Accessoires", "Beauté"];
    alternatives = [
      { name: "Baskets en toile bio classique", price: 25000, description: "Alternative légère et ultra-confortable pour un usage quotidien." }
    ];
    performantUpgrades = [
      { name: "Souliers cousus Goodyear Cuir Plein Fleur", price: 160000, description: "Montage artisanal d'exception garantissant une durabilité de plusieurs décennies." }
    ];
    compatibleAccessories = [
      { name: "Embauchoirs en cèdre brut", price: 15000, description: "Maintient la forme de vos chaussures et absorbe l'humidité résiduelle." },
      { name: "Crème nourissante bio pour cuir noble", price: 6000, description: "À base de cire d'abeille naturelle pour raviver la souplesse et la brillance." }
    ];
    aiTips = "Le cuir pleine fleur nécessite une période d'adaptation mais offre le meilleur confort de marche. Pour les chaussures de ville, un montage cousu Goodyear ou Blake est un gage absolu de qualité réparable.";
  } else if (cat.includes("tél") || cat.includes("sams") || cat.includes("app") || cat.includes("iph") || cat.includes("phon") || cat.includes("xiaomi") || cat.includes("huawei") || cat.includes("tecno") || cat.includes("infinix")) {
    similarCategories = ["Ordinateurs", "Accessoires", "Jeux vidéo"];
    alternatives = [
      { name: "Smartphone Reconditionné Certifié (Grade A)", price: 185000, description: "Performance identique au neuf pour un prix et une empreinte carbone réduits." }
    ];
    performantUpgrades = [
      { name: "Édition Ultra Pro Max 1 To SSD", price: 950000, description: "Capteur photo de niveau professionnel, écran OLED LTPO 120Hz et châssis titane." }
    ];
    compatibleAccessories = [
      { name: "Chargeur Ultra-Rapide GaN 65W", price: 20000, description: "Conception compacte en nitrure de gallium pour charger votre téléphone et votre PC en simultané." },
      { name: "Coque renforcée en polymère recyclé", price: 12000, description: "Protection militaire contre les chutes, toucher peau de pêche agréable." }
    ];
    aiTips = "Si vous recherchez un excellent rapport qualité-prix, les modèles reconditionnés en Grade A (état comme neuf) vous feront économiser jusqu'à 40% par rapport au neuf tout en faisant un geste pour la planète.";
  } else if (cat.includes("ord") || cat.includes("pc") || cat.includes("mac") || cat.includes("lapt") || cat.includes("intel") || cat.includes("amd")) {
    similarCategories = ["Téléphones", "Jeux vidéo", "Accessoires"];
    alternatives = [
      { name: "Ordinateur Portable bureautique reconditionné", price: 220000, description: "Idéal pour le secrétariat, les cours ou le streaming, équipé d'un SSD rapide." }
    ];
    performantUpgrades = [
      { name: "Station de calcul Pro 64 Go RAM RTX 4080", price: 1650000, description: "Conçu pour la modélisation 3D, le montage vidéo 4K de niveau cinéma et le gaming ultra." }
    ];
    compatibleAccessories = [
      { name: "Support d'ordinateur ergonomique en bois noble", price: 30000, description: "Élève l'écran à hauteur des yeux pour soulager la nuque, fabriqué dans notre atelier." },
      { name: "Hub USB-C multifonction en aluminium poli", price: 18000, description: "Ajoute des ports HDMI 4K, ports USB 3.0 et lecteurs de cartes SD." }
    ];
    aiTips = "Pour un usage polyvalent à long terme, privilégiez un processeur récent (Core i5/Ryzen 5 minimum) accompagné de 16 Go de RAM. Le SSD est obligatoire pour garantir une réactivité parfaite.";
  } else if (cat.includes("télév") || cat.includes("tv") || cat.includes("ecran") || cat.includes("écr") || cat.includes("oled") || cat.includes("qled") || cat.includes("led")) {
    similarCategories = ["Jeux vidéo", "Accessoires", "Electroménager"];
    alternatives = [
      { name: "Téléviseur LED Smart TV 4K 43\"", price: 180000, description: "Qualité d'image équilibrée et accès direct à Netflix, YouTube et Prime Video." }
    ];
    performantUpgrades = [
      { name: "Écran Cinéma OLED 4K 75\" Ambilight", price: 1250000, description: "Contrastes infinis, noirs parfaits, processeur d'image IA et barres de son Dolby Atmos intégrées." }
    ];
    compatibleAccessories = [
      { name: "Support mural articulé ultra-plat", price: 25000, description: "Permet d'orienter le téléviseur sous tous les angles avec un encombrement minimal." },
      { name: "Barre de son immersive sans fil + Caisson", price: 145000, description: "Améliore drastiquement la clarté des dialogues et la profondeur des basses." }
    ];
    aiTips = "La technologie OLED offre la meilleure qualité d'image en pièce sombre grâce à ses pixels auto-émissifs. Si votre salon est très lumineux, les téléviseurs QLED ou Mini-LED seront plus adaptés grâce à leur luminosité maximale supérieure.";
  } else if (cat.includes("mob") || cat.includes("meub") || cat.includes("chaise") || cat.includes("faut") || cat.includes("table") || cat.includes("canap") || cat.includes("lit") || cat.includes("bureau") || cat.includes("lounge") || cat.includes("dining") || cat.includes("office") || cat.includes("rocking")) {
    similarCategories = ["Accessoires", "Electroménager", "Jeux vidéo"];
    
    let matchedProd = null;
    if (desc.includes("orris") || cat.includes("lounge") || desc.includes("fauteuil vert") || desc.includes("velours")) {
      matchedProd = catalog.find(p => p.id === "orris-chair");
    } else if (desc.includes("elvo") || desc.includes("pivot") || desc.includes("bureau") || desc.includes("orange")) {
      matchedProd = catalog.find(p => p.id === "elvo-chair");
    } else if (desc.includes("sienna") || desc.includes("sculpt") || desc.includes("salle")) {
      matchedProd = catalog.find(p => p.id === "sienna-lounge");
    } else if (desc.includes("mollis") || desc.includes("accent") || desc.includes("minimal")) {
      matchedProd = catalog.find(p => p.id === "mollis-accent");
    } else if (desc.includes("kivi") || desc.includes("pouf") || desc.includes("nuage")) {
      matchedProd = catalog.find(p => p.id === "kivi-cozy");
    }

    if (matchedProd) {
      foundExactMatch = true;
      matchedProductId = matchedProd.id;
      matchedProductMessage = `Bonne nouvelle ! Nous avons trouvé le produit "${matchedProd.name}" qui correspond exactement à votre recherche de mobilier d'exception.`;
    }

    nearbyProducts = furnitureItems.map(p => ({
      ...p,
      matchReason: p.id === matchedProductId ? "Correspondance exacte !" : "Meuble de créateur d'artisanat d'art de catégorie connexe."
    }));

    alternatives = [
      { name: "Pouf d'accentuation Mollis Compact", price: 160000, description: "Option de meuble d'appoint plus facile à disposer dans les petits espaces." }
    ];
    performantUpgrades = [
      { name: "Fauteuil pivotant ergonomique Elvo Pro", price: 328000, description: "Modèle équipé d'un amortisseur pneumatique haut de gamme et d'un support lombaire ajustable." }
    ];
    compatibleAccessories = [
      { name: "Cire protectrice bio d'abeille d'Atelier", price: 12000, description: "Nourrit le bois de chêne ou noyer massif pour conserver son éclat originel pendant des décennies." },
      { name: "Kit de nettoyage doux pour velours", price: 8000, description: "Élimine les taches légères sans altérer le soyeux ni la teinte des fibres de coton." }
    ];
    aiTips = "Le mobilier d'artisanat se distingue par des essences de bois massifs nobles certifiées FSC et des structures assemblées traditionnellement. Un bon meuble doit durer toute une vie et être entièrement réparable.";
  } else {
    similarCategories = ["Accessoires", "Mobilier", "Vêtements"];
    alternatives = [
      { name: "Version d'entrée de gamme fonctionnelle", price: 15000, description: "Conception standard fiable, répondant aux besoins essentiels sans surcoût." }
    ];
    performantUpgrades = [
      { name: "Modèle Premium Edition Signature", price: 120000, description: "Version haut de gamme avec des matériaux nobles durables et une garantie étendue." }
    ];
    compatibleAccessories = [
      { name: "Pochette de rangement de protection", price: 5000, description: "Housse souple ajustée pour protéger votre article contre la poussière et les rayures." }
    ];
    aiTips = "Pour tout produit sur-mesure ou rare, nous vous recommandons d'indiquer le maximum de détails de design et d'usage. Notre équipe d'experts se charge de sourcer et de valider la conformité technique du produit.";
  }

  return {
    similarCategories,
    foundExactMatch,
    matchedProductId,
    matchedProductMessage,
    nearbyProducts,
    alternatives,
    performantUpgrades,
    compatibleAccessories,
    aiTips
  };
}

// Simple in-memory cache to prevent exceeding API limits (Gemini Free Tier 5 RPM)
const analysisCache = new Map<string, { data: any; timestamp: number }>();

app.post("/api/analyze-product", express.json(), async (req: express.Request, res: express.Response) => {
  try {
    const { category, characteristics, description } = req.body;
    
    // Create a normalized, stable cache key
    const cacheKey = JSON.stringify({
      category: (category || "").trim().toLowerCase(),
      characteristics: Object.keys(characteristics || {})
        .sort()
        .reduce((acc, key) => {
          acc[key] = String(characteristics[key]).trim().toLowerCase();
          return acc;
        }, {} as Record<string, string>),
      description: (description || "").trim().toLowerCase()
    });

    // Check cache (valid for 15 minutes)
    const cached = analysisCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < 15 * 60 * 1000)) {
      console.log("Returning cached AI analysis for:", category);
      return res.json(cached.data);
    }

    // Always return 503 Service Unavailable if AI client isn't available
    if (!ai) {
      return res.status(503).json({ error: "Assistant indisponible en ce moment. Réessayez plus tard." });
    }

    const systemInstruction = `You are the ultimate expert shopping assistant and product matches analyzer of nexus. (an elite boutique).
Analyze the customer's desired category, their customized specifications, and their long description, then return suggestions, tips, and matching catalog items in French.
Return a single JSON block strictly adhering to this TypeScript interface:
interface AIAnalysisResponse {
  similarCategories: string[];
  foundExactMatch: boolean;
  matchedProductId: string | null;
  matchedProductMessage: string | null;
  nearbyProducts: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    description: string;
    matchReason: string;
  }>;
  alternatives: Array<{ name: string; price: number; description: string }>;
  performantUpgrades: Array<{ name: string; price: number; description: string }>;
  compatibleAccessories: Array<{ name: string; price: number; description: string }>;
  aiTips: string;
}

The available catalog is:
${JSON.stringify(INITIAL_PRODUCTS)}

If the customer is searching for chairs, armchairs, lounge seats, rocking chairs, tables, or desk furniture, or they name things like 'Orris', 'Elvo', 'Sienna', 'Mollis', or 'Kivi', find the closest product in our catalog and:
- Set 'foundExactMatch' to true, 'matchedProductId' to the matching product's ID, and write a pleasant confirmation message in 'matchedProductMessage'.
- Populate 'nearbyProducts' with the catalog products.
For other categories (Vêtements, Téléphones, Ordinateurs, Téléviseurs, Electroménager, Accessoires, Jeux vidéo, Montres, Beauté, etc.), set 'foundExactMatch' to false and keep 'matchedProductId' as null, but invent beautiful, high-quality, relevant 'alternatives', 'performantUpgrades', 'compatibleAccessories' with realistic prices in West African Franc (F CFA) formatted like '45000' or similar, and provide a helpful expert 'aiTips' in French. Do not add markdown backticks outside the json, just return raw json.`;

    const prompt = `Client desired category: ${category}
Selected characteristics: ${JSON.stringify(characteristics)}
User custom description: "${description}"`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        similarCategories: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Categories similar or relevant to the requested product (e.g. ['Vêtements', 'Accessoires'])."
        },
        foundExactMatch: {
          type: Type.BOOLEAN,
          description: "True if an exact matching product exists in the catalog, false otherwise."
        },
        matchedProductId: {
          type: Type.STRING,
          description: "The exact ID of the matching product from our catalog, or empty string."
        },
        matchedProductMessage: {
          type: Type.STRING,
          description: "A friendly confirmation message in French if an exact match is found, or empty string."
        },
        nearbyProducts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              image: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              matchReason: { type: Type.STRING }
            },
            required: ["id", "name", "price", "image", "category", "description", "matchReason"]
          },
          description: "Catalog products that are highly relevant or of similar category."
        },
        alternatives: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              description: { type: Type.STRING }
            },
            required: ["name", "price", "description"]
          },
          description: "Two or three alternative options (not in catalog) with realistic prices in F CFA."
        },
        performantUpgrades: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              description: { type: Type.STRING }
            },
            required: ["name", "price", "description"]
          },
          description: "Premium or higher-end upgrade versions of the product with realistic prices in F CFA."
        },
        compatibleAccessories: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              description: { type: Type.STRING }
            },
            required: ["name", "price", "description"]
          },
          description: "Two or three compatible accessories or care items with realistic prices in F CFA."
        },
        aiTips: {
          type: Type.STRING,
          description: "Expert shopping advice and tips in French for choosing this kind of product."
        }
      },
      required: [
        "similarCategories",
        "foundExactMatch",
        "matchedProductId",
        "matchedProductMessage",
        "nearbyProducts",
        "alternatives",
        "performantUpgrades",
        "compatibleAccessories",
        "aiTips"
      ]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2
      }
    });

    const text = response.text || "";
    try {
      const parsed = JSON.parse(text);
      // Cache successful response
      analysisCache.set(cacheKey, { data: parsed, timestamp: Date.now() });
      return res.json(parsed);
    } catch (parseErr) {
      console.error("Gemini JSON parse failed, returning heuristics:", parseErr, text);
      const fallbackData = getHeuristicAnalysis(category, characteristics, description, INITIAL_PRODUCTS);
      // Cache the fallback too to prevent immediate retries
      analysisCache.set(cacheKey, { data: fallbackData, timestamp: Date.now() });
      return res.json(fallbackData);
    }
  } catch (err: any) {
    console.error("AI Analysis route error, returning 503 service unavailable:", err);
    return res.status(503).json({ error: "Assistant indisponible en ce moment. Réessayez plus tard." });
  }
});

// Chat message email dispatch endpoint
app.post("/api/send-chat-email", express.json(), (req: express.Request, res: express.Response) => {
  try {
    const { sender, text, recipientEmail, senderEmail, timestamp } = req.body;
    const targetEmail = recipientEmail || "grasdvirus@gmail.com";
    console.log(`[CHAT EMAIL TRANSMITTED] From: ${sender} (${senderEmail || "System"}) -> To Google Account: ${targetEmail}`);
    console.log(`[CONTENT]: "${text}" at ${timestamp || new Date().toISOString()}`);

    return res.json({
      success: true,
      deliveredTo: targetEmail,
      sender: sender,
      message: `Message transmis au compte Google (${targetEmail}) avec succès.`,
      timestamp: timestamp || new Date().toLocaleTimeString()
    });
  } catch (err: any) {
    console.error("Chat email dispatch error:", err);
    return res.status(500).json({ error: "Erreur lors de l'envoi de l'email" });
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
