import React, { useRef } from 'react';
import { Upload, X, CheckCircle2 } from 'lucide-react';

interface ImageUploadFieldProps {
  label: string;
  sublabel: string;
  value: string;
  onChange: (base64: string) => void;
  onClear: () => void;
  numberTag: number;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  sublabel,
  value,
  onChange,
  onClear,
  numberTag,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex items-center justify-center w-6 h-6 text-xs font-mono font-bold text-white bg-zinc-900 rounded-full">
          {numberTag}
        </span>
        <div>
          <h3 className="font-sans font-medium tracking-tight text-zinc-900 text-sm md:text-base">
            {label}
          </h3>
          <p className="text-xs text-zinc-500 font-sans">{sublabel}</p>
        </div>
      </div>

      {value ? (
        <div className="relative group w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-zinc-200 bg-zinc-50 shadow-sm transition-all duration-300 hover:shadow-md">
          <img
            src={value}
            alt={label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-4">
            <span className="text-white text-xs font-medium flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Imagem selecionada
            </span>
            <button
              id={`clear-btn-${numberTag}`}
              type="button"
              onClick={onClear}
              className="bg-white/90 hover:bg-white text-zinc-900 p-2 rounded-full transition-all duration-200 shadow-lg transform hover:scale-105"
              title="Trocar imagem"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          id={`dropzone-${numberTag}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="w-full aspect-[3/4] border-2 border-dashed border-zinc-300 hover:border-zinc-900 bg-zinc-50/50 hover:bg-zinc-100/50 rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 group"
        >
          <div className="w-14 h-14 bg-white shadow-md rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-zinc-100">
            <Upload className="w-6 h-6 text-zinc-700" />
          </div>
          <span className="font-medium text-sm text-zinc-800 mb-1">
            Clique para enviar
          </span>
          <span className="text-xs text-zinc-500 mb-3 max-w-[200px]">
            ou arraste e solte o arquivo aqui
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 bg-zinc-200/60 px-2 py-1 rounded">
            PNG, JPG ou WEBP
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};
