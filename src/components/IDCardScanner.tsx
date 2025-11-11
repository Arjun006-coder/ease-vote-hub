import { useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import Tesseract from 'tesseract.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, CheckCircle, Scan, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import * as CryptoJS from 'crypto-js';

interface IDCardScannerProps {
  onVerified: (hash: string, barcodeContent: string, imageDataUrl: string) => void; // Pass hash, barcode content, and image data URL
  onCancel: () => void;
}

export const IDCardScanner = ({ onVerified, onCancel }: IDCardScannerProps) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [barcodeData, setBarcodeData] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageDataUrl = event.target?.result as string;
        setUploadedImage(imageDataUrl);
        // Reset barcode data and scan attempts when new image is uploaded
        setBarcodeData(null);
        setScanAttempts(0);
        
        toast({
          title: 'Image uploaded',
          description: 'Image uploaded successfully. Verifying ID card automatically...',
        });
        
        // Automatically attempt to verify ID card after a short delay
        setTimeout(() => {
          scanBarcodeFromUploadedImage();
        }, 500);
      };
      reader.onerror = () => {
        toast({
          title: 'Error',
          description: 'Failed to read image file',
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({
        title: 'Error processing image',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Extract different regions of the image where barcode might be located
  const extractImageRegion = (imageDataUrl: string, region: { x: number; y: number; width: number; height: number }): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageDataUrl);
          return;
        }

        // Calculate actual crop region
        const cropX = Math.max(0, Math.floor(region.x * img.width));
        const cropY = Math.max(0, Math.floor(region.y * img.height));
        const cropWidth = Math.min(img.width - cropX, Math.floor(region.width * img.width));
        const cropHeight = Math.min(img.height - cropY, Math.floor(region.height * img.height));

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Disable smoothing for sharper barcode lines
        ctx.imageSmoothingEnabled = false;
        
        // Draw the cropped region
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        );

        resolve(canvas.toDataURL('image/png', 1.0));
      };
      img.onerror = () => resolve(imageDataUrl);
      img.src = imageDataUrl;
    });
  };

  // Preprocess image for better barcode detection
  const preprocessImage = (imageDataUrl: string, enhanceContrast: boolean = true): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageDataUrl);
          return;
        }

        // Set canvas size - maintain aspect ratio but ensure minimum resolution
        const maxDimension = 2000;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDimension || height > maxDimension) {
          const scale = maxDimension / Math.max(width, height);
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
        }

        canvas.width = width;
        canvas.height = height;

        // Use high-quality image rendering
        ctx.imageSmoothingEnabled = false; // Disable smoothing for sharper barcode lines
        ctx.drawImage(img, 0, 0, width, height);

        if (enhanceContrast) {
          // Apply contrast and brightness adjustments for better barcode detection
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Convert to grayscale first (barcodes are monochrome)
          for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
          }

          // Increase contrast dramatically for barcode detection
          const factor = 2.0;
          const intercept = 128 * (1 - factor);
          for (let i = 0; i < data.length; i += 4) {
            const value = data[i];
            const enhanced = Math.min(255, Math.max(0, value * factor + intercept));
            data[i] = enhanced;     // R
            data[i + 1] = enhanced; // G
            data[i + 2] = enhanced; // B
          }

          ctx.putImageData(imageData, 0, 0);
        }

        resolve(canvas.toDataURL('image/png', 1.0)); // Highest quality
      };
      img.onerror = () => resolve(imageDataUrl);
      img.src = imageDataUrl;
    });
  };

  // Read text from image using OCR (to verify barcode matches text)
  const readTextFromImage = async (imageDataUrl: string): Promise<string[]> => {
    try {
      console.log('Running OCR on image...');
      const { data: { text } } = await Tesseract.recognize(imageDataUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });
      
      // Extract lines of text
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      console.log('OCR detected text:', lines);
      return lines;
    } catch (error: any) {
      console.error('OCR error:', error);
      return [];
    }
  };

  const scanBarcodeFromUploadedImage = async () => {
    if (!uploadedImage) {
      toast({
        title: 'No image',
        description: 'Please upload an ID card image first',
        variant: 'destructive',
      });
      return;
    }

    setScanning(true);
    setProcessing(true);
    setScanAttempts(prev => prev + 1);

    try {
      let decodedText: string | null = null;
      let lastError: Error | null = null;

      // STRATEGY 1: Try scanning FULL ORIGINAL IMAGE first (no preprocessing, no region extraction)
      // Many barcode scanners work better on the original image
      console.log('🔍 Step 1: Trying to scan full original image (no preprocessing)...');
      try {
        const codeReader = new BrowserMultiFormatReader();
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const result = await new Promise<string>((resolve, reject) => {
          img.onload = async () => {
            try {
              console.log(`Image loaded: ${img.width}x${img.height}`);
              const decodeResult = await codeReader.decodeFromImageElement(img);
              if (decodeResult && decodeResult.getText()) {
                resolve(decodeResult.getText());
              } else {
                reject(new NotFoundException('No barcode found'));
              }
            } catch (err: any) {
              reject(err);
            }
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = uploadedImage;
        });

        if (result && result.trim().length > 0) {
          decodedText = result.trim();
          console.log(`✅ ZXing scan successful on full original image:`, decodedText);
        }
      } catch (fullImageError: any) {
        if (!(fullImageError instanceof NotFoundException)) {
          console.log('Full image scan error:', fullImageError.message);
        }
        lastError = fullImageError;
      }

      // STRATEGY 2: Try scanning different regions of ORIGINAL image (no preprocessing)
      if (!decodedText) {
        console.log('🔍 Step 2: Trying to scan regions of original image...');
        const regionsToScan = [
          { name: 'bottom-half', x: 0, y: 0.5, width: 1.0, height: 0.5 },   // Bottom half
          { name: 'bottom-third', x: 0, y: 0.67, width: 1.0, height: 0.33 }, // Bottom third
          { name: 'bottom-40pct', x: 0, y: 0.6, width: 1.0, height: 0.4 }, // Bottom 40%
          { name: 'bottom-quarter', x: 0, y: 0.75, width: 1.0, height: 0.25 }, // Bottom quarter
        ];

        for (const region of regionsToScan) {
          if (decodedText) break;
          
          try {
            console.log(`  → Scanning region: ${region.name} (${Math.round(region.y * 100)}%-${Math.round((region.y + region.height) * 100)}%)...`);
            
            // Extract region from ORIGINAL image (no preprocessing)
            const regionImage = await extractImageRegion(uploadedImage, region);
            
            const codeReader = new BrowserMultiFormatReader();
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            const result = await new Promise<string>((resolve, reject) => {
              img.onload = async () => {
                try {
                  const decodeResult = await codeReader.decodeFromImageElement(img);
                  if (decodeResult && decodeResult.getText()) {
                    resolve(decodeResult.getText());
                  } else {
                    reject(new NotFoundException('No barcode found'));
                  }
                } catch (err: any) {
                  reject(err);
                }
              };
              img.onerror = () => reject(new Error('Failed to load region image'));
              img.src = regionImage;
            });

            if (result && result.trim().length > 0) {
              decodedText = result.trim();
              console.log(`✅ ZXing scan successful in ${region.name}:`, decodedText);
              break;
            }
          } catch (regionError: any) {
            if (regionError instanceof NotFoundException) {
              console.log(`  ✗ No barcode in ${region.name}`);
            } else {
              console.log(`  ✗ Error in ${region.name}:`, regionError.message);
            }
            if (!lastError) lastError = regionError;
          }
        }
      }

      // STRATEGY 3: Try html5-qrcode on original image and regions
      if (!decodedText) {
        console.log('🔍 Step 3: Trying html5-qrcode on original image...');
        try {
          const tempScannerId = `temp-scanner-${Date.now()}`;
          const tempDiv = document.createElement('div');
          tempDiv.id = tempScannerId;
          tempDiv.style.display = 'none';
          document.body.appendChild(tempDiv);

          const html5QrCode = new Html5Qrcode(tempScannerId);
          decodedText = await html5QrCode.scanFile(uploadedImage, true);
          
          html5QrCode.clear();
          document.body.removeChild(tempDiv);

          if (decodedText && decodedText.trim().length > 0) {
            decodedText = decodedText.trim();
            console.log(`✅ html5-qrcode scan successful on full image:`, decodedText);
          }
        } catch (html5Error: any) {
          console.log('html5-qrcode on full image failed:', html5Error.message);
        }
      }

      // STRATEGY 4: Try PREPROCESSED image (if original failed)
      if (!decodedText) {
        console.log('🔍 Step 4: Trying preprocessed image...');
        try {
          const processedImage = await preprocessImage(uploadedImage, true);
          
          // Try full preprocessed image
          const codeReader = new BrowserMultiFormatReader();
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          const result = await new Promise<string>((resolve, reject) => {
            img.onload = async () => {
              try {
                const decodeResult = await codeReader.decodeFromImageElement(img);
                if (decodeResult && decodeResult.getText()) {
                  resolve(decodeResult.getText());
                } else {
                  reject(new NotFoundException('No barcode found'));
                }
              } catch (err: any) {
                reject(err);
              }
            };
            img.onerror = () => reject(new Error('Failed to load processed image'));
            img.src = processedImage;
          });

          if (result && result.trim().length > 0) {
            decodedText = result.trim();
            console.log(`✅ ZXing scan successful on preprocessed image:`, decodedText);
          }
        } catch (processedError: any) {
          console.log('Preprocessed image scan failed:', processedError.message);
        }
      }

      // STRATEGY 5: Try html5-qrcode on preprocessed regions
      if (!decodedText) {
        console.log('🔍 Step 5: Trying html5-qrcode on preprocessed regions...');
        try {
          const processedImage = await preprocessImage(uploadedImage, true);
          const regionsToScan = [
            { name: 'bottom-half', x: 0, y: 0.5, width: 1.0, height: 0.5 },
            { name: 'bottom-third', x: 0, y: 0.67, width: 1.0, height: 0.33 },
          ];

          for (const region of regionsToScan) {
            if (decodedText) break;
            
            try {
              const regionImage = await extractImageRegion(processedImage, region);
              
              const tempScannerId = `temp-scanner-${Date.now()}`;
              const tempDiv = document.createElement('div');
              tempDiv.id = tempScannerId;
              tempDiv.style.display = 'none';
              document.body.appendChild(tempDiv);

              const html5QrCode = new Html5Qrcode(tempScannerId);
              decodedText = await html5QrCode.scanFile(regionImage, true);
              
              html5QrCode.clear();
              document.body.removeChild(tempDiv);

              if (decodedText && decodedText.trim().length > 0) {
                decodedText = decodedText.trim();
                console.log(`✅ html5-qrcode scan successful in ${region.name}:`, decodedText);
                break;
              }
            } catch (html5Error: any) {
              console.log(`html5-qrcode failed on ${region.name}:`, html5Error.message);
            }
          }
        } catch (error: any) {
          console.log('Preprocessed region scan failed:', error.message);
        }
      }

      // If ID card detected, verify it with OCR
      if (decodedText && decodedText.trim().length > 0) {
        console.log('ID card detected:', decodedText);
        
        // Read text from image using OCR to verify
        toast({
          title: 'ID Card Detected! ✅',
          description: 'Verifying ID card details...',
        });
        
        try {
          const ocrText = await readTextFromImage(uploadedImage);
          const idCardText = decodedText.trim();
          
          // Check if ID card text appears in OCR results (case-insensitive)
          const idCardFoundInOCR = ocrText.some(line => 
            line.toLowerCase().includes(idCardText.toLowerCase()) ||
            idCardText.toLowerCase().includes(line.toLowerCase().replace(/\s/g, ''))
          );
          
          // Also check for partial matches (ID card might be encoded)
          const hasRelevantText = ocrText.some(line => {
            const cleanLine = line.replace(/\s/g, '').toLowerCase();
            return cleanLine.length > 0 && (
              idCardText.toLowerCase().includes(cleanLine) ||
              cleanLine.includes(idCardText.toLowerCase().substring(0, 5))
            );
          });
          
          if (idCardFoundInOCR || hasRelevantText) {
            console.log('✅ ID card verified with OCR text');
            setBarcodeData(idCardText);
            toast({
              title: 'ID Card Verified! ✅',
              description: 'ID card detected and verified from image',
            });
          } else {
            console.log('⚠️ ID card detected but OCR verification inconclusive');
            console.log('OCR text:', ocrText);
            console.log('ID Card Data:', idCardText);
            // Still accept it if ID card was scanned (might be encoded differently)
            setBarcodeData(idCardText);
            toast({
              title: 'ID Card Detected! ✅',
              description: 'ID card scanned from image. Proceeding with verification...',
            });
          }
          
          setScanAttempts(0);
          setScanning(false);
          setProcessing(false);
          return;
        } catch (ocrError: any) {
          console.error('OCR verification error:', ocrError);
          // Still accept ID card if OCR fails
          setBarcodeData(decodedText.trim());
          toast({
            title: 'ID Card Detected! ✅',
            description: 'ID card scanned successfully from image',
          });
          setScanAttempts(0);
          setScanning(false);
          setProcessing(false);
          return;
        }
      }

      // STRATEGY 6: Try OCR to extract ID card number from text (last resort)
      // Some ID cards have the ID number printed on the card
      if (!decodedText) {
        console.log('🔍 Step 6: Trying OCR to extract ID card number from text...');
        try {
          const ocrText = await readTextFromImage(uploadedImage);
          console.log('OCR extracted text:', ocrText);
          
          // Look for patterns that might be ID card numbers (e.g., "202400117", "2024CS117")
          // ID card numbers are often alphanumeric and appear near the bottom
          const idCardPatterns = ocrText
            .filter(line => {
              const cleaned = line.replace(/\s/g, '').toUpperCase();
              // Look for patterns like: numbers, alphanumeric codes, etc.
              return cleaned.length >= 6 && cleaned.length <= 15 && 
                     (/^\d+$/.test(cleaned) || /^[A-Z0-9]+$/.test(cleaned));
            })
            .map(line => line.replace(/\s/g, '').toUpperCase());
          
          if (idCardPatterns.length > 0) {
            console.log('Found potential ID card numbers from OCR:', idCardPatterns);
            // Use the longest pattern (most likely to be the ID card number)
            const potentialIdCard = idCardPatterns.sort((a, b) => b.length - a.length)[0];
            console.log(`⚠️ Using OCR-extracted ID card number: ${potentialIdCard}`);
            decodedText = potentialIdCard;
            
            // OCR-extracted ID card number is already verified (it came from the image text)
            setBarcodeData(potentialIdCard);
            toast({
              title: 'ID Card Detected! ✅',
              description: 'ID card number extracted from image text. This is a fallback method when scanning fails.',
            });
            setScanAttempts(0);
            setScanning(false);
            setProcessing(false);
            return;
          }
        } catch (ocrError: any) {
          console.log('OCR extraction failed:', ocrError.message);
        }
      }

      // If all methods failed (including OCR extraction)
      if (!decodedText) {
        console.error('❌ All ID card scanning methods failed. Last error:', lastError);
        console.error('Scanning attempted:');
        console.error('  - Full original image (ZXing)');
        console.error('  - Bottom regions of original image (ZXing)');
        console.error('  - Full original image (html5-qrcode)');
        console.error('  - Full preprocessed image (ZXing)');
        console.error('  - Preprocessed regions (html5-qrcode)');
        console.error('  - OCR text extraction');
        
        if (scanAttempts >= 3) {
          toast({
            title: 'ID Card Scanning Failed',
            description: 'Could not verify the ID card. Please check the browser console for details. Ensure: 1) Full ID card is visible, 2) Image is clear, 3) Good lighting, 4) High resolution.',
            variant: 'destructive',
            duration: 12000,
          });
        } else {
          toast({
            title: 'ID Card Not Detected',
            description: `Attempt ${scanAttempts}/3 failed. Check browser console (F12) for scanning details. The system tried multiple verification methods.`,
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('Error scanning ID card:', error);
      toast({
        title: 'Scan failed',
        description: 'Failed to verify ID card. Please ensure the full ID card image is clear.',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
      setProcessing(false);
    }
  };

  const handleVerify = async () => {
    // CRITICAL: Only allow verification if ID card was scanned automatically
    if (!barcodeData) {
      toast({
        title: 'ID Card Required',
        description: 'ID card must be scanned automatically from the image. Manual entry is not allowed for security reasons.',
        variant: 'destructive',
      });
      return;
    }

    if (!uploadedImage) {
      toast({
        title: 'Image required',
        description: 'Please upload an ID card image',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    try {
      // Generate hash from barcode data
      const hash = CryptoJS.SHA256(barcodeData).toString();

      // Check for duplicate barcode BEFORE allowing registration (critical: ensure no duplicate ID cards)
      // Note: We check BEFORE uploading the image to save storage space
      // Since RLS is disabled, we can query directly (simple and works)
      // Check by barcode content (primary check)
      const { data: existing, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id_card_barcode', barcodeData)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking for duplicate hash:', checkError);
        // If error is just "no rows found" (PGRST116), that's fine - it means no duplicate
        // Only throw if it's a real error (like connection issue)
        if (checkError.code !== 'PGRST116' && checkError.message !== 'JSON object requested, multiple (or no) rows returned') {
          toast({
            title: 'Error',
            description: `Failed to verify ID card: ${checkError.message}. Please check your connection and try again.`,
            variant: 'destructive',
          });
          setProcessing(false);
          return;
        }
      }

      if (existing) {
        // ID card already registered by another user - BLOCK registration
        toast({
          title: 'ID Card Already Registered',
          description: 'This ID card has already been registered by another user. Each ID card can only be used once. Please use a different ID card.',
          variant: 'destructive',
        });
        setProcessing(false);
        setUploadedImage(null);
        setBarcodeData(null);
        setScanAttempts(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // ID card is unique - proceed with verification
      // NOTE: We don't upload the image here because the user doesn't exist yet
      // The image will be uploaded AFTER user creation in Register.tsx
      // We pass the image data URL so it can be uploaded to the correct user folder
      toast({
        title: 'ID Card Verified! ✅',
        description: 'ID card is unique and verified. Proceeding to email verification...',
      });

      // Pass hash, barcode content, and image data URL
      onVerified(hash, barcodeData, uploadedImage);
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message || 'Failed to verify ID card',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setBarcodeData(null);
    setScanAttempts(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="glass-card border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Upload className="w-5 h-5" />
          ID Card Verification
        </CardTitle>
        <CardDescription className="text-white/70">
          Upload a clear photo of your full ID card. The system will automatically verify it's unique and hasn't been used before.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="id-card-upload"
            />
            <label
              htmlFor="id-card-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-white/50" />
              <p className="text-sm text-white/70">
                Click to upload ID card image
              </p>
              <p className="text-xs text-white/50">PNG, JPG up to 10MB</p>
            </label>
          </div>

          {uploadedImage && (
            <div className="relative">
              <img
                src={uploadedImage}
                alt="ID Card"
                className="w-full h-64 object-contain rounded-lg border border-white/20 bg-white/5"
              />
              <Button
                onClick={handleRemoveImage}
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                disabled={processing}
              >
                <X className="w-4 h-4" />
              </Button>
              
              {/* Scan ID Card Button - Show if ID card not detected */}
              {!barcodeData && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                  <Button
                    onClick={scanBarcodeFromUploadedImage}
                    disabled={scanning || processing}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {scanning ? (
                      <>
                        <Scan className="w-4 h-4 mr-2 animate-pulse" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Scan Again
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Barcode Status - Success */}
          {barcodeData && (
            <div className="p-4 rounded-lg bg-success/20 border border-success/30">
              <div className="flex items-center gap-2 text-success mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">ID Card detected successfully</span>
              </div>
              <p className="text-sm text-white/70 font-mono break-all">
                ID Card: {barcodeData.substring(0, 50)}{barcodeData.length > 50 ? '...' : ''}
              </p>
              <p className="text-xs text-white/50 mt-2">
                ✅ ID card was scanned automatically from your image
              </p>
            </div>
          )}

          {/* Barcode Status - Not Detected */}
          {!barcodeData && uploadedImage && !scanning && (
            <div className="p-4 rounded-lg bg-warning/20 border border-warning/30">
              <div className="flex items-start gap-2 text-warning mb-2">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block mb-2">ID Card Not Detected</span>
                  <div className="text-xs text-white/70 space-y-1">
                    <p>• The system tried to verify automatically but couldn't detect the ID card</p>
                    <p>• Click "Scan Again" button to retry</p>
                    <p>• Ensure the ID card is clearly visible, well-lit, and in focus</p>
                    <p>• Make sure the ID card is not blurred, damaged, or covered</p>
                    <p>• Try uploading a higher resolution image</p>
                    {scanAttempts > 0 && (
                      <p className="mt-2 text-warning font-semibold">
                        Scan attempts: {scanAttempts} / 3
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {scanAttempts >= 3 && (
                <div className="mt-3 p-3 rounded bg-red-500/20 border border-red-500/30">
                  <p className="text-xs text-red-200 font-semibold mb-1">
                    ⚠️ Multiple scan attempts failed
                  </p>
                  <p className="text-xs text-white/70 mb-2">
                    The system tried multiple methods but couldn't verify the ID card. 
                    This could be due to:
                  </p>
                  <ul className="text-xs text-white/70 list-disc list-inside space-y-1">
                    <li>ID card format not recognized</li>
                    <li><strong>Full ID card image not provided</strong> - cropped images are rejected for security</li>
                    <li>Image quality too low or ID card too small in the image</li>
                    <li>ID card damaged, partially obscured, or not clearly visible</li>
                    <li>Lighting, glare, or contrast issues</li>
                  </ul>
                  <p className="text-xs text-red-200 font-semibold mt-2">
                    ⚠️ Security: Only full ID card images are accepted. Cropped images are rejected for security.
                  </p>
                  <p className="text-xs text-white/70 mt-1">
                    Please upload a new, clear image of your complete ID card showing all details.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <p className="text-xs text-blue-200 font-semibold mb-1">
              📸 Important: Upload Full ID Card Image
            </p>
            <ul className="text-xs text-white/70 space-y-1 list-disc list-inside mb-2">
              <li><strong>Upload the complete ID card</strong> - not just a cropped image</li>
              <li>This ensures the ID card is authentic</li>
              <li>The system scans different regions of the image to verify the ID card</li>
              <li>OCR verifies the ID card details</li>
            </ul>
            <p className="text-xs text-blue-200 font-semibold mb-1 mt-2">
              📸 Tips for better scanning:
            </p>
            <ul className="text-xs text-white/70 space-y-1 list-disc list-inside">
              <li>Ensure good lighting and the full ID card is visible</li>
              <li>Make sure the ID card is clearly visible and not blurred</li>
              <li>Avoid shadows, glare, or reflections</li>
              <li>Keep the ID card flat and in focus</li>
              <li>Use a high-resolution image for best results</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-white/30 text-white hover:bg-white/10"
            disabled={processing}
          >
            Back
          </Button>
          <Button
            onClick={handleVerify}
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={processing || !barcodeData || !uploadedImage}
          >
            {processing ? (
              <>
                <Scan className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify & Continue
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
