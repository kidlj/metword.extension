import { getWordRanges, WordRange } from './lib'

async function start() {
    console.log("Metwords worker started")
    let url = "http://127.0.0.1:8080/word/mets"

    try {
        const res = await fetch(url)
        const result = JSON.parse(await res.text())
        console.log("success:", result.success)
        const mets = result.mets
        let ranges = new Map<string, WordRange>()
        ranges = getWordRanges(document.getRootNode(), ranges)
        ranges.forEach((val, key) => {
            console.log(key)
            if (mets[key] == undefined) {
                ranges.delete(key)
            } else {
                val.times = mets[key]
            }
        })
        console.log(ranges)
        for (let range of ranges.values()) {
            markWord(range)
        }
    } catch (err) {
        console.trace("errored", err)
    }
}

start()

document.onload = function (e: Event) {
    start()
}

function markWord(range: WordRange) {
    let span = document.createElement("span")
    span.classList.add("metword")
    span.setAttribute("times", range.times.toString())
    span.style.textDecorationLine = "underline"
    span.style.textDecorationColor = "red"
    span.style.textDecorationStyle = "solid"
    span.style.textUnderlinePosition = "under"
    range.range.surroundContents(span)
}