// Copyright (c) 2023 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

// See twitter/test.js for more information.

const startApplyingPolicy = (psstObj) => {
  const curUrl = window.location.href
  const urls = SETTINGS_URLS
  const nextUrl = urls.pop()
  psstObj.state = 'applying-policy'
  psstObj.urls_to_go_to = urls
  psstObj.start_url = curUrl

  return [psstObj, nextUrl]
}

// Main execution logic.
(() => {
  console.log('[PSST] Twitter policy script')
  // Get psst variables from local storage.
  const psst = localStorage.getItem('psst')

  if (!psst) {
    // We should only apply policy if the testing results are accurate,
    // give up.
    console.log('[PSST] In policy.js, no psst variable found in local storage')
    return
  }

  // We modify this JSON object in place and only save at end.
  const psstObj = JSON.parse(psst)
  if (!psstObj) {
    console.log('[PSST] Could not parse psst object')
    return
  }

  if (psstObj.state === 'done-applying-policy') {
    console.log('[PSST] Done applying policy')
    return
  }
  if (psstObj.state === 'done-testing') {
    // Start applying policy.
    const [psst, nextUrl] = startApplyingPolicy(psstObj)
    saveAndGoToNextUrl(psst, nextUrl)
    return
  }

  // Check if current URL is in the errors object.
  if (psstObj.errors[window.location.href]) {
    // We simply log the error and continue to the next URL.
    const curUrl = window.location.href
    console.log(`[PSST] In policy.js, not doing anything for ${curUrl} because of testing error.`)
  } else {
    try {
      waitForCheckboxToLoadWithTimeout(3000, true /* turnOff */)
    } catch (e) {
      // We simply log the error and continue to the next URL.
      psstObj.errors[window.location.href] = e.message
    }
  }

  let nextUrl = psstObj.urls_to_go_to.pop()
  if (!nextUrl) {
    // We're done
    console.log('[PSST] Done applying policy')
    psstObj.state = 'done-applying-policy'
    nextUrl = psstObj.start_url
  }

  saveAndGoToNextUrl(psstObj, nextUrl)
})()
