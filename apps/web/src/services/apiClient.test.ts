// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { readCookie } from "./apiClient";

beforeEach(() => {
  // Clear any cookies between tests.
  for (const c of document.cookie.split("; ")) {
    const name = c.split("=")[0];
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
});

describe("readCookie", () => {
  it("returns the value of an existing cookie", () => {
    document.cookie = "csrf=abc123; Path=/";
    expect(readCookie("csrf")).toBe("abc123");
  });

  it("returns null for a missing cookie", () => {
    expect(readCookie("nope")).toBeNull();
  });

  it("URL-decodes the value", () => {
    document.cookie = `token=${encodeURIComponent("a b/c+d")}; Path=/`;
    expect(readCookie("token")).toBe("a b/c+d");
  });

  it("does not match a cookie whose name is a prefix of another", () => {
    document.cookie = "csrf_other=zzz; Path=/";
    expect(readCookie("csrf")).toBeNull();
  });
});
