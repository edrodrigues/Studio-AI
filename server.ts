import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const SHARES_FILE = path.join("/tmp", "tryon_shares.json");

// In-memory cache backed by disk storage
const sharesCache = new Map<string, { id: string; images: string[]; createdAt: number }>();

function loadSharesFromDisk() {
  try {
    if (fs.existsSync(SHARES_FILE)) {
      const data = fs.readFileSync(SHARES_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => sharesCache.set(item.id, item));
      }
    }
  } catch (err) {
    console.warn("Failed to load shares from disk:", err);
  }
}

function saveSharesToDisk() {
  try {
    const list = Array.from(sharesCache.values());
    fs.writeFileSync(SHARES_FILE, JSON.stringify(list), "utf-8");
  } catch (err) {
    console.warn("Failed to save shares to disk:", err);
  }
}

loadSharesFromDisk();

function parseDataUrl(dataUrl: string) {
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9-+.]+);base64,(.+)$/);
  if (!matches) {
    return { mimeType: "image/jpeg", data: dataUrl.replace(/^data:image\/[^;]+;base64,/, "") };
  }
  return { mimeType: matches[1], data: matches[2] };
}

async function startServer() {
  const app = express();

  // Increase body parser limit for high resolution image uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", cachedShares: sharesCache.size });
  });

  // Get Shared TryOn Images
  app.get("/api/share/:id", (req, res) => {
    const { id } = req.params;
    const share = sharesCache.get(id);
    if (!share) {
      return res.status(404).json({ error: "Provador virtual não encontrado ou expirado." });
    }
    return res.json(share);
  });

  // POST Virtual TryOn Generation (NanoBanana2 / gemini-3.1-flash-image)
  app.post("/api/tryon", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "Chave de API Gemini (GEMINI_API_KEY) não configurada no servidor.",
        });
      }

      const { personImage, clothesImage } = req.body;
      if (!personImage || !clothesImage) {
        return res.status(400).json({
          error: "As duas fotos (pessoa e roupa) são obrigatórias.",
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const personPart = { inlineData: parseDataUrl(personImage) };
      const clothesPart = { inlineData: parseDataUrl(clothesImage) };

      // Define 1 high quality fashion model pose requested by user
      const posePrompt = "Photorealistic full body front-facing high-fashion studio shot of the exact person from Reference Image 1 wearing the exact clothing item from Reference Image 2. Confident standing fashion model pose, crisp fabric texture, clean minimalist neutral studio background, professional 8k lighting.";

      console.log("Starting NanoBanana2 (gemini-3.1-flash-image) generation for single pose...");

      const generatePoseWithRetry = async (promptText: string, maxRetries = 3): Promise<string> => {
        let attempt = 0;
        while (attempt <= maxRetries) {
          try {
            const response = await ai.models.generateContent({
              model: "gemini-3.1-flash-image",
              contents: {
                parts: [
                  { text: "Reference Image 1 (Subject Identity & Body to maintain):" },
                  personPart,
                  { text: "Reference Image 2 (Target Clothing Item to apply):" },
                  clothesPart,
                  { text: `Task: Virtual Try-On. Create a photo of Reference Image 1 wearing Reference Image 2. Pose instruction: ${promptText}` }
                ],
              },
              config: {
                imageConfig: {
                  aspectRatio: "3:4",
                  imageSize: "1K",
                },
              },
            });

            const parts = response.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                const mime = part.inlineData.mimeType || "image/png";
                return `data:${mime};base64,${part.inlineData.data}`;
              }
            }
            throw new Error("Não retornou nenhuma imagem da inteligência artificial.");
          } catch (poseErr: any) {
            const isRateLimit = poseErr?.status === 429 || poseErr?.message?.includes("429") || poseErr?.message?.toLowerCase()?.includes("quota") || poseErr?.message?.toLowerCase()?.includes("resource has been exhausted");
            if (isRateLimit && attempt < maxRetries) {
              attempt++;
              const waitSec = Math.pow(2, attempt) * 3; // 6s, 12s, 24s
              console.warn(`[429 Rate Limit] Cota excedida. Tentando novamente em ${waitSec}s (Tentativa ${attempt}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, waitSec * 1000));
              continue;
            }
            console.error("Erro ao gerar provador:", poseErr.message || poseErr);
            throw poseErr;
          }
        }
        throw new Error(`Falha ao gerar o provador após ${maxRetries} tentativas.`);
      };

      const imgBase64 = await generatePoseWithRetry(posePrompt);
      const generatedImages: string[] = [imgBase64];

      // Create unique ID for mobile sharing
      const shareId = Math.random().toString(36).substring(2, 9) + "-" + Date.now().toString(36);

      const shareRecord = {
        id: shareId,
        images: generatedImages,
        createdAt: Date.now(),
      };

      sharesCache.set(shareId, shareRecord);
      saveSharesToDisk();

      console.log(`Successfully created Virtual Try-On share: ${shareId}`);
      return res.json({ shareId, images: generatedImages });
    } catch (err: any) {
      console.error("Virtual Try-On API error:", err);
      let errMsg = err.message || "Erro interno ao gerar provador virtual com IA.";
      
      const isQuotaError = 
        err.status === 429 || 
        errMsg.includes("429") || 
        errMsg.toLowerCase().includes("quota") || 
        errMsg.toLowerCase().includes("exhausted") || 
        errMsg.toLowerCase().includes("billing");

      if (isQuotaError) {
        errMsg = "Cota Excedida (429): O modelo de geração de imagens do NanoBanana2 (gemini-3.1-flash-image) requer que você configure uma conta de faturamento (Pay-as-you-go) no seu painel do Google AI Studio. Este modelo experimental possui limite zero de requisições no plano gratuito.";
      }

      return res.status(isQuotaError ? 429 : 500).json({
        error: errMsg,
      });
    }
  });

  // Mount Vite middleware in development or static serve in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Express 4 wildcard catch-all
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Provador Virtual Server running on http://localhost:${PORT}`);
  });
}

startServer();
