const links = document.querySelectorAll('.titleline a:not(.sitebit.comhead a)');
        links.forEach(function(link) {
            link.addEventListener('click', function(event) {
                //event.preventDefault(); // Prevent default anchor behavior
                console.log(event);
                const parentElement = link.closest('.athing');
                console.log(parentElement.id);
                console.log(event.target.href)
                chrome.runtime.sendMessage({link: event.target.href});
            });
        });


async function getQuoteComments(submissionId) {

}