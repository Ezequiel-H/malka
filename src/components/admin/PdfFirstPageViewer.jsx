import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { getPdfPreviewUrl } from '../../utils/paymentUtils';

const renderPdfFirstPage = async (data, container, canvas, renderTaskRef) => {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  const { default: pdfjsWorker } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  GlobalWorkerOptions.workerSrc = pdfjsWorker;

  const pdf = await getDocument({ data }).promise;
  const page = await pdf.getPage(1);

  const context = canvas.getContext('2d');
  const baseViewport = page.getViewport({ scale: 1 });
  const maxWidth = Math.max(container.clientWidth - 8, 280);
  const maxHeight = Math.max(container.clientHeight - 8, 320);
  const scale = Math.min(
    maxWidth / baseViewport.width,
    maxHeight / baseViewport.height,
    2
  );
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  renderTaskRef.current?.cancel();
  const task = page.render({ canvasContext: context, viewport, canvas });
  renderTaskRef.current = task;
  await task.promise;
};

const PdfFirstPageViewer = ({ url, inscriptionId, className = '' }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [useCanvas, setUseCanvas] = useState(false);
  const previewUrl = getPdfPreviewUrl(url);

  useEffect(() => {
    setStatus('loading');
    setUseCanvas(false);
    return () => {
      renderTaskRef.current?.cancel();
    };
  }, [url, inscriptionId]);

  const handleImageLoad = () => {
    setUseCanvas(false);
    setStatus('ready');
  };

  const handleImageError = async () => {
    if (!inscriptionId) {
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const response = await axios.get(`/inscriptions/${inscriptionId}/comprobante/file`, {
        responseType: 'arraybuffer',
      });

      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      setUseCanvas(true);
      await renderPdfFirstPage(response.data, container, canvas, renderTaskRef);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center justify-center gap-3 w-full min-h-[14rem] lg:min-h-[22rem] ${className}`}
    >
      {status === 'loading' && (
        <div className="flex flex-col items-center py-10">
          <div className="spinner" />
          <p className="text-sm text-gray-600 mt-3">Cargando PDF...</p>
        </div>
      )}

      {!useCanvas && previewUrl && (
        <img
          src={previewUrl}
          alt="Primera página del comprobante PDF"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`max-w-full max-h-[22rem] lg:max-h-[26rem] rounded border border-gray-200 bg-white shadow-sm object-contain ${
            status === 'ready' ? 'block' : 'hidden'
          }`}
        />
      )}

      <canvas
        ref={canvasRef}
        aria-label="Primera página del comprobante PDF"
        className={`max-w-full max-h-[22rem] lg:max-h-[26rem] rounded border border-gray-200 bg-white shadow-sm object-contain ${
          status === 'ready' && useCanvas ? 'block' : 'hidden'
        }`}
      />

      {status === 'error' && (
        <div className="text-center py-8 px-4">
          <p className="text-sm text-gray-600 mb-4">
            No se pudo mostrar el PDF en el visor.
          </p>
        </div>
      )}

      {(status === 'ready' || status === 'error') && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary text-sm py-1.5 px-4 shrink-0"
        >
          Abrir PDF en pestaña nueva
        </a>
      )}
    </div>
  );
};

export default PdfFirstPageViewer;
