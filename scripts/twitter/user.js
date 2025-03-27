// Copyright (c) 2025 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

/*
 Extracts end returns the Twitter user ID
 Returns the dictionary object:
 {
  "user": <twid>,
  "tasks": { 
      {
        url:<setting url, MUST BE UNIQUE>,
        description:<setting description>},
      },
       .... 
  }

 }
 In ca the twid extracting is impossible it must return null
*/

(() => {
  const TWID_COOKIE_NAME = 'twid'

  const getTwId = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith(TWID_COOKIE_NAME))
      ?.split('=')[1]
  }

  return {
    user: getTwId(),
    tasks: [
      {
        url: 'https://x.com/settings/location',
        description: 'Disable attaching location information to posts'
      },
      {
        url: 'https://x.com/settings/data_sharing_with_business_partners',
        description: 'Disable sharing additional information with business partners'
      },
      {
        url: 'https://x.com/settings/off_twitter_activity',
        description: 'Disable personalization based on your inferred identity'
      },
      {
        url: 'https://x.com/settings/ads_preferences',
        description: 'Disable personalized ads'
      }
    ]
  }
})()
