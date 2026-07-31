"use client";

import type {
  StudioAspectRatio,
  StudioOutputCount,
  StudioQuality,
} from "@/app/studio/_components/StudioCreateTypes";

type StudioAdvancedSettingsProps = {
  audience: string;
  style: string;
  tone: string;
  colours: string;
  quality: StudioQuality;
  aspectRatio: StudioAspectRatio;
  outputCount: StudioOutputCount;
  durationSeconds: number;
  reference: string;
  notes: string;
  brandKit: string;
  projectTitle: string;
  saveToLibrary: boolean;
  isVideo: boolean;
  disabled?: boolean;
  onAudienceChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  onToneChange: (value: string) => void;
  onColoursChange: (value: string) => void;
  onQualityChange: (value: StudioQuality) => void;
  onAspectRatioChange: (value: StudioAspectRatio) => void;
  onOutputCountChange: (value: StudioOutputCount) => void;
  onDurationSecondsChange: (value: number) => void;
  onReferenceChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onBrandKitChange: (value: string) => void;
  onProjectTitleChange: (value: string) => void;
  onSaveToLibraryChange: (value: boolean) => void;
};

const inputClassName =
  "min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/30 focus:bg-white/[0.07] focus:ring-4 focus:ring-cyan-300/5 disabled:cursor-not-allowed disabled:opacity-50";

const labelClassName = "grid gap-2";

const labelTextClassName =
  "text-sm font-black text-slate-200";

export default function StudioAdvancedSettings({
  audience,
  style,
  tone,
  colours,
  quality,
  aspectRatio,
  outputCount,
  durationSeconds,
  reference,
  notes,
  brandKit,
  projectTitle,
  saveToLibrary,
  isVideo,
  disabled = false,
  onAudienceChange,
  onStyleChange,
  onToneChange,
  onColoursChange,
  onQualityChange,
  onAspectRatioChange,
  onOutputCountChange,
  onDurationSecondsChange,
  onReferenceChange,
  onNotesChange,
  onBrandKitChange,
  onProjectTitleChange,
  onSaveToLibraryChange,
}: StudioAdvancedSettingsProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_30px_100px_rgba(0,0,0,0.24)]">
      <div className="border-b border-white/10 px-5 py-5 sm:px-7">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
          Optional details
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
          Fine-tune the creative direction
        </h2>

        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-400">
          Beacon can choose sensible defaults, so only change the
          settings that matter to your result.
        </p>
      </div>

      <div className="grid gap-6 p-5 sm:p-7">
        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClassName}>
            <span className={labelTextClassName}>
              Target audience
            </span>

            <input
              value={audience}
              onChange={(event) =>
                onAudienceChange(event.target.value)
              }
              type="text"
              disabled={disabled}
              placeholder="Example: UK homeowners aged 30–60"
              className={inputClassName}
            />
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>
              Creative style
            </span>

            <select
              value={style}
              onChange={(event) =>
                onStyleChange(event.target.value)
              }
              disabled={disabled}
              className={inputClassName}
            >
              <option value="premium">
                Premium and polished
              </option>
              <option value="minimal">
                Minimal and modern
              </option>
              <option value="bold">
                Bold and energetic
              </option>
              <option value="corporate">
                Professional and corporate
              </option>
              <option value="editorial">Editorial</option>
              <option value="cinematic">Cinematic</option>
              <option value="friendly">
                Friendly and approachable
              </option>
            </select>
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClassName}>
            <span className={labelTextClassName}>Tone</span>

            <select
              value={tone}
              onChange={(event) =>
                onToneChange(event.target.value)
              }
              disabled={disabled}
              className={inputClassName}
            >
              <option value="confident">Confident</option>
              <option value="professional">
                Professional
              </option>
              <option value="friendly">Friendly</option>
              <option value="luxury">Luxury</option>
              <option value="playful">Playful</option>
              <option value="calm">Calm</option>
              <option value="technical">Technical</option>
            </select>
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>
              Preferred colours
            </span>

            <input
              value={colours}
              onChange={(event) =>
                onColoursChange(event.target.value)
              }
              type="text"
              disabled={disabled}
              placeholder="Example: navy blue, gold and white"
              className={inputClassName}
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <label className={labelClassName}>
            <span className={labelTextClassName}>
              Quality
            </span>

            <select
              value={quality}
              onChange={(event) =>
                onQualityChange(
                  event.target.value as StudioQuality,
                )
              }
              disabled={disabled}
              className={inputClassName}
            >
              <option value="draft">Draft</option>
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="maximum">Maximum</option>
            </select>
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>
              Aspect ratio
            </span>

            <select
              value={aspectRatio}
              onChange={(event) =>
                onAspectRatioChange(
                  event.target.value as StudioAspectRatio,
                )
              }
              disabled={disabled}
              className={inputClassName}
            >
              <option value="1:1">Square · 1:1</option>
              <option value="4:5">Portrait · 4:5</option>
              <option value="9:16">Vertical · 9:16</option>
              <option value="16:9">
                Landscape · 16:9
              </option>
            </select>
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>
              Number of outputs
            </span>

            <select
              value={outputCount}
              onChange={(event) =>
                onOutputCountChange(
                  Number(
                    event.target.value,
                  ) as StudioOutputCount,
                )
              }
              disabled={disabled}
              className={inputClassName}
            >
              <option value={1}>1 output</option>
              <option value={2}>2 outputs</option>
              <option value={4}>4 outputs</option>
            </select>
          </label>
        </div>

        {isVideo ? (
          <label className={labelClassName}>
            <span className={labelTextClassName}>
              Video duration
            </span>

            <select
              value={durationSeconds}
              onChange={(event) =>
                onDurationSecondsChange(
                  Number(event.target.value),
                )
              }
              disabled={disabled}
              className={inputClassName}
            >
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={120}>2 minutes</option>
              <option value={300}>5 minutes</option>
            </select>
          </label>
        ) : null}

        <label className={labelClassName}>
          <span className={labelTextClassName}>
            Reference link
          </span>

          <input
            value={reference}
            onChange={(event) =>
              onReferenceChange(event.target.value)
            }
            type="url"
            disabled={disabled}
            placeholder="Paste a website, product or visual reference URL"
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>
            Additional instructions
          </span>

          <textarea
            value={notes}
            onChange={(event) =>
              onNotesChange(event.target.value)
            }
            rows={5}
            disabled={disabled}
            placeholder="Tell Beacon what to avoid, preserve or prioritise..."
            className={`${inputClassName} resize-y leading-7`}
          />
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClassName}>
            <span className={labelTextClassName}>
              Saved brand kit
            </span>

            <select
              value={brandKit}
              onChange={(event) =>
                onBrandKitChange(event.target.value)
              }
              disabled={disabled}
              className={inputClassName}
            >
              <option value="none">
                Do not use a brand kit
              </option>
              <option value="beacon">
                Beacon Master Brand
              </option>
              <option value="beacon-business">
                Beacon Business
              </option>
              <option value="beacon-studio">
                Beacon Studio
              </option>
            </select>
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>
              Save to project
            </span>

            <select
              value={projectTitle}
              onChange={(event) =>
                onProjectTitleChange(event.target.value)
              }
              disabled={disabled}
              className={inputClassName}
            >
              <option value="Beacon AI">Beacon AI</option>
              <option value="Beacon Business">
                Beacon Business
              </option>
              <option value="Beacon Studio">
                Beacon Studio
              </option>
              <option value="New client project">
                New client project
              </option>
            </select>
          </label>
        </div>

        <label className="flex cursor-pointer items-start gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 transition hover:bg-white/[0.07]">
          <input
            type="checkbox"
            checked={saveToLibrary}
            onChange={(event) =>
              onSaveToLibraryChange(event.target.checked)
            }
            disabled={disabled}
            className="mt-1 h-5 w-5 rounded border-white/20 bg-slate-900 text-cyan-400 focus:ring-cyan-300 disabled:cursor-not-allowed"
          />

          <span>
            <span className="block font-black text-white">
              Save to Project Library
            </span>

            <span className="mt-1 block text-sm font-medium leading-6 text-slate-400">
              Keep the prompt, settings and generated assets
              available for later editing, duplication and export.
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}