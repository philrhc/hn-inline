const links = document.querySelectorAll('.titleline a:not(.sitebit.comhead a)');
        links.forEach(function(link) {
            link.addEventListener('click', function(event) {
                const parentElement = link.closest('.athing');
                chrome.runtime.sendMessage({
                    command: "clicked", 
                    url: event.target.href, 
                    id: parentElement.id
                });
            });
        });
