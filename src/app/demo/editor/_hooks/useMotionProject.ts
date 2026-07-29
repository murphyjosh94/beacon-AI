import { useCallback, useEffect, useRef, useState } from "react";

export type MotionAspectRatio = "16:9" | "9:16" | "1:1" | "4:5";

export type MotionScene = {
  id: string;
  title: string;
  startMs: number;
  durationMs: number;
  background?: string;
  assetId?: string | null;
  text?: string;
};

export type MotionProject = {
  id: string;
  name: string;
  description: string;
  aspectRatio: MotionAspectRatio;
  durationMs: number;
  scenes: MotionScene[];
  assetIds: string[];
  createdAt: string;
  updatedAt: string;
};

type ProjectStatus =
  | "idle"
  | "loading"
  | "creating"
  | "saving"
  | "saved"
  | "error";

type CreateProjectInput = Partial<
  Pick<
    MotionProject,
    | "name"
    | "description"
    | "aspectRatio"
    | "durationMs"
    | "scenes"
    | "assetIds"
  >
>;

type UseMotionProjectOptions = {
  projectId?: string | null;
  autosaveDelayMs?: number;
  createIfMissing?: boolean;
  initialProject?: CreateProjectInput;
};

type UseMotionProjectResult = {
  project: MotionProject | null;
  status: ProjectStatus;
  error: string | null;
  isDirty: boolean;
  loadProject: (id: string) => Promise<MotionProject | null>;
  createProject: (
    input?: CreateProjectInput,
  ) => Promise<MotionProject | null>;
  updateProject: (
    update:
      | Partial<MotionProject>
      | ((current: MotionProject) => MotionProject),
  ) => void;
  saveProject: () => Promise<MotionProject | null>;
  deleteProject: () => Promise<boolean>;
  clearError: () => void;
};

const DEFAULT_AUTOSAVE_DELAY_MS = 1500;

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
}

async function readJsonResponse<T>(
  response: Response,
): Promise<T> {
  const data = (await response.json().catch(() => null)) as
    | T
    | { error?: string }
    | null;

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return data as T;
}

export function useMotionProject({
  projectId = null,
  autosaveDelayMs = DEFAULT_AUTOSAVE_DELAY_MS,
  createIfMissing = false,
  initialProject = {},
}: UseMotionProjectOptions = {}): UseMotionProjectResult {
  const [project, setProject] =
    useState<MotionProject | null>(null);
  const [status, setStatus] =
    useState<ProjectStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const projectRef = useRef<MotionProject | null>(null);
  const saveTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedProjectIdRef = useRef<string | null>(null);
  const saveRequestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setStatus((current) =>
      current === "error" ? "idle" : current,
    );
  }, []);

  const loadProject = useCallback(
    async (id: string) => {
      if (!id.trim()) {
        setError("A project id is required.");
        setStatus("error");
        return null;
      }

      clearSaveTimer();
      saveRequestRef.current?.abort();

      setStatus("loading");
      setError(null);

      try {
        const response = await fetch(
          `/api/motion/projects/${encodeURIComponent(id)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data = await readJsonResponse<
          MotionProject | { project: MotionProject }
        >(response);

        const loadedProject =
          "project" in data ? data.project : data;

        projectRef.current = loadedProject;
        loadedProjectIdRef.current = loadedProject.id;

        setProject(loadedProject);
        setIsDirty(false);
        setStatus("saved");

        return loadedProject;
      } catch (caughtError) {
        const message = getErrorMessage(
          caughtError,
          "Unable to load the motion project.",
        );

        setError(message);
        setStatus("error");

        return null;
      }
    },
    [clearSaveTimer],
  );

  const createProject = useCallback(
    async (input: CreateProjectInput = {}) => {
      clearSaveTimer();

      setStatus("creating");
      setError(null);

      try {
        const response = await fetch(
          "/api/motion/projects",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...initialProject,
              ...input,
            }),
          },
        );

        const data = await readJsonResponse<{
          project: MotionProject;
        }>(response);

        projectRef.current = data.project;
        loadedProjectIdRef.current = data.project.id;

        setProject(data.project);
        setIsDirty(false);
        setStatus("saved");

        return data.project;
      } catch (caughtError) {
        const message = getErrorMessage(
          caughtError,
          "Unable to create the motion project.",
        );

        setError(message);
        setStatus("error");

        return null;
      }
    },
    [clearSaveTimer, initialProject],
  );

  const saveProject = useCallback(async () => {
    const currentProject = projectRef.current;

    if (!currentProject) {
      return null;
    }

    clearSaveTimer();
    saveRequestRef.current?.abort();

    const controller = new AbortController();
    saveRequestRef.current = controller;

    setStatus("saving");
    setError(null);

    try {
      const response = await fetch(
        `/api/motion/projects/${encodeURIComponent(
          currentProject.id,
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(currentProject),
          signal: controller.signal,
        },
      );

      const data = await readJsonResponse<{
        project: MotionProject;
      }>(response);

      if (controller.signal.aborted) {
        return null;
      }

      projectRef.current = data.project;
      setProject(data.project);
      setIsDirty(false);
      setStatus("saved");

      return data.project;
    } catch (caughtError) {
      if (
        caughtError instanceof DOMException &&
        caughtError.name === "AbortError"
      ) {
        return null;
      }

      const message = getErrorMessage(
        caughtError,
        "Unable to save the motion project.",
      );

      setError(message);
      setStatus("error");

      return null;
    } finally {
      if (saveRequestRef.current === controller) {
        saveRequestRef.current = null;
      }
    }
  }, [clearSaveTimer]);

  const updateProject = useCallback(
    (
      update:
        | Partial<MotionProject>
        | ((current: MotionProject) => MotionProject),
    ) => {
      setProject((current) => {
        if (!current) {
          return current;
        }

        const nextProject =
          typeof update === "function"
            ? update(current)
            : {
                ...current,
                ...update,
              };

        projectRef.current = nextProject;
        setIsDirty(true);
        setStatus("idle");

        return nextProject;
      });
    },
    [],
  );

  const deleteProject = useCallback(async () => {
    const currentProject = projectRef.current;

    if (!currentProject) {
      return false;
    }

    clearSaveTimer();
    saveRequestRef.current?.abort();

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch(
        `/api/motion/projects/${encodeURIComponent(
          currentProject.id,
        )}`,
        {
          method: "DELETE",
        },
      );

      await readJsonResponse<{ success: boolean }>(
        response,
      );

      projectRef.current = null;
      loadedProjectIdRef.current = null;

      setProject(null);
      setIsDirty(false);
      setStatus("idle");

      return true;
    } catch (caughtError) {
      const message = getErrorMessage(
        caughtError,
        "Unable to delete the motion project.",
      );

      setError(message);
      setStatus("error");

      return false;
    }
  }, [clearSaveTimer]);

  useEffect(() => {
    if (!isDirty || !project) {
      return;
    }

    clearSaveTimer();

    saveTimerRef.current = setTimeout(() => {
      void saveProject();
    }, Math.max(250, autosaveDelayMs));

    return clearSaveTimer;
  }, [
    autosaveDelayMs,
    clearSaveTimer,
    isDirty,
    project,
    saveProject,
  ]);

  useEffect(() => {
    if (!projectId) {
      if (
        createIfMissing &&
        !projectRef.current &&
        loadedProjectIdRef.current !== "__creating__"
      ) {
        loadedProjectIdRef.current = "__creating__";
        void createProject().finally(() => {
          if (
            loadedProjectIdRef.current === "__creating__"
          ) {
            loadedProjectIdRef.current = null;
          }
        });
      }

      return;
    }

    if (loadedProjectIdRef.current === projectId) {
      return;
    }

    loadedProjectIdRef.current = projectId;

    void loadProject(projectId);
  }, [
    createIfMissing,
    createProject,
    loadProject,
    projectId,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload,
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload,
      );
    };
  }, [isDirty]);

  useEffect(
    () => () => {
      clearSaveTimer();
      saveRequestRef.current?.abort();
    },
    [clearSaveTimer],
  );

  return {
    project,
    status,
    error,
    isDirty,
    loadProject,
    createProject,
    updateProject,
    saveProject,
    deleteProject,
    clearError,
  };
}