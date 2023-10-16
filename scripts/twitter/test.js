// // Copyright (c) 2023 The Brave Authors. All rights reserved.
// // This Source Code Form is subject to the terms of the Mozilla Public
// // License, v. 2.0. If a copy of the MPL was not distributed with this file,
// // You can obtain one at https://mozilla.org/MPL/2.0/.

console.log("PSST test.js inserted");
(() => {
  return new Promise((resolve) => {
    console.log("In the promise");
    resolve('hello world');
  })
})();