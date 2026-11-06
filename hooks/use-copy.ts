"use client";

import { useCallback, useState } from "react";

function copyWithSelection(value: string) {
  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";

  const selection = document.getSelection();
  const previousRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  document.body.removeChild(textarea);

  if (selection && previousRange) {
    selection.removeAllRanges();
    selection.addRange(previousRange);
  }

  return copied;
}

export function useCopy(resetAfter = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (value: string) => {
      let success = false;

      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        window.isSecureContext
      ) {
        try {
          await navigator.clipboard.writeText(value);
          success = true;
        } catch {
          success = false;
        }
      }

      if (!success) {
        success = copyWithSelection(value);
      }

      if (success) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), resetAfter);
      }

      return success;
    },
    [resetAfter],
  );

  return { copied, copy };
}
