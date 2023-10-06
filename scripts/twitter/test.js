// Copyright (c) 2023 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.
psst = {
  state: 'processing',
  urls_to_go_to: [
    'https://twitter.com/home',
    'https://twitter.com/settings/ads_preferences',
    'https://twitter.com/settings/off_twitter_activity',
    'https://twitter.com/settings/data_sharing_with_business_partners',
    'https://twitter.com/settings/location_information'
  ]
}; // Added comma here

(() => {
  console.debug('[PSST] Twitter test script')
  const psstProcessing = true

  localStorage.setItem('psst-processing', psstProcessing)
})(); // Removed extra semicolon
(() => {
  console.debug('[PSST] Twitter test script')
  const psstProcessing = true

  localStorage.setItem('psst-processing', psstProcessing)
})() // Removed newline between function and ( of function call
