import Dialog = require("plugins/dialog");

class PromptSignIn {

    constructor() {
    }

    signIn() {
        navigator.id.request({
            siteName: 'Chavah Messianic Radio',
            oncancel: function () { }
        });
        this.close();
    }

    close() {
        Dialog.close(this);
    }
}

export = PromptSignIn;