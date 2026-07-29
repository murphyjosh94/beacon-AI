"use client";

import {
  duplicateKeyframes,
  getAllKeyframes,
  Keyframe,
  KeyframeTrack,
} from "./KeyframeUtils";

export type MarqueeSelection = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

export type KeyframeScreenPosition = {
  id: string;
  x: number;
  y: number;
};

export class KeyframeSelectionController {
  private selectedIds = new Set<string>();
  private clipboard: Keyframe[] = [];
  private anchorId: string | null = null;

  constructor(initialSelection?: Iterable<string>) {
    if (initialSelection) {
      this.selectedIds = new Set(initialSelection);
    }
  }

  getSelection(): Set<string> {
    return new Set(this.selectedIds);
  }

  setSelection(ids: Iterable<string>): Set<string> {
    this.selectedIds = new Set(ids);
    return this.getSelection();
  }

  clear(): Set<string> {
    this.selectedIds.clear();
    this.anchorId = null;
    return this.getSelection();
  }

  has(id: string): boolean {
    return this.selectedIds.has(id);
  }

  selectOnly(id: string): Set<string> {
    this.selectedIds = new Set([id]);
    this.anchorId = id;
    return this.getSelection();
  }

  toggle(id: string): Set<string> {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }

    this.anchorId = id;
    return this.getSelection();
  }

  add(id: string): Set<string> {
    this.selectedIds.add(id);
    this.anchorId = id;
    return this.getSelection();
  }

  selectRange(track: KeyframeTrack, targetId: string): Set<string> {
    const sorted = [...track.keyframes].sort((a, b) => a.timeMs - b.timeMs);
    const anchorIndex = this.anchorId
      ? sorted.findIndex((item) => item.id === this.anchorId)
      : -1;
    const targetIndex = sorted.findIndex((item) => item.id === targetId);

    if (targetIndex < 0) return this.getSelection();

    if (anchorIndex < 0) {
      return this.selectOnly(targetId);
    }

    const start = Math.min(anchorIndex, targetIndex);
    const end = Math.max(anchorIndex, targetIndex);

    for (let index = start; index <= end; index += 1) {
      this.selectedIds.add(sorted[index].id);
    }

    return this.getSelection();
  }

  selectMarquee(
    marquee: MarqueeSelection,
    positions: KeyframeScreenPosition[],
    additive = false,
  ): Set<string> {
    if (!additive) {
      this.selectedIds.clear();
    }

    const left = Math.min(marquee.startX, marquee.currentX);
    const right = Math.max(marquee.startX, marquee.currentX);
    const top = Math.min(marquee.startY, marquee.currentY);
    const bottom = Math.max(marquee.startY, marquee.currentY);

    for (const position of positions) {
      if (
        position.x >= left &&
        position.x <= right &&
        position.y >= top &&
        position.y <= bottom
      ) {
        this.selectedIds.add(position.id);
      }
    }

    return this.getSelection();
  }

  getSelectedKeyframes(tracks: KeyframeTrack[]): Keyframe[] {
    return getAllKeyframes(tracks).filter((item) =>
      this.selectedIds.has(item.id),
    );
  }

  copy(tracks: KeyframeTrack[]): Keyframe[] {
    this.clipboard = this.getSelectedKeyframes(tracks).map((keyframe) => ({
      ...keyframe,
      bezier: keyframe.bezier ? [...keyframe.bezier] as [number, number, number, number] : undefined,
    }));

    return [...this.clipboard];
  }

  cut(tracks: KeyframeTrack[]): {
    copied: Keyframe[];
    ids: string[];
  } {
    const copied = this.copy(tracks);
    return {
      copied,
      ids: copied.map((item) => item.id),
    };
  }

  paste(offsetMs: number, durationMs: number): Keyframe[] {
    const pasted = duplicateKeyframes(this.clipboard, offsetMs, durationMs);
    this.selectedIds = new Set(pasted.map((item) => item.id));
    return pasted;
  }

  duplicate(
    tracks: KeyframeTrack[],
    offsetMs: number,
    durationMs: number,
  ): Keyframe[] {
    const duplicated = duplicateKeyframes(
      this.getSelectedKeyframes(tracks),
      offsetMs,
      durationMs,
    );

    this.selectedIds = new Set(duplicated.map((item) => item.id));
    return duplicated;
  }

  selectAll(tracks: KeyframeTrack[]): Set<string> {
    this.selectedIds = new Set(
      getAllKeyframes(tracks).map((item) => item.id),
    );
    return this.getSelection();
  }

  getClipboard(): Keyframe[] {
    return [...this.clipboard];
  }
}