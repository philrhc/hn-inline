
chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {
    const link = request.link;
    const currentTab = await getCurrentTab();
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (tab.url == link && changeInfo.status == "complete") {
        console.log("hello new page")
      }
    });
  }
);

async function getCurrentTab() {
      let queryOptions = { active: true, lastFocusedWindow: true };
      let [tab] = await chrome.tabs.query(queryOptions);
      return tab;
}