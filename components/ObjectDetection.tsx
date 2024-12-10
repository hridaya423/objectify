/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { 
  Camera, 
  RefreshCcw, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import ParticleBackground from './ParticleBackground';

// Enhanced interface to track object detections with improved stability
interface StableDetection {
  class: string;
  confidence: number;
  detectionCount: number;
  lastDetected: number;
  bbox: number[]; // Store bounding box for consistent rendering
}

const ObjectDetectionApp: React.FC = () => {
  const [state, setState] = useState({
    model: null as cocoSsd.ObjectDetection | null,
    detections: [] as StableDetection[],
    isLoading: true,
    error: null as string | null
  });

  // Enhanced refs to track detection state
  const detectionHistoryRef = useRef<{[key: string]: {
    confidences: number[];
    bboxes: number[][];
  }}>({});
  const lastDetectionTimeRef = useRef(Date.now());

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // More sophisticated stabilization method
  const processDetections = useCallback((predictions: cocoSsd.DetectedObject[]) => {
    const currentTime = Date.now();
    const stabilizedDetections: StableDetection[] = [];
    const detectionHistory = detectionHistoryRef.current;

    // Increase stability threshold
    const STABILITY_THRESHOLD = {
      minFrames: 5,      // Require more consistent detections
      minConfidence: 60, // Higher confidence requirement
      maxJitter: 50      // Maximum allowed pixel variation
    };

    predictions.forEach(prediction => {
      const { class: detectedClass, score, bbox } = prediction;
      const roundedConfidence = Math.round(score * 100);

      // Initialize history for this class if not exists
      if (!detectionHistory[detectedClass]) {
        detectionHistory[detectedClass] = {
          confidences: [],
          bboxes: []
        };
      }

      const classHistory = detectionHistory[detectedClass];

      // Add current confidence and bbox to history
      classHistory.confidences.push(roundedConfidence);
      classHistory.bboxes.push(bbox);

      // Limit history to last 7 detections
      if (classHistory.confidences.length > 7) {
        classHistory.confidences.shift();
        classHistory.bboxes.shift();
      }

      // Calculate average confidence and check stability
      const avgConfidence = Math.round(
        classHistory.confidences.reduce((a, b) => a + b, 0) / 
        classHistory.confidences.length
      );

      // Check bbox consistency (reduce jittering)
      const bboxConsistency = classHistory.bboxes.every((prevBbox, index) => {
        if (index === 0) return true;
        return classHistory.bboxes.slice(0, index).every(prevBox => 
          Math.abs(prevBox[0] - prevBbox[0]) < STABILITY_THRESHOLD.maxJitter &&
          Math.abs(prevBox[1] - prevBbox[1]) < STABILITY_THRESHOLD.maxJitter
        );
      });

      // Enhanced stability check
      const isStableDetection = 
        classHistory.confidences.length >= STABILITY_THRESHOLD.minFrames && 
        avgConfidence > STABILITY_THRESHOLD.minConfidence &&
        bboxConsistency;

      if (isStableDetection) {
        // Use average bbox for more stable positioning
        const avgBbox = classHistory.bboxes.reduce((acc, curr) => 
          acc.map((val, idx) => val + curr[idx]), [0, 0, 0, 0])
          .map(val => val / classHistory.bboxes.length);

        stabilizedDetections.push({
          class: detectedClass,
          confidence: avgConfidence,
          detectionCount: classHistory.confidences.length,
          lastDetected: currentTime,
          bbox: avgBbox
        });
      }
    });

    // Update state with stabilized detections
    setState(prev => ({ 
      ...prev, 
      detections: stabilizedDetections 
    }));

    lastDetectionTimeRef.current = currentTime;
  }, []);

  const setupDetection = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await tf.setBackend('webgl');
      const loadedModel = await cocoSsd.load();
      await startWebcam();

      setState(prev => ({ 
        ...prev, 
        model: loadedModel, 
        isLoading: false 
      }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error 
          ? `Detection Setup Error: ${err.message}` 
          : 'Failed to set up object detection', 
        isLoading: false 
      }));
    }
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        return new Promise<void>((resolve) => {
          videoRef.current!.onloadedmetadata = () => {
            videoRef.current!.play();
            resolve();
          };
        });
      }
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error 
          ? `Webcam Error: ${err.message}` 
          : 'Could not access webcam' 
      }));
    }
  }, []);

  const detectObjects = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const { model } = state;

    if (!model || !video || !canvas) return;

    try {
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const predictions = await model.detect(video);
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Use stabilized detections for rendering
        state.detections.forEach((detection) => {
          const [x, y, width, height] = detection.bbox;
          const label = `${detection.class} (${detection.confidence}%)`;

          // Gradient border effect (same as before)
          const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
          gradient.addColorStop(0, 'rgba(255, 87, 34, 0.7)');
          gradient.addColorStop(1, 'rgba(33, 150, 243, 0.7)');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 4;
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = 15;
          ctx.strokeRect(x, y, width, height);
          ctx.shadowBlur = 0;

          // Stylish label
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(x, y - 35, ctx.measureText(label).width + 20, 35);
          
          ctx.fillStyle = 'white';
          ctx.font = '16px "Space Grotesk", sans-serif';
          ctx.fillText(label, x + 10, y - 10);
        });

        // Continue processing new detections
        processDetections(predictions);
      }
    } catch (err) {
      console.error('Object Detection Error:', err);
    }
  }, [state, processDetections]);
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (state.model) {
      detectObjects();
      intervalId = setInterval(detectObjects, 2000); // Increased interval to 2 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [state.model, detectObjects]);

  useEffect(() => {
    setupDetection();
  }, [setupDetection]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center p-6">
        <ParticleBackground />
      <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 animate-gradient-x opacity-70 blur-3xl"></div>
          <div className="relative z-10 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Camera className="w-12 h-12 text-white drop-shadow-lg" />
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Objectify
              </h1>
            </div>
            {state.model ? (
              <CheckCircle2 className="w-10 h-10 text-green-400 animate-pulse" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-yellow-400 animate-bounce" />
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {state.error && (
            <div className="bg-red-500/20 border-l-4 border-red-500 p-4 mb-6 text-white">
              <p className="flex items-center space-x-2">
                <AlertTriangle className="w-6 h-6" />
                <span>{state.error}</span>
              </p>
            </div>
          )}

          {/* Video and Canvas Container */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline
              className="w-full transform transition-all duration-300 hover:scale-105"
            />
            <canvas 
              ref={canvasRef} 
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
          </div>

          {/* Action Button */}
          <div className="mt-6">
            <button 
              onClick={setupDetection} 
              disabled={state.isLoading}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-full 
              transform transition-all duration-300 hover:scale-105 hover:shadow-2xl 
              focus:outline-none focus:ring-4 focus:ring-purple-300 
              disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {state.isLoading ? (
                <RefreshCcw className="animate-spin mr-2" />
              ) : (
                <RefreshCcw className="mr-2" />
              )}
              {state.isLoading ? 'Loading Model...' : 'Restart Detection'}
            </button>
          </div>

          {state.detections.length > 0 && (
            <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center space-x-2 mb-4">
                <Info className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Stable Detections</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {state.detections.map((detection, index) => (
                  <div 
                    key={index} 
                    className="bg-white/10 backdrop-blur-lg rounded-xl p-4 
                    border border-white/20 transform transition-all 
                    duration-300 hover:scale-105 hover:shadow-2xl"
                  >
                    <p className="text-white font-semibold">{detection.class}</p>
                    <p className="text-purple-200 text-sm">
                      Confidence: {detection.confidence}%
                      <span className="ml-2 text-xs text-gray-400">
                        (Stable for {detection.detectionCount} frames)
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObjectDetectionApp;