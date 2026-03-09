"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, RefreshCw, MapPin, CheckCircle2, AlertCircle, Maximize2 } from "lucide-react";

import { useAppStore } from "@/hooks/use-app-store";

async function blobToFile(blob: Blob, fileName: string): Promise<File> {
  return new File([blob], fileName, { type: "image/jpeg" });
}

export function CameraCapture() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const { setCapture, clearCapture, capture: captureState } = useAppStore();

  // Callback ref: fires exactly when the video element mounts/unmounts
  const videoRefCallback = (node: HTMLVideoElement | null) => {
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(console.error);
    }
  };

  const requestPermissions = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to access camera.";
      setError(message);
    }
  };

  const capture = async () => {
    setIsCapturing(true);
    setError(null);

    const video = document.querySelector("video") as HTMLVideoElement | null;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      setError("Camera element not found.");
      setIsCapturing(false);
      return;
    }

    try {
      // Ensure video has valid dimensions before drawing
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error("Camera not ready yet — please wait a moment and try again.");
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(video, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("Failed to capture image from camera.");

      // GPS is attempted but optional for testing
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 0
        });
      }).catch(() => null);

      const file = await blobToFile(blob, `verdant-proof-${Date.now()}.jpg`);
      const capturedAt = new Date().toISOString();

      setPreviewUrl(URL.createObjectURL(blob));
      setCapture({
        file,
        capturedAt,
        latitude: position?.coords.latitude ?? 0,
        longitude: position?.coords.longitude ?? 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsCapturing(false);
    }
  };

  const retake = () => {
    setPreviewUrl(null);
    clearCapture();
    setError(null);
  };

  return (
    <section className="tg-card relative group">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Proof of Outdoor</h2>
          <p className="text-xs text-muted-foreground mt-1 text-red-500 md:text-muted-foreground underline md:no-underline">Verify your physical presence to unlock rewards.</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <Camera className="h-6 w-6 text-accent-foreground" />
        </div>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/90 border border-border/50 shadow-2xl group/camera">
        {!stream && !previewUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-6">Camera access required for verification.</p>
            <button
              type="button"
              onClick={() => void requestPermissions()}
              className="tg-button h-11 px-8"
            >
              Enable Lens
            </button>
          </div>
        )}

        {stream && !previewUrl && (
          <>
            <video
              ref={videoRefCallback}
              className="h-full w-full object-cover"
              playsInline
              autoPlay
              muted
            />
            {/* HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20">
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live Feed</span>
              </div>
              <div className="absolute bottom-4 right-4 text-white/40">
                <Maximize2 className="h-6 w-6" />
              </div>
              {/* Scan Line Animation */}
              <div className="absolute inset-x-0 h-[2px] bg-primary/30 shadow-[0_0_15px_rgba(16,185,129,1)] animate-[scan_3s_ease-in-out_infinite]" />
            </div>

            <div className="absolute bottom-6 inset-x-0 flex justify-center px-6">
              <button
                type="button"
                onClick={() => void capture()}
                disabled={isCapturing}
                className="h-14 w-14 rounded-full bg-white border-4 border-primary/20 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
              >
                <div className="h-10 w-10 rounded-full border-2 border-black/10 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full bg-black/80" />
                </div>
              </button>
            </div>
          </>
        )}

        {previewUrl && (
          <div className="relative h-full w-full group/preview">
            <Image
              src={previewUrl}
              alt="Captured proof"
              className="h-full w-full object-cover animate-in fade-in zoom-in-95 duration-500"
              fill
              unoptimized
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold">Proof Captured</p>
                  <div className="flex items-center gap-2 text-[10px] text-white/60 font-bold uppercase tracking-wider">
                    <MapPin className="h-3 w-3" />
                    <span>{captureState.latitude?.toFixed(4)}, {captureState.longitude?.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={retake}
              className="absolute top-4 right-4 h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-xs font-medium text-red-500 leading-tight">{error}</p>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-secondary/20">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-loose">
          Verification requires active GPS and <br /> environment data.
        </p>
      </div>

      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
      `}</style>
    </section>
  );
}
