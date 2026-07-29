export type StudioAspectRatio =
  | "16:9"
  | "9:16"
  | "1:1"
  | "4:5";

export type StudioDevicePreset =
  | "desktop"
  | "tablet"
  | "mobile";

export type StudioTrackType =
  | "camera"
  | "scroll"
  | "cursor"
  | "highlight"
  | "text"
  | "audio"
  | "voiceover";

export type StudioActionType =
  | "load"
  | "scroll"
  | "zoom"
  | "pan"
  | "cursor-move"
  | "cursor-click"
  | "highlight"
  | "text"
  | "fade"
  | "wait";

export type StudioTarget = {
  selector?: string;
  sectionId?: string;
  x?: number;
  y?: number;
};

export type StudioKeyframe = {
  id: string;
  atMs: number;
  durationMs: number;
  action: StudioActionType;
  target?: StudioTarget;
  value?: string | number | boolean;
  easing?: string;
  metadata?: Record<string, unknown>;
};

export type StudioTrack = {
  id: string;
  name: string;
  type: StudioTrackType;
  enabled: boolean;
  locked: boolean;
  keyframes: StudioKeyframe[];
};

export type StudioProject = {
  id: string;
  name: string;
  description: string;
  sourceUrl: string;
  aspectRatio: StudioAspectRatio;
  device: StudioDevicePreset;
  durationMs: number;
  tracks: StudioTrack[];
  createdAt: string;
  updatedAt: string;
};

export type StudioBridgeCommand =
  | { type: "beacon-studio:ping" }
  | {
      type: "beacon-studio:scroll";
      selector?: string;
      sectionId?: string;
      top?: number;
      behavior?: ScrollBehavior;
    }
  | {
      type: "beacon-studio:highlight";
      selector: string;
      enabled: boolean;
    }
  | {
      type: "beacon-studio:click";
      selector: string;
    }
  | {
      type: "beacon-studio:type";
      selector: string;
      text: string;
    }
  | { type: "beacon-studio:reset" };

export type StudioBridgeEvent =
  | {
      type: "beacon-studio:ready";
      href: string;
    }
  | {
      type: "beacon-studio:pong";
      href: string;
    }
  | {
      type: "beacon-studio:error";
      message: string;
    };