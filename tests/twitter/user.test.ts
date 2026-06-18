// Copyright (c) 2026 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

import { describe, it, expect, beforeEach } from 'vitest';
import type { UserScriptData } from '../../src/common/declarations';
import type { Task } from '../../src/common/psst_utils';
import { TwitterUserScript } from '../../src/twitter/user';

const TWID_COOKIE_NAME = 'twid';

/**
 * Reset document.cookie to an arbitrary string.
 * jsdom's cookie setter only appends, so we first expire every existing
 * cookie, then set the desired ones.
 */
function setCookieJar(cookieString: string) {
  for (const pair of document.cookie.split('; ')) {
    const name = pair.split('=')[0];
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }
  if (cookieString) {
    for (const pair of cookieString.split('; ')) {
      document.cookie = pair;
    }
  }
}

describe('TwitterUserScript.getUserId', () => {
  beforeEach(() => {
    setCookieJar('');
  });

  it('returns the twid cookie value when present', () => {
    setCookieJar(`${TWID_COOKIE_NAME}=abc123; foo=bar`);
    const instance = new TwitterUserScript();
    expect(instance.getUserId()).toBe('abc123');
  });

  it('returns undefined when the twid cookie is absent', () => {
    setCookieJar('foo=bar; other=baz');
    const instance = new TwitterUserScript();
    expect(instance.getUserId()).toBeUndefined();
  });

  it('returns undefined when twid is empty', () => {
    setCookieJar(`${TWID_COOKIE_NAME}=`);
    const instance = new TwitterUserScript();
    expect(instance.getUserId()).toBeUndefined();
  });

  it('handles URL-encoded cookie values', () => {
    setCookieJar(`${TWID_COOKIE_NAME}=t%3A12345`);
    const instance = new TwitterUserScript();
    expect(instance.getUserId()).toBe('t%3A12345');
  });

  it('ignores similarly-named cookies', () => {
    setCookieJar('twid_extra=other; twid=real_value');
    const instance = new TwitterUserScript();
    expect(instance.getUserId()).toBe('real_value');
  });
});

describe('TwitterUserScript.getTasks', () => {
  beforeEach(() => {
    setCookieJar(`${TWID_COOKIE_NAME}=test_user`);
  });

  it('returns a UserScriptData object with the correct shape', () => {
    const instance = new TwitterUserScript();
    const data = instance.getTasks();

    expect(data).toBeDefined();
    expect(data).toHaveProperty('user_id');
    expect(data).toHaveProperty('share_experience_link');
    expect(data).toHaveProperty('site_name');
    expect(data).toHaveProperty('tasks');
  });

  it('contains 5 task entries', () => {
    const instance = new TwitterUserScript();
    const data = instance.getTasks() as UserScriptData;
    expect(data.tasks).toHaveLength(5);
  });

  it('has site_name set to x.com', () => {
    const instance = new TwitterUserScript();
    const data = instance.getTasks() as UserScriptData;
    expect(data.site_name).toBe('x.com');
  });

  it('each task has all required fields', () => {
    const instance = new TwitterUserScript();
    const data = instance.getTasks() as UserScriptData;
    const requiredFields: (keyof Task)[] = ['uid', 'url', 'description', 'selector', 'turn_off'];

    for (const task of data.tasks) {
      for (const field of requiredFields) {
        expect(task).toHaveProperty(String(field));
      }
    }
  });

  it('all task UIDs are unique', () => {
    const instance = new TwitterUserScript();
    const data = instance.getTasks() as UserScriptData;
    const uids = data.tasks.map(t => t.uid);
    expect(uids.length).toBe(new Set(uids).size);
  });

  it('propagates getUserId result into user_id', () => {
    const instance = new TwitterUserScript();
    const data = instance.getTasks() as UserScriptData;
    expect(data.user_id).toBe(instance.getUserId());
  });
});
