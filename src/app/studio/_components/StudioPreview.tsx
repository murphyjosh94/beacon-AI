"use client";

import {
  type CSSProperties,
  type ReactNode,
  useMemo,
} from "react";

import { useStudio } from "../StudioProvider";

export type StudioPreviewProps = {
  externalPreview?: ReactNode;
  className?: string;
};

export default function StudioPreview({
  externalPreview,
  className = "",
}: StudioPreviewProps) {
  const { state, actions } = useStudio();

  const selectedClip = useMemo(() => {
    if (!state.selection.primaryClipId) {
      return null;
    }

    return (
      state.timeline.tracks
        .flatMap((track) => track.clips)
        .find(
          (clip) =>
            clip.id ===
            state.selection.primaryClipId,
        ) ?? null
    );
  }, [
    state.selection.primaryClipId,
    state.timeline.tracks,
  ]);

  const currentClips = useMemo(
    () =>
      state.timeline.tracks
        .filter(
          (track) =>
            !track.hidden,
        )
        .flatMap((track) =>
          track.clips.filter(
            (clip) =>
              !clip.hidden &&
              state.timeline.playheadMs >=
                clip.startMs &&
              state.timeline.playheadMs <=
                clip.startMs +
                  clip.durationMs,
          ),
        )
        .sort(
          (first, second) =>
            first.layer -
            second.layer,
        ),
    [
      state.timeline.playheadMs,
      state.timeline.tracks,
    ],
  );

  if (externalPreview) {
    return (
      <div
        className={`h-full min-h-0 overflow-hidden bg-black ${className}`}
      >
        {externalPreview}
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-[#020617] p-6 ${className}`}
    >
      {state.preferences.showGrid ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.18) 1px, transparent 1px)",
            backgroundSize:
              "24px 24px",
          }}
        />
      ) : null}

      <div
        className="relative max-h-full max-w-full overflow-hidden border border-white/10 shadow-2xl"
        style={{
          aspectRatio: `${state.project.width}/${state.project.height}`,
          width:
            "min(100%, 1200px)",
          backgroundColor:
            state.project
              .backgroundColor,
        }}
        onPointerDown={() =>
          actions.clearSelection()
        }
      >
        {currentClips.length > 0 ? (
          currentClips.map(
            (clip) => {
              const clipStyle: CSSProperties =
                {
                  position:
                    "absolute",
                  left: `${clip.transform.x}px`,
                  top: `${clip.transform.y}px`,
                  width: `${clip.transform.width}px`,
                  height: `${clip.transform.height}px`,
                  opacity:
                    clip.transform
                      .opacity,
                  transform: `rotate(${clip.transform.rotation}deg) scale(${clip.transform.scaleX}, ${clip.transform.scaleY})`,
                  transformOrigin: `${
                    clip.transform
                      .anchorX * 100
                  }% ${
                    clip.transform
                      .anchorY * 100
                  }%`,
                  border:
                    selectedClip?.id ===
                    clip.id
                      ? "2px solid rgb(34 211 238)"
                      : undefined,
                  overflow:
                    "hidden",
                  ...(clip.style as
                    | CSSProperties
                    | undefined),
                };

              const asset =
                clip.assetId
                  ? state.assets.find(
                      (item) =>
                        item.id ===
                        clip.assetId,
                    ) ?? null
                  : null;

              return (
                <button
                  key={clip.id}
                  type="button"
                  style={clipStyle}
                  className="group text-left"
                  onPointerDown={(
                    event,
                  ) => {
                    event.stopPropagation();

                    actions.selectClip(
                      clip.id,
                      event.shiftKey,
                    );
                  }}
                  aria-label={`Select ${clip.name}`}
                >
                  {clip.type ===
                  "text" ? (
                    <span className="block h-full w-full whitespace-pre-wrap">
                      {clip.content ||
                        clip.name}
                    </span>
                  ) : clip.type ===
                      "image" &&
                    asset ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.url}
                      alt={clip.name}
                      className="h-full w-full object-cover"
                      draggable={
                        false
                      }
                    />
                  ) : (clip.type ===
                        "video" ||
                      clip.type ===
                        "recording") &&
                    asset ? (
                    <video
                      src={asset.url}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-slate-800/80 p-3 text-center text-xs text-slate-300">
                      {clip.name}
                    </span>
                  )}
                </button>
              );
            },
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-2xl text-cyan-100">
              ◈
            </div>

            <p className="mt-4 text-sm font-semibold text-white">
              Beacon Studio canvas
            </p>

            <p className="mt-2 max-w-sm px-6 text-xs leading-5 text-slate-500">
              Create an AI campaign,
              upload an asset, or place
              an item on the timeline
              to begin.
            </p>
          </div>
        )}

        {state.preferences
          .showSafeArea ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[5%] border border-dashed border-amber-300/50"
          />
        ) : null}

        {state.preferences.showGuides
          ? state.guides.map(
              (guide) => (
                <div
                  key={guide.id}
                  aria-hidden="true"
                  className="pointer-events-none absolute bg-cyan-300/60"
                  style={
                    guide.axis ===
                    "x"
                      ? {
                          left:
                            guide.position,
                          top: 0,
                          bottom: 0,
                          width: 1,
                        }
                      : {
                          top:
                            guide.position,
                          left: 0,
                          right: 0,
                          height: 1,
                        }
                  }
                />
              ),
            )
          : null}
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/10 bg-slate-950/75 px-2 py-1 font-mono text-[10px] text-slate-400 backdrop-blur">
        {state.project.width} ×{" "}
        {state.project.height}
      </div>
    </div>
  );
}