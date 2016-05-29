pagetext.js
===========

[![Build status](https://travis-ci.org/jncraton/pagetext.js.png)](https://travis-ci.org/jncraton/pagetext.js)

A phantomjs script to grab the article text from a web page. Readability was a starting point for this project.

Usage
-----

`phantomjs pagetext.js [url]`

Response is a JSON object like the following:

    {
        "title": "[page title]",
        "text": "[page text]",
        "html": "[html representing the main article body]"
    }
    
Disclaimer
----------

This script tells some white lies. It claims to be Firefox and always uses google.com as it's referer. This helps to get around restrictions in place on certain sites, but it also means that this should not be used as part of an automated bot or scraper without modification. In it's current implementation, it is expected to be run by a user to get the content of an individual page.
