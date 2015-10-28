child_process = require('child_process')
assert = require('assert')

urls = [
    'http://www.nytimes.com/2015/09/27/opinion/sunday/stop-googling-lets-talk.html',
    'https://en.wikipedia.org/wiki/Phantomjs'
]

urls.forEach(function (url) {
    console.log(url)
    
    json = child_process.execSync('phantomjs get_page_text.js ' + url).toString()
    
    result = JSON.parse(json)
    
    assert(result, 'No result returned')
    assert(result.title, 'No title property')
    assert(result.title.length > 10, 'Title property too short')
    assert(result.text, 'No text property')
    assert(result.text.length > 1000, 'Text property too short')
    assert(result.text.indexOf('Continue reading the main story') == -1, 'Ads detected in text ("Continue reading the main story" found)')
})
