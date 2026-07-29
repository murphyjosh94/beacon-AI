"use client";

import { useEffect } from "react";

import type {
  StudioBridgeCommand,
  StudioBridgeEvent,
} from "../types";

const HIGHLIGHT_ATTRIBUTE =
  "data-beacon-studio-highlighted";
const ORIGINAL_STYLE_ATTRIBUTE =
  "data-beacon-studio-original-style";
const ORIGINAL_VALUE_ATTRIBUTE =
  "data-beacon-studio-original-value";

function postBridgeEvent(
  target: Window,
  origin: string,
  event: StudioBridgeEvent,
) {
  target.postMessage(event, origin);
}

function findElement(
  selector?: string,
  sectionId?: string,
): HTMLElement | null {
  if (selector) {
    try {
      const element =
        document.querySelector<HTMLElement>(
          selector,
        );

      if (element) {
        return element;
      }
    } catch {
      return null;
    }
  }

  if (sectionId) {
    return document.getElementById(sectionId);
  }

  return null;
}

function storeOriginalStyle(
  element: HTMLElement,
) {
  if (
    element.hasAttribute(
      ORIGINAL_STYLE_ATTRIBUTE,
    )
  ) {
    return;
  }

  element.setAttribute(
    ORIGINAL_STYLE_ATTRIBUTE,
    element.getAttribute("style") ?? "",
  );
}

function restoreOriginalStyle(
  element: HTMLElement,
) {
  if (
    !element.hasAttribute(
      ORIGINAL_STYLE_ATTRIBUTE,
    )
  ) {
    return;
  }

  const originalStyle =
    element.getAttribute(
      ORIGINAL_STYLE_ATTRIBUTE,
    ) ?? "";

  if (originalStyle) {
    element.setAttribute(
      "style",
      originalStyle,
    );
  } else {
    element.removeAttribute("style");
  }

  element.removeAttribute(
    ORIGINAL_STYLE_ATTRIBUTE,
  );
  element.removeAttribute(
    HIGHLIGHT_ATTRIBUTE,
  );
}

function highlightElement(
  element: HTMLElement,
) {
  storeOriginalStyle(element);

  element.setAttribute(
    HIGHLIGHT_ATTRIBUTE,
    "true",
  );

  element.style.position =
    getComputedStyle(element).position ===
    "static"
      ? "relative"
      : element.style.position;
  element.style.zIndex = "2147483000";
  element.style.outline =
    "3px solid rgba(103, 232, 249, 0.95)";
  element.style.outlineOffset = "5px";
  element.style.borderRadius =
    element.style.borderRadius || "12px";
  element.style.boxShadow =
    "0 0 0 8px rgba(34, 211, 238, 0.14), 0 0 40px rgba(34, 211, 238, 0.45)";
  element.style.transition =
    "outline 180ms ease, box-shadow 180ms ease, transform 180ms ease";
}

function removeHighlight(
  element: HTMLElement,
) {
  restoreOriginalStyle(element);
}

function clearHighlights() {
  const highlighted =
    document.querySelectorAll<HTMLElement>(
      `[${HIGHLIGHT_ATTRIBUTE}="true"]`,
    );

  highlighted.forEach((element) => {
    restoreOriginalStyle(element);
  });
}

function saveOriginalValue(
  element:
    | HTMLInputElement
    | HTMLTextAreaElement,
) {
  if (
    element.hasAttribute(
      ORIGINAL_VALUE_ATTRIBUTE,
    )
  ) {
    return;
  }

  element.setAttribute(
    ORIGINAL_VALUE_ATTRIBUTE,
    element.value,
  );
}

function setNativeValue(
  element:
    | HTMLInputElement
    | HTMLTextAreaElement,
  value: string,
) {
  saveOriginalValue(element);

  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;

  const descriptor =
    Object.getOwnPropertyDescriptor(
      prototype,
      "value",
    );

  descriptor?.set?.call(element, value);

  element.dispatchEvent(
    new Event("input", {
      bubbles: true,
    }),
  );

  element.dispatchEvent(
    new Event("change", {
      bubbles: true,
    }),
  );
}

function typeIntoElement(
  element: HTMLElement,
  text: string,
) {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    element.focus();
    setNativeValue(element, text);
    return;
  }

  if (element.isContentEditable) {
    storeOriginalStyle(element);

    if (
      !element.hasAttribute(
        ORIGINAL_VALUE_ATTRIBUTE,
      )
    ) {
      element.setAttribute(
        ORIGINAL_VALUE_ATTRIBUTE,
        element.textContent ?? "",
      );
    }

    element.focus();
    element.textContent = text;

    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: text,
      }),
    );
  }
}

function resetTypedValues() {
  const inputs =
    document.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >(
      `input[${ORIGINAL_VALUE_ATTRIBUTE}], textarea[${ORIGINAL_VALUE_ATTRIBUTE}]`,
    );

  inputs.forEach((element) => {
    const originalValue =
      element.getAttribute(
        ORIGINAL_VALUE_ATTRIBUTE,
      ) ?? "";

    setNativeValue(
      element,
      originalValue,
    );

    element.removeAttribute(
      ORIGINAL_VALUE_ATTRIBUTE,
    );
  });

  const editableElements =
    document.querySelectorAll<HTMLElement>(
      `[contenteditable="true"][${ORIGINAL_VALUE_ATTRIBUTE}]`,
    );

  editableElements.forEach((element) => {
    element.textContent =
      element.getAttribute(
        ORIGINAL_VALUE_ATTRIBUTE,
      ) ?? "";

    element.removeAttribute(
      ORIGINAL_VALUE_ATTRIBUTE,
    );

    element.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );
  });
}

function clickElement(
  element: HTMLElement,
) {
  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  });

  element.focus({
    preventScroll: true,
  });

  element.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );

  element.dispatchEvent(
    new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );

  element.click();
}

function resetPage() {
  clearHighlights();
  resetTypedValues();

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto",
  });

  const activeElement =
    document.activeElement;

  if (
    activeElement instanceof HTMLElement
  ) {
    activeElement.blur();
  }
}

function executeCommand(
  command: StudioBridgeCommand,
): string | null {
  if (
    command.type ===
    "beacon-studio:ping"
  ) {
    return null;
  }

  if (
    command.type ===
    "beacon-studio:reset"
  ) {
    resetPage();
    return null;
  }

  if (
    command.type ===
    "beacon-studio:scroll"
  ) {
    const element = findElement(
      command.selector,
      command.sectionId,
    );

    if (element) {
      element.scrollIntoView({
        behavior:
          command.behavior ?? "smooth",
        block: "center",
        inline: "nearest",
      });
      return null;
    }

    if (
      typeof command.top === "number"
    ) {
      window.scrollTo({
        top: command.top,
        left: 0,
        behavior:
          command.behavior ?? "smooth",
      });
      return null;
    }

    return "The requested scroll target could not be found.";
  }

  if (
    command.type ===
    "beacon-studio:highlight"
  ) {
    const element = findElement(
      command.selector,
    );

    if (!element) {
      return `Highlight target not found: ${command.selector}`;
    }

    if (command.enabled) {
      highlightElement(element);
    } else {
      removeHighlight(element);
    }

    return null;
  }

  if (
    command.type ===
    "beacon-studio:click"
  ) {
    const element = findElement(
      command.selector,
    );

    if (!element) {
      return `Click target not found: ${command.selector}`;
    }

    clickElement(element);
    return null;
  }

  if (
    command.type ===
    "beacon-studio:type"
  ) {
    const element = findElement(
      command.selector,
    );

    if (!element) {
      return `Typing target not found: ${command.selector}`;
    }

    if (
      !(
        element instanceof
          HTMLInputElement ||
        element instanceof
          HTMLTextAreaElement ||
        element.isContentEditable
      )
    ) {
      return `Typing target is not editable: ${command.selector}`;
    }

    typeIntoElement(
      element,
      command.text,
    );
    return null;
  }

  return "Unsupported Beacon Studio command.";
}

export default function MotionBridge() {
  useEffect(() => {
    const parentWindow =
      window.parent !== window
        ? window.parent
        : null;

    if (!parentWindow) {
      return;
    }

    const allowedOrigin =
      window.location.origin;

    const handleMessage = (
      event: MessageEvent<StudioBridgeCommand>,
    ) => {
      if (
        event.origin !== allowedOrigin ||
        event.source !== parentWindow
      ) {
        return;
      }

      const command = event.data;

      if (
        !command ||
        typeof command !== "object" ||
        typeof command.type !== "string" ||
        !command.type.startsWith(
          "beacon-studio:",
        )
      ) {
        return;
      }

      if (
        command.type ===
        "beacon-studio:ping"
      ) {
        postBridgeEvent(
          parentWindow,
          allowedOrigin,
          {
            type: "beacon-studio:pong",
            href: window.location.href,
          },
        );
        return;
      }

      try {
        const error =
          executeCommand(command);

        if (error) {
          postBridgeEvent(
            parentWindow,
            allowedOrigin,
            {
              type: "beacon-studio:error",
              message: error,
            },
          );
        }
      } catch (error) {
        postBridgeEvent(
          parentWindow,
          allowedOrigin,
          {
            type: "beacon-studio:error",
            message:
              error instanceof Error
                ? error.message
                : "The page could not execute a Studio command.",
          },
        );
      }
    };

    window.addEventListener(
      "message",
      handleMessage,
    );

    postBridgeEvent(
      parentWindow,
      allowedOrigin,
      {
        type: "beacon-studio:ready",
        href: window.location.href,
      },
    );

    return () => {
      window.removeEventListener(
        "message",
        handleMessage,
      );
      clearHighlights();
    };
  }, []);

  return null;
}