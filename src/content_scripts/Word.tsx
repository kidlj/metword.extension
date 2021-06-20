
import React from 'react'
import { getSceneSentence, markWord, WordRange } from './lib'

const meetURL = "http://127.0.0.1:8080/word/meet"

interface WordProps {
	word: WordObject
	selectText: string
	range: Range,
	parent: Node
}

interface WordObject {
	id: string
	name: string
	usPhonetic: string
	ukPhonetic: string
	defs: string[]
	scenes: Scene[]
}

interface WordState {
	met: boolean,
	times: number
	scenes: Scene[]
}

interface Scene {
	sentence: string
	url: string
}


class Word extends React.Component<WordProps, WordState> {
	state: WordState = {
		times: this.props.word.scenes.length,
		scenes: this.props.word.scenes,
		met: false
	}
	render() {
		const word = this.props.word
		return (
			< div className="word" >
				<div className="head">
					<span className="headword">{word.name}</span>
					<span className="met-times">{this.state.times}</span>
					<button className="plus-one" key={word.id} disabled={this.state.met} onClick={() => this.plusOne(word.id, this.props.selectText, this.props.range, this.props.parent)}>+1</button>
				</div>
				<div className="phonetic">
					<span>US /{word.usPhonetic}/ UK /{word.ukPhonetic}/</span>
				</div>
				<div className="defs">
					<ul>
						{word.defs.map((def) => (<li className="def">{def}</li>))}
					</ul>
				</div>
				<div className="scenes">
					<ul>
						{this.state.scenes.map((scene) => {
							return <li className="scene">
								<a href={scene.url}>{scene.sentence}</a>
							</li>
						})}
					</ul>
				</div>
			</div>
		)
	}

	async plusOne(id: string, selectText: string, range: Range, parent: Node) {
		console.log("before mark: startContainer:", range.startContainer)
		console.log("before mark: endContainer:", range.endContainer)
		console.log("before mark: parent:", parent)
		// After markSelection, range.startContainer and .endContainer changed, 
		// so we can't rely on it anymore.
		// Instead, we rely on the extra "parent" prop, which doesn't change.
		this.markSelection(range, selectText)
		const selectedNode = this.getSelectedNode(parent)!
		console.log("after mark: startContainer:", range.startContainer)
		console.log("after mark: endContainer:", range.endContainer)
		console.log("after mark: parent:", parent)
		const text = getSceneSentence(parent, selectText)
		console.log("sentence:", text);
		// After getting sentencce cancel the selected attribute
		(selectedNode as HTMLElement).removeAttribute("selected")
		const url = window.location.href
		try {
			const body = {
				id: id,
				url: url,
				text: text
			}
			let payload = JSON.stringify(body)
			let jsonHeaders = new Headers({
				'Content-Type': 'application/json'
			})

			const meetResult = await fetch(meetURL, {
				method: "POST",
				body: payload,
				headers: jsonHeaders
			})
			if (meetResult.status != 200) {
				console.log("meet word return:", status)
				return
			}
		} catch (err) {
			console.log("meet word failed", err)
		}
		this.setState({
			times: this.state.times + 1,
			met: true,
			scenes: this.state.scenes.concat({
				sentence: text,
				url: url
			})
		})
	}

	markSelection(range: Range, selectText: string) {
		let wr = {
			times: this.state.times + 1,
			range: range
		}
		// pure text selection in text node
		if (range.startContainer == range.endContainer) {
			markWord(wr, true)
			return
		}

		// next sibling must be the selection containing node
		const next = range.startContainer.nextSibling! as Node
		// const marked = this.getMarkNode(node, selectText)
		// console.log("marked is:", marked)
		if (next == null && this.getMarkNode(range.startContainer.parentNode!, selectText) != null) {
			const ele = range.startContainer.parentNode as HTMLElement
			const times = this.state.times + 1
			ele.setAttribute("met-times", "-".repeat(times))
			ele.setAttribute("selected", "true")
		} else {
			markWord(wr, true)
		}
	}

	getMarkNode(n: Node, selectText: string): Node | null {
		if (n.nodeType == Node.ELEMENT_NODE && n.nodeName == "SPAN" &&
			(n as HTMLElement).getAttribute("class") == "metword" &&
			n.firstChild!.nodeValue == selectText) {
			return n
		}

		for (let c = n.firstChild; c != null; c = c.nextSibling) {
			const n = this.getMarkNode(c, selectText)
			if (n != null) {
				return n
			}
		}

		return null
	}

	getSelectedNode(n: Node): Node | null {
		if (n.nodeType == Node.ELEMENT_NODE && n.nodeName == "SPAN" &&
			(n as HTMLElement).getAttribute("class") == "metword" &&
			(n as HTMLElement).getAttribute("selected") == "true") {
			return n
		}

		for (let c = n.firstChild; c != null; c = c.nextSibling) {
			const n = this.getSelectedNode(c)
			if (n != null) {
				return n
			}
		}

		return null
	}
}

export default Word
