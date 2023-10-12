// Copyright (c) 2023 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

// psst = {
//   state: 'testing|done-testing|applying-policy|done-applying-policy',
//   urls_to_go_to: [
//     'https://twitter.com/settings/ads_preferences',
//     'https://twitter.com/settings/off_twitter_activity',
//     'https://twitter.com/settings/data_sharing_with_business_partners',
//     'https://twitter.com/settings/location_information'
//   ],
//   start_url: 'https://twitter.com/home'
//   errors: {
//     'https://twitter.com/settings/ads_preferences': 'error message'
//  }
// }

const SETTINGS_URLS = [
  'https://twitter.com/settings/ads_preferences',
  'https://twitter.com/settings/off_twitter_activity',
  'https://twitter.com/settings/data_sharing_with_business_partners',
  'https://twitter.com/settings/location_information'
]

/* Helper functions */
const goToUrl = (url) => {
  console.log(`[PSST] Going to ${url}`)
  window.location.href = url
}
const checkCheckboxes = (resolve, reject, turnOff) => {
  const checkboxes = document.querySelectorAll("input[type='checkbox']")
  if (checkboxes.length === 1) {
    console.log('[PSST] Found privacy checkbox')
    if (turnOff) {
      console.log('[PSST] Unchecking privacy checkbox')
      if (checkboxes[0].checked) {
        // Uncheck it
        checkboxes[0].click()
      }
    }
    console.log('[PSST] Found privacy checkbox')
    resolve(true)
  } else {
    console.log('[PSST] Did not find privacy checkbox')
    // Throw error
    reject('No checkbox found')
  }
}
const waitForCheckboxToLoadWithTimeout = (timeout, turnOff) => {
  console.log('[PSST] Checking if page is fine')
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      return checkCheckboxes(resolve, reject, turnOff)
    }, timeout)
  })
}
const startTesting = () => {
  console.log('[PSST] No psst variable found in local storage')
  const curUrl = window.location.href
  const urls = SETTINGS_URLS
  const nextUrl = urls.pop()
  const psst = {
    state: 'testing',
    urls_to_go_to: urls,
    start_url: curUrl,
    errors: {}
  }
  return [psst, nextUrl]
}
const saveAndGoToNextUrl = (psst, nextUrl) => {
  // Save the psst object to local storage.
  localStorage.setItem('psst', JSON.stringify(psst))
  // Go to the next URL.
  goToUrl(nextUrl)
}

// Main execution logic.
(async () => {
  console.log('[PSST] Twitter test script')
  // Get psst variables from local storage.
  const psst = localStorage.getItem('psst')

  if (!psst) {
    // Start testing
    const [psst, nextUrl] = startTesting()
    saveAndGoToNextUrl(psst, nextUrl)
    return false
  }

  // We modify this JSON object in place and only save at end.
  const psstObj = JSON.parse(psst)
  if (!psstObj) {
    console.log('[PSST] Could not parse psst object')
    return false
  }

  if (psstObj.state === 'done-testing' ||
      psstObj.state === 'applying-policy' ||
      psstObj.state === 'done-applying-policy') {
    console.log('[PSST] Already tested, time to apply policy')
    // Invoke the policy script
    return true
  }

  try {
    await waitForCheckboxToLoadWithTimeout(2000, false /* turnOff */)
  } catch (e) {
    // We simply log the error and continue to the next URL.
    psstObj.errors[window.location.href] = e.message
  }

  let nextUrl = psstObj.urls_to_go_to.pop()
  if (!nextUrl) {
    psstObj.state = 'done-testing'
    nextUrl = psstObj.start_url
  }

  saveAndGoToNextUrl(psstObj, nextUrl)
  return false
})()
