import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import { parseDataUrl } from "./lib/parseDataUrl";
import { setShare } from "./lib/cache";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

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

    const posePrompt = "Photorealistic full body front-facing high-fashion studio shot of the exact person from Reference Image 1 wearing the exact clothing item from Reference Image 2. Confident standing fashion model pose, crisp fabric texture, clean minimalist neutral studio background, professional 8k lighting.";

    console.log("Starting NanoBanana2 (gemini-3.1-flash-image) generation for single pose...");

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: {
        parts: [
          { text: "Reference Image 1 (Subject Identity & Body to maintain):" },
          personPart,
          { text: "Reference Image 2 (Target Clothing Item to apply):" },
          clothesPart,
          { text: `Task: Virtual Try-On. Create a photo of Reference Image 1 wearing Reference Image 2. Pose instruction: ${posePrompt}` }
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
    let imgBase64: string | undefined;
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || "image/png";
        imgBase64 = `data:${mime};base64,${part.inlineData.data}`;
        break;
      }
    }
    if (!imgBase64) {
      throw new Error("Não retornou nenhuma imagem da inteligência artificial.");
    }
    const generatedImages: string[] = [imgBase64];

    const shareId = Math.random().toString(36).substring(2, 9) + "-" + Date.now().toString(36);
    setShare(shareId, generatedImages);

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
}
