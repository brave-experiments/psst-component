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
  const SIGNED_USER_LS_KEY_NAME = 'voyager'
  const PSST_PUBLIC_ID_COOKIE_NAME = 'psst_public_identifier'
  const CODE_ELEM_JSON_IDENTIFIER =
    'com.linkedin.voyager.identity.shared.PublicContactInfo'

  const hasLocalStorageKeyStartingWith = prefix =>
    Object.keys(localStorage).some(key => key.startsWith(prefix))

  const setCookie = (name, value, days) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
  }

  const getCookie = name => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? match[2] : null
  }

  const getUid = () => {
    const element = [...document.querySelectorAll('code')].find(
      el =>
        !el.children.length &&
        el.textContent.includes(CODE_ELEM_JSON_IDENTIFIER)
    )
    if (!element && hasLocalStorageKeyStartingWith(SIGNED_USER_LS_KEY_NAME)) {
      return getCookie(PSST_PUBLIC_ID_COOKIE_NAME) // Return saved cookie if element is not found
    }

    try {
      const publicIdentifier =
        JSON.parse(element.textContent)?.included?.[0]?.publicIdentifier || null
      if (publicIdentifier) {
        setCookie(PSST_PUBLIC_ID_COOKIE_NAME, publicIdentifier, 30)
      }
      return publicIdentifier
    } catch {
      return null
    }
  }
  console.log('[PSST] linkedin user:', getUid())
  return {
    user: getUid(),
    requests: [
      {
        url: 'https://www.linkedin.com/mypreferences/d/member-cookies',
        description: 'Disable cookies'
      },
      {
        url: 'https://www.linkedin.com/mypreferences/d/settings/policy-and-academic-research',
        description: 'Disable your data sharing with third parties'
      },
      {
        url: 'https://www.linkedin.com/mypreferences/d/settings/ads-location',
        description: 'Profile Location'
      },
      {
        url: 'https://www.linkedin.com/mypreferences/d/settings/linked-in-activity-data',
        description: 'LinkedIn activity data'
      },
      {
        url: 'https://www.linkedin.com/mypreferences/d/settings/ads-inferred-location',
        description: 'Ads based on Inferred city location'
      },
      {
        url: 'https://www.linkedin.com/mypreferences/d/interest-categories',
        description: 'Ads based on Inferred interests and traits'
      },
      {
        url: 'https://www.linkedin.com/mypreferences/d/settings/ads-by-age',
        description: 'Ads based on Inferred age range'
      },
      {
        url: 'https://www.linkedin.com/mypreferences/d/settings/ads-by-gender',
        description: 'Ads based on Inferred gender'
      },
      {
        url: 'https://www.linkedin.com/mypreferences/d/settings/ads-beyond-linkedin',
        description: 'Ad Partners Data for Ads off LinkedIn'
      },
      {
        url: 'https://www.linkedin.com/mypreferences/d/settings/ads-interactions-with-business',
        description: 'Advertiser data for ads'
      },
      {
        url: 'https://www.linkedin.com/mypreferences/d/settings/ads-related-actions',
        description: 'Measure ad success'
      }
    ]
  }
})()
