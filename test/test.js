var child_process = require('child_process')
var assert = require('assert')
var path = require('path')

var currentDir = path.dirname(process.mainModule.filename)

urls = [
    'file:///' + currentDir + '/nytimes.html',
    'http://www.bbc.co.uk/news/world-asia-34665539',
    'http://www.nytimes.com/2015/09/27/opinion/sunday/stop-googling-lets-talk.html',
    'https://en.wikipedia.org/wiki/Phantomjs'
]

urls.forEach(function (url) {
    console.log(url)
    
    json = child_process.execSync('phantomjs pagetext.js ' + url).toString()
    
    result = JSON.parse(json)
    
    assert(result, 'No result returned')
    assert(result.title, 'No title property')
    assert(result.title.length > 10, 'Title property too short')
    assert(result.text, 'No text property')
    assert(result.text.length > 1000, 'Text property too short')
    assert(result.html, 'No html property')
    assert(result.html.length > 1000, 'html property too short')
    console.log(result.text)
    assert(result.text.indexOf('Continue reading the main story') == -1, 'Ads detected in text ("Continue reading the main story" found)')
})
