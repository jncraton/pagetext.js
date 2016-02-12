var system = require('system');
var webPage = require('webpage');
var page = webPage.create();

page.customHeaders = {
    'User-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:41.0) Gecko/20100101 Firefox/41.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'http://www.google.com',
};

debug_messages = ''

page.onConsoleMessage = function (msg) {debug_messages += '\n' + msg}
page.onError = function () {}
page.onAlert = function () {}

setTimeout(function () {
    console.log('Error: Timeout reached')
    phantom.exit()
}, 15000)

page.open(system.args[1], function (status) {
    setTimeout(function () {
        page.evaluate(function () {
            (function () {
                if (document.body == null) {
                    body = document.createElement("body");
                    document.body = body;
                }
                
                var frames = document.querySelectorAll('frame')
                if (frames) {
                    var longestFrame = document.body
                    
                    for (var i = 0; i < frames.length; i++) {
                        var body = frames[i].contentWindow.document.body
                        if (body.textContent.length > longestFrame.textContent.length) {
                            longestFrame = body
                        }
                    }
                    
                    var frameset = document.querySelector('frameset')
                    
                    if (frameset) {
                        frameset.remove()
                        document.body = document.createElement("body");
                    }

                    document.body.innerHTML = longestFrame.innerHTML
                }

                // Remove extra elements
                var els = document.querySelectorAll('meta,style,script,noscript,iframe,link,object')
                for (var i = 0; i < els.length; i++) {
                    els[i].parentNode.removeChild(els[i])
                }

                document.body.innerHTML = grabArticle().innerHTML;
            })()

            function grabArticle() {
                var allParagraphs = document.getElementsByTagName("p");
                var topDivCount = 0;
                var topDiv = null;
                var topDivParas;
                
                // Replace all doubled-up <BR> tags with <P> tags, and remove fonts.
                var pattern =  new RegExp ("<br/?>[ \r\n\s]*<br/?>", "g");
                document.body.innerHTML = document.body.innerHTML.replace(pattern, "</p><p>").replace(/<\/?font[^>]*>/g, '');
                
                // Study all the paragraphs and find the chunk that has the best score.
                // A score is determined by things like: Number of <p>'s, commas, special classes, etc.
                for (var j=0; j	< allParagraphs.length; j++) {
                    parentNode = allParagraphs[j].parentNode;

                    // Initialize readability data
                    if(typeof parentNode.readability == 'undefined') {
                        parentNode.readability = {"contentScore": 0};
                    }
                    
                    parentNode.readability.contentScore += getMetaScore(parentNode);
                    
                    // Add a point for the paragraph found
                    if(allParagraphs[j].textContent.length > 10) {
                        parentNode.readability.contentScore++;
                    }

                    // Add points for any commas within this paragraph
                    parentNode.readability.contentScore += getCharCount(allParagraphs[j]);
                }

                // Assignment from index for performance. See http://www.peachpit.com/articles/article.aspx?p=31567&seqNum=5 
                for(nodeIndex = 0; (node = document.getElementsByTagName('*')[nodeIndex]); nodeIndex++) {
                    if(typeof node.readability != 'undefined' && (topDiv == null || node.readability.contentScore > topDiv.readability.contentScore)) {
                        topDiv = node;
                    }
                }

                if(topDiv == null) {
                  topDiv = document.createElement('div');
                }
                
                topDiv = removeExtraElements(topDiv);
                topDiv = combineBreaks(topDiv);

                topDiv = clean(topDiv, "form,h1,h2");
                topDiv = clean(topDiv, "table", 250);
                
                // Remove most attributes
                for(nodeIndex = 0; (node = document.getElementsByTagName('*')[nodeIndex]); nodeIndex++) {
                    for (var i = node.attributes.length - 1; i >= 0; i--) {
                        if (['href','src'].indexOf(node.attributes[i].name.toLowerCase()) < 0) {
                            node.removeAttributeNode(node.attributes[i]);
                        }
                    }
                }

                return topDiv;
            }
            
            function getMetaScore( e ) {
                var score = 0
                
                // Returns score based on element meta data (tag name, classes, and id) rather than actual content
                nodeProperties = e.tagName
                
                for (var i = 0; i < e.attributes.length; i++) {
                    nodeProperties += ' ' + e.attributes[i].name
                    nodeProperties += ' ' + e.attributes[i].value
                }
                
                // Look for a special classes, ids, and tag names
                if(nodeProperties.match(/(^|\s)(comment|meta|footer|footnote|ad|share|hidden|figure|caption)(\s|$)/i)) {
                    score -= 50;
                } else if(nodeProperties.match(/((^|\s)(post|hentry|entry[-]?(content|text|body)?|article[-]?(content|text|body)?)(\s|$))/i)) {
                    score += 25;
                }
                
                return score
            }    
                
            // Get character count
            function getCharCount ( e,s ) {
                s = s || ",";
                return e.textContent.split(s).length;
            }

            function removeExtraElements ( e ) {
                var divsList = e.querySelectorAll("*:not(p):not(ol):not(ul):not(a):not(span):not(b):not(i):not(u):not(em):not(strong):not(blockquote):not(pre):not(h1):not(h2):not(h3):not(h4):not(h5):not(h6)");
                var curDivLength = divsList.length;
                
                // Gather counts for other typical elements embedded within.
                // Traverse backwards so we can remove nodes at the same time without effecting the traversal.
                for (var i=curDivLength-1; i >= 0; i--) {
                    var p = divsList[i].getElementsByTagName("p").length;
                    var img = divsList[i].getElementsByTagName("img").length;
                    var li = divsList[i].getElementsByTagName("li").length;
                    var a = divsList[i].getElementsByTagName("a").length;
                    var embed = divsList[i].getElementsByTagName("embed").length;

                    // If the number of commas is less than 10 (bad sign) ...
                    if ( getCharCount(divsList[i]) < 10) {
                        // And the number of non-paragraph elements is more than paragraphs 
                        // or other ominous signs :
                        
                        if ( img > p || li > p || a > p || p == 0 || embed > 0 || getMetaScore(divsList[i]) < 0) {
                            divsList[i].parentNode.removeChild(divsList[i]);
                        }
                    }
                }
                return e;
            }

            function combineBreaks ( e ) {
                e.innerHTML = e.innerHTML.replace(/(<br\s*\/?>(\s|&nbsp;?)*){1,}/g,'<br />');
                return e;
            }

            function clean(e, selector, minWords) {
                var targetList = e.querySelectorAll( selector );
                minWords = minWords || 1000000;

                for (var y=0; y < targetList.length; y++) {
                    // If the text content isn't laden with words, remove the child:
                    if (getCharCount(targetList[y], " ") < minWords) {
                        targetList[y].parentNode.removeChild(targetList[y]);
                    }
                }
                return e;
            }
        })
        
        function cleanText(text) {
            text = text.replace(/<!--[\s\S]*?-->/g, "")
            text = text.replace(/[\t ]+/g, " ")
            text = text.replace(/\n /g, "\n")
            text = text.replace(/\n\n+/g, "\n\n")
            return text
        }
        
        result = {
            'title':cleanText(page.title),
            'html':cleanText(page.content),
            'debug_messages':debug_messages,
        }
        
        // Add some markdown to the DOM so that it is included in the plain text
        page.evaluate(function () {
            list_items = document.querySelectorAll('li')
            
            for (var i = 0; i < list_items.length; i++) {
                list_items[i].textContent = '- ' + list_items[i].textContent
            }

            headers = document.querySelectorAll('h1,h2,h3,h4,h5,h6')
            
            for (var i = 0; i < headers.length; i++) {
                prefix = ''
                
                for (var level = 0; level < headers[i].tagName[1]; level++) {
                    prefix += '#'
                }
                headers[i].textContent = prefix + ' ' + headers[i].textContent
            }
        })
        
        result['text'] = cleanText(page.plainText)
            
        console.log(JSON.stringify(result))
        phantom.exit();
    }, 5000)
});
