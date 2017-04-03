InboxSDK.load('1.0', 'sdk_secure-mail_47311eefae').then(function (sdk) {

    // the SDK has been loaded, now do something with it!
    sdk.Compose.registerComposeViewHandler(function (composeView) {

        // a compose view has come into existence, do something with it!
        composeView.addButton({
            title: "Encrypt this message",
            iconUrl: 'https://lh5.googleusercontent.com/itq66nh65lfCick8cJ-OPuqZ8OUDTIxjCc25dkc4WUT1JG8XG3z6-eboCu63_uDXSqMnLRdlvQ=s128-h128-e365',
            onClick: function (event) {
                var currentText = event.composeView.getTextContent();
                var recipients = event.composeView.getToRecipients();

                if (recipients.length == 0) {
                    alert("Add recipient before encrypting");
                    return;
                }

                var recipientEmail = recipients[0].emailAddress;
                var passphrase = prompt("Enter your passphrase:");

                chrome.runtime.sendMessage({
                        type: 'encrypt_message',
                        to: recipientEmail,
                        content: currentText,
                        passPhrase: passphrase
                    },
                    function (response) {
                    console.log(response);
                        if(response.type == 'ciphertext'){
                            var res = response.content;
                            event.composeView.setBodyHTML(res);
                        } else if(response.type == 'error'){
                            alert(response.content);
                        }
                    });

            }
        });

        var insertImgUrl = chrome.extension.getURL("icons/insert.png");

        composeView.addButton({

            title: "Insert Your Public Key",
            iconUrl: insertImgUrl,
            onClick: function (event) {

                chrome.storage.sync.get("publicKey", function (items) {
                    var publicKey = (items.publicKey);

                    if (publicKey) {
                        event.composeView.insertTextIntoBodyAtCursor(publicKey);
                    } else {
                        alert("You do not have a keypair yet, set one in the options page");
                    }
                });


            }
        });
    });

    sdk.Conversations.registerMessageViewHandler(function (messageView) {
        var messageContent = messageView.getBodyElement();
        var cleaned = strip_tags(messageContent.innerHTML, '');

        var key = getKeyFromText(cleaned);
        var senderEmail = messageView.getSender().emailAddress;

        var hasKey = false;
        var hasEncryptedMessage = false;
        var encryptedMessage;

        if (key != null) {
            hasKey = true;
        } else {
            encryptedMessage = getEncryptedMessageFromText(cleaned);
            if(encryptedMessage != null){
                hasEncryptedMessage = true;
            }
        }


        if (hasKey) {
            messageView.addAttachmentCardView({
                title: "Store Public Key",
                description: "Add public key for " + senderEmail + " to your secure messsaging group",
                previewUrl: "",
                previewThumbnailUrl: 'https://lh5.googleusercontent.com/itq66nh65lfCick8cJ-OPuqZ8OUDTIxjCc25dkc4WUT1JG8XG3z6-eboCu63_uDXSqMnLRdlvQ=s128-h128-e365',
                failoverPreviewIconUrl: 'https://lh5.googleusercontent.com/itq66nh65lfCick8cJ-OPuqZ8OUDTIxjCc25dkc4WUT1JG8XG3z6-eboCu63_uDXSqMnLRdlvQ=s128-h128-e365',
                previewOnClick: function (attachmentCardView) {
                    attachmentCardView.preventDefault();

                    chrome.runtime.sendMessage({
                            type: "storekey",
                            email: senderEmail,
                            key: key
                        },
                        function (response) {
                            if(response.type == 'success'){
                                alert("Saved Public Key for " + senderEmail);
                            } else if(response.type == 'error'){
                                alert(response.content);
                            }
                        });
                },
                fileIconImageUrl: 'https://lh5.googleusercontent.com/itq66nh65lfCick8cJ-OPuqZ8OUDTIxjCc25dkc4WUT1JG8XG3z6-eboCu63_uDXSqMnLRdlvQ=s128-h128-e365',
                buttons: [{
                    iconUrl: 'https://lh5.googleusercontent.com/itq66nh65lfCick8cJ-OPuqZ8OUDTIxjCc25dkc4WUT1JG8XG3z6-eboCu63_uDXSqMnLRdlvQ=s128-h128-e365',
                    tooltip: "Action from button",
                    onClick: function (attachmentCardClickEvent) {
                        var storeObj = {};
                        storeObj[senderEmail] = key;
                        chrome.storage.sync.set(storeObj, function () {
                            alert("Saved Public Key for " + senderEmail);
                        });
                    }
                }],
            });
        }

        if(hasEncryptedMessage){
            messageView.addAttachmentCardView({
                title: "Decrypt Message",
                description: "Decrypt this message",
                previewUrl: "",
                previewThumbnailUrl: 'https://lh5.googleusercontent.com/itq66nh65lfCick8cJ-OPuqZ8OUDTIxjCc25dkc4WUT1JG8XG3z6-eboCu63_uDXSqMnLRdlvQ=s128-h128-e365',
                failoverPreviewIconUrl: 'https://lh5.googleusercontent.com/itq66nh65lfCick8cJ-OPuqZ8OUDTIxjCc25dkc4WUT1JG8XG3z6-eboCu63_uDXSqMnLRdlvQ=s128-h128-e365',
                previewOnClick: function (attachmentCardView) {
                    attachmentCardView.preventDefault();
                    var passphrase = prompt("Please enter your passphrase:");

                    chrome.runtime.sendMessage({
                            type: 'decrypt_message',
                            from: senderEmail,
                            content: cleaned,
                            passPhrase: passphrase
                        },
                        function (response) {
                            console.log(response);
                            if(response.type == 'cleartext'){
                                //TODO: Probably vulnerable to XSS
                                messageView.getBodyElement().textContent = response.content;
                            } else if(response.type == 'error'){
                                alert(response.content);
                            }
                        });


                },
                fileIconImageUrl: 'https://lh5.googleusercontent.com/itq66nh65lfCick8cJ-OPuqZ8OUDTIxjCc25dkc4WUT1JG8XG3z6-eboCu63_uDXSqMnLRdlvQ=s128-h128-e365',
                buttons: [{
                    iconUrl: 'https://lh5.googleusercontent.com/itq66nh65lfCick8cJ-OPuqZ8OUDTIxjCc25dkc4WUT1JG8XG3z6-eboCu63_uDXSqMnLRdlvQ=s128-h128-e365',
                    tooltip: "Action from button",
                    onClick: function (attachmentCardClickEvent) {

                    }
                }],
            });
        }

    });

});


