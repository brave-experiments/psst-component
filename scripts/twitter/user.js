// Copyright (c) 2025 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

/*
 * Extracts end returns the Twitter user ID
 * Returns the dictionary object:
 * {
 *  "user": <twid>,
 *  "state": 'testing|done-testing|applying-policy|done-applying-policy'
 *
 * }
 * In ca the twid extracting is impossible it must return null
 */
;(() => {
  const TWID_COOKIE_NAME = 'twid'

  const getTwId = () => {
    console.log('[PSST] Extracting twid V3')
    return document.cookie
      .split('; ')
      .find(row => row.startsWith(TWID_COOKIE_NAME))
      ?.split('=')[1]
  }

  return {
    user: getTwId(),
    requests: [
      {
        url: 'https://x.com/settings/location',
        description: 'Location'
      },
      {
        url: 'https://x.com/settings/data_sharing_with_business_partners',
        description: 'Data sharing with business partners'
      },
      {
        url: 'https://x.com/settings/off_twitter_activity',
        description: 'Twitter Activity'
      },
      {
        url: 'https://x.com/settings/ads_preferences',
        description: 'Ads Preferences'
      }
    ]
  }
})()
