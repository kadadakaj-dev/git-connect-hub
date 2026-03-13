import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import {
  Camera,
  Loader2,
  User,
  RotateCw,
  ZoomIn,
  ZoomOut,
  FlipHorizontal,
  Upload,
  Trash2,
  X,
  Grid3X3 as Grid3x3,
} from 'lucide-react';

interface AvatarEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl: string | null;
  fullName: string;
  userId: string;
  onAvatarUpdated: () => void;
}

const AvatarEditDialog = ({
  open,
  onOpenChange,
  currentAvatarUrl,
  fullName,
  userId,
  onAvatarUpdated,
}: AvatarEditDialogProps) => {
  const { language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);

  const CANVAS_SIZE = 280;

  const t = {
    sk: {
      title: 'Zmeniť profilovú fotku',
      subtitle: 'Vyberte, upravte a nahrajte svoju fotku',
      choosePhoto: 'Vybrať fotku',
      upload: 'Nahrať',
      cancel: 'Zrušiť',
      uploading: 'Nahrávam...',
      success: 'Fotka bola aktualizovaná',
      error: 'Chyba pri nahrávaní fotky',
      removePhoto: 'Odstrániť fotku',
      removed: 'Fotka bola odstránená',
      zoom: 'Priblíženie',
      brightness: 'Jas',
      rotate: 'Otočiť',
      flip: 'Prevrátiť',
      reset: 'Resetovať',
      dragHint: 'Potiahnite obrázok pre zmenu pozície',
      cropGrid: 'Mriežka',
      fileTooLarge: 'Súbor je príliš veľký (max 5MB)',
      invalidFileType: 'Neplatný typ súboru (JPG, PNG, WebP)',
    },
    en: {
      title: 'Change Profile Photo',
      subtitle: 'Select, edit, and upload your photo',
      choosePhoto: 'Choose Photo',
      upload: 'Upload',
      cancel: 'Cancel',
      uploading: 'Uploading...',
      success: 'Photo updated successfully',
      error: 'Error uploading photo',
      removePhoto: 'Remove Photo',
      removed: 'Photo removed',
      zoom: 'Zoom',
      brightness: 'Brightness',
      rotate: 'Rotate',
      flip: 'Flip',
      reset: 'Reset',
      dragHint: 'Drag image to reposition',
      cropGrid: 'Grid',
      fileTooLarge: 'File too large (max 5MB)',
      invalidFileType: 'Invalid file type (JPG, PNG, WebP)',
    },
  };

  const text = t[language];

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const resetEdits = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setBrightness(100);
    setOffsetX(0);
    setOffsetY(0);
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !selectedImage) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    // Fill background
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Apply transforms
    ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -zoom : zoom, zoom);

    // Brightness filter
    ctx.filter = `brightness(${brightness}%)`;

    // Calculate aspect-fit dimensions
    const imgAspect = selectedImage.width / selectedImage.height;
    let drawW: number, drawH: number;
    if (imgAspect > 1) {
      drawH = CANVAS_SIZE;
      drawW = CANVAS_SIZE * imgAspect;
    } else {
      drawW = CANVAS_SIZE;
      drawH = CANVAS_SIZE / imgAspect;
    }

    ctx.drawImage(
      selectedImage,
      -drawW / 2 + offsetX,
      -drawH / 2 + offsetY,
      drawW,
      drawH
    );

    ctx.restore();

    // Draw crop grid overlay
    if (showGrid) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2);
      ctx.clip();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.5;

      // Rule of thirds
      const third = CANVAS_SIZE / 3;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(third * i, 0);
        ctx.lineTo(third * i, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, third * i);
        ctx.lineTo(CANVAS_SIZE, third * i);
        ctx.stroke();
      }

      // Center crosshair
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 0.5;
      const center = CANVAS_SIZE / 2;
      const crossSize = 12;
      ctx.beginPath();
      ctx.moveTo(center - crossSize, center);
      ctx.lineTo(center + crossSize, center);
      ctx.moveTo(center, center - crossSize);
      ctx.lineTo(center, center + crossSize);
      ctx.stroke();

      ctx.restore();
    }
  }, [selectedImage, zoom, rotation, flipH, brightness, offsetX, offsetY, showGrid]);

  useEffect(() => {
    if (selectedImage) {
      // Use requestAnimationFrame to ensure canvas is mounted after conditional render
      requestAnimationFrame(() => {
        drawCanvas();
      });
    }
  }, [drawCanvas, selectedImage]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedImage(null);
      resetEdits();
    }
  }, [open, resetEdits]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error(text.invalidFileType);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(text.fileTooLarge);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setSelectedImage(img);
      resetEdits();
    };
    img.src = URL.createObjectURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      // Pinch-to-zoom start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setLastPinchDistance(dist);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offsetX, y: touch.clientY - offsetY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && lastPinchDistance !== null) {
      // Pinch-to-zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / lastPinchDistance;
      setZoom((prev) => Math.min(3, Math.max(0.5, prev * scale)));
      setLastPinchDistance(dist);
    } else if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setOffsetX(touch.clientX - dragStart.x);
      setOffsetY(touch.clientY - dragStart.y);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setLastPinchDistance(null);
  };

  const handleUpload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsUploading(true);

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas to blob failed'))), 'image/webp', 0.9);
      });

      const fileName = `${userId}/${Date.now()}.webp`;

      // Delete old avatar
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([decodeURIComponent(oldPath)]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { cacheControl: '3600', upsert: true, contentType: 'image/webp' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('client_profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      toast.success(text.success);
      onAvatarUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(text.error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploading(true);
    try {
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([decodeURIComponent(oldPath)]);
        }
      }

      const { error } = await supabase
        .from('client_profiles')
        .update({ avatar_url: null })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(text.removed);
      onAvatarUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Remove error:', error);
      toast.error(text.error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{text.title}</DialogTitle>
          <DialogDescription>{text.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5">
          {!selectedImage ? (
            /* Current avatar preview + choose button */
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={currentAvatarUrl || undefined} alt={fullName} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {fullName ? getInitials(fullName) : <User className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>

              <div className="flex gap-2">
                <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Camera className="h-4 w-4" />
                  {text.choosePhoto}
                </Button>
                {currentAvatarUrl && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRemovePhoto}
                    disabled={isUploading}
                    className="text-destructive hover:text-destructive"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Image editor */
            <>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className="rounded-full border-4 border-background shadow-lg cursor-grab active:cursor-grabbing touch-none"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onTouchStart={handleCanvasTouchStart}
                  onTouchMove={handleCanvasTouchMove}
                  onTouchEnd={handleCanvasMouseUp}
                />
                <p className="text-xs text-muted-foreground text-center mt-2">{text.dragHint}</p>
              </div>

              {/* Edit controls */}
              <div className="w-full space-y-4">
                {/* Zoom */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <ZoomIn className="h-3.5 w-3.5" /> {text.zoom}
                    </span>
                    <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
                  </div>
                  <Slider
                    value={[zoom]}
                    onValueChange={([v]) => setZoom(v)}
                    min={0.5}
                    max={3}
                    step={0.05}
                  />
                </div>

                {/* Brightness */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <ZoomOut className="h-3.5 w-3.5" /> {text.brightness}
                    </span>
                    <span className="text-xs text-muted-foreground">{brightness}%</span>
                  </div>
                  <Slider
                    value={[brightness]}
                    onValueChange={([v]) => setBrightness(v)}
                    min={50}
                    max={150}
                    step={1}
                  />
                </div>

                {/* Quick actions */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Button
                    variant={showGrid ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowGrid((g) => !g)}
                    className="gap-1.5"
                  >
                    <Grid3x3 className="h-3.5 w-3.5" />
                    {text.cropGrid}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="gap-1.5"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    {text.rotate}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFlipH((f) => !f)}
                    className="gap-1.5"
                  >
                    <FlipHorizontal className="h-3.5 w-3.5" />
                    {text.flip}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedImage(null);
                      resetEdits();
                    }}
                    className="gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" />
                    {text.cancel}
                  </Button>
                </div>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            {text.cancel}
          </Button>
          {selectedImage && (
            <Button onClick={handleUpload} disabled={isUploading} className="gap-2">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {text.uploading}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {text.upload}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarEditDialog;
