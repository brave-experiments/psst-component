// Copyright (c) 2026 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/

import type { UserScriptData } from "./declarations";

export interface UserScriptInterface {
  readonly version: number;
  readonly includeUrlPatterns: string[];
  readonly excludeUrlPatterns: string[];
  readonly userScript: string;
  readonly policyScript: string;

  getUserId(): string | undefined;
  getTasks(): UserScriptData | undefined;
}
