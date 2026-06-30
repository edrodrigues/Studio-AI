import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getShare } from "../lib/cache";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "ID inválido." });
  }
  const share = getShare(id);
  if (!share) {
    return res.status(404).json({ error: "Provador virtual não encontrado ou expirado." });
  }
  res.json(share);
}
