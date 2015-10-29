var system = require('system');
var webPage = require('webpage');
var page = webPage.create();

page.customHeaders = {
    'User-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:41.0) Gecko/20100101 Firefox/41.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'http://www.google.com',
};

page.onConsoleMessage = function () {}
page.onError = function () {}
page.onAlert = function () {}

setTimeout(function () {
    console.log('Error: Timeout reached')
    phantom.exit()
}, 30000)

page.open(system.args[1], function (status) {
    page.evaluate(function () {
        (function(){
            if (document.body == null) {
                body = document.createElement("body");
                document.body = body;
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

                    // Look for a special classname
                    if(parentNode.className.match(/(comment|meta|footer|footnote)/)) {
                        parentNode.readability.contentScore -= 50;
                    } else if(parentNode.className.match(/((^|\\s)(post|hentry|entry[-]?(content|text|body)?|article[-]?(content|text|body)?)(\\s|$))/)) {
                        parentNode.readability.contentScore += 25;
                    }

                    // Look for a special ID
                    if(parentNode.id.match(/(comment|meta|footer|footnote)/)) {
                        parentNode.readability.contentScore -= 50;
                    } else if(parentNode.id.match(/^(post|hentry|entry[-]?(content|text|body)?|article[-]?(content|text|body)?)$/)) {
                        parentNode.readability.contentScore += 25;
                    }
                }

                // Add a point for the paragraph found
                if(allParagraphs[j].textContent.length > 10) {
                    parentNode.readability.contentScore++;
                }

                // Add points for any commas within this paragraph
                parentNode.readability.contentScore += getCharCount(allParagraphs[j]);
            }

            // Assignment from index for performance. See http://www.peachpit.com/articles/article.aspx?p=31567&seqNum=5 
            for(nodeIndex = 0; (node = document.getElementsByTagName('*')[nodeIndex]); nodeIndex++)
                if(typeof node.readability != 'undefined' && (topDiv == null || node.readability.contentScore > topDiv.readability.contentScore)) {
                    topDiv = node;
                }

            if(topDiv == null) {
              topDiv = document.createElement('div');
            }
            
            topDiv = removeExtraDivs(topDiv);
            topDiv = combineBreaks(topDiv);

            topDiv = clean(topDiv, "form,object,h1,h2,iframe");
            topDiv = clean(topDiv, "table", 250);
            
            return topDiv;
        }

        // Get character count
        function getCharCount ( e,s ) {
            s = s || ",";
            return e.textContent.split(s).length;
        }

        function removeExtraDivs ( e ) {
            var divsList = e.getElementsByTagName( "div" );
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
                    if ( img > p || li > p || a > p || p == 0 || embed > 0) {
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
    
    console.log(JSON.stringify({
        'title':page.title,
        'text':page.plainText,
        'html':page.content,
    }))
    phantom.exit();
});
