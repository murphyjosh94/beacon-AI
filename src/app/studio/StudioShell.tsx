"use client";

import type { ReactNode } from "react";

import StudioWorkspace from "./_components/StudioWorkspace";
import {
  StudioProvider,
  type StudioProviderProps,
  type StudioSnapshot,
} from "./StudioProvider";

export type StudioShellProps = {
  projectId?: string;
  className?: string;
  disabled?: boolean;
  initialProject?: StudioProviderProps["initialProject"];
  initialTimeline?: StudioProviderProps["initialTimeline"];
  initialAssets?: StudioProviderProps["initialAssets"];
  initialPreferences?: StudioProviderProps["initialPreferences"];
  initialPanels?: StudioProviderProps["initialPanels"];
  historyLimit?: number;
  plugins?: StudioProviderProps["plugins"];
  onAutosave?: StudioProviderProps["onAutosave"];
  onStateChange?: StudioProviderProps["onStateChange"];
  onExit?: () => void;
  onPublish?: (snapshot: StudioSnapshot) => Promise<void> | void;
  preview?: ReactNode;
};

export default function StudioShell({
  projectId,
  className = "",
  disabled = false,
  initialProject,
  initialTimeline,
  initialAssets,
  initialPreferences,
  initialPanels,
  historyLimit,
  plugins,
  onAutosave,
  onStateChange,
  onExit,
  onPublish,
  preview,
}: StudioShellProps) {
  const resolvedInitialProject = projectId
    ? {
        ...initialProject,
        id: projectId,
      }
    : initialProject;

  return (
    <div className={className}>
      <StudioProvider
        initialProject={resolvedInitialProject}
        initialTimeline={initialTimeline}
        initialAssets={initialAssets}
        initialPreferences={initialPreferences}
        initialPanels={initialPanels}
        historyLimit={historyLimit}
        plugins={plugins}
        onAutosave={onAutosave}
        onStateChange={onStateChange}
      >
        <StudioWorkspace
          disabled={disabled}
          onExit={onExit}
          onPublish={onPublish}
          preview={preview}
        />
      </StudioProvider>
    </div>
  );
}