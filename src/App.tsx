import React, { useState, useEffect } from 'react';
import { Sparkles, Download, Share2, Check, RefreshCw, Wand2, Eye, ShieldCheck, Loader2, Shirt, User, WifiOff } from 'lucide-react';
import { ImageUploadField } from './components/ImageUploadField';
import { MobileShareView } from './components/MobileShareView';
import { TryOnResponse } from './types';

export default function App() {
  const [personImage, setPersonImage] = useState<string>('');
  const [clothesImage, setClothesImage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<TryOnResponse | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [downloadingAll, setDownloadingAll] = useState<boolean>(false);
  const [selectedModalImg, setSelectedModalImg] = useState<{ url: string; index: number } | null>(null);

  // Check if viewing mobile share URL
  const [urlShareId, setUrlShareId] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sId = params.get('share');
    if (sId) {
      setUrlShareId(sId);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch('/api/health');
        if (mounted) setServerOnline(res.ok);
      } catch {
        if (mounted) setServerOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  if (urlShareId) {
    return (
      <MobileShareView
        shareId={urlShareId}
        onBackToMain={() => {
          window.history.pushState({}, '', window.location.pathname);
          setUrlShareId(null);
        }}
      />
    );
  }

  const handleGenerate = async () => {
    if (!personImage || !clothesImage) {
      setError('Por favor, insira as duas fotos (da pessoa e da roupa) para continuar.');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setCopiedLink(false);

    try {
      const res = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personImage, clothesImage }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao comunicar com o servidor do NanoBanana2.');
      }

      setResponse(data);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado ao gerar as fotos.');
    } finally {
      setLoading(false);
    }
  };

  const downloadImageAsJpg = (dataUrl: string, index: number) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 1024;
        canvas.height = img.height || 1365;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const jpgUrl = canvas.toDataURL('image/jpeg', 0.92);
          const link = document.createElement('a');
          link.download = `provador-nanobanana2-pose-${index + 1}.jpg`;
          link.href = jpgUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        resolve();
      };
      img.src = dataUrl;
    });
  };

  const handleDownloadAllJpg = async () => {
    if (!response?.images) return;
    setDownloadingAll(true);
    try {
      for (let i = 0; i < response.images.length; i++) {
        await downloadImageAsJpg(response.images[i], i);
        await new Promise((r) => setTimeout(r, 400));
      }
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleCopyMobileLink = () => {
    if (!response?.shareId) return;
    const origin = window.location.origin;
    const mobileUrl = `${origin}/?share=${response.shareId}`;
    navigator.clipboard.writeText(mobileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleReset = () => {
    setResponse(null);
    setError(null);
    setPersonImage('');
    setClothesImage('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* Background Subtle Accent */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-25">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-amber-600/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-orange-600/15 rounded-full blur-[160px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Server Status Banner */}
        {serverOnline === false && (
          <div className="mb-6 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-center gap-2 animate-fade-in">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Servidor offline — as requisições à API podem falhar. Verifique se o servidor Express está rodando.</span>
          </div>
        )}

        {/* Header */}
        <header className="text-center mb-10 md:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-4 py-1.5 rounded-full shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
              Criado por{' '}
              <a
                href="https://www.futurereadylabs.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white transition-colors"
              >
                Future Ready Labs
              </a>{' '}
              (I.S.)
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-sans">
            Provador Virtual de Roupas
          </h1>
          <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto font-sans">
            Insira sua foto e a foto da roupa desejada. Nossa inteligência artificial recriará você vestindo a peça em uma foto fotorealista em pose de modelo com iluminação de estúdio.
          </p>
        </header>

        {/* Input Section (STRICTLY 2 FIELDS) */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-2xl mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
            {/* Field 1 */}
            <div className="bg-white rounded-2xl p-4 md:p-5 shadow-xl text-zinc-900">
              <ImageUploadField
                numberTag={1}
                label="Foto da Pessoa"
                sublabel="Rosto visível ou corpo inteiro na vertical"
                value={personImage}
                onChange={setPersonImage}
                onClear={() => setPersonImage('')}
              />
            </div>

            {/* Field 2 */}
            <div className="bg-white rounded-2xl p-4 md:p-5 shadow-xl text-zinc-900">
              <ImageUploadField
                numberTag={2}
                label="Foto da Roupa"
                sublabel="Peça isolada ou em manequim/fundo neutro"
                value={clothesImage}
                onChange={setClothesImage}
                onClear={() => setClothesImage('')}
              />
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3 animate-fade-in">
              <div className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-ping" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 border-t border-zinc-800/60">
            <button
              id="generate-tryon-btn"
              onClick={handleGenerate}
              disabled={loading || !personImage || !clothesImage}
              className="w-full sm:w-auto min-w-[320px] bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold text-base px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/15 flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none disabled:transform-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-950" />
                  <span>NanoBanana2 Gerando Provador...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 text-zinc-950 fill-current" />
                  <span>Gerar Provador Virtual</span>
                </>
              )}
            </button>

            {(personImage || clothesImage) && !loading && (
              <button
                id="reset-inputs-btn"
                onClick={handleReset}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-300 py-2 px-4 rounded-lg transition"
              >
                Limpar Campos
              </button>
            )}
          </div>
        </div>

        {/* Loading Overlay Card during AI Processing */}
        {loading && (
          <div className="bg-zinc-900/80 border border-amber-500/30 rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden my-8 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-orange-500/5" />
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-sans">
              Modelando sua Roupa com Inteligência Artificial
            </h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
              O motor NanoBanana2 está calculando dobras do tecido, caimento anatômico e iluminação de estúdio para criar sua foto fotorealista em pose de modelo.
            </p>
            <div className="flex justify-center gap-6 text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> Iluminação de Estúdio</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> Caimento Anatômico</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> Pose de Modelo</span>
            </div>
          </div>
        )}

        {/* Results Section */}
        {response && response.images && response.images[0] && (
          <div id="results-section" className="space-y-8 animate-fade-in pt-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-5 gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">
                  Provador Concluído
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Seu Look Modelado por IA
                </h2>
              </div>

              {/* The EXACT 2 requested buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  id="download-jpg-btn"
                  onClick={() => downloadImageAsJpg(response.images[0], 0)}
                  className="bg-white hover:bg-zinc-100 text-zinc-950 font-bold px-5 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition transform active:scale-98 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Foto em JPG</span>
                </button>

                <button
                  id="copy-mobile-link-btn"
                  onClick={handleCopyMobileLink}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-5 py-3 rounded-xl border border-zinc-700 flex items-center justify-center gap-2 text-sm transition transform active:scale-98 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-amber-400" />
                      <span>Copiar Link Mobile</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Single Model Photo Showcase */}
            <div className="max-w-md mx-auto">
              <div className="group bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 hover:border-zinc-700 hover:shadow-amber-500/5">
                <div 
                  className="relative aspect-[3/4] overflow-hidden bg-zinc-950 cursor-zoom-in" 
                  onClick={() => setSelectedModalImg({ url: response.images[0], index: 0 })}
                >
                  <img
                    src={response.images[0]}
                    alt="Look Gerado"
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-103"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                    <span className="bg-white/90 text-zinc-900 px-4 py-2 rounded-full font-medium text-xs flex items-center gap-1.5 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition">
                      <Eye className="w-3.5 h-3.5" /> Ampliar foto
                    </span>
                  </div>
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-mono font-medium text-white">
                    Fidelidade Máxima
                  </div>
                </div>
                
                <div className="p-5 flex items-center justify-between bg-zinc-900/90">
                  <div>
                    <h4 className="font-bold text-white text-sm">Estúdio Fotorealista</h4>
                    <p className="text-xs text-zinc-400">Caimento anatômico e proporções fiéis por NanoBanana2</p>
                  </div>
                  <button
                    onClick={() => downloadImageAsJpg(response.images[0], 0)}
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 transition"
                    title="Baixar esta foto em JPG"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Link helper tip */}
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Visualização Rápida no Smartphone</h4>
                  <p className="text-xs text-zinc-400">
                    O link copiado abre uma interface exclusiva móvel para você mostrar as roupas provadas a amigos ou clientes.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCopyMobileLink}
                className="shrink-0 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4"
              >
                {copiedLink ? 'Link Copiado!' : 'Copiar Link Agora'}
              </button>
            </div>
          </div>
        )}

        {/* Footer Guarantee */}
        <footer className="mt-16 text-center text-xs text-zinc-600 font-sans border-t border-zinc-900 pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-zinc-500" /> Privacidade Garantida</span>
          <span className="hidden sm:inline">•</span>
          <span>As imagens enviadas são processadas em memória e não são utilizadas para treinar modelos públicos.</span>
        </footer>
      </div>

      {/* Modal Zoom */}
      {selectedModalImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-fade-in"
          onClick={() => setSelectedModalImg(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 bg-zinc-950 flex items-center justify-between border-b border-zinc-800">
              <span className="text-sm font-bold text-white px-2">Pose #{selectedModalImg.index + 1} ampliada</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadImageAsJpg(selectedModalImg.url, selectedModalImg.index)}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar JPG
                </button>
                <button
                  onClick={() => setSelectedModalImg(null)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
                >
                  Fechar
                </button>
              </div>
            </div>
            <div className="overflow-auto p-2 flex items-center justify-center bg-black">
              <img src={selectedModalImg.url} alt="Zoom" className="max-h-[80vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
