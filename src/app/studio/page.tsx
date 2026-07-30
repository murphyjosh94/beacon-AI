"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Clock3,
  Clapperboard,
  FileImage,
  Film,
  FolderOpen,
  Home,
  Image as ImageIcon,
  Laugh,
  Loader2,
  Menu,
  MessageSquareText,
  Music2,
  Search,
  Sparkles,
  Trash2,
  Video,
  WandSparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type StudioProject = {
  id: string;
  name: string;
  description?: string;
  sourceUrl?: string;
  durationMs?: number;
  aspectRatio?: string;
  updatedAt?: string;
  createdAt?: string;
  thumbnailUrl?: string;
};

type StudioProjectsResponse =
  | StudioProject[]
  | {
      projects?: StudioProject[];
      data?: StudioProject[];
      project?: StudioProject;
      id?: string;
    };

type CreationType = {
  id: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  examples: string[];
};

type StudioNavigationItem = {
  label: string;
  href: string;
  icon: typeof Home;
};

const STUDIO_NAVIGATION: StudioNavigationItem[] = [
  {
    label: "Home",
    href: "/studio",
    icon: Home,
  },
  {
    label: "Studio dashboard",
    href: "/studio/dashboard",
    icon: Sparkles,
  },
  {
    label: "Memberships",
    href: "/studio/memberships",
    icon: Check,
  },
  {
    label: "Pricing",
    href: "/studio/pricing",
    icon: BriefcaseBusiness,
  },
];

const CREATION_TYPES: CreationType[] = [
  {
    id: "marketing",
    title: "Marketing",
    description:
      "Create branded adverts, promotions and campaigns for your business.",
    icon: BriefcaseBusiness,
    examples: ["Business advert", "Product promotion", "Website launch"],
  },
  {
    id: "short-video",
    title: "Short-form video",
    description:
      "Create vertical clips for Instagram, TikTok, YouTube and Facebook.",
    icon: Video,
    examples: ["Instagram Reel", "TikTok clip", "YouTube Short"],
  },
  {
    id: "long-video",
    title: "Long-form AI video",
    description:
      "Turn a script or idea into a longer narrated or animated production.",
    icon: Clapperboard,
    examples: ["Explainer", "Nursery rhyme", "YouTube video"],
  },
  {
    id: "images",
    title: "Images and graphics",
    description:
      "Generate social graphics, posters, thumbnails, banners and artwork.",
    icon: ImageIcon,
    examples: ["Social post", "Poster", "Thumbnail"],
  },
  {
    id: "writing",
    title: "Social posts and copy",
    description:
      "Write captions, adverts, campaigns, blogs and product descriptions.",
    icon: MessageSquareText,
    examples: ["Facebook post", "Caption", "Campaign copy"],
  },
  {
    id: "memes",
    title: "Memes and entertainment",
    description:
      "Create shareable memes, comic ideas, greetings and entertaining content.",
    icon: Laugh,
    examples: ["General meme", "Comic post", "Greeting"],
  },
  {
    id: "audio",
    title: "Voice and audio",
    description:
      "Generate voice-overs, podcast intros, narration and audio adverts.",
    icon: Music2,
    examples: ["Voice-over", "Radio advert", "Narration"],
  },
  {
    id: "custom",
    title: "Create from any idea",
    description:
      "Start with a blank request and let Beacon choose the best production path.",
    icon: WandSparkles,
    examples: ["Custom scene", "Mixed media", "Original concept"],
  },
];

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function normaliseProjects(payload: StudioProjectsResponse): StudioProject[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.projects)) {
    return payload.projects;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload.project) {
    return [payload.project];
  }

  return [];
}

function formatProjectDate(project: StudioProject): string {
  const rawDate = project.updatedAt ?? project.createdAt;

  if (!rawDate) {
    return "Recently created";
  }

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return `Updated ${DATE_FORMATTER.format(date)}`;
}

function formatDuration(durationMs?: number): string {
  if (!durationMs || durationMs <= 0) {
    return "Project";
  }

  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return seconds === 0 ? `${minutes} min` : `${minutes}m ${seconds}s`;
}

function isNavigationItemActive(pathname: string, href: string): boolean {
  if (href === "/studio") {
    return pathname === "/studio";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function StudioLogo() {
  return (
    <Link
      aria-label="Beacon Studio home"
      className="group inline-flex min-w-0 items-center gap-3"
      href="/studio"
    >
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/30 bg-gradient-to-br from-[#173b8f] via-[#0a1f55] to-[#061024] shadow-[0_12px_35px_rgba(37,99,235,0.32)]">
        <span className="absolute inset-1 rounded-xl border border-white/10" />
        <Sparkles className="relative h-5 w-5 text-amber-200 transition group-hover:scale-110" />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-base font-black tracking-[0.08em] text-white sm:text-lg">
          BEACON STUDIO
        </span>
        <span className="block truncate text-[0.65rem] font-bold uppercase tracking-[0.16em] text-cyan-200/80 sm:text-xs">
          Create. Refine. Bring ideas to life.
        </span>
      </span>
    </Link>
  );
}

function StudioNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050b18]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] w-full max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <StudioLogo />

        <nav
          aria-label="Beacon Studio navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {STUDIO_NAVIGATION.map((item) => {
            const Icon = item.icon;
            const active = isNavigationItemActive(pathname, item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-black transition ${
                  active
                    ? "border border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
                    : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                }`}
                href={item.href}
                key={item.href}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-cyan-300/25 hover:bg-cyan-300/10 lg:hidden"
          onClick={() => setMobileMenuOpen((open) => !open)}
          type="button"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileMenuOpen ? (
        <nav
          aria-label="Beacon Studio mobile navigation"
          className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-6 lg:hidden"
        >
          <div className="mx-auto grid w-full max-w-[1500px] gap-2">
            {STUDIO_NAVIGATION.map((item) => {
              const Icon = item.icon;
              const active = isNavigationItemActive(pathname, item.href);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-12 items-center gap-3 rounded-2xl border px-4 text-sm font-black transition ${
                    active
                      ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
                      : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function StudioFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-[#030712]">
      <div className="mx-auto grid w-full max-w-[1500px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_1fr] lg:px-8">
        <div>
          <StudioLogo />
          <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-slate-500">
            Beacon Studio turns ideas, scripts and business briefs into polished
            marketing content, social posts, graphics, voice, video and reusable
            creative assets.
          </p>
        </div>

        <div className="md:justify-self-end">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Studio navigation
          </p>

          <nav
            aria-label="Beacon Studio footer navigation"
            className="mt-4 flex flex-wrap gap-x-5 gap-y-3"
          >
            {STUDIO_NAVIGATION.map((item) => (
              <Link
                className="text-sm font-bold text-slate-400 transition hover:text-cyan-200"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-2 px-4 py-5 text-xs font-semibold text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>© {new Date().getFullYear()} Beacon Studio.</span>
          <span>Built by Beacon AI. Designed to make creation clearer.</span>
        </div>
      </div>
    </footer>
  );
}

export default function StudioDashboardPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [idea, setIdea] = useState("");
  const [selectedType, setSelectedType] = useState("marketing");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/motion/projects", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load your Studio projects.");
      }

      const payload = (await response.json()) as StudioProjectsResponse;
      setProjects(normaliseProjects(payload));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load your Studio projects.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      const searchable = [
        project.name,
        project.description,
        project.sourceUrl,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [projects, searchQuery]);

  const activeCreationType =
    CREATION_TYPES.find((item) => item.id === selectedType) ??
    CREATION_TYPES[0];

  function beginCreation(typeId = selectedType) {
    const params = new URLSearchParams();
    params.set("type", typeId);

    const trimmedIdea = idea.trim();

    if (trimmedIdea) {
      params.set("prompt", trimmedIdea);
    }

    router.push(`/studio/create?${params.toString()}`);
  }

  const deleteProject = async (projectId: string) => {
    if (deletingId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this Studio project? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(projectId);
    setError(null);

    try {
      const response = await fetch(
        `/api/motion/projects/${encodeURIComponent(projectId)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Could not delete the project.");
      }

      setProjects((current) =>
        current.filter((project) => project.id !== projectId),
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the project.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050b18] text-white">
      <StudioNavbar />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-[-10rem] top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-blue-600/15 blur-[120px]" />
          <div className="absolute right-[-8rem] top-[12rem] h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-[120px]" />
          <div className="absolute bottom-[-12rem] left-[35%] h-[26rem] w-[26rem] rounded-full bg-amber-400/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-blue-700/30 via-slate-950/95 to-cyan-500/10 p-6 shadow-[0_35px_100px_rgba(0,0,0,0.35)] sm:p-8 lg:p-10">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100">
                <Sparkles className="h-4 w-4" />
                Beacon Studio
              </div>

              <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                What would you like to create?
              </h1>

              <p className="mx-auto mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-300 sm:text-base">
                Turn an idea, script or business brief into marketing content,
                social media posts, images, short clips or complete AI-generated
                videos.
              </p>

              <div className="mx-auto mt-8 max-w-3xl rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-3 shadow-2xl">
                <textarea
                  className="min-h-32 w-full resize-none bg-transparent px-3 py-3 text-base font-semibold leading-7 text-white outline-none placeholder:text-slate-600 sm:text-lg"
                  onChange={(event) => setIdea(event.target.value)}
                  placeholder="Example: Create a 30-second Instagram Reel promoting my plumbing business, using a professional British voice-over and a clear call to action."
                  value={idea}
                />

                <div className="flex flex-col gap-3 border-t border-white/10 px-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-left text-xs font-bold text-slate-500">
                    <activeCreationType.icon className="h-4 w-4 text-cyan-200" />
                    <span>{activeCreationType.title}</span>
                  </div>

                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 px-6 text-sm font-black text-white shadow-[0_15px_45px_rgba(37,99,235,0.28)] transition hover:scale-[1.02]"
                    onClick={() => beginCreation()}
                    type="button"
                  >
                    Continue to creator
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="mt-4 text-xs font-semibold text-slate-500">
                Your live cost calculator will confirm credits and estimated AI
                cost before anything is rendered.
              </p>
            </div>
          </section>

          <section className="py-8">
            <div>
              <h2 className="text-2xl font-black">Choose a creation type</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Pick a starting point. Beacon can combine formats when your idea
                needs more than one type of content.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {CREATION_TYPES.map((item) => {
                const Icon = item.icon;
                const active = selectedType === item.id;

                return (
                  <button
                    aria-pressed={active}
                    className={`group rounded-[1.75rem] border p-5 text-left transition hover:-translate-y-0.5 ${
                      active
                        ? "border-cyan-300/35 bg-cyan-300/10 shadow-[0_20px_55px_rgba(34,211,238,0.08)]"
                        : "border-white/10 bg-white/[0.035] hover:border-cyan-300/20 hover:bg-white/[0.055]"
                    }`}
                    key={item.id}
                    onClick={() => setSelectedType(item.id)}
                    onDoubleClick={() => beginCreation(item.id)}
                    type="button"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                        active
                          ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100"
                          : "border-white/10 bg-white/5 text-slate-300"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="mt-5 text-lg font-black">{item.title}</h3>

                    <p className="mt-2 min-h-16 text-sm font-medium leading-6 text-slate-500">
                      {item.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.examples.map((example) => (
                        <span
                          className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-[0.65rem] font-bold text-slate-400"
                          key={example}
                        >
                          {example}
                        </span>
                      ))}
                    </div>

                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-200">
                      Select
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {error ? (
            <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100">
              <span>{error}</span>
              <button
                className="shrink-0 text-xs font-black uppercase tracking-wider text-red-200 hover:text-white"
                onClick={() => setError(null)}
                type="button"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.25)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-cyan-200" />
                  <h2 className="text-xl font-black">Your projects</h2>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Continue a draft, review a render or reuse an earlier project.
                </p>
              </div>

              <label className="flex h-11 w-full items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 sm:max-w-sm">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search projects"
                  type="search"
                  value={searchQuery}
                />
              </label>
            </div>

            <div className="mt-6">
              {isLoading ? (
                <div className="flex min-h-56 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-cyan-300" />
                    <p className="mt-3 text-sm font-bold text-slate-400">
                      Loading Studio projects
                    </p>
                  </div>
                </div>
              ) : filteredProjects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProjects.map((project) => (
                    <article
                      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055]"
                      key={project.id}
                    >
                      <button
                        className="block w-full text-left"
                        onClick={() =>
                          router.push(
                            `/studio/editor/${encodeURIComponent(project.id)}`,
                          )
                        }
                        type="button"
                      >
                        <div className="relative flex aspect-video items-center justify-center overflow-hidden border-b border-white/10 bg-gradient-to-br from-blue-700/30 via-slate-900 to-cyan-500/10">
                          {project.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt=""
                              className="h-full w-full object-cover"
                              src={project.thumbnailUrl}
                            />
                          ) : (
                            <>
                              <div className="absolute inset-5 rounded-2xl border border-white/10 bg-slate-950/70 shadow-2xl" />
                              <Film className="relative h-9 w-9 text-cyan-200" />
                            </>
                          )}

                          <span className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-slate-950/80 px-2.5 py-1 text-[0.65rem] font-black text-slate-200 backdrop-blur">
                            {formatDuration(project.durationMs)}
                          </span>
                        </div>

                        <div className="p-5">
                          <h3 className="truncate text-base font-black text-white">
                            {project.name || "Untitled project"}
                          </h3>

                          <p className="mt-2 line-clamp-2 min-h-10 text-xs font-semibold leading-5 text-slate-500">
                            {project.description ||
                              "Beacon Studio creation project"}
                          </p>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatProjectDate(project)}
                            </span>

                            <span className="inline-flex items-center gap-1 text-xs font-black text-cyan-200">
                              Open
                              <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>
                      </button>

                      <div className="border-t border-white/10 px-5 py-3">
                        <button
                          className="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-red-200 disabled:opacity-50"
                          disabled={deletingId === project.id}
                          onClick={() => void deleteProject(project.id)}
                          type="button"
                        >
                          {deletingId === project.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete project
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                    <FileImage className="h-6 w-6 text-cyan-200" />
                  </div>

                  <h3 className="mt-4 text-lg font-black">
                    {searchQuery
                      ? "No matching projects"
                      : "Create your first Studio project"}
                  </h3>

                  <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                    {searchQuery
                      ? "Try another search term or clear the search."
                      : "Describe what you want to create and Beacon will guide you through format, quality, credits and rendering."}
                  </p>

                  {!searchQuery ? (
                    <button
                      className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-500"
                      onClick={() => beginCreation()}
                      type="button"
                    >
                      <Sparkles className="h-4 w-4" />
                      Start creating
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </section>

          <section className="py-8">
            <div className="grid gap-4 md:grid-cols-3">
              <button
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 text-left transition hover:border-cyan-300/25 hover:bg-white/[0.055]"
                onClick={() => router.push("/studio/projects")}
                type="button"
              >
                <FolderOpen className="h-5 w-5 text-cyan-200" />
                <h3 className="mt-4 font-black">All projects</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  View every draft, completed render and previous creation.
                </p>
              </button>

              <button
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 text-left transition hover:border-cyan-300/25 hover:bg-white/[0.055]"
                onClick={() => router.push("/studio/assets")}
                type="button"
              >
                <FileImage className="h-5 w-5 text-cyan-200" />
                <h3 className="mt-4 font-black">Asset library</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Manage reusable logos, images, clips, audio and brand files.
                </p>
              </button>

              <button
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 text-left transition hover:border-cyan-300/25 hover:bg-white/[0.055]"
                onClick={() => router.push("/studio/pricing")}
                type="button"
              >
                <Sparkles className="h-5 w-5 text-cyan-200" />
                <h3 className="mt-4 font-black">Credits and pricing</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Review your plan, available credits and Studio usage details.
                </p>
              </button>
            </div>
          </section>
        </div>
      </main>

      <StudioFooter />
    </div>
  );
}