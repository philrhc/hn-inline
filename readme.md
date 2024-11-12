# HN Inline
## an experimental inline quote highlighter

When clicking links on HN, comments that quote the article are highlighted.

![one](./screenshots/one.jpeg)
![two](./screenshots/two.jpeg)
![three](./screenshots/three.jpeg)


### inside
The content script listens for a click on an article and then messages the background script with the URL and submission ID. The comments are then retrieved from the Algolia API and then sent to an injected script to find and highlight the quotes/comments.

because of the permissions required to work, i probably won’t package this up and distribute it. If you would like to use it in chrome, you can easily add the folder as an unpackaged extension, firefox makes this a little more tricky, it can be built using web-ext, i use it from here: https://addons.mozilla.org/en-US/firefox/addon/hn-inline/

the manifest.json is set up for chrome right now, for firefox the manifest is in /manifests/firefox.json

there is a bug when quotes overlap but apart from that I am happy with the success rate.

the icons were made by https://caballe.ro/
