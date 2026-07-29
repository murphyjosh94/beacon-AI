"use client";

import {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type RecordingMode = "screen" | "camera" | "screen-camera";
export type RecordingState =
  | "idle"
  | "requesting"
  | "countdown"
  | "recording"
  | "paused"
  | "processing"
  | "error";

export type RecordingQuality = "720p" | "1080p" | "4k";
export type RecordingFrameRate = 30 | 60;
export type RecordingCountdown = 0 | 3 | 5 | 10;

export type RecordingDevice = {
  deviceId: string;
  label: string;
};

export type StudioRecording = {
  id: string;
  name: string;
  url: string;
  blob: Blob;
  mimeType: string;
  durationMs: number;
  sizeBytes: number;
  width: number;
  height: number;
  frameRate: number;
  createdAt: string;
  mode: RecordingMode;
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasSystemAudio: boolean;
  posterUrl?: string;
};

export type RecordingTimelineClip = {
  id: string;
  recordingId: string;
  name: string;
  startMs: number;
  durationMs: number;
  trimStartMs: number;
  trimEndMs: number;
  playbackRate: number;
  muted: boolean;
  locked: boolean;
  layer: number;
};

export type RecordingHistoryEntry =
  | {
      type: "recording-created";
      label: string;
      recording: StudioRecording;
    }
  | {
      type: "recording-added-to-timeline";
      label: string;
      recording: StudioRecording;
      clip: RecordingTimelineClip;
    }
  | {
      type: "frame-captured";
      label: string;
      blob: Blob;
      url: string;
      createdAt: string;
    };

export type RecordingToolbarProps = {
  className?: string;
  projectId?: string;
  playheadMs?: number;
  disabled?: boolean;
  defaultMode?: RecordingMode;
  defaultQuality?: RecordingQuality;
  defaultFrameRate?: RecordingFrameRate;
  defaultCountdown?: RecordingCountdown;
  defaultSystemAudio?: boolean;
  defaultMicrophoneEnabled?: boolean;
  defaultCameraEnabled?: boolean;
  onRecordingCreated?: (recording: StudioRecording) => void;
  onAddToTimeline?: (
    clip: RecordingTimelineClip,
    recording: StudioRecording,
  ) => void;
  onFrameCaptured?: (payload: {
    blob: Blob;
    url: string;
    createdAt: string;
  }) => void;
  onHistory?: (entry: RecordingHistoryEntry) => void;
  onStateChange?: (state: RecordingState) => void;
};

type QualityPreset = {
  width: number;
  height: number;
  videoBitsPerSecond: number;
};

const QUALITY_PRESETS: Record<RecordingQuality, QualityPreset> = {
  "720p": {
    width: 1280,
    height: 720,
    videoBitsPerSecond: 4_000_000,
  },
  "1080p": {
    width: 1920,
    height: 1080,
    videoBitsPerSecond: 8_000_000,
  },
  "4k": {
    width: 3840,
    height: 2160,
    videoBitsPerSecond: 20_000_000,
  },
};

const AUDIO_BITS_PER_SECOND = 192_000;
const RECORDING_TIMESLICE_MS = 500;

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatDuration(durationMs: number): string {
  const safe = Math.max(0, Math.floor(durationMs));
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function formatFileSize(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(sizeBytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = sizeBytes / 1024 ** exponent;

  return `${value.toFixed(exponent === 0 ? 0 : value >= 10 ? 1 : 2)} ${
    units[exponent]
  }`;
}

function chooseMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";

  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function getFileExtension(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  return "webm";
}

function getAudioConstraints(
  deviceId: string,
  noiseSuppression: boolean,
  echoCancellation: boolean,
  autoGainControl: boolean,
): MediaTrackConstraints {
  return {
    deviceId: deviceId ? { exact: deviceId } : undefined,
    noiseSuppression,
    echoCancellation,
    autoGainControl,
    channelCount: 2,
    sampleRate: 48_000,
  };
}

function createTimelineClip(
  recording: StudioRecording,
  playheadMs: number,
): RecordingTimelineClip {
  return {
    id: createId("recording_clip"),
    recordingId: recording.id,
    name: recording.name,
    startMs: Math.max(0, playheadMs),
    durationMs: recording.durationMs,
    trimStartMs: 0,
    trimEndMs: 0,
    playbackRate: 1,
    muted: false,
    locked: false,
    layer: 0,
  };
}

async function readVideoMetadata(
  url: string,
): Promise<{
  durationMs: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
    };

    video.onloadedmetadata = () => {
      const result = {
        durationMs: Number.isFinite(video.duration) ? video.duration * 1000 : 0,
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
      };

      cleanup();
      resolve(result);
    };

    video.onerror = () => {
      cleanup();
      resolve({
        durationMs: 0,
        width: 0,
        height: 0,
      });
    };
  });
}

async function captureVideoFrame(
  video: HTMLVideoElement,
): Promise<Blob | null> {
  if (!video.videoWidth || !video.videoHeight) return null;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");
  if (!context) return null;

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 1);
  });
}

function mergeStreams(
  videoTracks: MediaStreamTrack[],
  audioTracks: MediaStreamTrack[],
): MediaStream {
  return new MediaStream([...videoTracks, ...audioTracks]);
}

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

function getSupportedDisplayMedia(): boolean {
  return Boolean(navigator.mediaDevices?.getDisplayMedia);
}

function getSupportedUserMedia(): boolean {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

export default function RecordingToolbar({
  className = "",
  projectId,
  playheadMs = 0,
  disabled = false,
  defaultMode = "screen",
  defaultQuality = "1080p",
  defaultFrameRate = 30,
  defaultCountdown = 3,
  defaultSystemAudio = true,
  defaultMicrophoneEnabled = true,
  defaultCameraEnabled = false,
  onRecordingCreated,
  onAddToTimeline,
  onFrameCaptured,
  onHistory,
  onStateChange,
}: RecordingToolbarProps) {
  const [mode, setMode] = useState<RecordingMode>(defaultMode);
  const [state, setState] = useState<RecordingState>("idle");
  const [quality, setQuality] = useState<RecordingQuality>(defaultQuality);
  const [frameRate, setFrameRate] =
    useState<RecordingFrameRate>(defaultFrameRate);
  const [countdownLength, setCountdownLength] =
    useState<RecordingCountdown>(defaultCountdown);
  const [countdownRemaining, setCountdownRemaining] = useState(0);

  const [systemAudioEnabled, setSystemAudioEnabled] =
    useState(defaultSystemAudio);
  const [microphoneEnabled, setMicrophoneEnabled] =
    useState(defaultMicrophoneEnabled);
  const [cameraEnabled, setCameraEnabled] =
    useState(defaultCameraEnabled);
  const [cameraOverlayEnabled, setCameraOverlayEnabled] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);

  const [microphones, setMicrophones] = useState<RecordingDevice[]>([]);
  const [cameras, setCameras] = useState<RecordingDevice[]>([]);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState("");
  const [selectedCameraId, setSelectedCameraId] = useState("");

  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastRecording, setLastRecording] =
    useState<StudioRecording | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<Blob[]>([]);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const composedStreamRef = useRef<MediaStream | null>(null);

  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingPausedAtRef = useRef<number | null>(null);
  const totalPausedMsRef = useRef(0);
  const recordingIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioAnalyserFrameRef = useRef<number | null>(null);

  const objectUrlsRef = useRef<Set<string>>(new Set());

  const activeRecording =
    state === "recording" ||
    state === "paused" ||
    state === "countdown" ||
    state === "requesting";

  const modeNeedsScreen = mode === "screen" || mode === "screen-camera";
  const modeNeedsCamera = mode === "camera" || mode === "screen-camera";

  const selectedPreset = QUALITY_PRESETS[quality];

  const statusLabel = useMemo(() => {
    switch (state) {
      case "requesting":
        return "Requesting permission";
      case "countdown":
        return `Starting in ${countdownRemaining}`;
      case "recording":
        return "Recording";
      case "paused":
        return "Paused";
      case "processing":
        return "Saving";
      case "error":
        return "Recording error";
      default:
        return "Ready";
    }
  }, [countdownRemaining, state]);

  const setRecordingState = useCallback(
    (next: RecordingState) => {
      setState(next);
      onStateChange?.(next);
    },
    [onStateChange],
  );

  const clearCountdownTimer = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const clearRecordingTimer = useCallback(() => {
    if (recordingIntervalRef.current !== null) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, []);

  const stopAudioAnalyser = useCallback(() => {
    if (audioAnalyserFrameRef.current !== null) {
      cancelAnimationFrame(audioAnalyserFrameRef.current);
      audioAnalyserFrameRef.current = null;
    }

    audioAnalyserRef.current?.disconnect();
    audioAnalyserRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setAudioLevel(0);
  }, []);

  const stopAllStreams = useCallback(() => {
    stopStream(displayStreamRef.current);
    stopStream(cameraStreamRef.current);
    stopStream(microphoneStreamRef.current);
    stopStream(composedStreamRef.current);

    displayStreamRef.current = null;
    cameraStreamRef.current = null;
    microphoneStreamRef.current = null;
    composedStreamRef.current = null;

    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  }, []);

  const cleanupRecording = useCallback(() => {
    clearCountdownTimer();
    clearRecordingTimer();
    stopAudioAnalyser();
    stopAllStreams();
  }, [
    clearCountdownTimer,
    clearRecordingTimer,
    stopAllStreams,
    stopAudioAnalyser,
  ]);

  useEffect(() => {
    return () => {
      cleanupRecording();
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [cleanupRecording]);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const nextMicrophones = devices
        .filter((device) => device.kind === "audioinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${index + 1}`,
        }));

      const nextCameras = devices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }));

      setMicrophones(nextMicrophones);
      setCameras(nextCameras);

      if (!selectedMicrophoneId && nextMicrophones[0]) {
        setSelectedMicrophoneId(nextMicrophones[0].deviceId);
      }

      if (!selectedCameraId && nextCameras[0]) {
        setSelectedCameraId(nextCameras[0].deviceId);
      }
    } catch {
      setMicrophones([]);
      setCameras([]);
    }
  }, [selectedCameraId, selectedMicrophoneId]);

  useEffect(() => {
    void refreshDevices();

    navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);

    return () => {
      navigator.mediaDevices?.removeEventListener?.(
        "devicechange",
        refreshDevices,
      );
    };
  }, [refreshDevices]);

  const startAudioAnalyser = useCallback((stream: MediaStream) => {
    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) return;

    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;

    const source = context.createMediaStreamSource(
      new MediaStream(audioTracks),
    );
    source.connect(analyser);

    audioContextRef.current = context;
    audioAnalyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteTimeDomainData(data);

      let peak = 0;
      for (let index = 0; index < data.length; index += 1) {
        peak = Math.max(peak, Math.abs((data[index] - 128) / 128));
      }

      setAudioLevel(clamp(peak * 2, 0, 1));
      audioAnalyserFrameRef.current = requestAnimationFrame(tick);
    };

    tick();
  }, []);

  const createMicrophoneStream = useCallback(async () => {
    if (!microphoneEnabled) return null;
    if (!getSupportedUserMedia()) {
      throw new Error("Microphone recording is not supported in this browser.");
    }

    return navigator.mediaDevices.getUserMedia({
      audio: getAudioConstraints(
        selectedMicrophoneId,
        noiseSuppression,
        echoCancellation,
        autoGainControl,
      ),
      video: false,
    });
  }, [
    autoGainControl,
    echoCancellation,
    microphoneEnabled,
    noiseSuppression,
    selectedMicrophoneId,
  ]);

  const createCameraStream = useCallback(async () => {
    if (!modeNeedsCamera && !cameraEnabled) return null;
    if (!getSupportedUserMedia()) {
      throw new Error("Camera recording is not supported in this browser.");
    }

    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
        width: { ideal: selectedPreset.width },
        height: { ideal: selectedPreset.height },
        frameRate: { ideal: frameRate, max: frameRate },
      },
    });
  }, [
    cameraEnabled,
    frameRate,
    modeNeedsCamera,
    selectedCameraId,
    selectedPreset.height,
    selectedPreset.width,
  ]);

  const createDisplayStream = useCallback(async () => {
    if (!modeNeedsScreen) return null;
    if (!getSupportedDisplayMedia()) {
      throw new Error("Screen recording is not supported in this browser.");
    }

    return navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: selectedPreset.width },
        height: { ideal: selectedPreset.height },
        frameRate: { ideal: frameRate, max: frameRate },
      },
      audio: systemAudioEnabled,
    });
  }, [
    frameRate,
    modeNeedsScreen,
    selectedPreset.height,
    selectedPreset.width,
    systemAudioEnabled,
  ]);

  const composeScreenAndCamera = useCallback(
    async (
      displayStream: MediaStream,
      cameraStream: MediaStream,
    ): Promise<MediaStream> => {
      const displayVideo = document.createElement("video");
      const cameraVideo = document.createElement("video");
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("The browser could not create the recording canvas.");
      }

      canvas.width = selectedPreset.width;
      canvas.height = selectedPreset.height;

      displayVideo.srcObject = displayStream;
      cameraVideo.srcObject = cameraStream;
      displayVideo.muted = true;
      cameraVideo.muted = true;
      displayVideo.playsInline = true;
      cameraVideo.playsInline = true;

      await Promise.all([
        displayVideo.play(),
        cameraVideo.play(),
      ]);

      let active = true;
      const draw = () => {
        if (!active) return;

        context.drawImage(
          displayVideo,
          0,
          0,
          canvas.width,
          canvas.height,
        );

        if (cameraOverlayEnabled) {
          const overlayWidth = Math.round(canvas.width * 0.22);
          const overlayHeight = Math.round(overlayWidth * (9 / 16));
          const margin = Math.round(canvas.width * 0.025);
          const x = canvas.width - overlayWidth - margin;
          const y = canvas.height - overlayHeight - margin;

          context.save();
          context.beginPath();
          context.roundRect(x, y, overlayWidth, overlayHeight, 18);
          context.clip();
          context.drawImage(
            cameraVideo,
            x,
            y,
            overlayWidth,
            overlayHeight,
          );
          context.restore();

          context.strokeStyle = "rgba(255,255,255,0.55)";
          context.lineWidth = Math.max(2, canvas.width / 900);
          context.strokeRect(x, y, overlayWidth, overlayHeight);
        }

        requestAnimationFrame(draw);
      };

      draw();

      const canvasStream = canvas.captureStream(frameRate);
      const originalStop = canvasStream.getVideoTracks()[0]?.stop.bind(
        canvasStream.getVideoTracks()[0],
      );

      const videoTrack = canvasStream.getVideoTracks()[0];
      if (videoTrack && originalStop) {
        videoTrack.stop = () => {
          active = false;
          originalStop();
        };
      }

      return canvasStream;
    },
    [
      cameraOverlayEnabled,
      frameRate,
      selectedPreset.height,
      selectedPreset.width,
    ],
  );

  const buildRecordingStream = useCallback(async (): Promise<MediaStream> => {
    const [displayStream, cameraStream, microphoneStream] = await Promise.all([
      createDisplayStream(),
      createCameraStream(),
      createMicrophoneStream(),
    ]);

    displayStreamRef.current = displayStream;
    cameraStreamRef.current = cameraStream;
    microphoneStreamRef.current = microphoneStream;

    if (displayStream) {
      const displayVideoTrack = displayStream.getVideoTracks()[0];
      displayVideoTrack?.addEventListener("ended", () => {
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== "inactive") {
          recorder.stop();
        }
      });
    }

    let videoTracks: MediaStreamTrack[] = [];

    if (
      mode === "screen-camera" &&
      displayStream &&
      cameraStream
    ) {
      const composed = await composeScreenAndCamera(
        displayStream,
        cameraStream,
      );
      composedStreamRef.current = composed;
      videoTracks = composed.getVideoTracks();
    } else if (mode === "screen" && displayStream) {
      videoTracks = displayStream.getVideoTracks();
    } else if (mode === "camera" && cameraStream) {
      videoTracks = cameraStream.getVideoTracks();
    }

    const audioTracks: MediaStreamTrack[] = [];

    if (displayStream && systemAudioEnabled) {
      audioTracks.push(...displayStream.getAudioTracks());
    }

    if (microphoneStream && microphoneEnabled) {
      audioTracks.push(...microphoneStream.getAudioTracks());
    }

    const finalStream = mergeStreams(videoTracks, audioTracks);

    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject =
        mode === "screen-camera"
          ? composedStreamRef.current
          : mode === "screen"
            ? displayStream
            : cameraStream;

      previewVideoRef.current.muted = true;
      previewVideoRef.current.playsInline = true;
      void previewVideoRef.current.play().catch(() => undefined);
    }

    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
      cameraVideoRef.current.muted = true;
      cameraVideoRef.current.playsInline = true;
      void cameraVideoRef.current.play().catch(() => undefined);
    }

    return finalStream;
  }, [
    composeScreenAndCamera,
    createCameraStream,
    createDisplayStream,
    createMicrophoneStream,
    microphoneEnabled,
    mode,
    systemAudioEnabled,
  ]);

  const startRecordingTimer = useCallback(() => {
    recordingIntervalRef.current = window.setInterval(() => {
      const startedAt = recordingStartedAtRef.current;
      if (!startedAt) return;

      const pausedAt = recordingPausedAtRef.current;
      const currentTime = pausedAt ?? Date.now();

      setRecordingElapsedMs(
        Math.max(0, currentTime - startedAt - totalPausedMsRef.current),
      );
    }, 100);
  }, []);

  const beginRecorder = useCallback(
    async (stream: MediaStream) => {
      const mimeType = chooseMimeType();

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: selectedPreset.videoBitsPerSecond,
        audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
      });

      mediaRecorderRef.current = recorder;
      recorderChunksRef.current = [];
      recordingStartedAtRef.current = Date.now();
      recordingPausedAtRef.current = null;
      totalPausedMsRef.current = 0;
      setRecordingElapsedMs(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recorderChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setErrorMessage("The browser could not complete the recording.");
        setRecordingState("error");
        cleanupRecording();
      };

      recorder.onstop = async () => {
        setRecordingState("processing");
        clearRecordingTimer();
        stopAudioAnalyser();

        const resolvedMimeType =
          recorder.mimeType || mimeType || "video/webm";
        const blob = new Blob(recorderChunksRef.current, {
          type: resolvedMimeType,
        });
        const url = URL.createObjectURL(blob);
        objectUrlsRef.current.add(url);

        const metadata = await readVideoMetadata(url);
        const fallbackDuration = Math.max(
          0,
          Date.now() -
            (recordingStartedAtRef.current ?? Date.now()) -
            totalPausedMsRef.current,
        );

        const extension = getFileExtension(resolvedMimeType);
        const createdAt = new Date().toISOString();

        const recording: StudioRecording = {
          id: createId("studio_recording"),
          name: `Studio recording ${new Date().toLocaleString("en-GB", {
            dateStyle: "short",
            timeStyle: "short",
          })}.${extension}`,
          url,
          blob,
          mimeType: resolvedMimeType,
          durationMs: metadata.durationMs || fallbackDuration,
          sizeBytes: blob.size,
          width: metadata.width || selectedPreset.width,
          height: metadata.height || selectedPreset.height,
          frameRate,
          createdAt,
          mode,
          hasCamera: modeNeedsCamera || cameraEnabled,
          hasMicrophone: microphoneEnabled,
          hasSystemAudio: systemAudioEnabled && modeNeedsScreen,
        };

        setLastRecording(recording);
        onRecordingCreated?.(recording);
        onHistory?.({
          type: "recording-created",
          label: `Create recording: ${recording.name}`,
          recording,
        });

        cleanupRecording();
        setRecordingElapsedMs(0);
        setRecordingState("idle");
      };

      recorder.start(RECORDING_TIMESLICE_MS);
      setRecordingState("recording");
      startRecordingTimer();
      startAudioAnalyser(stream);
    },
    [
      cameraEnabled,
      cleanupRecording,
      clearRecordingTimer,
      frameRate,
      microphoneEnabled,
      mode,
      modeNeedsCamera,
      modeNeedsScreen,
      onHistory,
      onRecordingCreated,
      selectedPreset.height,
      selectedPreset.videoBitsPerSecond,
      selectedPreset.width,
      setRecordingState,
      startAudioAnalyser,
      startRecordingTimer,
      stopAudioAnalyser,
      systemAudioEnabled,
    ],
  );

  const startCountdown = useCallback(
    (stream: MediaStream) => {
      if (countdownLength === 0) {
        void beginRecorder(stream);
        return;
      }

      let remaining = countdownLength;
      setCountdownRemaining(remaining);
      setRecordingState("countdown");

      countdownIntervalRef.current = window.setInterval(() => {
        remaining -= 1;
        setCountdownRemaining(remaining);

        if (remaining <= 0) {
          clearCountdownTimer();
          void beginRecorder(stream);
        }
      }, 1000);
    },
    [
      beginRecorder,
      clearCountdownTimer,
      countdownLength,
      setRecordingState,
    ],
  );

  const requestRecording = useCallback(async () => {
    if (disabled || activeRecording || state === "processing") return;

    if (typeof MediaRecorder === "undefined") {
      setErrorMessage("Media recording is not supported in this browser.");
      setRecordingState("error");
      return;
    }

    setErrorMessage(null);
    setRecordingState("requesting");

    try {
      const stream = await buildRecordingStream();
      startCountdown(stream);
    } catch (error) {
      cleanupRecording();

      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Screen, camera or microphone permission was denied."
          : error instanceof Error
            ? error.message
            : "The recording devices could not be opened.";

      setErrorMessage(message);
      setRecordingState("error");
    }
  }, [
    activeRecording,
    buildRecordingStream,
    cleanupRecording,
    disabled,
    setRecordingState,
    startCountdown,
    state,
  ]);

  const pauseOrResume = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (state === "recording" && recorder.state === "recording") {
      recorder.pause();
      recordingPausedAtRef.current = Date.now();
      setRecordingState("paused");
      return;
    }

    if (state === "paused" && recorder.state === "paused") {
      if (recordingPausedAtRef.current) {
        totalPausedMsRef.current += Date.now() - recordingPausedAtRef.current;
      }

      recordingPausedAtRef.current = null;
      recorder.resume();
      setRecordingState("recording");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    cleanupRecording();
    setRecordingState("idle");
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder) {
      recorder.onstop = null;

      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    }

    recorderChunksRef.current = [];
    cleanupRecording();
    setRecordingElapsedMs(0);
    setRecordingState("idle");
  };

  const captureCurrentFrame = async () => {
    const video = previewVideoRef.current;
    if (!video) return;

    const blob = await captureVideoFrame(video);
    if (!blob) {
      setErrorMessage("A frame could not be captured from the preview.");
      return;
    }

    const url = URL.createObjectURL(blob);
    objectUrlsRef.current.add(url);
    const createdAt = new Date().toISOString();

    onFrameCaptured?.({
      blob,
      url,
      createdAt,
    });

    onHistory?.({
      type: "frame-captured",
      label: "Capture recording frame",
      blob,
      url,
      createdAt,
    });
  };

  const addLastRecordingToTimeline = () => {
    if (!lastRecording || !onAddToTimeline) return;

    const clip = createTimelineClip(lastRecording, playheadMs);
    onAddToTimeline(clip, lastRecording);

    onHistory?.({
      type: "recording-added-to-timeline",
      label: `Add ${lastRecording.name} to timeline`,
      recording: lastRecording,
      clip,
    });
  };

  const downloadLastRecording = () => {
    if (!lastRecording) return;

    const anchor = document.createElement("a");
    anchor.href = lastRecording.url;
    anchor.download = lastRecording.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;

    if (
      target.tagName === "INPUT" ||
      target.tagName === "SELECT" ||
      target.tagName === "TEXTAREA"
    ) {
      return;
    }

    const modifier = event.metaKey || event.ctrlKey;

    if (modifier && event.shiftKey && event.key.toLowerCase() === "r") {
      event.preventDefault();

      if (state === "idle" || state === "error") {
        void requestRecording();
      } else if (state === "recording" || state === "paused") {
        stopRecording();
      }
    }

    if (event.key === " " && (state === "recording" || state === "paused")) {
      event.preventDefault();
      pauseOrResume();
    }

    if (event.key === "Escape" && activeRecording) {
      event.preventDefault();
      cancelRecording();
    }
  };

  const handleModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextMode = event.target.value as RecordingMode;
    setMode(nextMode);

    if (nextMode === "screen-camera") {
      setCameraEnabled(true);
    }
  };

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-2xl ${className}`}
      aria-label="Beacon Studio recording toolbar"
      data-project-id={projectId}
      tabIndex={0}
      onKeyDown={handleKeyboard}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900/95 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Recording toolbar
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Capture your screen, camera and microphone directly into Studio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium ${
              state === "recording"
                ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
                : state === "paused"
                  ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                  : state === "error"
                    ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-400"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                state === "recording"
                  ? "animate-pulse bg-rose-400"
                  : state === "paused"
                    ? "bg-amber-300"
                    : state === "processing"
                      ? "animate-pulse bg-cyan-300"
                      : "bg-slate-600"
              }`}
            />
            {statusLabel}
          </span>

          <button
            type="button"
            onClick={() => setSettingsOpen((current) => !current)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
          >
            {settingsOpen ? "Hide settings" : "Recording settings"}
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
            <video
              ref={previewVideoRef}
              className="h-full w-full object-contain"
              muted
              playsInline
            />

            {!activeRecording && state !== "processing" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-2xl text-cyan-100">
                  ●
                </div>
                <p className="mt-4 text-sm font-semibold text-white">
                  Recording preview
                </p>
                <p className="mt-1 max-w-sm px-4 text-xs leading-5 text-slate-500">
                  Your live screen or camera preview will appear here once
                  permission is granted.
                </p>
              </div>
            ) : null}

            {state === "countdown" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Recording starts in
                  </p>
                  <p className="mt-3 text-7xl font-semibold text-cyan-100">
                    {Math.max(1, countdownRemaining)}
                  </p>
                </div>
              </div>
            ) : null}

            {state === "recording" || state === "paused" ? (
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 backdrop-blur">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    state === "recording"
                      ? "animate-pulse bg-rose-400"
                      : "bg-amber-300"
                  }`}
                />
                <span className="font-mono text-xs font-semibold text-white">
                  {formatDuration(recordingElapsedMs)}
                </span>
              </div>
            ) : null}

            {cameraStreamRef.current &&
            mode !== "camera" &&
            cameraOverlayEnabled ? (
              <video
                ref={cameraVideoRef}
                className="absolute bottom-4 right-4 aspect-video w-[24%] min-w-28 rounded-xl border border-white/20 bg-black object-cover shadow-2xl"
                muted
                playsInline
              />
            ) : null}

            <div className="absolute bottom-3 left-3 right-3">
              <div className="h-2 overflow-hidden rounded-full bg-slate-900/80 backdrop-blur">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-[width] duration-75"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
            </div>
          </div>

          {errorMessage ? (
            <p className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(state === "idle" || state === "error") && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => void requestRecording()}
                className="min-w-36 flex-1 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Start recording
              </button>
            )}

            {(state === "recording" || state === "paused") && (
              <>
                <button
                  type="button"
                  onClick={pauseOrResume}
                  className="flex-1 rounded-lg border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100 hover:bg-amber-300/20"
                >
                  {state === "paused" ? "Resume" : "Pause"}
                </button>

                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex-1 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/20"
                >
                  Stop and save
                </button>

                <button
                  type="button"
                  onClick={cancelRecording}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400 hover:bg-white/10"
                >
                  Cancel
                </button>
              </>
            )}

            {activeRecording && modeNeedsScreen ? (
              <button
                type="button"
                onClick={() => void captureCurrentFrame()}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 hover:bg-white/10"
              >
                Capture frame
              </button>
            ) : null}
          </div>

          {lastRecording ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/55 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-600">
                    Latest recording
                  </p>
                  <h3 className="mt-1 truncate text-sm font-semibold text-white">
                    {lastRecording.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDuration(lastRecording.durationMs)} ·{" "}
                    {lastRecording.width}×{lastRecording.height} ·{" "}
                    {lastRecording.frameRate} fps ·{" "}
                    {formatFileSize(lastRecording.sizeBytes)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!onAddToTimeline}
                    onClick={addLastRecordingToTimeline}
                    className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/20 disabled:opacity-40"
                  >
                    Add at {formatDuration(playheadMs)}
                  </button>

                  <button
                    type="button"
                    onClick={downloadLastRecording}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
                  >
                    Save file
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 bg-slate-900/45 p-4">
          <section className="rounded-xl border border-white/10 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-white">
              Capture source
            </h3>

            <label className="mt-4 block text-[11px] text-slate-500">
              Recording mode
              <select
                value={mode}
                disabled={disabled || activeRecording}
                onChange={handleModeChange}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
              >
                <option value="screen">Screen</option>
                <option value="camera">Camera</option>
                <option value="screen-camera">Screen + camera</option>
              </select>
            </label>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="rounded-lg border border-white/10 bg-slate-900 p-3 text-[11px] text-slate-400">
                Quality
                <select
                  value={quality}
                  disabled={disabled || activeRecording}
                  onChange={(event) =>
                    setQuality(event.target.value as RecordingQuality)
                  }
                  className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-2 py-2 text-xs text-white outline-none"
                >
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="4k">4K</option>
                </select>
              </label>

              <label className="rounded-lg border border-white/10 bg-slate-900 p-3 text-[11px] text-slate-400">
                Frame rate
                <select
                  value={frameRate}
                  disabled={disabled || activeRecording}
                  onChange={(event) =>
                    setFrameRate(
                      Number(event.target.value) as RecordingFrameRate,
                    )
                  }
                  className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-2 py-2 text-xs text-white outline-none"
                >
                  <option value={30}>30 fps</option>
                  <option value={60}>60 fps</option>
                </select>
              </label>
            </div>

            <label className="mt-3 block text-[11px] text-slate-500">
              Countdown
              <select
                value={countdownLength}
                disabled={disabled || activeRecording}
                onChange={(event) =>
                  setCountdownLength(
                    Number(event.target.value) as RecordingCountdown,
                  )
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
              >
                <option value={0}>No countdown</option>
                <option value={3}>3 seconds</option>
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
              </select>
            </label>
          </section>

          {settingsOpen ? (
            <>
              <section className="rounded-xl border border-white/10 bg-slate-950 p-4">
                <h3 className="text-sm font-semibold text-white">
                  Audio settings
                </h3>

                <label className="mt-4 block text-[11px] text-slate-500">
                  Microphone
                  <select
                    value={selectedMicrophoneId}
                    disabled={disabled || activeRecording || !microphoneEnabled}
                    onChange={(event) =>
                      setSelectedMicrophoneId(event.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
                  >
                    {microphones.length ? (
                      microphones.map((device) => (
                        <option
                          key={device.deviceId}
                          value={device.deviceId}
                        >
                          {device.label}
                        </option>
                      ))
                    ) : (
                      <option value="">Default microphone</option>
                    )}
                  </select>
                </label>

                <div className="mt-3 space-y-2">
                  {[
                    {
                      label: "Record microphone",
                      value: microphoneEnabled,
                      setter: setMicrophoneEnabled,
                    },
                    {
                      label: "Capture system audio",
                      value: systemAudioEnabled,
                      setter: setSystemAudioEnabled,
                    },
                    {
                      label: "Noise suppression",
                      value: noiseSuppression,
                      setter: setNoiseSuppression,
                    },
                    {
                      label: "Echo cancellation",
                      value: echoCancellation,
                      setter: setEchoCancellation,
                    },
                    {
                      label: "Automatic gain",
                      value: autoGainControl,
                      setter: setAutoGainControl,
                    },
                  ].map((setting) => (
                    <label
                      key={setting.label}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-[11px] text-slate-400"
                    >
                      <span>{setting.label}</span>
                      <input
                        type="checkbox"
                        checked={setting.value}
                        disabled={disabled || activeRecording}
                        onChange={(event) =>
                          setting.setter(event.target.checked)
                        }
                        className="accent-cyan-400"
                      />
                    </label>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-slate-950 p-4">
                <h3 className="text-sm font-semibold text-white">
                  Camera settings
                </h3>

                <label className="mt-4 block text-[11px] text-slate-500">
                  Camera
                  <select
                    value={selectedCameraId}
                    disabled={
                      disabled ||
                      activeRecording ||
                      (!modeNeedsCamera && !cameraEnabled)
                    }
                    onChange={(event) =>
                      setSelectedCameraId(event.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
                  >
                    {cameras.length ? (
                      cameras.map((device) => (
                        <option
                          key={device.deviceId}
                          value={device.deviceId}
                        >
                          {device.label}
                        </option>
                      ))
                    ) : (
                      <option value="">Default camera</option>
                    )}
                  </select>
                </label>

                <div className="mt-3 space-y-2">
                  <label className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-[11px] text-slate-400">
                    <span>Enable camera</span>
                    <input
                      type="checkbox"
                      checked={cameraEnabled}
                      disabled={disabled || activeRecording}
                      onChange={(event) =>
                        setCameraEnabled(event.target.checked)
                      }
                      className="accent-cyan-400"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-[11px] text-slate-400">
                    <span>Camera overlay</span>
                    <input
                      type="checkbox"
                      checked={cameraOverlayEnabled}
                      disabled={disabled || activeRecording}
                      onChange={(event) =>
                        setCameraOverlayEnabled(event.target.checked)
                      }
                      className="accent-cyan-400"
                    />
                  </label>
                </div>
              </section>
            </>
          ) : null}

          <section className="rounded-xl border border-white/10 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-white">
              Browser support
            </h3>

            <dl className="mt-3 space-y-2 text-[11px]">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900 px-3 py-2">
                <dt className="text-slate-500">Screen capture</dt>
                <dd
                  className={
                    getSupportedDisplayMedia()
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }
                >
                  {getSupportedDisplayMedia() ? "Supported" : "Unavailable"}
                </dd>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900 px-3 py-2">
                <dt className="text-slate-500">Camera and microphone</dt>
                <dd
                  className={
                    getSupportedUserMedia()
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }
                >
                  {getSupportedUserMedia() ? "Supported" : "Unavailable"}
                </dd>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900 px-3 py-2">
                <dt className="text-slate-500">Media recorder</dt>
                <dd
                  className={
                    typeof MediaRecorder !== "undefined"
                      ? "text-emerald-300"
                      : "text-rose-300"
                  }
                >
                  {typeof MediaRecorder !== "undefined"
                    ? "Supported"
                    : "Unavailable"}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-900 px-4 py-3 text-[11px] text-slate-500">
        <span>
          {quality} · {frameRate} fps ·{" "}
          {systemAudioEnabled ? "system audio on" : "system audio off"}
        </span>
        <span>
          Ctrl/Cmd + Shift + R: start/stop · Space: pause/resume · Esc: cancel
        </span>
      </footer>
    </section>
  );
}