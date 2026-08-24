import { describe, expect, test } from "bun:test";
import { audioHlsBufferConfig, shouldFallbackFromHlsJs, shouldFallbackFromNativeHls } from "./audioMediaSourcePolicy";

describe("audio media source fallback policy", () => {
  test("keeps recordings buffered for four minutes without delaying live audio", () => {
    expect(audioHlsBufferConfig(false)).toEqual({
      backBufferLength: 30,
      lowLatencyMode: false,
      maxBufferLength: 240,
      maxBufferSize: 8 * 1024 * 1024,
      maxMaxBufferLength: 240,
    });
    expect(audioHlsBufferConfig(true)).toEqual({
      backBufferLength: 30,
      lowLatencyMode: true,
      maxBufferLength: 30,
      maxBufferSize: 8 * 1024 * 1024,
      maxMaxBufferLength: 60,
    });
  });

  test("uses the progressive source only for a missing VOD HLS manifest", () => {
    expect(shouldFallbackFromHlsJs({ hasProgressiveSource: true, live: false, sourceReady: false, status: 404 })).toBe(true);
    expect(shouldFallbackFromHlsJs({ hasProgressiveSource: true, live: false, sourceReady: false, status: 502 })).toBe(false);
    expect(shouldFallbackFromHlsJs({ hasProgressiveSource: true, live: false, sourceReady: true, status: 404 })).toBe(false);
    expect(shouldFallbackFromHlsJs({ hasProgressiveSource: true, live: true, sourceReady: false, status: 404 })).toBe(false);
  });

  test("allows native HLS fallback only before VOD metadata is available", () => {
    expect(shouldFallbackFromNativeHls({ hasProgressiveSource: true, live: false, sourceReady: false })).toBe(true);
    expect(shouldFallbackFromNativeHls({ hasProgressiveSource: true, live: false, sourceReady: true })).toBe(false);
    expect(shouldFallbackFromNativeHls({ hasProgressiveSource: true, live: true, sourceReady: false })).toBe(false);
  });
});
