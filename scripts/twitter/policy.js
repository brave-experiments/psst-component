// Copyright (c) 2025 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

/*
Script Receives as parameter the next data from the user script:
{
   "tasks": [ {
      "description": "Ads Preferences",
      "url": "https://x.com/settings/ads_preferences"
   }, {
      "description": "Twitter Activity",
      "url": "https://x.com/settings/off_twitter_activity"
   }, {
      "description": "Data sharing with business partners",
      "url": "https://x.com/settings/data_sharing_with_business_partners"
   }, {
      "description": "Location",
      "url": "https://x.com/settings/location"
   } ],
   "user": "u%3D2637575963"
}
and uses 'tasks' - as list of policy settings tasks to apply
'user' -  user identifier extracted by the user script

If local storage contains the data with 'psst' key:
psst = {
  state: 'started|completed',
  tasks_list: [ {
      "description": "Ads Preferences",
      "url": "https://x.com/settings/ads_preferences"
   }, {
      "description": "Twitter Activity",
      "url": "https://x.com/settings/off_twitter_activity"
   }, {
      "description": "Data sharing with business partners",
      "url": "https://x.com/settings/data_sharing_with_business_partners"
   }, {
      "description": "Location",
      "url": "https://x.com/settings/location"
   } ],
  start_url: 'https://twitter.com/home',
  progress: 1,
  errors: {
    "https://x.com/settings/ads_preferences1": {
       "description": "Failed Task",
       "error": "No checkbox found"
     }
 }
}
It will be used for every next script execution as
*/

// Timeout to wait of the URL opening
const WAIT_FOR_PAGE_TIMEOUT = 3000

// Use tasks as list of the policy settings tasks to apply
const PSST_TASKS = params.tasks
const PSST_TASKS_LENGTH = params.tasks?.length ?? 0

// Flag which is present only for the first (initial) execution of the policy script
const PSST_INITIAL_EXECUTION_FLAG = params.initial_execution ?? false

// State of operations
const psstState = {
  STARTED: "started",
  COMPLETED: "completed"
}

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

const getAvailableTasks = (psst) => {
  const tasksInList = (psst?.tasks_list?.length ?? 0)
  return tasksInList + ((psst?.current_task ?? null) === null ? 0 : 1)
}

const getProcessedTasks = (psst) => {
    return (psst?.applied?.length ?? 0) + (psst?.errors?.length ?? 0)
}

const calculateProgress = (processedTasks, availableTasks) => {
  return processedTasks / (processedTasks + availableTasks)
}

const start = () => {
  const curUrl = window.location.href
  const tasks = PSST_TASKS
  const next_task = tasks.shift()
  const psst = {
    state: psstState.STARTED,
    tasks_list: tasks,
    start_url: curUrl,
    progress: calculateProgress(0, PSST_TASKS_LENGTH),
    current_task: next_task,
    errors: {},
    applied:[]
  }
  return [psst, next_task.url]
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

  if (!psst || PSST_INITIAL_EXECUTION_FLAG) {
    // Start applying-policy
    const [psst, nextUrl] = start()
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

  if (psstObj.state === psstState.COMPLETED) {
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
    const current_task = psstObj.current_task
    if(current_task) {
      psstObj.applied.push(psstObj.current_task)
    }
  } catch (e) {
    // We simply log the error and continue to the next URL.
    psstObj.errors[psstObj.current_task.url] = {
      description: psstObj.current_task.description,
      error: e
    }
  }

  const next_task = psstObj.tasks_list.shift()
  let nextUrl = null
  if (!next_task) {
    psstObj.state = psstState.COMPLETED
    nextUrl = psstObj.start_url
  } else {
    nextUrl = next_task.url
  }

  psstObj.current_task = next_task
  psstObj.progress = calculateProgress(getProcessedTasks(psstObj), getAvailableTasks(psstObj))

  saveAndGoToNextUrl(psstObj, nextUrl)
  return {
    result: false,
    psst: psstObj
  }
})()
