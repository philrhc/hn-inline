(function() {
    console.log("script injected");

    async function insertComments(inlineComments) {
        console.log(inlineComments);

        inlineComments.sort((a, b) => findQuote(b.comment_text).length - findQuote(a.comment_text).length);

        for (let comment of inlineComments) {
            const { author, comment_text: text, objectID } = comment;
            const link = linkToComment(objectID);
            const quote = findQuote(text);
            const commentOnQuote = findComment(text);
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
    return `https://news.ycombinator.com/item?id=${commentId}`;
}

function findQuote(comment) {
    const split = comment.split("<p>")[0];
    const decoded = decodeHtml(split);

    // Remove the indent char and the whitespace formatting
    const indentRemoved = decoded.replace(">", "").trim();

    // Commenters sometimes then use quotes
    if (indentRemoved.startsWith('"') && indentRemoved.endsWith('"')) {
        return indentRemoved.slice(1, -1); // Remove the quote
    }
    return indentRemoved;
}

function findComment(comment) {
    const split = comment.split("<p>").slice(1);
    const recombined = recombineComment(split);
    const decoded = decodeHtml(recombined);
    return decoded.trim();
}

function recombineComment(splitComment) {
    return splitComment.join('<br />');
}

function decodeHtml(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc.documentElement.textContent;
}

function matchElement(quote) {
    const quoteEscaped = quote.replace(/"/g, '&quot;');

    const xpaths = [
        `//p[contains(normalize-space(text()),"${quoteEscaped}")]`, // First attempt to find p element containing text
        `//text()[contains(normalize-space(.),"${quoteEscaped}")]`,  // Now try all text elements
    ];
    for (const xpath of xpaths) {
        const matchingElement = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (matchingElement.singleNodeValue != null) {
            return matchingElement.singleNodeValue;
        }
    }
}

function highlight(quote, author, comment, link) {
    const matchingElement = matchElement(quote);
    if (!matchingElement) {
        console.log("Did not find: " + quote);
        return;
    }

    const allText = matchingElement.textContent.replace(/\n/g, ' ');
    const [textBefore, textAfter] = allText.split(quote);

    const highlightDiv = divWithClassName("hn-inline-highlight");
    highlightDiv.addEventListener("click", () => {
        window.location.href = link;
    });

    const extensionDiv = divWithClassName("hn-inline-extension");
    const extensionHeaderDiv = divWithClassName("hn-inline-extension-header");
    const commentDiv = document.createElement('div');
    extensionHeaderDiv.appendChild(createAuthorElement(author));

    const commentTextDiv = divWithClassName("hn-inline-comment-text");
    addText(commentTextDiv, comment);
    commentDiv.appendChild(extensionHeaderDiv);
    commentDiv.appendChild(commentTextDiv);
    extensionDiv.appendChild(commentDiv);
    highlightDiv.appendChild(document.createTextNode(quote));
    highlightDiv.appendChild(extensionDiv);

    const container = document.createElement('div');
    if (textBefore) {
        container.appendChild(document.createTextNode(textBefore));
    }
    container.appendChild(highlightDiv);
    if (textAfter) {
        container.appendChild(document.createTextNode(textAfter));
    }
    matchingElement.replaceWith(container);
}

function createAuthorElement(author) {
    const authorA = document.createElement("a");
    authorA.innerText = author;
    return authorA;
}

function addText(node, text) {
    text.split(/<br\s*\/?>/i).forEach((part, index) => {
        if (index > 0) node.appendChild(document.createElement('br'));
        if (part.trim()) node.appendChild(document.createTextNode(part));
    });
}

function divWithClassName(className) {
    const div = document.createElement("div");
    div.className = className;
    return div;
}