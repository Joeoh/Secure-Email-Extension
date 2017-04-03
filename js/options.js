document.addEventListener('DOMContentLoaded', function () {


    //Register listener here as onclick is not allowed
    document.getElementById("generatePassPhrase").onclick = function() {generateKeyPair()};

    chrome.storage.sync.get("publicKey", function(items) {
        var publicKey =  (items.publicKey);

        if(publicKey){
            document.getElementById('createKey').innerHTML = "You have a key <br><textarea>"+publicKey+"</textarea>";
        } else {
            console.log("No Key");
        }
    });


    chrome.storage.sync.get(null, function(items) {



        var allKeys = Object.keys(items);
        var tableOfContacts = "<h2>You have keys for: </h2><table border='1'><thead><td>Email</td></thead>";

        if(allKeys.length <=2) return;

        for(var i = 0; i < allKeys.length;i ++){
            var currentKey = allKeys[i];

            if(currentKey == "publicKey" || currentKey == "privateKey") break;
            tableOfContacts += "<tr><td>"+currentKey+"</td><td><a href='#' class='delete' data-email='"+currentKey+"'>X</a></td></tr>";
        }

        tableOfContacts += "</table>";
        document.getElementById('contactKeys').innerHTML = tableOfContacts;

        var anchors = document.getElementsByClassName('delete');
        for(var i = 0; i < anchors.length; i++) {
            var anchor = anchors[i];
            anchor.onclick = function() {
                var email = anchor.getAttribute('data-email');
                chrome.storage.sync.remove(email,function (items) {
                    alert('Removed ' + email + ' from secure messaging group');

                });
            }
        }


    });



});



var openpgp = window.openpgp; // use as CommonJS, AMD, ES6 module or via window.openpgp
openpgp.initWorker({ path:'js/openpgp.worker.min.js' }) // set the relative web worker path



function generateKeyPair(){

    var name = document.getElementById('name').value;
    var email = document.getElementById('email').value;
    var passPhrase = document.getElementById('passPhrase').value;

    generateAndStoreKeyPair(name,email,passPhrase);

}

function generateAndStoreKeyPair(name, email,passphrase){

    var options = {
        userIds: [{ name:name, email:email}], // multiple user IDs
        numBits: 2048,                  // RSA key size
        passphrase: passphrase         // protects the private key
    };

    openpgp.generateKey(options).then(function(key) {
        var privkey = key.privateKeyArmored; // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
        var pubkey = key.publicKeyArmored;   // '-----BEGIN PGP PUBLIC KEY BLOCK ... '

        chrome.storage.sync.set({'publicKey': pubkey, 'privateKey' : privkey}, function() {
            document.getElementById('createKey').textContent = "Key generated and saved!";

        });

    });

}