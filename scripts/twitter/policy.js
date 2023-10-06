// Copyright (c) 2023 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.
console.log('This is the twitter policy script')

const check_the_box = () => {
  console.log('Checking the box')
  const checkboxes = document.querySelectorAll("input[type='checkbox']")
  if (checkboxes.length === 1) {
    checkboxes[0].checked = true
    return true
  } else {
    return false
  }
}

// Function to navigate to a URL with a random delay and return a promise
const navigateWithRandomDelayAndPromise = async (url) => {
  const randomDelay = Math.floor(Math.random() * (3000 - 500 + 1) + 500)

  console.log(`Navigating to ${url} after a delay of ${randomDelay} milliseconds`)

  return new Promise((resolve) => {
    setTimeout(() => {
      window.onload = () => {
        resolve()
      }
      window.location.href = url
    }, randomDelay)
  })
}

const urlsToGoTo = [
  'https://twitter.com/home',
  'https://twitter.com/settings/ads_preferences',
  'https://twitter.com/settings/off_twitter_activity',
  'https://twitter.com/settings/data_sharing_with_business_partners',
  'https://twitter.com/settings/location_information'
]

const curUrl = window.location.href

// Check if we are on the twitter settings page
if (urlsToGoTo.includes(curUrl)) {
  checkTheBox()
}

// Check for urlsToGoTo in local storage
if (localStorage.getItem('urlsToGoTo')) {
  console.log('Found urlsToGoTo in local storage')
  const urlsToGoTo = JSON.parse(localStorage.getItem('urlsToGoTo'))
} else {
  console.log("Didn't find urlsToGoTo in local storage")
  localStorage.setItem('urlsToGoTo', JSON.stringify(urlsToGoTo))
}

const nextUrl = urlsToGoTo.pop()

// Save the urls_to_go_to to local storage
localStorage.setItem('urls_to_go_to', JSON.stringify(urls_to_go_to))

// navigate to the url
const navigateToNextUrl = async () => {
  await navigateWithRandomDelayAndPromise(next_url)
}

navigateToNextUrl()
