import { getWordIndexes, getWordRanges, WordRange } from './lib'
import { JSDOM } from 'jsdom'
import { expect, Test, TestSuite, FTestSuite } from 'testyts';


@FTestSuite()
export class MyTestSuite {
    @Test()
    testGetWordIndexes() {
        const s = "Hello world, 你好 mellon. 再见 collie! Now? later; see: sec0nd_ para-graph"
        let result = getWordIndexes(s)
        expect.toBeEqual(result, [
            {
                "word": "hello",
                "start": 0,
                "end": 5,
            },
            {
                "word": "world",
                "start": 6,
                "end": 11
            },
            {
                "word": "mellon",
                "start": 16,
                "end": 22
            },
            {
                "word": "collie",
                "start": 27,
                "end": 33
            },
            {
                "word": "now",
                "start": 35,
                "end": 38
            },
            {
                "word": "later",
                "start": 40,
                "end": 45
            },
            {
                "word": "see",
                "start": 47,
                "end": 50
            }
        ])
    }
}

@FTestSuite()
export class RangeTestSuite {
    @Test()
    testGetWordRanges() {

        const html_string = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test getWordNodeIndexes</title>
</head>

<body>
    <div class="main">
        <article>
            <p id="first">Hello world.</p>
            <p id="second">The sec0nd_ para-graph.</p>
            <p id="three">这里是中文。</p>
            <p id="four">Hello world.</p>
        </article>
    </div>
</body>

</html>
`
        const dom = new JSDOM(html_string)
        const node = dom.window.document.getRootNode()
        let ranges = new Map<string, WordRange>()
        ranges = getWordRanges(node, ranges)

        const first = dom.window.document.getElementById("first")!.firstChild as Node
        const second = dom.window.document.getElementById("second")!.firstChild as Node

        const helloRange = dom.window.document.createRange()
        helloRange.setStart(first, 0)
        helloRange.setEnd(first, 5)

        const worldRange = dom.window.document.createRange()
        worldRange.setStart(first, 6)
        worldRange.setEnd(first, 11)

        const theRange = dom.window.document.createRange()
        theRange.setStart(second, 0)
        theRange.setEnd(second, 3)

        expect.toBeEqual(ranges, new Map(
            [
                ["hello", {
                    "times": 0,
                    "node": first,
                    "range": helloRange
                }],
                ["world", {
                    "times": 0,
                    "node": first,
                    "range": worldRange
                }],
                ["the", {
                    "times": 0,
                    "node": second,
                    "range": theRange
                }]
            ]
        ))
    }
}