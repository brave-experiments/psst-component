// Copyright (c) 2025 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.
//
// Script Receives as parameter the next data from the user script:
// {
//    "requests": [ {
//        url:'https://www.linkedin.com/mypreferences/d/member-cookies',
//        description: 'Disable cookies'
//    }, {
//       url:'https://www.linkedin.com/mypreferences/d/settings/policy-and-academic-research',
//       description: 'Disable your data sharing with third parties'
//    },
//       .....
//    {
//       url:'https://www.linkedin.com/mypreferences/d/settings/ads-interactions-with-business',
//       description: 'Advertiser data for ads'
//    } ],
//    "user": "user-name-7a8394356"
// }
// and uses 'requests' - as list of policy settings tasks to apply
// 'user' -  user identifier extracted by the user script
//
// If local storage contains the data with 'psst' key:
// psst = {
//   state: 'applying-policy|done-applying-policy',
//   urls_to_go_to: [
//     'https://www.linkedin.com/mypreferences/d/member-cookies'',
//     'https://www.linkedin.com/mypreferences/d/settings/policy-and-academic-research',
//     ......
//     'https://www.linkedin.com/mypreferences/d/settings/ads-interactions-with-business'
//   ],
//   start_url: 'https://www.linkedin.com/feed'
//   errors: {
//     'https://www.linkedin.com/mypreferences/d/settings/ads-interactions-with-business': 'error message'
//  }
// }
// It will be used for every next script execution as

const SETTINGS_URLS_LENGTH = params.requests?.length ?? 0
const WAIT_FOR_PAGE_TIMEOUT = 3000

// Use requests as list of the policy settings tasks to apply
const SETTINGS_URLS = params.requests

/* Helper functions */
const goToUrl = url => {
  window.location.href = url
}
const checkCheckboxes = (resolve, reject, turnOff) => {
  const checkboxes = document.querySelectorAll("input[type='checkbox']")
  if (checkboxes.length === 1) {
    if (turnOff) {
      if (checkboxes[0].checked) {
        // Uncheck it
        checkboxes[0].click()
      }
    }
    resolve(true)
  } else {
    // Throw error
    reject('No checkbox found')
  }
}
const waitForCheckboxToLoadWithTimeout = (timeout, turnOff) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      return checkCheckboxes(resolve, reject, turnOff)
    }, timeout)
  })
}
const calculatePercent = urls => {
  return 1 - urls.length / SETTINGS_URLS_LENGTH
}

const start = () => {
  const curUrl = window.location.href
  const urlData = SETTINGS_URLS
  const nextUrlData = urlData.shift()
  const psst = {
    state: 'applying-policy',
    urls_to_go_to: urlData,
    start_url: curUrl,
    progress: calculatePercent(urlData),
    applyingTask: nextUrlData,
    errors: {},
    applied:[]
  }
  return [psst, nextUrlData.url, nextUrlData.description]
}
const saveAndGoToNextUrl = (psst, nextUrl) => {
  // Save the psst object to local storage.
  window.parent.localStorage.setItem('psst', JSON.stringify(psst))
  // Go to the next URL.
  goToUrl(nextUrl)
}

// Main execution logic.
(async () => {
  // Get psst variables from local storage.
  const psst = window.parent.localStorage.getItem('psst')

  if (!psst) {
    // Start applying-policy
    const [psst, nextUrl, nextDescription] = start()
    saveAndGoToNextUrl(psst, nextUrl)
    return {
      result: false,
      psst: psst
    }
  }

  // We modify this JSON object in place and only save at end.
  const psstObj = JSON.parse(psst)
  if (!psstObj) {
    return {
      result: false
    }
  }

  if (psstObj.state === 'done-applying-policy') {
    // Invoke the policy script
    return {
      result: true,
      psst: psstObj
    }
  }

  try {
    await waitForCheckboxToLoadWithTimeout(
      WAIT_FOR_PAGE_TIMEOUT,
      true /* turnOff */
    )
    const applyingTask = psstObj.applyingTask
    if(applyingTask) {
      psstObj.applied.push(psstObj.applyingTask.description)
    }
  } catch (e) {
    // We simply log the error and continue to the next URL.
    psstObj.errors[psstObj.applyingTask.url] = e
  }

  const nextUrlData = psstObj.urls_to_go_to.shift()
  let nextUrl = null
  if (!nextUrlData) {
    psstObj.state = 'done-applying-policy'
    nextUrl = psstObj.start_url
  } else {
    nextUrl = nextUrlData.url
  }

  psstObj.progress = calculatePercent(psstObj.urls_to_go_to)
  psstObj.applyingTask = nextUrlData

  saveAndGoToNextUrl(psstObj, nextUrl)
  return {
    result: false,
    psst: psstObj
  }
})()
