"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createStudioShortcutRegistry,
  executeStudioShortcut,
  findMatchingStudioShortcut,
  findShortcutConflicts,
  formatStudioShortcut,
  getCurrentStudioPlatform,
  registerStudioShortcutCommands,
  type StudioShortcutConflict,
  type StudioShortcutDefinition,
  type StudioShortcutOverrides,
  type StudioShortcutPlatform,
  type StudioShortcutScope,
} from "./StudioShortcuts";
import { useStudio } from "./StudioProvider";

export type StudioHotkeyDebugEvent = {
  shortcutId: string;
  label: string;
  formattedBinding: string | null;
  scope: StudioShortcutScope;
  timestamp: number;
};

export type StudioHotkeysContextValue = {
  enabled: boolean;
  platform: StudioShortcutPlatform;
  scope: StudioShortcutScope;
  shortcuts: StudioShortcutDefinition[];
  conflicts: StudioShortcutConflict[];
  lastTriggered: StudioHotkeyDebugEvent | null;
  setEnabled: (enabled: boolean) => void;
  setScope: (scope: StudioShortcutScope) => void;
  triggerShortcut: (shortcutId: string) => Promise<boolean>;
};

export type StudioHotkeysProps = {
  children?: ReactNode;
  enabled?: boolean;
  defaultEnabled?: boolean;
  scope?: StudioShortcutScope;
  defaultScope?: StudioShortcutScope;
  overrides?: StudioShortcutOverrides;
  shortcuts?: StudioShortcutDefinition[];
  platform?: StudioShortcutPlatform;
  debug?: boolean;
  registerCommands?: boolean;
  capture?: boolean;
  allowWhenModalOpen?: boolean;
  onTriggered?: (event: StudioHotkeyDebugEvent) => void;
  onConflict?: (conflicts: StudioShortcutConflict[]) => void;
  onCommandPalette?: () => void;
};

export type UseStudioHotkeysOptions = Omit<
  StudioHotkeysProps,
  "children"
>;

const StudioHotkeysContext =
  createContext<StudioHotkeysContextValue | null>(null);

const DEFAULT_SCOPE: StudioShortcutScope = "global";

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;

  if (!element) return false;

  return (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.tagName === "SELECT" ||
    element.isContentEditable ||
    element.closest('[contenteditable="true"]') !== null
  );
}

function hasOpenDialog(): boolean {
  if (typeof document === "undefined") return false;

  return Boolean(
    document.querySelector(
      'dialog[open], [role="dialog"][aria-modal="true"], [data-studio-modal="true"]',
    ),
  );
}

function resolveScopeFromTarget(
  target: EventTarget | null,
  fallback: StudioShortcutScope,
): StudioShortcutScope {
  const element = target as HTMLElement | null;

  if (!element) return fallback;

  const explicitScope = element.closest<HTMLElement>(
    "[data-studio-shortcut-scope]",
  )?.dataset.studioShortcutScope as
    | StudioShortcutScope
    | undefined;

  if (explicitScope) {
    return explicitScope;
  }

  const panel = element.closest<HTMLElement>("[data-studio-panel]")
    ?.dataset.studioPanel;

  switch (panel) {
    case "timeline":
    case "keyframes":
      return "timeline";
    case "inspector":
    case "curves":
    case "history":
      return "inspector";
    case "assets":
      return "assets";
    case "recording":
      return "recording";
    case "voiceOver":
      return "voice-over";
    case "renderQueue":
      return "render";
    default:
      break;
  }

  if (
    element.closest(
      "[data-studio-canvas], [data-studio-preview], [data-studio-viewport]",
    )
  ) {
    return "canvas";
  }

  if (isEditableTarget(element)) {
    return "text-editing";
  }

  return fallback;
}

function isCompositionEventActive(event: KeyboardEvent): boolean {
  return event.isComposing || event.keyCode === 229;
}

function matchesShortcutScope(
  shortcut: StudioShortcutDefinition,
  scope: StudioShortcutScope,
): boolean {
  const scopes = Array.isArray(shortcut.scope)
    ? shortcut.scope
    : [shortcut.scope];

  return scopes.includes("global") || scopes.includes(scope);
}

function dispatchStudioEvent(
  name: string,
  detail?: unknown,
): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(name, {
      detail,
    }),
  );
}

export function useStudioHotkeys(
  options: UseStudioHotkeysOptions = {},
): StudioHotkeysContextValue {
  const { state, actions, refs } = useStudio();

  const {
    enabled: controlledEnabled,
    defaultEnabled = true,
    scope: controlledScope,
    defaultScope = DEFAULT_SCOPE,
    overrides,
    shortcuts: suppliedShortcuts,
    platform: suppliedPlatform,
    debug = false,
    registerCommands = true,
    capture = true,
    allowWhenModalOpen = false,
    onTriggered,
    onConflict,
    onCommandPalette,
  } = options;

  const [uncontrolledEnabled, setUncontrolledEnabled] =
    useState(defaultEnabled);
  const [uncontrolledScope, setUncontrolledScope] =
    useState<StudioShortcutScope>(defaultScope);
  const [lastTriggered, setLastTriggered] =
    useState<StudioHotkeyDebugEvent | null>(null);

  const enabled = controlledEnabled ?? uncontrolledEnabled;
  const scope = controlledScope ?? uncontrolledScope;

  const platform = useMemo(
    () => suppliedPlatform ?? getCurrentStudioPlatform(),
    [suppliedPlatform],
  );

  const shortcuts = useMemo(() => {
    if (suppliedShortcuts) {
      return suppliedShortcuts;
    }

    return createStudioShortcutRegistry({
      platform,
      overrides,
    });
  }, [overrides, platform, suppliedShortcuts]);

  const conflicts = useMemo(
    () => findShortcutConflicts(shortcuts, platform),
    [platform, shortcuts],
  );

  const optionsRef = useRef({
    enabled,
    scope,
    debug,
    allowWhenModalOpen,
    onTriggered,
    onCommandPalette,
  });

  useEffect(() => {
    optionsRef.current = {
      enabled,
      scope,
      debug,
      allowWhenModalOpen,
      onTriggered,
      onCommandPalette,
    };
  }, [
    allowWhenModalOpen,
    debug,
    enabled,
    onCommandPalette,
    onTriggered,
    scope,
  ]);

  useEffect(() => {
    onConflict?.(conflicts);
  }, [conflicts, onConflict]);

  useEffect(() => {
    if (!registerCommands) return;

    return registerStudioShortcutCommands(actions, shortcuts);
  }, [actions, registerCommands, shortcuts]);

  const emitTriggered = useCallback(
    (
      shortcut: StudioShortcutDefinition,
      activeScope: StudioShortcutScope,
      keyboardEvent?: KeyboardEvent,
    ) => {
      const binding = keyboardEvent
        ? shortcut.bindings.find((candidate) => {
            const syntheticShortcuts = [
              {
                ...shortcut,
                bindings: [candidate],
              },
            ];

            return (
              findMatchingStudioShortcut(
                keyboardEvent,
                syntheticShortcuts,
                {
                  scope: activeScope,
                  state: refs.stateRef.current,
                  actions,
                },
                platform,
              ) !== null
            );
          })
        : shortcut.bindings[0];

      const detail: StudioHotkeyDebugEvent = {
        shortcutId: shortcut.id,
        label: shortcut.label,
        formattedBinding: binding
          ? formatStudioShortcut(binding, platform)
          : null,
        scope: activeScope,
        timestamp: Date.now(),
      };

      setLastTriggered(detail);
      optionsRef.current.onTriggered?.(detail);

      if (optionsRef.current.debug) {
        dispatchStudioEvent("beacon-studio:shortcut", detail);
      }
    },
    [actions, platform, refs.stateRef],
  );

  const triggerShortcut = useCallback(
    async (shortcutId: string): Promise<boolean> => {
      const shortcut = shortcuts.find(
        (candidate) => candidate.id === shortcutId,
      );

      if (!shortcut || !enabled) return false;

      const activeScope = optionsRef.current.scope;

      if (!matchesShortcutScope(shortcut, activeScope)) {
        return false;
      }

      if (shortcut.id === "studio.project.command-palette") {
        optionsRef.current.onCommandPalette?.();
        dispatchStudioEvent("beacon-studio:command-palette");
        emitTriggered(shortcut, activeScope);
        return true;
      }

      const executed = await executeStudioShortcut(shortcut, {
        scope: activeScope,
        state: refs.stateRef.current,
        actions,
        platform,
      });

      if (executed) {
        emitTriggered(shortcut, activeScope);
      }

      return executed;
    },
    [
      actions,
      emitTriggered,
      enabled,
      platform,
      refs.stateRef,
      shortcuts,
    ],
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentOptions = optionsRef.current;

      if (!currentOptions.enabled) return;
      if (event.defaultPrevented) return;
      if (isCompositionEventActive(event)) return;

      if (
        !currentOptions.allowWhenModalOpen &&
        hasOpenDialog()
      ) {
        const target = event.target as HTMLElement | null;
        const insideStudioModal = target?.closest(
          '[data-studio-modal="true"]',
        );

        if (!insideStudioModal) return;
      }

      const activeScope = resolveScopeFromTarget(
        event.target,
        currentOptions.scope,
      );

      const shortcut = findMatchingStudioShortcut(
        event,
        shortcuts,
        {
          scope: activeScope,
          state: refs.stateRef.current,
          actions,
        },
        platform,
      );

      if (!shortcut) return;

      const matchedBinding = shortcut.bindings.find(
        (binding) => {
          const candidate = {
            ...shortcut,
            bindings: [binding],
          };

          return (
            findMatchingStudioShortcut(
              event,
              [candidate],
              {
                scope: activeScope,
                state: refs.stateRef.current,
                actions,
              },
              platform,
            ) !== null
          );
        },
      );

      if (!matchedBinding) return;

      if (
        isEditableTarget(event.target) &&
        !matchedBinding.allowInInput
      ) {
        return;
      }

      if (event.repeat && !matchedBinding.allowRepeat) {
        return;
      }

      if (matchedBinding.preventDefault !== false) {
        event.preventDefault();
      }

      if (matchedBinding.stopPropagation) {
        event.stopPropagation();
      }

      if (shortcut.id === "studio.project.command-palette") {
        currentOptions.onCommandPalette?.();
        dispatchStudioEvent("beacon-studio:command-palette");
        emitTriggered(shortcut, activeScope, event);
        return;
      }

      void executeStudioShortcut(shortcut, {
        scope: activeScope,
        state: refs.stateRef.current,
        actions,
        event,
        platform,
      }).then((executed) => {
        if (executed) {
          emitTriggered(shortcut, activeScope, event);
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown, {
      capture,
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, {
        capture,
      });
    };
  }, [
    actions,
    capture,
    emitTriggered,
    enabled,
    platform,
    refs.stateRef,
    shortcuts,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleExternalTrigger = (
      event: Event,
    ) => {
      const customEvent = event as CustomEvent<{
        shortcutId?: string;
      }>;

      if (customEvent.detail?.shortcutId) {
        void triggerShortcut(customEvent.detail.shortcutId);
      }
    };

    window.addEventListener(
      "beacon-studio:trigger-shortcut",
      handleExternalTrigger,
    );

    return () => {
      window.removeEventListener(
        "beacon-studio:trigger-shortcut",
        handleExternalTrigger,
      );
    };
  }, [triggerShortcut]);

  return {
    enabled,
    platform,
    scope,
    shortcuts,
    conflicts,
    lastTriggered,
    setEnabled: setUncontrolledEnabled,
    setScope: setUncontrolledScope,
    triggerShortcut,
  };
}

export function StudioHotkeys({
  children,
  ...options
}: StudioHotkeysProps) {
  const value = useStudioHotkeys(options);

  return (
    <StudioHotkeysContext.Provider value={value}>
      {children}
      {options.debug ? (
        <StudioHotkeyDebugOverlay event={value.lastTriggered} />
      ) : null}
    </StudioHotkeysContext.Provider>
  );
}

export function useStudioHotkeysContext(): StudioHotkeysContextValue {
  const context = useContext(StudioHotkeysContext);

  if (!context) {
    throw new Error(
      "useStudioHotkeysContext must be used inside <StudioHotkeys>.",
    );
  }

  return context;
}

export function useOptionalStudioHotkeysContext():
  | StudioHotkeysContextValue
  | null {
  return useContext(StudioHotkeysContext);
}

export function StudioShortcutScope({
  scope,
  children,
  className = "",
  as: Component = "div",
}: {
  scope: StudioShortcutScope;
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "aside" | "main";
}) {
  return (
    <Component
      className={className}
      data-studio-shortcut-scope={scope}
    >
      {children}
    </Component>
  );
}

export function StudioHotkeyDebugOverlay({
  event,
}: {
  event: StudioHotkeyDebugEvent | null;
}) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!event) return;

    setVisible(true);

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setVisible(false);
    }, 1_500);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [event]);

  if (!event || !visible) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-10 left-1/2 z-[1000] -translate-x-1/2 rounded-xl border border-cyan-400/20 bg-slate-950/95 px-4 py-3 text-center shadow-2xl backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
        Studio shortcut
      </p>
      <p className="mt-1 text-sm font-semibold text-white">
        {event.label}
      </p>
      {event.formattedBinding ? (
        <kbd className="mt-2 inline-flex rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] text-cyan-100">
          {event.formattedBinding}
        </kbd>
      ) : null}
    </div>
  );
}

export function dispatchStudioShortcut(
  shortcutId: string,
): void {
  dispatchStudioEvent("beacon-studio:trigger-shortcut", {
    shortcutId,
  });
}

export function openStudioCommandPalette(): void {
  dispatchStudioEvent("beacon-studio:command-palette");
}