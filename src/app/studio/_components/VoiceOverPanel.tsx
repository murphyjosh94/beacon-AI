"use client";

import {
  ChangeEvent,
  DragEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type VoiceAssetStatus = "ready" | "recording" | "processing" | "error";

export type VoiceAsset = {
  id: string;
  name: string;
  url: string;
  blob?: Blob;
  durationMs: number;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  favourite: boolean;
  status: VoiceAssetStatus;
  waveform: number[];
};

export type VoiceTimelineClip = {
  id: string;
  assetId: string;
  name: string;
  startMs: number;
  durationMs: number;
  trimStartMs: number;
  trimEndMs: number;
  fadeInMs: number;
  fadeOutMs: number;
  gain: number;
  pan: number;
  playbackRate: number;
  muted: boolean;
  locked: boolean;
};

export type VoiceOverHistoryEntry =
  | {
      type: "asset-added";
      label: string;
      asset: VoiceAsset;
    }
  | {
      type: "asset-updated";
      label: string;
      previous: VoiceAsset;
      next: VoiceAsset;
    }
  | {
      type: "asset-deleted";
      label: string;
      asset: VoiceAsset;
    }
  | {
      type: "clip-added";
      label: string;
      clip: VoiceTimelineClip;
    }
  | {
      type: "recording-created";
      label: string;
      asset: VoiceAsset;
    };

export type VoiceOverPanelProps = {
  className?: string;
  projectId?: string;
  playheadMs?: number;
  disabled?: boolean;
  initialAssets?: VoiceAsset[];
  acceptedMimeTypes?: string[];
  maxFileSizeBytes?: number;
  onAssetsChange?: (assets: VoiceAsset[]) => void;
  onAddClip?: (clip: VoiceTimelineClip, asset: VoiceAsset) => void;
  onDeleteAsset?: (asset: VoiceAsset) => void;
  onHistory?: (entry: VoiceOverHistoryEntry) => void;
  onGenerateTranscript?: (asset: VoiceAsset) => Promise<void> | void;
  onGenerateSpeech?: (payload: {
    text: string;
    voice: string;
    speed: number;
  }) => Promise<VoiceAsset | null | void>;
};

type RecorderState =
  | "idle"
  | "requesting"
  | "countdown"
  | "recording"
  | "paused"
  | "processing"
  | "error";

type AudioDevice = {
  deviceId: string;
  label: string;
};

const DEFAULT_ACCEPTED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
  "audio/mp4",
  "audio/webm",
];

const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024;
const WAVEFORM_BAR_COUNT = 80;
const RECORDING_TIMESLICE_MS = 250;

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function formatDuration(durationMs: number): string {
  const safe = Math.max(0, Math.round(durationMs));
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = safe % 1000;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}.${Math.floor(
    milliseconds / 100,
  )}`;
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normaliseWaveform(values: number[], count = WAVEFORM_BAR_COUNT): number[] {
  if (!values.length) {
    return Array.from({ length: count }, () => 0.08);
  }

  const chunkSize = Math.max(1, Math.floor(values.length / count));
  const reduced: number[] = [];

  for (let index = 0; index < values.length; index += chunkSize) {
    const slice = values.slice(index, index + chunkSize);
    const peak = Math.max(...slice.map((value) => Math.abs(value)));
    reduced.push(clamp(peak, 0.04, 1));
  }

  while (reduced.length < count) reduced.push(0.04);
  return reduced.slice(0, count);
}

async function readAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const cleanup = () => {
      audio.removeAttribute("src");
      audio.load();
    };

    audio.preload = "metadata";
    audio.src = url;

    audio.onloadedmetadata = () => {
      const durationMs = Number.isFinite(audio.duration)
        ? Math.max(0, audio.duration * 1000)
        : 0;
      cleanup();
      resolve(durationMs);
    };

    audio.onerror = () => {
      cleanup();
      resolve(0);
    };
  });
}

async function createWaveform(blob: Blob, count = WAVEFORM_BAR_COUNT): Promise<number[]> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      return Array.from({ length: count }, (_, index) =>
        0.15 + Math.abs(Math.sin(index * 0.47)) * 0.45,
      );
    }

    const context = new AudioContextClass();
    const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
    const channelData = decoded.getChannelData(0);
    const chunkSize = Math.max(1, Math.floor(channelData.length / count));
    const peaks: number[] = [];

    for (let index = 0; index < count; index += 1) {
      const start = index * chunkSize;
      const end = Math.min(channelData.length, start + chunkSize);
      let peak = 0;

      for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
        peak = Math.max(peak, Math.abs(channelData[sampleIndex]));
      }

      peaks.push(clamp(peak, 0.04, 1));
    }

    await context.close();
    return normaliseWaveform(peaks, count);
  } catch {
    return Array.from({ length: count }, (_, index) =>
      0.12 + Math.abs(Math.sin(index * 0.63)) * 0.38,
    );
  }
}

function chooseRecorderMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/ogg;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function getFileExtension(mimeType: string): string {
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4") || mimeType.includes("aac")) return "m4a";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("flac")) return "flac";
  return "webm";
}

function makeTimelineClip(
  asset: VoiceAsset,
  startMs: number,
): VoiceTimelineClip {
  return {
    id: createId("voice_clip"),
    assetId: asset.id,
    name: asset.name,
    startMs: Math.max(0, startMs),
    durationMs: Math.max(0, asset.durationMs),
    trimStartMs: 0,
    trimEndMs: 0,
    fadeInMs: 0,
    fadeOutMs: 0,
    gain: 1,
    pan: 0,
    playbackRate: 1,
    muted: false,
    locked: false,
  };
}

function sanitiseName(name: string): string {
  const cleaned = name.trim().replace(/\s+/g, " ");
  return cleaned || "Untitled voice-over";
}

function Waveform({
  values,
  progress = 0,
  compact = false,
}: {
  values: number[];
  progress?: number;
  compact?: boolean;
}) {
  const safeValues = values.length ? values : Array.from({ length: 48 }, () => 0.12);

  return (
    <div
      className={`flex w-full items-center gap-[2px] overflow-hidden ${
        compact ? "h-7" : "h-12"
      }`}
      aria-hidden="true"
    >
      {safeValues.map((value, index) => {
        const barProgress = index / Math.max(1, safeValues.length - 1);
        const played = barProgress <= progress;

        return (
          <span
            key={`${index}-${value}`}
            className={`block min-w-[2px] flex-1 rounded-full transition ${
              played ? "bg-cyan-300" : "bg-slate-600"
            }`}
            style={{
              height: `${Math.max(8, value * (compact ? 28 : 44))}px`,
              opacity: played ? 0.95 : 0.65,
            }}
          />
        );
      })}
    </div>
  );
}

function Icon({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center ${className}`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

export default function VoiceOverPanel({
  className = "",
  projectId,
  playheadMs = 0,
  disabled = false,
  initialAssets = [],
  acceptedMimeTypes = DEFAULT_ACCEPTED_TYPES,
  maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE,
  onAssetsChange,
  onAddClip,
  onDeleteAsset,
  onHistory,
  onGenerateTranscript,
  onGenerateSpeech,
}: VoiceOverPanelProps) {
  const [assets, setAssets] = useState<VoiceAsset[]>(initialAssets);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(
    initialAssets[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [playingAssetId, setPlayingAssetId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({});
  const [previewVolume, setPreviewVolume] = useState(1);

  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [recorderError, setRecorderError] = useState<string | null>(null);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [inputLevel, setInputLevel] = useState(0);
  const [liveWaveform, setLiveWaveform] = useState<number[]>(
    Array.from({ length: 64 }, () => 0.04),
  );

  const [ttsText, setTtsText] = useState("");
  const [ttsVoice, setTtsVoice] = useState("Beacon Natural");
  const [ttsSpeed, setTtsSpeed] = useState(1);
  const [ttsBusy, setTtsBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentObjectUrlsRef = useRef<Set<string>>(new Set());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingPausedAtRef = useRef<number | null>(null);
  const totalPausedMsRef = useRef(0);
  const recordingIntervalRef = useRef<number | null>(null);
  const analyserFrameRef = useRef<number | null>(null);
  const analyserContextRef = useRef<AudioContext | null>(null);
  const analyserSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [assets, selectedAssetId],
  );

  const filteredAssets = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();

    return assets
      .filter((asset) => (favouritesOnly ? asset.favourite : true))
      .filter((asset) =>
        normalisedQuery
          ? `${asset.name} ${asset.mimeType}`.toLowerCase().includes(normalisedQuery)
          : true,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [assets, favouritesOnly, query]);

  const updateAssets = useCallback(
    (nextAssets: VoiceAsset[]) => {
      setAssets(nextAssets);
      onAssetsChange?.(nextAssets);
    },
    [onAssetsChange],
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
      }

      currentObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());

      if (recordingIntervalRef.current !== null) {
        window.clearInterval(recordingIntervalRef.current);
      }

      if (analyserFrameRef.current !== null) {
        cancelAnimationFrame(analyserFrameRef.current);
      }

      void analyserContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    const refreshDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices
          .filter((device) => device.kind === "audioinput")
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${index + 1}`,
          }));

        setDevices(audioInputs);

        if (!selectedDeviceId && audioInputs[0]) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      } catch {
        setDevices([]);
      }
    };

    void refreshDevices();
    navigator.mediaDevices.addEventListener?.("devicechange", refreshDevices);

    return () => {
      navigator.mediaDevices.removeEventListener?.("devicechange", refreshDevices);
    };
  }, [selectedDeviceId]);

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (disabled) return;

      setUploadError(null);
      const files = Array.from(fileList);
      const newAssets: VoiceAsset[] = [];

      for (const file of files) {
        const accepted =
          acceptedMimeTypes.includes(file.type) ||
          /\.(mp3|wav|aac|ogg|flac|m4a|webm)$/i.test(file.name);

        if (!accepted) {
          setUploadError(`"${file.name}" is not a supported audio file.`);
          continue;
        }

        if (file.size > maxFileSizeBytes) {
          setUploadError(
            `"${file.name}" is larger than ${formatFileSize(maxFileSizeBytes)}.`,
          );
          continue;
        }

        const url = URL.createObjectURL(file);
        currentObjectUrlsRef.current.add(url);

        const [durationMs, waveform] = await Promise.all([
          readAudioDuration(url),
          createWaveform(file),
        ]);

        const asset: VoiceAsset = {
          id: createId("voice_asset"),
          name: sanitiseName(file.name.replace(/\.[^/.]+$/, "")),
          url,
          blob: file,
          durationMs,
          sizeBytes: file.size,
          mimeType: file.type || "audio/unknown",
          createdAt: new Date().toISOString(),
          favourite: false,
          status: "ready",
          waveform,
        };

        newAssets.push(asset);
        onHistory?.({
          type: "asset-added",
          label: `Add voice asset: ${asset.name}`,
          asset,
        });
      }

      if (newAssets.length) {
        const next = [...assets, ...newAssets];
        updateAssets(next);
        setSelectedAssetId(newAssets[0].id);
      }
    },
    [
      acceptedMimeTypes,
      assets,
      disabled,
      maxFileSizeBytes,
      onHistory,
      updateAssets,
    ],
  );

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      void processFiles(event.target.files);
    }

    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFiles(false);

    if (event.dataTransfer.files.length) {
      void processFiles(event.dataTransfer.files);
    }
  };

  const toggleFavourite = (asset: VoiceAsset) => {
    const nextAsset = { ...asset, favourite: !asset.favourite };
    const next = assets.map((item) => (item.id === asset.id ? nextAsset : item));
    updateAssets(next);
    onHistory?.({
      type: "asset-updated",
      label: `${nextAsset.favourite ? "Favourite" : "Unfavourite"} ${asset.name}`,
      previous: asset,
      next: nextAsset,
    });
  };

  const renameAsset = (asset: VoiceAsset) => {
    const nextName = window.prompt("Rename voice-over", asset.name);
    if (nextName === null) return;

    const cleaned = sanitiseName(nextName);
    if (cleaned === asset.name) return;

    const nextAsset = { ...asset, name: cleaned };
    const next = assets.map((item) => (item.id === asset.id ? nextAsset : item));
    updateAssets(next);
    onHistory?.({
      type: "asset-updated",
      label: `Rename ${asset.name}`,
      previous: asset,
      next: nextAsset,
    });
  };

  const deleteAsset = (asset: VoiceAsset) => {
    const confirmed = window.confirm(`Delete "${asset.name}" from this project?`);
    if (!confirmed) return;

    if (playingAssetId === asset.id) {
      audioRef.current?.pause();
      setPlayingAssetId(null);
    }

    if (currentObjectUrlsRef.current.has(asset.url)) {
      URL.revokeObjectURL(asset.url);
      currentObjectUrlsRef.current.delete(asset.url);
    }

    const next = assets.filter((item) => item.id !== asset.id);
    updateAssets(next);
    setSelectedAssetId((current) =>
      current === asset.id ? next[0]?.id ?? null : current,
    );
    onDeleteAsset?.(asset);
    onHistory?.({
      type: "asset-deleted",
      label: `Delete voice asset: ${asset.name}`,
      asset,
    });
  };

  const playAsset = (asset: VoiceAsset) => {
    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;

    if (playingAssetId === asset.id && !audio.paused) {
      audio.pause();
      setPlayingAssetId(null);
      return;
    }

    audio.pause();
    audio.src = asset.url;
    audio.volume = clamp(previewVolume, 0, 1);
    audio.currentTime = 0;

    audio.ontimeupdate = () => {
      const progress =
        audio.duration > 0 ? clamp(audio.currentTime / audio.duration, 0, 1) : 0;
      setPlaybackProgress((current) => ({
        ...current,
        [asset.id]: progress,
      }));
    };

    audio.onended = () => {
      setPlayingAssetId(null);
      setPlaybackProgress((current) => ({
        ...current,
        [asset.id]: 0,
      }));
    };

    void audio
      .play()
      .then(() => setPlayingAssetId(asset.id))
      .catch(() => {
        setPlayingAssetId(null);
        setUploadError("The browser could not play this audio file.");
      });
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = clamp(previewVolume, 0, 1);
    }
  }, [previewVolume]);

  const addAssetToTimeline = (asset: VoiceAsset) => {
    const clip = makeTimelineClip(asset, playheadMs);
    onAddClip?.(clip, asset);
    onHistory?.({
      type: "clip-added",
      label: `Add ${asset.name} to timeline`,
      clip,
    });
  };

  const stopAnalyser = useCallback(() => {
    if (analyserFrameRef.current !== null) {
      cancelAnimationFrame(analyserFrameRef.current);
      analyserFrameRef.current = null;
    }

    analyserSourceRef.current?.disconnect();
    analyserSourceRef.current = null;
    void analyserContextRef.current?.close();
    analyserContextRef.current = null;
    setInputLevel(0);
  }, []);

  const stopRecordingTimer = useCallback(() => {
    if (recordingIntervalRef.current !== null) {
      window.clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, []);

  const stopRecordingStream = useCallback(() => {
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;
  }, []);

  const startAnalyser = useCallback((stream: MediaStream) => {
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

    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);

    analyserContextRef.current = context;
    analyserSourceRef.current = source;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteTimeDomainData(data);

      let peak = 0;
      for (let index = 0; index < data.length; index += 1) {
        peak = Math.max(peak, Math.abs((data[index] - 128) / 128));
      }

      const level = clamp(peak * 1.8, 0, 1);
      setInputLevel(level);
      setLiveWaveform((current) => [...current.slice(1), Math.max(0.04, level)]);
      analyserFrameRef.current = requestAnimationFrame(tick);
    };

    tick();
  }, []);

  const beginRecorder = useCallback(
    async (stream: MediaStream) => {
      try {
        const mimeType = chooseRecorderMimeType();
        const recorder = new MediaRecorder(
          stream,
          mimeType ? { mimeType } : undefined,
        );

        recordingChunksRef.current = [];
        mediaRecorderRef.current = recorder;
        recordingStartedAtRef.current = Date.now();
        recordingPausedAtRef.current = null;
        totalPausedMsRef.current = 0;
        setRecordingElapsedMs(0);
        setLiveWaveform(Array.from({ length: 64 }, () => 0.04));

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordingChunksRef.current.push(event.data);
          }
        };

        recorder.onerror = () => {
          setRecorderError("The recording could not be completed.");
          setRecorderState("error");
          stopRecordingTimer();
          stopAnalyser();
          stopRecordingStream();
        };

        recorder.onstop = async () => {
          setRecorderState("processing");
          stopRecordingTimer();
          stopAnalyser();

          const finalMimeType =
            recorder.mimeType || mimeType || "audio/webm";
          const blob = new Blob(recordingChunksRef.current, {
            type: finalMimeType,
          });
          const url = URL.createObjectURL(blob);
          currentObjectUrlsRef.current.add(url);

          const [durationMs, waveform] = await Promise.all([
            readAudioDuration(url),
            createWaveform(blob),
          ]);

          const extension = getFileExtension(finalMimeType);
          const asset: VoiceAsset = {
            id: createId("voice_recording"),
            name: `Voice-over ${new Date().toLocaleString("en-GB", {
              dateStyle: "short",
              timeStyle: "short",
            })}`,
            url,
            blob,
            durationMs:
              durationMs ||
              Math.max(
                0,
                Date.now() -
                  (recordingStartedAtRef.current ?? Date.now()) -
                  totalPausedMsRef.current,
              ),
            sizeBytes: blob.size,
            mimeType: finalMimeType,
            createdAt: new Date().toISOString(),
            favourite: false,
            status: "ready",
            waveform,
          };

          const next = [...assets, asset];
          updateAssets(next);
          setSelectedAssetId(asset.id);
          setRecorderState("idle");
          setRecordingElapsedMs(0);
          stopRecordingStream();

          onHistory?.({
            type: "recording-created",
            label: `Create recording: ${asset.name}`,
            asset,
          });
        };

        recorder.start(RECORDING_TIMESLICE_MS);
        setRecorderState("recording");
        startAnalyser(stream);

        recordingIntervalRef.current = window.setInterval(() => {
          const startedAt = recordingStartedAtRef.current;
          if (!startedAt) return;

          const pausedAt = recordingPausedAtRef.current;
          const now = pausedAt ?? Date.now();
          setRecordingElapsedMs(
            Math.max(0, now - startedAt - totalPausedMsRef.current),
          );
        }, 100);
      } catch {
        setRecorderError("The browser could not start recording.");
        setRecorderState("error");
        stopRecordingStream();
      }
    },
    [
      assets,
      onHistory,
      startAnalyser,
      stopAnalyser,
      stopRecordingStream,
      stopRecordingTimer,
      updateAssets,
    ],
  );

  const requestRecording = async () => {
    if (disabled || recorderState !== "idle") return;

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setRecorderError("Microphone recording is not supported in this browser.");
      setRecorderState("error");
      return;
    }

    setRecorderError(null);
    setRecorderState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDeviceId
            ? { exact: selectedDeviceId }
            : undefined,
          noiseSuppression,
          echoCancellation,
          autoGainControl,
        },
      });

      recordingStreamRef.current = stream;
      setRecorderState("countdown");
      setCountdown(3);

      let remaining = 3;
      const countdownTimer = window.setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);

        if (remaining <= 0) {
          window.clearInterval(countdownTimer);
          void beginRecorder(stream);
        }
      }, 1000);
    } catch (error) {
      setRecorderState("error");
      setRecorderError(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone permission was denied."
          : "The microphone could not be opened.",
      );
      stopRecordingStream();
    }
  };

  const pauseOrResumeRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorderState === "recording") {
      recorder.pause();
      recordingPausedAtRef.current = Date.now();
      setRecorderState("paused");
      return;
    }

    if (recorderState === "paused") {
      if (recordingPausedAtRef.current) {
        totalPausedMsRef.current += Date.now() - recordingPausedAtRef.current;
      }

      recordingPausedAtRef.current = null;
      recorder.resume();
      setRecorderState("recording");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    setRecorderState("idle");
    stopRecordingTimer();
    stopAnalyser();
    stopRecordingStream();
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder) {
      recorder.onstop = null;
      if (recorder.state !== "inactive") recorder.stop();
    }

    recordingChunksRef.current = [];
    stopRecordingTimer();
    stopAnalyser();
    stopRecordingStream();
    setRecorderState("idle");
    setRecordingElapsedMs(0);
  };

  const generateSpeech = async () => {
    if (!onGenerateSpeech || !ttsText.trim() || disabled || ttsBusy) return;

    setTtsBusy(true);

    try {
      const generated = await onGenerateSpeech({
        text: ttsText.trim(),
        voice: ttsVoice,
        speed: ttsSpeed,
      });

      if (generated) {
        const next = [...assets, generated];
        updateAssets(next);
        setSelectedAssetId(generated.id);
        onHistory?.({
          type: "asset-added",
          label: `Generate speech: ${generated.name}`,
          asset: generated,
        });
      }
    } finally {
      setTtsBusy(false);
    }
  };

  const handleAssetDragStart = (
    event: ReactPointerEvent<HTMLButtonElement>,
    asset: VoiceAsset,
  ) => {
    if (!onAddClip) return;

    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;

    const handleMove = (moveEvent: PointerEvent) => {
      const distance = Math.hypot(
        moveEvent.clientX - startX,
        moveEvent.clientY - startY,
      );

      if (distance > 8) moved = true;
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);

      if (moved) {
        addAssetToTimeline(asset);
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-2xl ${className}`}
      aria-label="Beacon Studio voice-over panel"
      data-project-id={projectId}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900/95 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Voice-over</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Record, upload and place narration on the Studio timeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-[11px] text-slate-400">
            Preview volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={previewVolume}
              onChange={(event) => setPreviewVolume(Number(event.target.value))}
              className="w-24 accent-cyan-400"
              aria-label="Preview volume"
            />
          </label>

          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Upload audio
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.aac,.ogg,.flac,.m4a,.webm,audio/*"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      </header>

      <div className="grid min-h-[44rem] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-b border-white/10 xl:border-b-0 xl:border-r">
          <div className="border-b border-white/10 p-4">
            <div
              className={`rounded-xl border border-dashed p-5 transition ${
                isDraggingFiles
                  ? "border-cyan-300 bg-cyan-400/10"
                  : "border-white/15 bg-slate-900/45"
              }`}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDraggingFiles(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (event.currentTarget === event.target) {
                  setIsDraggingFiles(false);
                }
              }}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center py-3 text-center">
                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
                  <Icon>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        d="M12 16V4m0 0-4 4m4-4 4 4M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Icon>
                </div>
                <p className="mt-3 text-sm font-medium text-white">
                  Drop audio files here
                </p>
                <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                  MP3, WAV, AAC, OGG, FLAC, M4A or WebM up to{" "}
                  {formatFileSize(maxFileSizeBytes)} each.
                </p>
              </div>
            </div>

            {uploadError ? (
              <p className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
                {uploadError}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label className="relative min-w-[220px] flex-1">
                <span className="sr-only">Search voice assets</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search voice recordings"
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
                />
              </label>

              <button
                type="button"
                onClick={() => setFavouritesOnly((current) => !current)}
                className={`rounded-lg border px-3 py-2 text-xs transition ${
                  favouritesOnly
                    ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                    : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                Favourites
              </button>
            </div>
          </div>

          <div className="max-h-[36rem] overflow-y-auto p-3">
            {filteredAssets.length ? (
              <div className="space-y-2">
                {filteredAssets.map((asset) => {
                  const selected = asset.id === selectedAssetId;
                  const playing = asset.id === playingAssetId;
                  const progress = playbackProgress[asset.id] ?? 0;

                  return (
                    <article
                      key={asset.id}
                      className={`rounded-xl border p-3 transition ${
                        selected
                          ? "border-cyan-400/30 bg-cyan-400/[0.07]"
                          : "border-white/10 bg-slate-900/45 hover:bg-slate-900/75"
                      }`}
                      onClick={() => setSelectedAssetId(asset.id)}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            playAsset(asset);
                          }}
                          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"
                          aria-label={playing ? `Pause ${asset.name}` : `Play ${asset.name}`}
                        >
                          {playing ? "Ⅱ" : "▶"}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate text-xs font-semibold text-white">
                                {asset.name}
                              </h3>
                              <p className="mt-1 text-[10px] text-slate-500">
                                {formatDuration(asset.durationMs)} ·{" "}
                                {formatFileSize(asset.sizeBytes)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleFavourite(asset);
                              }}
                              className={`rounded p-1 text-sm ${
                                asset.favourite
                                  ? "text-amber-300"
                                  : "text-slate-600 hover:text-amber-200"
                              }`}
                              aria-label={
                                asset.favourite
                                  ? `Remove ${asset.name} from favourites`
                                  : `Add ${asset.name} to favourites`
                              }
                            >
                              ★
                            </button>
                          </div>

                          <button
                            type="button"
                            className="mt-2 block w-full cursor-grab text-left active:cursor-grabbing"
                            onPointerDown={(event) =>
                              handleAssetDragStart(event, asset)
                            }
                            onDoubleClick={() => addAssetToTimeline(asset)}
                            aria-label={`Drag ${asset.name} to timeline`}
                          >
                            <Waveform
                              values={asset.waveform}
                              progress={progress}
                              compact
                            />
                          </button>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={!onAddClip || disabled}
                              onClick={(event) => {
                                event.stopPropagation();
                                addAssetToTimeline(asset);
                              }}
                              className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] font-semibold text-cyan-100 hover:bg-cyan-400/20 disabled:opacity-40"
                            >
                              Add at {formatDuration(playheadMs)}
                            </button>

                            <button
                              type="button"
                              disabled={disabled}
                              onClick={(event) => {
                                event.stopPropagation();
                                renameAsset(asset);
                              }}
                              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-400 hover:bg-white/10"
                            >
                              Rename
                            </button>

                            <button
                              type="button"
                              disabled={disabled}
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteAsset(asset);
                              }}
                              className="rounded-md border border-rose-400/10 bg-rose-400/5 px-2 py-1 text-[10px] text-rose-300 hover:bg-rose-400/10"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-xl border border-white/10 bg-slate-900/30 p-6 text-center">
                <p className="text-sm font-medium text-slate-300">
                  No voice-over assets found
                </p>
                <p className="mt-2 max-w-xs text-xs leading-5 text-slate-600">
                  Upload an audio file or record directly from your microphone.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4 bg-slate-900/45 p-4">
          <section className="rounded-xl border border-white/10 bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Microphone recording
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  Record narration without leaving Beacon Studio.
                </p>
              </div>

              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  recorderState === "recording"
                    ? "animate-pulse bg-rose-400"
                    : recorderState === "paused"
                      ? "bg-amber-300"
                      : "bg-slate-700"
                }`}
              />
            </div>

            <label className="mt-4 block text-[11px] text-slate-500">
              Input device
              <select
                value={selectedDeviceId}
                disabled={disabled || recorderState !== "idle"}
                onChange={(event) => setSelectedDeviceId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
              >
                {devices.length ? (
                  devices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))
                ) : (
                  <option value="">Default microphone</option>
                )}
              </select>
            </label>

            <div className="mt-4 rounded-lg border border-white/10 bg-slate-900/70 p-3">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Input level</span>
                <span>{Math.round(inputLevel * 100)}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-[width] duration-75"
                  style={{ width: `${inputLevel * 100}%` }}
                />
              </div>

              <div className="mt-3">
                <Waveform values={liveWaveform} compact />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 text-[11px] text-slate-400">
              {[
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
              ].map((option) => (
                <label
                  key={option.label}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2"
                >
                  <span>{option.label}</span>
                  <input
                    type="checkbox"
                    checked={option.value}
                    disabled={disabled || recorderState !== "idle"}
                    onChange={(event) => option.setter(event.target.checked)}
                    className="accent-cyan-400"
                  />
                </label>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-slate-900 p-4 text-center">
              {recorderState === "countdown" ? (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                    Recording starts in
                  </p>
                  <p className="mt-2 text-5xl font-semibold text-cyan-200">
                    {Math.max(1, countdown)}
                  </p>
                </div>
              ) : recorderState === "recording" ||
                recorderState === "paused" ? (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                    {recorderState === "paused" ? "Paused" : "Recording"}
                  </p>
                  <p className="mt-2 font-mono text-3xl font-semibold text-white">
                    {formatDuration(recordingElapsedMs)}
                  </p>
                </div>
              ) : recorderState === "processing" ? (
                <p className="py-4 text-sm text-cyan-100">
                  Processing recording…
                </p>
              ) : (
                <div>
                  <p className="text-3xl">●</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Ready to record
                  </p>
                </div>
              )}
            </div>

            {recorderError ? (
              <p className="mt-3 rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
                {recorderError}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {recorderState === "idle" || recorderState === "error" ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={requestRecording}
                  className="flex-1 rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-400/20 disabled:opacity-40"
                >
                  Start recording
                </button>
              ) : null}

              {recorderState === "recording" ||
              recorderState === "paused" ? (
                <>
                  <button
                    type="button"
                    onClick={pauseOrResumeRecording}
                    className="flex-1 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-300/20"
                  >
                    {recorderState === "paused" ? "Resume" : "Pause"}
                  </button>

                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex-1 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/20"
                  >
                    Stop and save
                  </button>

                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-slate-950 p-4">
            <h3 className="text-sm font-semibold text-white">
              AI voice generation
            </h3>
            <p className="mt-1 text-[11px] leading-4 text-slate-500">
              Generate narration through your configured Beacon speech service.
            </p>

            <textarea
              rows={5}
              value={ttsText}
              disabled={disabled || !onGenerateSpeech}
              onChange={(event) => setTtsText(event.target.value)}
              placeholder={
                onGenerateSpeech
                  ? "Enter the narration script…"
                  : "Connect an AI speech provider to enable generation."
              }
              className="mt-4 w-full resize-none rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs leading-5 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50 disabled:opacity-50"
            />

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-[11px] text-slate-500">
                Voice
                <select
                  value={ttsVoice}
                  disabled={disabled || !onGenerateSpeech}
                  onChange={(event) => setTtsVoice(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
                >
                  <option>Beacon Natural</option>
                  <option>Beacon Clear</option>
                  <option>Beacon Warm</option>
                  <option>Beacon Presenter</option>
                </select>
              </label>

              <label className="text-[11px] text-slate-500">
                Speed
                <select
                  value={ttsSpeed}
                  disabled={disabled || !onGenerateSpeech}
                  onChange={(event) => setTtsSpeed(Number(event.target.value))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50 disabled:opacity-50"
                >
                  <option value={0.75}>0.75×</option>
                  <option value={0.9}>0.9×</option>
                  <option value={1}>1×</option>
                  <option value={1.1}>1.1×</option>
                  <option value={1.25}>1.25×</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              disabled={
                disabled ||
                !onGenerateSpeech ||
                !ttsText.trim() ||
                ttsBusy
              }
              onClick={() => void generateSpeech()}
              className="mt-3 w-full rounded-lg border border-violet-400/20 bg-violet-400/10 px-3 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {ttsBusy ? "Generating…" : "Generate voice-over"}
            </button>
          </section>

          {selectedAsset ? (
            <section className="rounded-xl border border-white/10 bg-slate-950 p-4">
              <h3 className="truncate text-sm font-semibold text-white">
                {selectedAsset.name}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
                <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
                  <dt className="text-slate-600">Duration</dt>
                  <dd className="mt-1 text-slate-300">
                    {formatDuration(selectedAsset.durationMs)}
                  </dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
                  <dt className="text-slate-600">File size</dt>
                  <dd className="mt-1 text-slate-300">
                    {formatFileSize(selectedAsset.sizeBytes)}
                  </dd>
                </div>
                <div className="col-span-2 rounded-lg border border-white/10 bg-slate-900 p-3">
                  <dt className="text-slate-600">Format</dt>
                  <dd className="mt-1 break-all text-slate-300">
                    {selectedAsset.mimeType}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                disabled={!onGenerateTranscript || disabled}
                onClick={() =>
                  void onGenerateTranscript?.(selectedAsset)
                }
                className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-40"
              >
                Generate transcript
              </button>
            </section>
          ) : null}
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-900 px-4 py-3 text-[11px] text-slate-500">
        <span>
          {assets.length} voice asset{assets.length === 1 ? "" : "s"} ·{" "}
          {formatFileSize(
            assets.reduce((total, asset) => total + asset.sizeBytes, 0),
          )}
        </span>
        <span>
          Double-click a waveform to add it at the current playhead.
        </span>
      </footer>
    </section>
  );
}