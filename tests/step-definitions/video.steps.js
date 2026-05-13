'use strict';

const { friendly } = require('./webship');

// Video recording steps — start / stop / save mid-scenario.
//
// Playwright records video only at browser-context creation. Mid-scenario
// `start` / `stop` therefore work by tearing down the current page +
// context and reopening with the new recording flag. Page state is lost
// across the boundary — call `start` BEFORE any navigation and `stop` only
// when you no longer need the current page state.
//
// Default mode is 'off' (no recording). See cucumber.js → worldParameters.video.

const { When, Then } = require('@cucumber/cucumber');
const fs = require('fs');
const path = require('path');

function settings(world) {
  const cfg = (world.parameters && world.parameters.video) || {};
  return {
    dir: process.env.WEBSHIP_VIDEO_DIR || cfg.dir || './videos',
    size: cfg.size || { width: 1280, height: 720 },
  };
}

async function rebuildContext(world, recordVideo) {
  await world.closeBrowser();
  if (recordVideo) {
    const s = settings(world);
    fs.mkdirSync(s.dir, { recursive: true });
    world._videoRequested = true;
    await world.openBrowser({ recordVideo: { dir: s.dir, size: s.size } });
  } else {
    world._videoRequested = false;
    await world.openBrowser();
  }
}

/**
 * Start recording the browser as a webm video. Closes the current page +
 * context and reopens with `recordVideo` enabled. Place BEFORE any
 * navigation in the scenario.
 *
 * Example #1: When I start video recording
 * Example #2: And I start video recording
 * Example #3: Given I start video recording
 * Example #4: But I start video recording
 * Example #5: Then I start video recording
 *
 */
When(/^(I |we )*start video recording$/, async function (pronoun) {
  try {
    await rebuildContext(this, true);
  } catch (e) {
    throw friendly({
      action: 'start video recording',
      cause: e,
      hint: `the videos directory (${(this.parameters && this.parameters.video && this.parameters.video.dir) || './videos'}) must be writable.`,
    });
  }
});

/**
 * Stop recording. Closes the current page + context (which flushes the
 * webm to disk) and reopens a fresh, non-recording browser so the rest
 * of the scenario can continue.
 *
 * Example #1: When I stop video recording
 * Example #2: And I stop video recording
 * Example #3: But I stop video recording
 * Example #4: Then I stop video recording
 * Example #5: Then I stop video recording
 *
 */
When(/^(I |we )*stop video recording$/, async function (pronoun) {
  try {
    if (!this.page || !this._videoRequested) return;
    const video = this.page.video();
    // Close context first — flushes the webm — then saveAs while the
    // browser is still alive, finally close the browser and reopen fresh.
    try { await this.context.close(); } catch { /* ignore */ }
    if (video) {
      try {
        const s = settings(this);
        const name = this._videoSaveAsName || `manual.${Date.now()}.webm`;
        const dest = path.join(s.dir, name);
        await video.saveAs(dest);
        await video.delete().catch(() => {});
        process.stderr.write(`\n[webship-js] video saved → ${dest}\n`);
        // Reset so the After hook does not try to re-save.
        this._videoSaveAsName = null;
      } catch (e) {
        process.stderr.write(`\n[webship-js] video save failed: ${e.message}\n`);
      }
    }
    if (this.playwrightBrowser) {
      try { await this.playwrightBrowser.close(); } catch { /* ignore */ }
      this.playwrightBrowser = null;
    }
    this.context = null;
    this.page = null;
    this._videoRequested = false;
    await this.openBrowser();
  } catch (e) {
    throw friendly({
      action: 'stop video recording',
      cause: e,
      hint: 'the scenario will continue with a fresh, non-recording browser.',
    });
  }
});

/**
 * Reserve a custom filename for the current scenario's video. The actual
 * save happens at scenario end (Playwright's `video.saveAs()` blocks
 * until recording finishes, so we cannot copy bytes mid-flight). If the
 * scenario calls `stop video recording` before scenario end, the manual
 * webm uses this name instead of the automatic timestamped one.
 *
 * Example #1: When I save the current video as "checkout-flow.webm"
 * Example #2: When I save the current video as "regression-21.webm"
 * Example #3: And I save the current video as "smoke.webm"
 * Example #4: Then I save the current video as "demo.webm"
 * Example #5: But I save the current video as "rerun.webm"
 *
 */
When(/^(I |we )*save the current video as "([^"]*)"$/, function (pronoun, name) {
  try {
    if (!this._videoRequested) {
      throw new Error('recording is not active');
    }
    if (!name || !name.trim()) {
      throw new Error('filename is empty');
    }
    this._videoSaveAsName = name;
  } catch (e) {
    throw friendly({
      action: `save the current video as "${name}"`,
      cause: e,
      hint: 'call "When I start video recording" first, or set worldParameters.video.mode to "on".',
    });
  }
});

/**
 * Print the path that the current video will be written to. Diagnostic
 * only — never asserts, never fails.
 *
 * Example #1: Then print video path
 * Example #2: And print video path
 * Example #3: But print video path
 * Example #4: Then print video path
 * Example #5: Then print video path
 *
 */
Then(/^print video path$/, async function () {
  // Diagnostic only — swallow every error and report inline.
  try {
    if (!this.page || !this._videoRequested) {
      console.log('\n--- Video path: recording is OFF ---');
      return;
    }
    const video = this.page.video();
    if (!video) {
      console.log('\n--- Video path: no video object on this page ---');
      return;
    }
    try {
      const p = await video.path();
      console.log(`\n--- Video path: ${p} ---`);
    } catch (e) {
      console.log(`\n--- Video path unavailable: ${e.message} ---`);
    }
  } catch (e) {
    console.log(`\n--- Video path error: ${e.message} ---`);
  }
});
