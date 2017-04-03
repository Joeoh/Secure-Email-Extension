document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('newContent').textContent = "Heres some dynamic text";

    // Get a value saved in a form.
    var theValue = "Test Local Storage";

    // Read it using the storage API
    chrome.storage.sync.get(['foo'], function(items) {
        document.getElementById('newContent').textContent = items.foo;
    });
});