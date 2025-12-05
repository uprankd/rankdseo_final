'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface WatermarkedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export default function WatermarkedImage({ src, alt, className, onClick }: WatermarkedImageProps) {
  const [watermarkedSrc, setWatermarkedSrc] = useState<string>(src);
  const [isProcessing, setIsProcessing] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Open watermarked image in new tab
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${alt}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  background: #000;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  object-fit: contain;
                }
              </style>
            </head>
            <body>
              <img src="${watermarkedSrc}" alt="${alt}" />
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  useEffect(() => {
    const addWatermark = async () => {
      try {
        setIsProcessing(true);

        // Create a canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Load the original image
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = src;
        });

        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Create watermark text
        const watermarkText = 'RankdSEO';
        
        // Calculate font size based on image dimensions (make it large)
        const fontSize = Math.min(img.width, img.height) * 0.15; // 15% of smallest dimension
        ctx.font = `bold ${fontSize}px Arial`;
        
        // Measure text to center it
        const textMetrics = ctx.measureText(watermarkText);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;
        
        // Center position
        const x = (img.width - textWidth) / 2;
        const y = (img.height + textHeight) / 2;

        // Add semi-transparent overlay for better readability (lighter overlay)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, img.width, img.height);

        // Draw watermark text with outline (more transparent)
        // Outline (stroke)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = fontSize * 0.05;
        ctx.strokeText(watermarkText, x, y);
        
        // Fill text (much more transparent)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillText(watermarkText, x, y);

        // Add rotated watermarks in corners and center
        ctx.save();
        
        // Top-left corner
        drawCornerWatermark(ctx, watermarkText, fontSize * 0.3, img.width * 0.15, img.height * 0.15, -45);
        
        // Top-right corner
        drawCornerWatermark(ctx, watermarkText, fontSize * 0.3, img.width * 0.85, img.height * 0.15, 45);
        
        // Bottom-left corner
        drawCornerWatermark(ctx, watermarkText, fontSize * 0.3, img.width * 0.15, img.height * 0.85, 45);
        
        // Bottom-right corner
        drawCornerWatermark(ctx, watermarkText, fontSize * 0.3, img.width * 0.85, img.height * 0.85, -45);
        
        ctx.restore();

        // Convert canvas to data URL
        const watermarkedDataUrl = canvas.toDataURL('image/png');
        setWatermarkedSrc(watermarkedDataUrl);
        setIsProcessing(false);

      } catch (error) {
        console.error('Error adding watermark:', error);
        // If watermarking fails, use original image
        setWatermarkedSrc(src);
        setIsProcessing(false);
      }
    };

    // Helper function to draw corner watermarks
    function drawCornerWatermark(
      ctx: CanvasRenderingContext2D,
      text: string,
      fontSize: number,
      x: number,
      y: number,
      rotation: number
    ) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.font = `bold ${fontSize}px Arial`;
      
      // Outline
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = fontSize * 0.05;
      ctx.strokeText(text, -ctx.measureText(text).width / 2, 0);
      
      // Fill
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
      
      ctx.restore();
    }

    if (src) {
      addWatermark();
    }
  }, [src]);

  return (
    <div className="relative">
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">Adding watermark...</p>
          </div>
        </div>
      )}
      <img
        src={watermarkedSrc}
        alt={alt}
        className={className}
        onClick={onClick}
        style={{ display: isProcessing ? 'none' : 'block' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
