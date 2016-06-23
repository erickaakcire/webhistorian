# Web Historian: See your web browsing history in a new light
This extension for the Google Chrome browser lets you visualize your web browsing history in ways you've never seen before. See how you navigate the web, what search words you use the most, and what websites you visit using interactive visualizations.

Web Historian helps users analyze their own web browsing, and users can opt-in to donate their history data to a research project and take a brief survey to provide context for the data. This allows social scientists to combine the analysis of real-world browsing records with the contextual information that can only be provided by the users themselves. 

The extension uses the D3.js for the visualizations and accesses the history data via the chrome.history API.

Web Historian runs entirely on the local browser using only client-side JavaScript and can be used while the browser is offline (the Web Visits view will be less colorful offline since categories are downloaded from a server), until the "participate" option is chosen. 

For more information see [http://webhistorian.org] (http://webhistorian.org)

#To run the extension in Developer Mode

You will be able to see  your visualizations, but you won't be able to participate in the research project when you install Web Historian using developer mode.
<ol>
<li> Download the extension code to your machine. Press the "Clone or download" green button on the Web Historian Repsitory https://github.com/erickaakcire/webhistorian. From there you can download the zip file or copy the address to clone. If you downoad the zip file you need to unzip it.
<li> In your file system rename the file .../js/app/config.js-template.js to .../js/app/config.js

<li> In your Chrome browser's address bar type: chrome://extensions/ <br/> or navigate: Settings (an icon with three lines or three dots near the top right of the browser) > More Tools > Extensions

<li> Select the Checkbox for "Developer Mode"

<li> Click "Load unpacked extension"

<li> Browse to the directory where you downloaded the extension code and click "Select"
</ol>

# Technical Overview

Web Historian is a web application created in JavaScript using d3.js, jQuery, Bootstrap, require.js and a number of other browser-based technologies.

The entrypoint into the extension is the `index.html` file in the root of the project's directory. This file creates the "shell" of the user interface, including the toolbar as well as designated `DIV` element where various visualizations will load each's respective content.

The JavaScript architecture of the extension is built around [RequireJS](http://requirejs.org/) to split the project into separate module that componentize the implementaion of the project as well as providing "on-demand" loading of components as needed.

On the launch of the extension, this process is followed:

1. `index.html` loads the RequireJS library, which uses `js/app/main.js` to configure the JavaScript environment
2. `js/app/main.js` loads `js/app/history.js` which launches a modal progress display that tracks the progress of the extension retrieving and transforming the user's browsing history for use with other upload and display components.
3. `js/app/main.js` loads `js/app/home.js` to display the home page and trigger the require.js scripts to load on click.
4. On a successful fetch of the local browsing history, the extension dismisses the progress modal and presents the user with options to visualize their data and opt-in to the research project.
5. If the user chooses to participate in the research, the extension loads `js/lib/passive-data-kit.js` which packages and uploads the user's web history to a [Passive Data Kit](https://github.com/audaciouscode/PassiveDataKit-Django) server.

# Visualizations Overview

Visualizations rely heavily on RequireJS on-demand component loading. In `home.js`, visualizations may be launched by clicking the UI element in the main interface wired to a specific visualization:

    $("#search_words_card").click(function()
    {
      $("#search_words").click();
    });

    $("#search_words").click(function() {
      requirejs(["../app/search-terms"], function (search_words) 
      {
        search_words.display(history, history.fullData);
      });
    });

On the example above, the implementation of the search terms visualization is contained within `js/app/search-terms.js`. The general form of these files are:

    define(["../app/utils", "lib1", "lib2"], function(utils, lib1, lib2) 
    {
      // Create object to hold onto shared state.
      var visualization = {};
      
      // Define functionality required by the visualization.
      
      // Return an object containing methods to be called by main.js.
      visualization.display = function(history, data)
      {
      
      };
      
      return visualization;
    }

The click handler in `home.js` will call the `display` method on the returned object and pass the `history` object containing the extension's state (such as the list of all data loaded from the history) and a `data` array that reflects the currently-selected subset (from the calendar input) of the entire user history.

This array uses this structure:

    [
      {
        "id": "255153",                   // Unique identifier for the visit instance.
        "url": "http://www.example.com/", // URL loaded for the visit instance.   
        "urlId": "74289",                 // Unique identifier for the URL visited.
        "protocol": "http:",              // Protocol used to request the resource (http or https).
        "domain": "example.com",          // Domain of the URL host.
        "searchTerms": "",                // Any search terms used to locate this URL.
        "date": 1449426710486.8,          // Unix timestamp of the visit in milliseconds.
        "transType": "typed",             // Method used to navigate to this URL. 
                                          // See https://developer.chrome.com/extensions/history#transition_types for values.
        "refVisitId": "0",                // Referrer visit preceding this visit (if available).
        "title": "Page Title Goes Here."  // Title of the page (if available).
      },
      {
        // Another visit structure.
      },
      ...
    ]

The visualization is responsible for transforming this array into another representation of the user's browsing history.

# Creating a New Visualization

To create a new visualization, follow these steps:

1. Create a new JavaScript file that will contain your visualization logic using the template provided above.
2. In `index.html`, add the UI element that the user will click to load the new visualization. The navigation bar is a great place to include the UI element.
3. In `home.js`, setup the click handler that will load the new visualization JavaScript file and call the returned object's `display` method.
4. In the visualization JavaScript file, implement the display logic that transforms the browsing history array into a new representation of the data. Don't forget to implement the listeners for the date pickers in the navigation bar:

````    
    $("input#start_date").datepicker().on("changeDate", function(e)
    {
       visualization.display(history, data);
    });
    
    $("input#end_date").datepicker().on("changeDate", function(e)
    {
      visualization.display(history, data);
    });
````
