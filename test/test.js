var child_process = require('child_process')
var assert = require('assert')
var path = require('path')

var currentDir = path.dirname(process.mainModule.filename)

pages = [
    {
        'url': 'file:///' + currentDir + '/guardian.html',
        'must_contain': ['I’ve often wondered how the media would respond when eco-apocalypse struck']
    }, {
        'url': 'file:///' + currentDir + '/wikipedia.html',
        'must_contain': ['BSD License']
    }, {
        'url': 'file:///' + currentDir + '/iafrikan.html',
        'must_contain': ['“One of the most important']
    }, {
        'url': 'file:///' + currentDir + '/github_blog.html',
        'must_contain': ['Final thoughts','problem-solution ordering issues','Think of yourself as someone who sells aspirin']
    }, {
        'url': 'file:///' + currentDir + '/nytimes.html',
    }, {
        'url': 'file:///' + currentDir + '/bbc.html',
    }, {
        'url': 'https://en.wikipedia.org/wiki/Phantomjs',
    },
]

pages.forEach(function (page) {
    console.log(`Loading ${page.url}...`)
    var stdout = child_process.execSync('phantomjs --load-images=false pagetext.js ' + page.url)
        
    console.log(`Processing ${page.url}...`)
    result = JSON.parse(stdout)

    assert(result, 'No result returned')
    assert(!result.hasOwnProperty('error'), `Error: ${result.error}`)
    assert(result.hasOwnProperty('title'), 'No title property')
    assert(result.title.length > 10, 'Title property too short')
    assert(result.hasOwnProperty('text'), 'No text property')
    assert(result.text.length > 1000, 'Text property too short')
    assert(result.text.length < 20000, 'Text property too long')
    assert(result.hasOwnProperty('html'), 'No html property')
    assert(result.html.length > 1000, 'html property too short')
    assert(result.html.length < 25000, 'html property too long')
    console.log(result.text)
    assert(result.text.indexOf('Continue reading the main story') == -1, 'Ads detected in text ("Continue reading the main story" found)')
    
    if (page.must_contain) {
        page.must_contain.forEach(function (str) {
            assert(result.text.indexOf(str) >= 0, 'Text "' + str + '" not fount')
        })
    }
})
