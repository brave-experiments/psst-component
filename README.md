# PSST Component

For local testing, add this "component" to your Profiles directory, under `lhhcaamjbmbijmjbnnodjaknblkiagon`. On MacOS, this is at `~/Library/Application\ Support/BraveSoftware/Brave-Browser-Development/`. 

```
lhhcaamjbmbijmjbnnodjaknblkiagon/1/
 |_ manifest.json
 |_ psst.json
 |_ scripts/
    |_ twitter/
        |_ test.js
        |_ policy.js
    |_ linkedin/
        |_ test.js
        |_ policy.js
```
See [psst_rule.cc](https://github.com/brave/brave-core/blob/master/components/psst/browser/core/psst_rule.cc) for the format of psst.json.
