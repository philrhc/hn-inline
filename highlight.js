class Comment {
    constructor(author, comment, link) {
        this.author = author;
        this.comment = comment;
        this.link = link;
    }
}

(function() {
    console.log("hn inline comments loaded");

    async function insertComments(inlineComments) {
        inlineComments.sort((a, b) => findQuote(a.comment_text).length - findQuote(b.comment_text).length);

        while (inlineComments.length > 0) {
            const comment = inlineComments.pop();
            const quote = findQuote(comment.comment_text);
            const associatedComments = [new Comment(comment.author, findComment(comment.comment_text), linkToComment(comment.objectID))];
            for (let i = 0; i < inlineComments.length; i++) {
                const each = inlineComments[i];
                otherQuote = findQuote(each.comment_text);
                if (quote.includes(otherQuote)) {
                    inlineComments.splice(i, 1);
                    associatedComments.push(new Comment(each.author, findComment(each.comment_text), linkToComment(each.objectID)));
                    i--; // Adjust index after removal
                }
            }
            highlightMultiple(quote, associatedComments);
        }
    }

    chrome.runtime.onMessage.addListener((message) => {
        if (message.command === "highlight") {
            insertComments(message.data);
        }
    });
})();

function linkToComment(commentId) {
    // Validate that commentId is a number
    if (!/^\d+$/.test(commentId)) {
        console.error("Invalid commentId: must be a number");
        return null;
    }
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
    const quoteRemoved = comment.split("<p>").slice(1).join('<br />');
    const decoded = decodeHtml(quoteRemoved);
    return decoded.trim();
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

function highlightMultiple(quote, associatedComments) {
    const matchingElement = matchElement(quote);
    if (!matchingElement) {
        console.log("Did not find: " + quote);
        return;
    }

    const allText = matchingElement.textContent.replace(/\n/g, ' ');
    const [textBefore, textAfter] = allText.split(quote);

    const highlightDiv = divWithClassName("hn-inline-highlight");
    if (associatedComments[0].link) {
        highlightDiv.addEventListener("click", () => {
            window.location.href = link;
        });
    }

    const extensionDiv = divWithClassName("hn-inline-extension");
    for (const each of associatedComments) {
        const extensionHeaderDiv = divWithClassName("hn-inline-extension-header");
        extensionHeaderDiv.appendChild(createAuthorElement(each.author));
        const commentTextDiv = divWithClassName("hn-inline-comment-text");
        addText(commentTextDiv, each.comment);
        const commentDiv = document.createElement('div');
        commentDiv.appendChild(extensionHeaderDiv);
        commentDiv.appendChild(commentTextDiv);
        extensionDiv.appendChild(commentDiv);
    }
    
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