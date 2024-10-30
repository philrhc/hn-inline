class TabListener {

  setLink(link) {
    this.link = link;
    this.ran = false; 
  }

  onUpdate = async (tabId, changeInfo, tab) => {
    if (this.ran == false //only run once per page
        && tab.url == this.link.url 
        && changeInfo.status == "complete") {
      const quoteComments = await getQuoteComments(this.link.id);
      if (quoteComments.length > 0) {
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ["hn-inline.css"],
        });
        await chrome.scripting.executeScript({
          target : { tabId : tab.id },
          files : [ "highlight.js" ],
        });
        chrome.tabs.sendMessage(tab.id, {
          command: "highlight",
          data: quoteComments
        });
        this.ran = true;
      }
    }
  }
}

const tabListener = new TabListener(); 

chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    if (request.command == "clicked") {
      tabListener.setLink(request);
      chrome.tabs.onUpdated.addListener(tabListener.onUpdate);
    }
  }
);

//not necessary right now - may as well listen on all tabs
async function getCurrentTab() {
      let queryOptions = { active: true, lastFocusedWindow: true };
      let [tab] = await chrome.tabs.query(queryOptions);
      return tab;
}

async function getQuoteComments(submissionId) {
  console.log("Getting comments on submissionId: " + submissionId);

  let quotedComments = [];
  let commentsResponse = await fetch(`https://hn.algolia.com/api/v1/search?tags=comment,story_${submissionId}&hitsPerPage=200`);
  let comments = await commentsResponse.json();
  let pagesOfComments = comments.nbPages;
  let currentPage = 0;

  console.log("Received number of pages: " + pagesOfComments);
  do {
    for (j = 0; j < comments.hits.length; j++) {
      const comment = comments.hits[j];
      if (isTopLevelComment(comment) && searchCommentForQuoteSymbol(comment)) {
          quotedComments.push(comment);
          console.log(comment.comment_text);
      }
    }
    currentPage++;
    if (pagesOfComments > 1) {
      commentsResponse = await fetch(`https://hn.algolia.com/api/v1/search?tags=comment,story_${submissionId}&page=${currentPage}&hitsPerPage=200`);
      comments = await commentsResponse.json();
    }
  } while (currentPage < pagesOfComments)
    
  return quotedComments;
}

function isTopLevelComment(comment) {
  return comment.parent_id == comment.story_id;
}

function searchCommentForQuoteSymbol(comment) {
  return comment.comment_text.startsWith("&gt;");
}
