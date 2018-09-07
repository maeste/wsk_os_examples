function main(params) {
    var s = params.text
    reversed = s.split("").reverse().join("");
    return { text: reversed };
}
