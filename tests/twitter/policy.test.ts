// Copyright (c) 2026 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TwitterPolicyScript } from '../../src/twitter/policy';
import { PolicyScriptBase } from '../../src/common/policy_base';

const ATTEMPTS = PolicyScriptBase.WAIT_FOR_PAGE_ATTEMPTS_COUNT;
const TIMEOUT = PolicyScriptBase.WAIT_FOR_PAGE_TIMEOUT;
const SELECTOR = '#toggle';

/**
 * Insert a checkbox (or arbitrary element) into the document and return it.
 */
function addCheckbox(checked: boolean): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = 'toggle';
  input.checked = checked;
  document.body.appendChild(input);
  return input;
}

describe('TwitterPolicyScript.waitForSettingAppliedWithTimeout', () => {
  let instance: TwitterPolicyScript;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    localStorage.clear();
    instance = new TwitterPolicyScript();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('turnOff = true (setting should end up unchecked)', () => {
    it('unchecks a checked checkbox', async () => {
      const checkbox = addCheckbox(true);

      const promise = instance.waitForSettingAppliedWithTimeout(SELECTOR, true);
      await vi.advanceTimersByTimeAsync(TIMEOUT);

      await expect(promise).resolves.toBeUndefined();
      expect(checkbox.checked).toBe(false);
    });

    it('leaves an already-unchecked checkbox untouched', async () => {
      const checkbox = addCheckbox(false);
      const clickSpy = vi.spyOn(checkbox, 'click');

      const promise = instance.waitForSettingAppliedWithTimeout(SELECTOR, true);
      await vi.advanceTimersByTimeAsync(TIMEOUT);

      await expect(promise).resolves.toBeUndefined();
      expect(checkbox.checked).toBe(false);
      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  describe('turnOff = false (setting should end up checked)', () => {
    it('checks an unchecked checkbox', async () => {
      const checkbox = addCheckbox(false);

      const promise = instance.waitForSettingAppliedWithTimeout(SELECTOR, false);
      await vi.advanceTimersByTimeAsync(TIMEOUT);

      await expect(promise).resolves.toBeUndefined();
      expect(checkbox.checked).toBe(true);
    });

    it('leaves an already-checked checkbox untouched', async () => {
      const checkbox = addCheckbox(true);
      const clickSpy = vi.spyOn(checkbox, 'click');

      const promise = instance.waitForSettingAppliedWithTimeout(SELECTOR, false);
      await vi.advanceTimersByTimeAsync(TIMEOUT);

      await expect(promise).resolves.toBeUndefined();
      expect(checkbox.checked).toBe(true);
      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  describe('polling behaviour', () => {
    it('does not resolve before the first interval tick', async () => {
      addCheckbox(true);
      let settled = false;

      const promise = instance
        .waitForSettingAppliedWithTimeout(SELECTOR, true)
        .finally(() => {
          settled = true;
        });

      await vi.advanceTimersByTimeAsync(TIMEOUT - 1);
      expect(settled).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      await promise;
      expect(settled).toBe(true);
    });

    it('resolves once the checkbox appears on a later attempt', async () => {
      const promise = instance.waitForSettingAppliedWithTimeout(SELECTOR, true);

      // First tick: nothing in the DOM yet -> a failed attempt, no rejection.
      await vi.advanceTimersByTimeAsync(TIMEOUT);

      // Checkbox shows up before the attempt limit is reached.
      const checkbox = addCheckbox(true);
      await vi.advanceTimersByTimeAsync(TIMEOUT);

      await expect(promise).resolves.toBeUndefined();
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('rejection after exhausting attempts', () => {
    it('rejects when the selector is undefined', async () => {
      const promise = instance.waitForSettingAppliedWithTimeout(undefined, true);
      const assertion = expect(promise).rejects.toThrow(
        `Checkbox not found after ${ATTEMPTS} attempts. Error: No selector provided`
      );

      await vi.advanceTimersByTimeAsync(TIMEOUT * ATTEMPTS);
      await assertion;
    });

    it('rejects when no element matches the selector', async () => {
      const promise = instance.waitForSettingAppliedWithTimeout('#missing', true);
      const assertion = expect(promise).rejects.toThrow(
        `Checkbox not found after ${ATTEMPTS} attempts. Error: No checkbox found`
      );

      await vi.advanceTimersByTimeAsync(TIMEOUT * ATTEMPTS);
      await assertion;
    });

    it('rejects when the matched element is not a checkbox', async () => {
      const text = document.createElement('input');
      text.type = 'text';
      text.id = 'toggle';
      document.body.appendChild(text);

      const promise = instance.waitForSettingAppliedWithTimeout(SELECTOR, true);
      const assertion = expect(promise).rejects.toThrow(
        `Checkbox not found after ${ATTEMPTS} attempts. Error: No checkbox found`
      );

      await vi.advanceTimersByTimeAsync(TIMEOUT * ATTEMPTS);
      await assertion;
    });

    it('does not reject before the attempt limit is reached', async () => {
      const promise = instance.waitForSettingAppliedWithTimeout('#missing', true);
      let rejected = false;
      promise.catch(() => {
        rejected = true;
      });

      // One tick short of the limit.
      await vi.advanceTimersByTimeAsync(TIMEOUT * (ATTEMPTS - 1));
      expect(rejected).toBe(false);

      // Settle the promise so it doesn't leak as an unhandled rejection.
      await vi.advanceTimersByTimeAsync(TIMEOUT);
      await promise.catch(() => undefined);
      expect(rejected).toBe(true);
    });
  });
});
