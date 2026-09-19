import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  X,
  Camera,
  RotateCcw,
  Check,
  RefreshCw,
  AlertCircle,
  Upload,
  Sparkles,
  Loader2
} from "lucide-react";

/**
 * CameraCaptureModal
 * High-performance, accessible live webcam/camera capture modal.
 * Supports:
 * - Live webcam stream with user face guide
 * - Mirror toggle for natural selfie framing
 * - Camera flip (front/back on mobile)
 * - Snapshot capture with instant freeze-frame preview
 * - Fallback to native device camera file picker if permissions/webcam unavailable
 */
export default function CameraCaptureModal({
  isOpen,
  onClose,
  onPhotoCaptured,
  title = "Take Profile Photo"
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fallbackInputRef = useRef(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const [cameraError, setCameraError] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  // Stop camera tracks cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Check for multiple camera devices (e.g. front & back cameras)
  const detectCameras = useCallback(async () => {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoInputs.length > 1);
      }
    } catch {}
  }, []);

  // Start live webcam stream
  const startCamera = useCallback(async () => {
    stopStream();
    setCameraError("");
    setIsInitializing(true);
    setCapturedPhoto(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Your browser does not support direct webcam access. Please choose from files or use the device camera below.");
      setIsInitializing(false);
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 720 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            .play()
            .then(() => {
              setIsStreaming(true);
              setIsInitializing(false);
            })
            .catch(() => {
              setIsInitializing(false);
            });
        };
      } else {
        setIsInitializing(false);
      }
    } catch (err) {
      console.warn("Webcam access error:", err);
      let msg = "Could not access camera. Please allow camera permissions in your browser or choose an image file.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please allow camera access in your browser settings, or use device camera below.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No camera found on your device. You can choose a photo from your files instead.";
      }
      setCameraError(msg);
      setIsInitializing(false);
    }
  }, [facingMode, stopStream]);

  // Handle open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      detectCameras();
      startCamera();
    } else {
      stopStream();
      setCapturedPhoto(null);
      setCameraError("");
    }

    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, detectCameras, stopStream]);

  // Flip camera between front and back
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Capture snapshot from video feed onto canvas
  const handleCapture = () => {
    if (!videoRef.current) return;

    // Trigger visual shutter flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth || 640, video.videoHeight || 640);

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    // Center crop to 1:1 square
    const sx = ((video.videoWidth || size) - size) / 2;
    const sy = ((video.videoHeight || size) - size) / 2;

    if (facingMode === "user") {
      // Mirror horizontally so it feels natural
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedPhoto(dataUrl);
    stopStream();
  };

  // Discard preview and resume camera
  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // Confirm photo and send back
  const handleConfirmPhoto = () => {
    if (capturedPhoto && typeof onPhotoCaptured === "function") {
      onPhotoCaptured(capturedPhoto);
      stopStream();
      onClose();
    }
  };

  // Native fallback file handler (mobile camera direct)
  const handleFallbackChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof onPhotoCaptured === "function") {
        onPhotoCaptured(event.target.result);
      }
      stopStream();
      onClose();
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="cam-modal-backdrop" onClick={onClose}>
      <div
        className="cam-modal-window"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="cam-modal-header">
          <div className="cam-modal-title-group">
            <div className="cam-modal-icon-badge">
              <Camera size={17} />
            </div>
            <div>
              <h3 className="cam-modal-title">{title}</h3>
              <p className="cam-modal-sub">Position your face inside the circle frame</p>
            </div>
          </div>

          <button
            type="button"
            className="cam-modal-close-btn"
            onClick={onClose}
            aria-label="Close camera"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="cam-viewfinder-container">
          {capturedPhoto ? (
            /* FROZEN CAPTURED PREVIEW */
            <div className="cam-preview-frame">
              <img
                src={capturedPhoto}
                alt="Captured Snapshot"
                className="cam-captured-img"
              />
              <div className="cam-badge-preview-tag">
                <Sparkles size={12} />
                <span>Photo Captured</span>
              </div>
            </div>
          ) : cameraError ? (
            /* CAMERA ERROR / PERMISSION DENIED FALLBACK */
            <div className="cam-error-box">
              <div className="cam-error-icon">
                <AlertCircle size={32} />
              </div>
              <h4 className="cam-error-title">Webcam Unavailable</h4>
              <p className="cam-error-desc">{cameraError}</p>

              <div className="cam-error-actions">
                <button
                  type="button"
                  className="cam-btn-retry"
                  onClick={startCamera}
                >
                  <RefreshCw size={14} /> Try Again
                </button>

                <label className="cam-btn-fallback-trigger">
                  <Camera size={14} /> Use Device Camera App
                  <input
                    ref={fallbackInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFallbackChange}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>
          ) : (
            /* LIVE WEBCAM VIDEO STREAM */
            <div className="cam-live-frame">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`cam-video-element ${facingMode === "user" ? "mirrored" : ""}`}
              />

              {/* Viewfinder Target Mask */}
              <div className="cam-guide-overlay">
                <div className="cam-face-circle-guide" />
                <div className="cam-guide-corner top-left" />
                <div className="cam-guide-corner top-right" />
                <div className="cam-guide-corner bottom-left" />
                <div className="cam-guide-corner bottom-right" />
              </div>

              {/* Shutter Flash Animation */}
              {isFlashing && <div className="cam-shutter-flash" />}

              {/* Initializing indicator */}
              {isInitializing && (
                <div className="cam-loading-overlay">
                  <Loader2 size={32} className="spin" />
                  <span>Starting camera...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Controls Footer */}
        <div className="cam-modal-footer">
          {capturedPhoto ? (
            /* Captured Actions */
            <div className="cam-action-row-captured">
              <button
                type="button"
                className="cam-btn-secondary"
                onClick={handleRetake}
              >
                <RotateCcw size={15} />
                <span>Retake Photo</span>
              </button>

              <button
                type="button"
                className="cam-btn-primary"
                onClick={handleConfirmPhoto}
              >
                <Check size={16} />
                <span>Use This Photo</span>
              </button>
            </div>
          ) : (
            /* Live Stream Controls */
            <div className="cam-action-row-live">
              {hasMultipleCameras && (
                <button
                  type="button"
                  className="cam-btn-icon-switch"
                  onClick={handleFlipCamera}
                  title="Flip camera"
                  disabled={!isStreaming}
                >
                  <RefreshCw size={17} />
                </button>
              )}

              {/* Shutter Capture Button */}
              <button
                type="button"
                className="cam-btn-shutter"
                onClick={handleCapture}
                disabled={!isStreaming || isInitializing || Boolean(cameraError)}
                title="Take Photo"
              >
                <div className="cam-shutter-inner" />
              </button>

              {/* Native device file fallback trigger */}
              <label
                className="cam-btn-alt-upload"
                title="Choose from files or gallery"
              >
                <Upload size={15} />
                <span>Or Choose File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFallbackChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

