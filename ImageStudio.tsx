import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Upload, 
  Download, 
  Sliders, 
  Wand2, 
  Layers, 
  Check, 
  AlertCircle,
  Loader2,
  X,
  Maximize2,
  ArrowLeft,
  Zap,
  Lock
} from 'lucide-react';
import { generateOrEditImage } from '../services/geminiService';
import { cn } from '../lib/utils';
import { getImageGenerationsUsed, incrementImageGenerationsUsed } from '../lib/userStats';
import { useNavigation } from '../context/NavigationContext';

interface ImageStudioProps {
  onClose?: () => void;
  onInsertToNotes?: (imageUrl: string) => void;
  isPro?: boolean;
  onOpenUpgrade?: () => void;
}

export const ImageStudio: React.FC<ImageStudioProps> = ({ 
  onClose, 
  onInsertToNotes,
  isPro = false,
  onOpenUpgrade
}) => {
  const { goBack, registerModal } = useNavigation();
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (onClose) {
      return registerModal('ImageStudio', onClose);
    }
  }, [onClose, registerModal]);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [quality, setQuality] = useState<'flash' | 'pro'>('pro');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('2K');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('16:9');
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usesCount, setUsesCount] = useState<number>(getImageGenerationsUsed());

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setMode('edit');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter an image prompt or edit instruction.');
      return;
    }

    if (!isPro && usesCount >= 1) {
      setError('Free tier limit reached (1 image generation). Upgrade to Pro for unlimited image & diagram creation!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let base64Image: string | undefined;
      let mimeType: string | undefined;

      if (selectedImage && mode === 'edit') {
        const buffer = await selectedImage.arrayBuffer();
        base64Image = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        mimeType = selectedImage.type || 'image/png';
      }

      const imageUrl = await generateOrEditImage({
        prompt: prompt.trim(),
        base64Image,
        mimeType,
        quality,
        imageSize,
        aspectRatio
      });

      setGeneratedImage(imageUrl);
      if (!isPro) {
        incrementImageGenerationsUsed();
        setUsesCount(getImageGenerationsUsed());
      }
    } catch (err: any) {
      console.error("[ImageStudio] Generation error:", err);
      setError(err?.message || 'Failed to generate or edit image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `study_illustration_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-100 dark:border-slate-800 shadow-lush space-y-8 relative overflow-hidden h-full overflow-y-auto">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Wand2 className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider">
                Gemini 3 Pro Image
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 text-[10px] font-black uppercase tracking-wider">
                High Quality 1K-4K
              </span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              AI Image Studio & Editor
            </h2>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={goBack}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-purple-100 dark:hover:bg-purple-950 hover:text-purple-700 dark:hover:text-purple-300 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to AI Study Buddy</span>
          </button>
        )}
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => { setMode('create'); setSelectedImage(null); setImagePreview(null); }}
          className={cn(
            "p-5 rounded-2xl border-2 text-left flex items-center gap-4 transition-all",
            mode === 'create' 
              ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-100 shadow-md" 
              : "border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-900 text-slate-600 dark:text-slate-400"
          )}
        >
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            mode === 'create' ? "bg-purple-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
          )}>
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-base">Generate New Image</h4>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Create scientific diagrams, study charts, or conceptual artwork from prompt</p>
          </div>
        </button>

        <button
          onClick={() => setMode('edit')}
          className={cn(
            "p-5 rounded-2xl border-2 text-left flex items-center gap-4 transition-all",
            mode === 'edit' 
              ? "border-pink-600 bg-pink-50/50 dark:bg-pink-950/30 text-pink-900 dark:text-pink-100 shadow-md" 
              : "border-slate-100 dark:border-slate-800 hover:border-pink-200 dark:hover:border-pink-900 text-slate-600 dark:text-slate-400"
          )}
        >
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            mode === 'edit' ? "bg-pink-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
          )}>
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-base">Edit Existing Image</h4>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Upload a study photo or diagram and edit it with text prompts</p>
          </div>
        </button>
      </div>

      {/* Upload Box if in Edit Mode */}
      {mode === 'edit' && (
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Source Image to Edit
          </label>
          <div className="flex items-center gap-6 p-6 rounded-2xl border-2 border-dashed border-pink-200 dark:border-pink-900/50 bg-pink-50/20 dark:bg-pink-950/10">
            {imagePreview ? (
              <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-pink-500 shrink-0">
                <img src={imagePreview} alt="User-selected source image for AI editing and refinement" className="w-full h-full object-cover" />
                <button 
                  onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:scale-110 transition-transform"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 cursor-pointer hover:bg-pink-50/50 dark:hover:bg-pink-950/30 rounded-xl transition-colors">
                <Upload className="w-8 h-8 text-pink-500 mb-2" />
                <span className="text-xs font-bold text-pink-700 dark:text-pink-300">Upload Photo or Diagram</span>
                <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP (Up to 10MB)</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
            {imagePreview && (
              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium space-y-1">
                <p className="font-bold text-pink-600 dark:text-pink-400">Source image loaded!</p>
                <p>Describe what you want to add, change, remove, or transform in this image below.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prompt Input */}
      <div className="space-y-3">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>{mode === 'edit' ? 'Edit Instructions' : 'Image Description / Prompt'}</span>
          <span className="text-[11px] text-purple-600 font-bold">Powered by Gemini 3 Pro</span>
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            mode === 'edit'
              ? 'e.g., "Add glowing labels pointing to the nucleus and mitochondria in bright neon green, and make the background dark navy"'
              : 'e.g., "High quality 3D render of a photosynthesis light reaction diagram with chloroplasts, water molecules, ATP synthesis, and glowing electron transportation chains, clear text labels"'
          }
          className="w-full h-28 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
        />
      </div>

      {/* Settings Options (Resolution, Quality, Aspect Ratio) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
        
        {/* Model Quality */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Engine Quality
          </label>
          <div className="flex rounded-xl bg-slate-200 dark:bg-slate-700 p-1">
            <button
              onClick={() => setQuality('pro')}
              className={cn(
                "flex-1 py-2 text-xs font-black rounded-lg transition-all",
                quality === 'pro' ? "bg-white dark:bg-slate-900 text-purple-600 shadow-sm" : "text-slate-600 dark:text-slate-400"
              )}
            >
              Gemini 3 Pro
            </button>
            <button
              onClick={() => setQuality('flash')}
              className={cn(
                "flex-1 py-2 text-xs font-black rounded-lg transition-all",
                quality === 'flash' ? "bg-white dark:bg-slate-900 text-purple-600 shadow-sm" : "text-slate-600 dark:text-slate-400"
              )}
            >
              Flash Speed
            </button>
          </div>
        </div>

        {/* Image Size (1K, 2K, 4K) */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Resolution Size
          </label>
          <div className="flex rounded-xl bg-slate-200 dark:bg-slate-700 p-1">
            {(['1K', '2K', '4K'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setImageSize(size)}
                className={cn(
                  "flex-1 py-2 text-xs font-black rounded-lg transition-all",
                  imageSize === size ? "bg-white dark:bg-slate-900 text-purple-600 shadow-sm" : "text-slate-600 dark:text-slate-400"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Aspect Ratio
          </label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as any)}
            className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="16:9">16:9 Landscape (Widescreen)</option>
            <option value="1:1">1:1 Square (Diagram / Card)</option>
            <option value="9:16">9:16 Portrait (Mobile)</option>
            <option value="4:3">4:3 Standard</option>
            <option value="3:4">3:4 Tall</option>
          </select>
        </div>

      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-xs font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-base shadow-xl shadow-purple-500/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Generating High Precision Image ({imageSize})...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-6 h-6" />
            <span>{mode === 'edit' ? 'Apply AI Image Edits' : `Generate ${imageSize} Image`}</span>
          </>
        )}
      </button>

      {/* Result Display */}
      {generatedImage && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-500" /> Generated Visual Asset
            </h3>
            <div className="flex items-center gap-2">
              {onInsertToNotes && (
                <button
                  onClick={() => onInsertToNotes(generatedImage)}
                  className="px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-200 transition-colors"
                >
                  Insert to Study Notes
                </button>
              )}
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md"
              >
                <Download className="w-4 h-4" /> Download HD Image
              </button>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden border-2 border-purple-200 dark:border-purple-900 shadow-2xl group bg-slate-950 flex items-center justify-center min-h-[300px]">
            <img 
              src={generatedImage} 
              alt={prompt ? `AI generated study graphic: ${prompt}` : "AI generated study visual concept"} 
              className="max-h-[600px] w-auto object-contain mx-auto" 
            />
          </div>
        </motion.div>
      )}

      {/* Bottom Back Action Bar */}
      {onClose && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Main Studio Dashboard</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageStudio;
