/**
 * The reload must fire once and never twice. A loop here refreshes a student's
 * screen forever, which is worse than the error it is recovering from.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { installStaleChunkRecovery, __test__ } from "./staleChunk";

const { isStaleChunkError, FLAG } = __test__;

describe("isStaleChunkError", () => {
  it("matches what browsers throw for a chunk that is gone", () => {
    for (const msg of [
      "TypeError: Failed to fetch dynamically imported module: https://x/assets/PricingPage-abc.js",
      "TypeError: error loading dynamically imported module",
      "TypeError: Importing a module script failed.",
      'TypeError: Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html". Strict MIME type checking is enforced for module scripts per HTML spec.',
    ]) {
      expect(isStaleChunkError(new Error(msg.replace(/^\w*Error: /, "")))).toBe(true);
    }
  });

  it("ignores ordinary application errors", () => {
    expect(isStaleChunkError(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isStaleChunkError(new Error("NetworkError when attempting to fetch resource"))).toBe(false);
    expect(isStaleChunkError(undefined)).toBe(false);
  });
});

describe("reload guard", () => {
  let replace: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage.clear();
    replace = vi.fn();
    Object.defineProperty(window, "location", {
      value: { href: "https://www.passai.study/pricing", replace },
      writable: true,
    });
    installStaleChunkRecovery();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function failChunk() {
    const event = new Event("unhandledrejection") as Event & { reason?: unknown };
    event.reason = new Error(
      "Failed to fetch dynamically imported module: /assets/PricingPage-abc.js",
    );
    window.dispatchEvent(event);
  }

  it("reloads once", () => {
    failChunk();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(FLAG)).toBe("1");
  });

  it("does not reload a second time in the same tab", () => {
    failChunk();
    failChunk();
    failChunk();
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("does not reload for an unrelated error", () => {
    const event = new Event("unhandledrejection") as Event & { reason?: unknown };
    event.reason = new Error("Cannot read properties of undefined");
    window.dispatchEvent(event);
    expect(replace).not.toHaveBeenCalled();
  });
});
