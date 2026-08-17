export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  try {
    if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
      // Dynamically import pdfjs-dist only when extracting PDF text
      const pdfjsLib = await import('pdfjs-dist');
      if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }
      return fullText.trim() || `[PDF File: ${file.name} - No readable text extracted]`;
    }

    if (fileName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Dynamically import mammoth only when extracting docx text
      const mammothModule = await import('mammoth');
      const mammoth = (mammothModule as any).default || mammothModule;
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value.trim() || `[DOCX File: ${file.name} - Empty document]`;
    }

    if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.json') || fileName.endsWith('.csv') || file.type.startsWith('text/')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
      });
    }

    // Fallback for images or videos: return name and metadata description
    return `[Binary File: ${file.name} (${file.type || 'unknown type'}) - Processed via AI multimodal vision/audio engine]`;
  } catch (err) {
    console.warn('Text extraction fallback for file:', file.name, err);
    return `[Source File: ${file.name}] - Text extraction fallback mode.`;
  }
}
