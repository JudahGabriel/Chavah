import Dialog = require("plugins/dialog");

class UpgradeBrowserDialog {
    close() {
        Dialog.close(this);
    }
}

export = UpgradeBrowserDialog;