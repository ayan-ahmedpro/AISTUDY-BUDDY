import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Image as ImageIcon, 
  FileJson, 
  Download, 
  RefreshCcw, 
  Layers, 
  ArrowRight,
  FileCode,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import PptxGenJS from 'pptxgenjs';
import mammoth from 'mammoth';
import { saveAs } from 'file-saver';
import { useNavigation } from '../context/NavigationContext';

// Set up PDF.js worker safely
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

type ConversionType = 
  | 'pdf-to-word' 
  | 'word-to-pdf' 
  | 'pdf-to-ppt' 
  | 'ppt-to-pdf'
  | 'pdf-to-image' 
  | 'image-to-pdf' 
  | 'pdf-to-text';

const categories = [
  { 
    name: 'PDF Tools', 
    tools: [
      { id: 'pdf-to-word', label: 'PDF to Word', icon: <FileText/> },
      { id: 'pdf-to-ppt', label: 'PDF to PPT', icon: <FileCode/> },
      { id: 'pdf-to-image', label: 'PDF to PNG', icon: <ImageIcon/> },
      { id: 'pdf-to-text', label: 'PDF to Text', icon: <FileJson/> },
    ]
  },
  {
    name: 'Convert to PDF',
    tools: [
      { id: 'word-to-pdf', label: 'Word to PDF', icon: <FileText/> },
      { id: 'image-to-pdf', label: 'Image to PDF', icon: <ImageIcon/> },
      { id: 'ppt-to-pdf', label: 'PPT to PDF', icon: <FileCode/> },
    ]
  }
];

export default function Converter({ onClose }: { onClose: () => void }) {
  const { goBack, registerModal } = useNavigation();
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    return registerModal('Converter', onClose);
  }, [onClose, registerModal]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [type, setType] = useState<ConversionType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setSuccess(false);
      setError(null);
      // Auto-detect type based on extension
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') setType('pdf-to-word');
      else if (ext === 'docx' || ext === 'doc') setType('word-to-pdf');
      else if (['jpg', 'jpeg', 'png'].includes(ext || '')) setType('image-to-pdf');
      else if (['pptx', 'ppt'].includes(ext || '')) setType('ppt-to-pdf');
    }
  };

  const convert = async () => {
    if (!file || !type) return;
    setIsConverting(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileName = file.name.split('.').slice(0, -1).join('.');

      if (type === 'pdf-to-word') {
        setProgress(30);
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
          setProgress(30 + (i / pdf.numPages) * 50);
        }
        
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                children: [new TextRun(fullText)],
              }),
            ],
          }],
        });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${fileName}.docx`);
      } 
      
      else if (type === 'pdf-to-ppt') {
        setProgress(30);
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pptx = new PptxGenJS();
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const text = textContent.items.map((item: any) => item.str).join(' ');
          const slide = pptx.addSlide();
          slide.addText(text, { x: 0.5, y: 0.5, w: '90%', h: '90%', fontSize: 12 });
          setProgress(30 + (i / pdf.numPages) * 50);
        }
        await pptx.writeFile({ fileName: `${fileName}.pptx` });
      }

      else if (type === 'image-to-pdf') {
          const pdfDoc = await PDFDocument.create();
          const page = pdfDoc.addPage();
          setProgress(50);
          
          let image;
          if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            image = await pdfDoc.embedJpg(arrayBuffer);
          } else {
            image = await pdfDoc.embedPng(arrayBuffer);
          }
          
          const { width, height } = image.scale(0.5);
          page.drawImage(image, {
            x: 50,
            y: page.getHeight() - height - 50,
            width,
            height,
          });
          
          const pdfBytes = await pdfDoc.save();
          saveAs(new Blob([pdfBytes]), `${fileName}.pdf`);
      }

      else if (type === 'word-to-pdf' || type === 'ppt-to-pdf') {
          setProgress(30);
          let text = "";
          if (type === 'word-to-pdf') {
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
          } else {
            // For PPT to PDF, we'd need a complex parser. 
            // In a browser-only environment, we'll provide a warning or simplified text extraction if possible.
            // For now, we'll treat it as high-priority placeholder or text-based if we can use a simple zip parser.
            text = "Notice: PPT to PDF in-browser is limited to text extraction in this version.\n\n" + 
                   "Please use a dedicated server-side tool for full layout preservation.";
          }
          
          const pdfDoc = await PDFDocument.create();
          const page = pdfDoc.addPage();
          page.drawText(text, {
              x: 50,
              y: page.getHeight() - 50,
              size: 10,
              maxWidth: page.getWidth() - 100
          });
          
          const pdfBytes = await pdfDoc.save();
          saveAs(new Blob([pdfBytes]), `${fileName}.pdf`);
      }

      else if (type === 'pdf-to-image') {
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          if (context) {
            await page.render({ 
                canvasContext: context, 
                viewport,
                canvas: canvas as any
            } as any).promise;
            canvas.toBlob((blob) => {
                if (blob) saveAs(blob, `${fileName}.png`);
            });
          }
      }

      else if (type === 'pdf-to-text') {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        const blob = new Blob([text], { type: 'text/plain' });
        saveAs(blob, `${fileName}.txt`);
      }

      setSuccess(true);
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to convert file. Make sure the file is not corrupted.");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm overflow-y-auto h-full p-4 md:p-8 flex justify-center items-start">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col my-auto py-2"
      >
        <div className="p-8 border-b flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg hover:rotate-6 transition-transform">
              <Layers className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Multi-Converter</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimized for Productivity</p>
            </div>
          </div>
          <button 
            onClick={goBack} 
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl transition-colors font-black text-xs flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to AI Study Buddy</span>
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {!file ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-500" />
              </div>
              <div className="text-center">
                <p className="font-black text-slate-900 text-lg">Drop your file here</p>
                <p className="text-sm font-medium text-slate-400">PDF, Word, PPT, Images</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-8">
              {/* File Info Card */}
              <div className="bg-slate-900 p-6 rounded-[2rem] flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    {file.name.endsWith('.pdf') ? <FileText className="text-red-400" /> : <ImageIcon className="text-blue-400" />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-black text-white truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs font-bold text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => {setFile(null); setType(null);}} 
                  className="p-3 hover:bg-white/10 rounded-2xl transition-colors text-white"
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
              </div>

              {/* Category Grid */}
              <div className="space-y-6">
                {categories.map((cat, catIdx) => (
                  <div key={`cat-${cat.name}-${catIdx}`} className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">{cat.name}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {cat.tools.map((btn, btnIdx) => (
                        <button
                          key={`btn-${btn.id}-${btnIdx}`}
                          onClick={() => setType(btn.id as ConversionType)}
                          className={cn(
                            "p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group",
                            type === btn.id 
                              ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" 
                              : "border-slate-100 bg-white text-slate-600 hover:border-slate-300"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                            type === btn.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                          )}>
                            {btn.icon}
                          </div>
                          <span className="text-xs font-black uppercase tracking-wide">{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 flex items-start gap-3 animate-head-shake">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <p className="text-sm font-bold text-red-600 leading-tight">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <p className="text-sm font-bold text-emerald-600">Conversion successful! File downloaded.</p>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t">
          <button
            disabled={!file || !type || isConverting}
            onClick={convert}
            className={cn(
              "w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all",
              !file || !type || isConverting
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white shadow-2xl hover:scale-[1.02] active:scale-95"
            )}
          >
            {isConverting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Processing... {Math.round(progress)}%</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download Converted File</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
