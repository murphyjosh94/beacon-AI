import type {
  StudioBridgeCommand,
  StudioBridgeEvent,
} from "../types";

type BridgeListener = (
  event: StudioBridgeEvent,
) => void;

export class IframeBridge {
  private iframe: HTMLIFrameElement | null;
  private listeners = new Set<BridgeListener>();
  private origin: string;

  constructor(
    iframe: HTMLIFrameElement | null,
    origin = window.location.origin,
  ) {
    this.iframe = iframe;
    this.origin = origin;
    window.addEventListener("message", this.handleMessage);
  }

  setIframe(iframe: HTMLIFrameElement | null) {
    this.iframe = iframe;
  }

  destroy() {
    window.removeEventListener("message", this.handleMessage);
    this.listeners.clear();
    this.iframe = null;
  }

  subscribe(listener: BridgeListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  send(command: StudioBridgeCommand) {
    const targetWindow = this.iframe?.contentWindow;

    if (!targetWindow) {
      return false;
    }

    targetWindow.postMessage(command, this.origin);
    return true;
  }

  ping() {
    return this.send({ type: "beacon-studio:ping" });
  }

  scrollToSelector(
    selector: string,
    behavior: ScrollBehavior = "smooth",
  ) {
    return this.send({
      type: "beacon-studio:scroll",
      selector,
      behavior,
    });
  }

  scrollToSection(
    sectionId: string,
    behavior: ScrollBehavior = "smooth",
  ) {
    return this.send({
      type: "beacon-studio:scroll",
      sectionId,
      behavior,
    });
  }

  scrollToTop(
    top: number,
    behavior: ScrollBehavior = "smooth",
  ) {
    return this.send({
      type: "beacon-studio:scroll",
      top,
      behavior,
    });
  }

  highlight(
    selector: string,
    enabled = true,
  ) {
    return this.send({
      type: "beacon-studio:highlight",
      selector,
      enabled,
    });
  }

  click(selector: string) {
    return this.send({
      type: "beacon-studio:click",
      selector,
    });
  }

  typeText(selector: string, text: string) {
    return this.send({
      type: "beacon-studio:type",
      selector,
      text,
    });
  }

  reset() {
    return this.send({
      type: "beacon-studio:reset",
    });
  }

  private handleMessage = (
    event: MessageEvent<StudioBridgeEvent>,
  ) => {
    if (event.origin !== this.origin) {
      return;
    }

    if (event.source !== this.iframe?.contentWindow) {
      return;
    }

    const payload = event.data;

    if (
      !payload ||
      typeof payload !== "object" ||
      typeof payload.type !== "string" ||
      !payload.type.startsWith("beacon-studio:")
    ) {
      return;
    }

    for (const listener of this.listeners) {
      listener(payload);
    }
  };
}