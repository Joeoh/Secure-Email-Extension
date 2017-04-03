/*
* From PHP.js
* */
function strip_tags (input, allowed) {
    allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('')
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi
    var commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi
    return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
        return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : ''
    })
}


function getKeyFromText(text){
    var start = "-----BEGIN PGP PUBLIC KEY BLOCK-----";
    var end = "-----END PGP PUBLIC KEY BLOCK-----";

    var startIndex = text.indexOf(start);
    if(startIndex == -1) return null;

    var endIndex = text.indexOf(end) + end.length;



    return text.substr(startIndex,endIndex);
}

function getEncryptedMessageFromText(text){
    var start = "-----BEGIN PGP MESSAGE-----";
    var end = "-----END PGP MESSAGE-----";

    var startIndex = text.indexOf(start);
    if(startIndex == -1) return null;

    var endIndex = text.indexOf(end) + end.length;



    return text.substr(startIndex,endIndex);
}