function paddingAction(args) {
    const leftPad = require("left-pad")
    var text = args.text ;
    return { text: leftPad(text, 30, "#") }
}

exports.main = paddingAction;
