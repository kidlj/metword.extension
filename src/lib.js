"use strict";
exports.__esModule = true;
var skips = new Map([
    ["HEAD", true],
    ["SCRIPT", true],
    ["STYLE", true],
    ["PRE", true],
    ["CODE", true],
    ["SAMP", true],
    ["TEXTAREA", true],
    ["IMG", true],
    ["SVG", true],
    ["CANVAS", true],
    ["VIDEO", true],
    ["AUDIO", true],
    ["FORM", true],
    ["INPUT", true],
    ["SELECT", true],
    ["BUTTON", true],
    ["A", true],
    ["MARK", true],
    ["INS", true],
    ["DEL", true],
    ["SUP", true],
    ["SUB", true],
    ["SMALL", true],
    ["BIG", true],
    ["CITE", true],
    ["FIELDSET", true],
    ["LEGEND", true],
    ["CAPTION", true],
    ["LABEL", true],
    ["OBJECT", true],
    ["VAR", true],
    ["KBD", true],
]);
function getWordRanges(n, m) {
    // ELEMENT_NODE
    if (n.nodeType == 1 && skips.get(n.nodeName) == true) {
        return m;
    }
    // TEXT_NODE
    if (n.nodeType == 3) {
        var wordIndexes = getWordIndexes(n.nodeValue);
        wordIndexes.forEach(function (v) {
            if (m.get(v.word) == undefined) {
                var range = document.createRange();
                range.setStart(n, v.start);
                range.setEnd(n, v.end);
                m.set(v.word, {
                    node: n,
                    times: 0,
                    range: range
                });
            }
        });
    }
    for (var c = n.firstChild; c != null; c = c.nextSibling) {
        m = getWordRanges(c, m);
    }
    return m;
}
exports.getWordRanges = getWordRanges;
function getWordIndexes(s) {
    var indexes = new Array();
    var inWord = false;
    var start = 0;
    var end = s.length;
    for (var i = 0; i < s.length; i++) {
        var c = s[i];
        if (isWordCharacter(c) && inWord == false && (i == 0 || isSpaceCharacter(s[i - 1]))) {
            inWord = true;
            start = i;
        }
        if (isWordDelimiter(c) && inWord == true) {
            inWord = false;
            end = i;
            var word = s.slice(start, end).toLowerCase();
            var wordIndex = {
                word: word,
                start: start,
                end: end
            };
            indexes.push(wordIndex);
        }
        if (i == s.length - 1 && inWord == true) {
            inWord = false;
            end = s.length;
            var word = s.slice(start, end).toLowerCase();
            var wordIndex = {
                word: word,
                start: start,
                end: end
            };
            indexes.push(wordIndex);
        }
        if (!isWordCharacter(c)) {
            inWord = false;
        }
    }
    return indexes;
}
exports.getWordIndexes = getWordIndexes;
function isWordCharacter(s) {
    var re = /^[a-zA-Z]$/;
    return re.test(s);
}
function isSpaceCharacter(s) {
    var re = /^\s$/;
    return re.test(s);
}
function isWordDelimiter(s) {
    var re = /^[\s\.,!?;:]$/;
    return re.test(s);
}
