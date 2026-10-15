import assert from "node:assert/strict";
import test from "node:test";
import { requestElementFullscreen } from "./fullscreen.mjs";

test("returns false when the browser does not expose an element fullscreen API", async () => {
  const element = {};

  assert.equal(await requestElementFullscreen(element), false);
});

test("requests native fullscreen with the element as its receiver", async () => {
  const element = {
    wasCalled: false,
    requestFullscreen() {
      this.wasCalled = true;
      return Promise.resolve();
    },
  };

  assert.equal(await requestElementFullscreen(element), true);
  assert.equal(element.wasCalled, true);
});

test("returns false when the browser rejects native fullscreen", async () => {
  const element = { requestFullscreen: () => Promise.reject(new Error("unsupported")) };

  assert.equal(await requestElementFullscreen(element), false);
});

test("supports the prefixed fullscreen API where available", async () => {
  const element = {
    wasCalled: false,
    webkitRequestFullscreen() {
      this.wasCalled = true;
    },
  };

  assert.equal(await requestElementFullscreen(element), true);
  assert.equal(element.wasCalled, true);
});
