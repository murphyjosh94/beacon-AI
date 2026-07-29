"use client";

import {
  ExternalLink,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { IframeBridge } from "../_engine/iframeBridge";
import type {
  StudioBridgeEvent,
  StudioDevicePreset,
} from "../types";

type WebsiteViewportProps = {
  sourceUrl: string;
  device: StudioDevicePreset;
  onDeviceChange: (
    device: StudioDevicePreset,
  ) => void;
  onBridgeReady?: (
    bridge: IframeBridge,
  ) => void;
};

const DEVICE_WIDTHS: Record<
  StudioDevicePreset,
  number
> = {
  desktop: 1440,
  tablet: 820,
  mobile: 390,
};

export default function WebsiteViewport({
  sourceUrl,
  device,
  onDeviceChange,
  onBridgeReady,
}: WebsiteViewportProps) {
  const iframeRef =
    useRef<HTMLIFrameElement | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const [bridgeState, setBridgeState] =
    useState<
      "connecting" | "ready" | "unavailable"
    >("connecting");

  const normalizedUrl = useMemo(() => {
    const value = sourceUrl.trim();
    return value || "/demo/beacon-ai";
  }, [sourceUrl]);

  useEffect(() => {
    if (!iframeRef.current) {
      return;
    }

    const bridge = new IframeBridge(
      iframeRef.current,
    );

    onBridgeReady?.(bridge);

    const unsubscribe = bridge.subscribe(
      (event: StudioBridgeEvent) => {
        if (
          event.type === "beacon-studio:ready" ||
          event.type === "beacon-studio:pong"
        ) {
          setBridgeState("ready");
        }

        if (event.type === "beacon-studio:error") {
          setBridgeState("unavailable");
        }
      },
    );

    const pingTimer = window.setTimeout(() => {
      if (!bridge.ping()) {
        setBridgeState("unavailable");
      }
    }, 600);

    const unavailableTimer =
      window.setTimeout(() => {
        setBridgeState((current) =>
          current === "connecting"
            ? "unavailable"
            : current,
        );
      }, 2500);

    return () => {
      window.clearTimeout(pingTimer);
      window.clearTimeout(unavailableTimer);
      unsubscribe();
      bridge.destroy();
    };
  }, [normalizedUrl, reloadKey, onBridgeReady]);

  const reload = () => {
    setBridgeState("connecting");
    setReloadKey((value) => value + 1);
  };

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/90 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-white">
            Live website viewport
          </p>

          <div className="mt-1 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                bridgeState === "ready"
                  ? "bg-emerald-300"
                  : bridgeState === "connecting"
                    ? "animate-pulse bg-amber-300"
                    : "bg-slate-500"
              }`}
            />

            <p className="truncate text-[0.65rem] font-semibold text-slate-500">
              {bridgeState === "ready"
                ? "Motion bridge connected"
                : bridgeState === "connecting"
                  ? "Connecting to page"
                  : "Live preview available; motion bridge not installed"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            <DeviceButton
              active={device === "desktop"}
              label="Desktop preview"
              onClick={() => onDeviceChange("desktop")}
            >
              <Monitor className="h-4 w-4" />
            </DeviceButton>

            <DeviceButton
              active={device === "tablet"}
              label="Tablet preview"
              onClick={() => onDeviceChange("tablet")}
            >
              <Tablet className="h-4 w-4" />
            </DeviceButton>

            <DeviceButton
              active={device === "mobile"}
              label="Mobile preview"
              onClick={() => onDeviceChange("mobile")}
            >
              <Smartphone className="h-4 w-4" />
            </DeviceButton>
          </div>

          <button
            aria-label="Reload preview"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            onClick={reload}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            aria-label="Open preview in new tab"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            onClick={() =>
              window.open(
                normalizedUrl,
                "_blank",
                "noopener,noreferrer",
              )
            }
            type="button"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-[34rem] overflow-auto bg-[linear-gradient(135deg,#0f172a_25%,#111827_25%,#111827_50%,#0f172a_50%,#0f172a_75%,#111827_75%,#111827_100%)] bg-[length:24px_24px] p-4 sm:p-6">
        <div
          className="mx-auto overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl transition-[width] duration-300"
          style={{
            width: `min(100%, ${DEVICE_WIDTHS[device]}px)`,
          }}
        >
          <iframe
            key={`${normalizedUrl}-${reloadKey}`}
            ref={iframeRef}
            className="block h-[70vh] min-h-[34rem] w-full border-0 bg-white"
            src={normalizedUrl}
            title="Beacon Studio live website preview"
          />
        </div>
      </div>
    </section>
  );
}

type DeviceButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
};

function DeviceButton({
  active,
  label,
  onClick,
  children,
}: DeviceButtonProps) {
  return (
    <button
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
        active
          ? "bg-blue-500 text-white"
          : "text-slate-400 hover:text-white"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}