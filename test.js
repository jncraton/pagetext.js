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
    
    assert(result)
    assert(result.title)
    assert(result.title.length > 10)
    assert(result.text)
    assert(result.text.length > 1000)
})
