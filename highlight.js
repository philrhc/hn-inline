(function() {
    console.log("script injected");

    async function insertComments(inlineComments) {
        console.log(inlineComments);
        for (var i = 0; i < inlineComments.length; i++) {
          let comment = inlineComments[i];
          let author = comment.author;
          let text = comment.comment_text;
          let link = linkToComment(comment.objectID)
          let quote = findQuote(text);
          let commentOnQuote = findComment(text);
          highlight(quote, author, commentOnQuote, link);
        }
      }


    chrome.runtime.onMessage.addListener((message) => {
      if (message.command === "highlight") {
        insertComments(message.data);
      }
    });
})();

function linkToComment(commentId) {
  return "https://news.ycombinator.com/item?id=" + commentId
}

function findQuote(comment) {
  let split = comment.split("<p>")[0];
  let indentRemoved = split.replace("&gt;", "");
  let quotesRemoved = indentRemoved.replace("&quot;", "");
  let decoded = decodeHtml(quotesRemoved)
  let quotedAgainRemoved = decoded.replace('"', "");
  let trimmed = quotedAgainRemoved.trim();
  return trimmed;
}

function findComment(comment) {
  let split = comment.split("<p>").slice(1);
  let recombined = recombineComment(split);
  let decoded = decodeHtml(recombined);
  let quotedAgainRemoved = decoded.replace('"', "");
  let trimmed = quotedAgainRemoved.trim();
  return trimmed;
}

function recombineComment(splitComment) {
  let comment = "";
  for (var i = 0; i < splitComment.length; i++) {
    comment += splitComment[i];
    if (i != splitComment.length - 1) {
      comment += '<br />';
    }
  }
  return comment;
}

function decodeHtml(html) {
  var txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function matchElement(quote) {
  xpaths = [
    `//p[contains(normalize-space(text()),"${quote}")]`, //first attempt to find p element containing text
    `//text()[contains(normalize-space(.),"${quote}")]`,  //now try all text elements TODO: optimise to ignore the previously searched kids of p
  ];
  for (const xpath of xpaths) {
    var matchingElement = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    if (matchingElement.singleNodeValue != null) {
      return matchingElement.singleNodeValue;
    }
  } 
}

function highlight(quote, author, comment, link) {
  const matchingElement = matchElement(quote);
  if (matchingElement == undefined) {
    console.log("Did not find: " + quote);
    return;
  }

  let allText = matchingElement.textContent.replace(/\n/g, ' ');
  let textBefore = allText.split(quote)[0];
  let textAfter = allText.split(quote)[1];
  
  const highlightDiv = divWithClassName("hn-inline-highlight");
  highlightDiv.addEventListener("click", function() {
    window.location.href = link;
  });
  const quotedTextNode = document.createTextNode(quote);
  const extensionDiv = divWithClassName("hn-inline-extension");
  const extensionHeaderDiv = divWithClassName("hn-inline-extension-header");
  const authorA = document.createElement("a");
  authorA.innerText = author;
  extensionHeaderDiv.appendChild(authorA);
  const commentDiv = divWithClassName("hn-inline-comment")
  addText(commentDiv, comment);
  extensionDiv.appendChild(extensionHeaderDiv);
  extensionDiv.appendChild(commentDiv);
  highlightDiv.appendChild(quotedTextNode);
  highlightDiv.appendChild(extensionDiv);

  const container = document.createElement('div');
  if (textBefore != undefined) {
    container.appendChild(document.createTextNode(textBefore));
  }
  container.appendChild(highlightDiv);
  if (textAfter != undefined) {
    container.appendChild(document.createTextNode(textAfter));
  }
  else {
    document.createTextNode('');
  }
  matchingElement.replaceWith(container);
}

function addText(node,text){     
  var t=text.split(/\s*<br ?\/?>\s*/i),
      i;
  if(t[0].length>0){         
    node.appendChild(document.createTextNode(t[0]));
  }
  for(i=1;i<t.length;i++){
     node.appendChild(document.createElement('BR'));
     if(t[i].length>0){
       node.appendChild(document.createTextNode(t[i]));
     }
  } 
}   

function divWithClassName(className) {
  const div = document.createElement("div")
  div.className = className;
  return div
}