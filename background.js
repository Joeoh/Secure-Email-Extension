var openpgp = window.openpgp; // use as CommonJS, AMD, ES6 module or via window.openpgp
openpgp.initWorker({ path:'js/openpgp.worker.min.js'}); // set the relative web worker path




chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.type == 'encrypt_message') {
        var recipientEmail = msg.to;
        var passphrase = msg.passPhrase;
        var toEncrypt = msg.content;

        chrome.storage.sync.get([recipientEmail, "publicKey", "privateKey"], function (items) {
            var receiverKey = items[recipientEmail];
            if (receiverKey != null) {
                var privKeyString = items.privateKey;
                var privKeyObj = openpgp.key.readArmored(privKeyString).keys[0];
                privKeyObj.decrypt(passphrase);

                options = {
                    data: toEncrypt,                             // input as String (or Uint8Array)
                    publicKeys: openpgp.key.readArmored(receiverKey).keys,  // for encryption
                    privateKeys: privKeyObj // for signing (optional)
                };

                openpgp.encrypt(options).then(function(ciphertext) {
                    var encrypted = ciphertext.data;
                    sendResponse({
                        type: "ciphertext",
                        content: encrypted
                    });
                });

            } else {
                sendResponse({
                    type: "error",
                    content: "No key for user "+recipientEmail
                });
            }
        });
    }


    if(msg.type == 'decrypt_message'){

        var encryptedText = msg.content;
        console.log(encryptedText);
        var senderEmail = msg.from;
        var passPhrase = msg.passPhrase;

        chrome.storage.sync.get([senderEmail, "privateKey"], function (items) {
            var senderKey = items[senderEmail];
            var privateKey = items.privateKey;

            var privKeyObj = openpgp.key.readArmored(privateKey).keys[0];
            privKeyObj.decrypt(passPhrase);


            options = {
                message: openpgp.message.readArmored(encryptedText),     // parse armored message
                publicKeys: openpgp.key.readArmored(senderKey).keys,    // for verification (optional)
                privateKey: privKeyObj // for decryption
            };

            openpgp.decrypt(options).then(function(plaintext) {
                var clearText = plaintext.data;


                sendResponse({
                    type: "cleartext",
                    content: clearText
                });
            });


        });

    }

    if(msg.type == 'storekey'){

        var senderEmail = msg.email;
        var key = msg.key;

        var storeObj = {};
        storeObj[senderEmail] = key;
        chrome.storage.sync.set(storeObj, function () {
            sendResponse({type:"success"});
        });
    }

    //Return async
    return true;
});






