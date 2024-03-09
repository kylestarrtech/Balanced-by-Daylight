# Autobalancer Info

This document contains key information on the autobalancer feature, what is required to operate it, add new leagues, and use the resources the tool offers.

Note this document is NOT meant to show how exactly one adds their own league. This is here for development purposes (i.e. so my forgetful ass can read up on how the hell I coded this).

## How the Autobalancer Works

The autobalancer is made up of a couple of different scripts and resources:

1. autobalancer.js
    * This script handles the primary functionality of the autobalancer. That is, it handles the fetching of registered leagues, the saving of different settings, and the modification of their associated **balance objects** (more on this in a bit).
2. autobalance-api.js
    * This script allows the Balanced by Daylight application to interface with the tool, letting the developers with their respective API keys refresh the application's autobalancer at any time, view the state of the autobalancer, and modify features.
3. Balance Object files
    * These files are located in `./autobalance-info`. They are simple JSON files that contain the following key values:
        1. `Enabled`: Whether or not autobalancing for this particular league is enabled at this time.
        2. `Frequency`: The frequency (in seconds) that the autobalancer tool will attempt to fetch new balancing. Ideally at least once per day.
        3. `LastRun`: The last time (in epoch, seconds) the autobalancer attempted to fetch updated balancing. Do not that for some leagues this is not going to be the same as the "Version" code on the actual balancing preset.
        4. `FileName`: Refers to the name of the file of the final converted balancing preset.
    * These are the resources the autobalancer tool requires to function. This file is regularly updated whenever new balancing is fetched. It is also updated if the API is utilized to change a setting, at which point the autobalancer tool is re-initialized.

## How to Add a League

Adding a league requires a few particular things. For starters, a file located in `./utilities/autobalancer`. This file is a simple node module containing the methods required to convert whatever the API sends to an output the Balanced by Daylight application can read. Some simple guidelines for this:

* The only export should be the function that does the conversion, nothing else. The autobalancer.js file that manages the timer will simply refer to this conversion function and send the fetched data to it. Then this is saved to a return file. If for whatever reason anything goes wrong in this process, it is cancelled and the old version remains.
* None of the league conversion files should ever show information linking itself to the API. No API keys, no URLs, simply a function that takes in the response text and converts it to a readable preset.

The second thing required will be, as mentioned above, a balance object file. See above for information on how to create this but a real example would be:

```json
{
    "Enabled":true,
    "Frequency":10800,
    "LastRun":1709907936,
    "FileName":"DBDL.json"
}
```

Third, inside of the `autobalancer.js` file the league has to be added to the `autobalanceLeagues` list. The first property needed is `Name`, which is the name of the league that's used across the entire system for grabbing the balance object file, and the URL. The second property needed is `ConversionFunc`, which is the function that takes in the API response for that particular league, and outputs a valid balancing preset.

Last but not least the URL required to fetch this should ALWAYS be put in the `.env` file. This URL should **never** be publicly facing as doing so is a huge privacy breach for the leagues that entrust us with this information. The only thing that should ever see this URL is the server. The URL format **must** remain consistent (e.g. `AUTOBALANCE-[NAME]-URL`) otherwise the primary autobalancer script will not pick it up.

Once all of this is in place, **congrats**! You've just successfully added a league to the Autobalance tool! Upon server restart the Autobalancer should immediately pick this up, refresh the balancing, and start the timer for when to do so next!

## Autobalancer API

Included with this feature is an API that can be used by the developers to modify and view the statistics of certain leagues. This exists solely as a way to change things on the fly in the case something arises that cannot be fixed automatically.

An API key is *required* to do any of these actions. The API keys are stored in the .env file for safekeeping.

Here are the endpoints within the tool:

### GET: /autobalance/:league/view?key=[APIKEY]

This endpoint returns the JSON details of a particular league's balance object file.

Example Return:
```json
{
    "Success": true,
    "Message": {
        "Enabled": true,
        "Frequency": 10800,
        "LastRun": 1709952357,
        "FileName": "DBDL.json"
    }
}
```

### GET: /autobalance/:league/refresh?key=[APIKEY]

This endpoint simply re-fetches the league's autobalance details. It bypasses the timer entirely and will not affect the next run.

Example Return:
```json
{
    "Success": true,
    "Message": "Autobalance refreshed!"
}
```

### POST: /autobalance/:league/modify?key=[APIKEY]

This endpoint allows you to modify and change a league's balance object file. It will only allow you to change the properties that it already has, and does not let you add new ones.

Example Body:
```json
{
    "Enabled":true,
    "Frequency":10800,
    "LastRun":1709951996,
    "FileName":"DBDL.json"
}
```

Example Return:
```json
{
    "Success": true,
    "Message": "League object modified!"
}
```