// Copyright (c) 2025 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

/*
Extracts end returns the LinkedIn user ID
Returns the dictionary object:
{
"user": <linkedin user ID>,
"tasks": [
  {
    url: 'https://www.linkedin.com/mypreferences/d/member-cookies',
    description: 'Disable cookies'
  },
  .............
]
}
In ca the <linkedin user ID> extracting is impossible it must return null
*/

(() => {
  // Flag which is present only for the first (initial) execution of the policy script
  const PSST_INITIAL_EXECUTION_FLAG = params.initial_execution ?? false

  const SIGNED_USER_LS_KEY_NAME = 'voyager'
  const PSST_PUBLIC_ID_COOKIE_NAME = 'psst_public_identifier'
  const CODE_ELEM_JSON_IDENTIFIER =
    'com.linkedin.voyager.identity.shared.PublicContactInfo'

  const psst = window.parent.localStorage.getItem('psst')

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
  return {
    user: getUid(),
    tasks: [
        {
          url: 'https://www.linkedin.com/mypreferences/d/member-cookies',
          description: 'Disable all non-essential cookies'
        },
        {
          url: 'https://www.linkedin.com/mypreferences/d/settings/policy-and-academic-research',
          description: 'Disable sharing your data for research with trusted third parties'
        },
        {
          url: 'https://www.linkedin.com/mypreferences/d/settings/ads-inferred-location',
          description: 'Disable personalizing ads based on inferred city location'
        },
        {
          url: 'https://www.linkedin.com/mypreferences/d/interest-categories',
          description: 'Disable personalizing ads based on inferred interests and traits'
        },
        {
          url: 'https://www.linkedin.com/mypreferences/d/settings/ads-by-age',
          description: 'Disable personalizing ads based on age range'
        },
        {
          url: 'https://www.linkedin.com/mypreferences/d/settings/ads-by-gender',
          description: 'Disable personalizing ads based on inferred gender'
        },
        {
          url: 'https://www.linkedin.com/mypreferences/d/settings/ads-beyond-linkedin',
          description: 'Disable personalized ads off of LinkedIn'
        },
        {
          url: 'https://www.linkedin.com/mypreferences/d/settings/ads-interactions-with-business',
          description: 'Disable personalized ads based on data given to businesses'
        },
        {
          url: 'https://www.linkedin.com/mypreferences/d/settings/ads-related-actions',
          description: 'Disable using your data for ad insights'
        }
  ]
  }
})()
