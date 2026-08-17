import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Film, 
  Play, 
  Sparkles, 
  Upload, 
  Download, 
  Loader2, 
  Clapperboard, 
  X, 
  AlertCircle, 
  Video, 
  CheckCircle2, 
  Clock, 
  Layers,
  ArrowLeft
} from 'lucide-react';
import { generateVeoVideo, pollVeoOperation, downloadVeoVideo } from '../services/geminiService';
import { cn } from '../lib/utils';
import { getVideoGenerationsUsed, incrementVideoGenerationsUsed } from '../lib/userStats';
import { Zap, Lock } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

interface VeoStudioProps {
  onClose?: () => void;
  isPro?: boolean;
  onOpenUpgrade?: () => void;
}

export const VeoStudio: React.FC<VeoStudioProps> = ({ 
  onClose,
  isPro = false,
  onOpenUpgrade
}) => {
  const { goBack, registerModal } = useNavigation();
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (onClose) {
      return registerModal('VeoStudio', onClose);
    }
  }, [onClose, registerModal]);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usesCount, setUsesCount] = useState<number>(getVideoGenerationsUsed());

  const progressTimerRef = useRef<any>(null);

  const reassuringMessages = [
    "Initializing Veo 3 Neural Renderer...",
    "Constructing 3D temporal keyframes...",
    "Synthesizing smooth fluid motion vectors...",
    "Blending lighting and material shaders...",
    "Polishing video resolution & rendering MP4 stream...",
    "Almost ready! Finalizing high-definition video..."
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !selectedImage) {
      setError('Please provide a video prompt or upload an image to animate.');
      return;
    }

    if (!isPro && usesCount >= 1) {
      setError('Free tier limit reached (1 video generation). Upgrade to Pro for unlimited AI video lesson generation!');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setProgressPercent(10);
    setStatusMessage(reassuringMessages[0]);

    // Animate reassuring progress messages
    let msgIndex = 0;
    progressTimerRef.current = setInterval(() => {
      msgIndex = (msgIndex + 1) % reassuringMessages.length;
      setStatusMessage(reassuringMessages[msgIndex]);
      setProgressPercent(prev => (prev < 90 ? prev + 8 : prev));
    }, 4500);

    try {
      let base64Image: string | undefined;
      let mimeType: string | undefined;

      if (selectedImage) {
        const buffer = await selectedImage.arrayBuffer();
        base64Image = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        mimeType = selectedImage.type || 'image/png';
      }

      // Step 1: Start operation
      const operationName = await generateVeoVideo({
        prompt: prompt.trim() || 'Animate this study material diagram into a high-definition motion lesson with dynamic camera panning',
        base64Image,
        mimeType,
        aspectRatio
      });

      // Step 2: Poll operation
      const completedOp = await pollVeoOperation(operationName, (msg) => {
        setStatusMessage(msg);
      });

      // Step 3: Fetch video blob
      const videoBlobUrl = await downloadVeoVideo(completedOp);
      
      setProgressPercent(100);
      setGeneratedVideoUrl(videoBlobUrl);

      if (!isPro) {
        incrementVideoGenerationsUsed();
        setUsesCount(getVideoGenerationsUsed());
      }
    } catch (err: any) {
      console.error("[VeoStudio] Generation error:", err);
      setError(err?.message || 'Failed to generate video. Veo model operation timed out or encountered an issue.');
    } finally {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const handleDownload = () => {
    if (!generatedVideoUrl) return;
    const a = document.createElement('a');
    a.href = generatedVideoUrl;
    a.download = `veo_lesson_video_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-100 dark:border-slate-800 shadow-lush space-y-8 relative overflow-hidden h-full overflow-y-auto">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Film className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider">
                Veo 3 Video Generator
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider">
                Text & Image To Motion
              </span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              Veo 3 AI Video Generator
            </h2>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={goBack}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-100 dark:hover:bg-blue-950 hover:text-blue-700 dark:hover:text-blue-300 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to AI Study Buddy</span>
          </button>
        )}
      </div>

      {/* Image Upload for Animate Image feature */}
      <div className="space-y-3">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Animate Photo / Diagram (Optional Starting Image)</span>
          <span className="text-[11px] text-indigo-600 font-bold">Image-to-Video Engine</span>
        </label>
        
        <div className="p-6 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/10 flex items-center gap-6">
          {imagePreview ? (
            <div className="relative w-36 h-24 rounded-xl overflow-hidden border-2 border-indigo-500 shrink-0">
              <img src={imagePreview} alt="User-selected video start frame visual prompt" className="w-full h-full object-cover" />
              <button 
                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:scale-110 transition-transform"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-28 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 rounded-xl transition-colors">
              <Upload className="w-8 h-8 text-indigo-500 mb-2" />
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Upload Photo to Animate</span>
              <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP — Veo will bring this photo to life!</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}

          {imagePreview && (
            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium space-y-1">
              <p className="font-bold text-indigo-600 dark:text-indigo-400">Starting image set!</p>
              <p>Veo will use this photo as the first frame and animate it dynamically based on your prompt.</p>
            </div>
          )}
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-3">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Video Motion Description
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='e.g., "A 3D cinematic zoom through a plant cell during photosynthesis showing chloroplasts absorbing sunlight and generating ATP in vibrant neon colors"'
          className="w-full h-24 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
        />
      </div>

      {/* Aspect Ratio Selector */}
      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Video Aspect Ratio
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setAspectRatio('16:9')}
            className={cn(
              "py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 border-2 transition-all",
              aspectRatio === '16:9'
                ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 shadow-sm"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
            )}
          >
            <Clapperboard className="w-4 h-4" /> 16:9 Landscape (Desktop / Presentation)
          </button>

          <button
            onClick={() => setAspectRatio('9:16')}
            className={cn(
              "py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 border-2 transition-all",
              aspectRatio === '9:16'
                ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 shadow-sm"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
            )}
          >
            <Video className="w-4 h-4" /> 9:16 Portrait (Mobile / Short)
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-xs font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Progress Loading State */}
      {loading && (
        <div className="p-8 rounded-3xl bg-indigo-950 text-white space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="font-black text-sm tracking-wide">{statusMessage}</span>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-300">{progressPercent}%</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-indigo-900">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full rounded-full transition-all duration-700 shadow-lg shadow-indigo-500/50" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-xs text-indigo-300/80 font-medium italic">
            Veo 3 video rendering takes about 30-90 seconds to synthesize smooth frames. Please hold on!
          </p>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-base shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Rendering Veo Video...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-6 h-6" />
            <span>{selectedImage ? 'Animate Image with Veo 3' : 'Generate Veo 3 Video'}</span>
          </>
        )}
      </button>

      {/* Result Player */}
      {generatedVideoUrl && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Generated Veo HD Video
            </h3>
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Download className="w-4 h-4" /> Download Video (MP4)
            </button>
          </div>

          <div className="rounded-3xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-900 shadow-2xl bg-slate-950 flex items-center justify-center">
            <video 
              src={generatedVideoUrl} 
              controls 
              autoPlay 
              loop 
              className={cn(
                "max-h-[500px] w-auto object-contain mx-auto",
                aspectRatio === '9:16' ? "max-h-[600px]" : ""
              )}
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

export default VeoStudio;
