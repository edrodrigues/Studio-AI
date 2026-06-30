import React, { useEffect, useState } from 'react';
import { Download, Sparkles, ArrowLeft, Loader2, Smartphone, Check } from 'lucide-react';
import { ShareData } from '../types';

interface MobileShareViewProps {
  shareId: string;
  onBackToMain: () => void;
}

export const MobileShareView: React.FC<MobileShareViewProps> = ({
  shareId,
  onBackToMain,
}) => {
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null);

  useEffect(() => {
    const fetchShare = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/share/${shareId}`);
        if (!res.ok) {
          throw new Error('Provador virtual expirado ou não encontrado.');
        }
        const json: ShareData = await res.json();
        setData(json);
        if (json.images && json.images.length > 0) {
          setSelectedImg(json.images[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar provador.');
      } finally {
        setLoading(false);
      }
    };
    fetchShare();
  }, [shareId]);

  const downloadAsJpg = (dataUrl: string, poseNum: number) => {
    setDownloadingIdx(poseNum);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 1024;
      canvas.height = img.height || 1365;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // White background for jpg
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const jpgUrl = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = `provador-nanobanana2-pose-${poseNum}.jpg`;
        link.href = jpgUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setTimeout(() => setDownloadingIdx(null), 1000);
    };
    img.src = dataUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-4" />
        <h2 className="text-lg font-medium">Carregando provador mobile...</h2>
        <p className="text-sm text-zinc-400 mt-1">Sincronizando poses NanoBanana2</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-4">
          <Smartphone className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-medium mb-2">Link indisponível</h2>
        <p className="text-sm text-zinc-400 max-w-sm mb-6">{error}</p>
        <button
          id="back-home-btn"
          onClick={onBackToMain}
          className="bg-white text-zinc-950 px-6 py-3 rounded-xl font-medium text-sm transition hover:bg-zinc-200"
        >
          Criar meu Provador Virtual
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col max-w-md mx-auto shadow-2xl relative pb-12">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
        <button
          id="mobile-back-btn"
          onClick={onBackToMain}
          className="text-zinc-400 hover:text-white flex items-center gap-1 text-xs font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" /> Novo Teste
        </button>
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-mono font-medium text-amber-300">NanoBanana2 AI</span>
        </div>
      </header>

      {/* Main Image Showcase */}
      <div className="w-full aspect-[3/4] bg-zinc-900 relative overflow-hidden">
        {selectedImg && (
          <img
            src={selectedImg}
            alt="Provador Virtual Pose"
            className="w-full h-full object-cover transition-all duration-300"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none opacity-80" />
        
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold block">
              Resultado Exclusivo
            </span>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Provador Virtual com IA
            </h1>
          </div>
        </div>
      </div>

      {/* Download Action */}
      <div className="px-4 mt-6 space-y-3">
        {selectedImg && (
          <button
            id="download-current-mobile"
            onClick={() => downloadAsJpg(selectedImg, 1)}
            disabled={downloadingIdx !== null}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition transform active:scale-98 disabled:opacity-50"
          >
            {downloadingIdx ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Baixando JPG...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Baixar Foto em JPG
              </>
            )}
          </button>
        )}

        <div className="text-center pt-2">
          <p className="text-[11px] text-zinc-500 font-sans">
            Gerado pela inteligência artificial NanoBanana2 via Future Ready Labs. As proporções corporais e caimento do tecido foram recriados com precisão fotorealista.
          </p>
        </div>
      </div>
    </div>
  );
};
