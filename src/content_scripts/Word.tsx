
import React from 'react'
import { browser } from 'webextension-polyfill-ts'
import { getSceneSentence, getSelectedElement } from './lib'

interface WordProps {
	word: WordObject
	selectText: string
	parent: Node
}

interface WordObject {
	id: string
	name: string
	usPhonetic: string
	ukPhonetic: string
	defs: string[]
	known: boolean,
	scenes: Scene[]
}

interface WordState {
	met: boolean,
	known: boolean,
	times: number
	scenes: Scene[]
}

interface Scene {
	sentence: string
	url: string
}


class Word extends React.Component<WordProps, WordState> {
	constructor(props: WordProps) {
		super(props)
		// this.plusOne = this.plusOne.bind(this)
		// this.know = this.know.bind(this)
		this.state = {
			times: this.props.word.scenes.length,
			scenes: this.props.word.scenes,
			met: false,
			known: this.props.word.known,
		}
	}
	render() {
		const word = this.props.word
		let getText = this.state.known ? "✓" : "Get"
		return (
			<div className="word" >
				<div className="head">
					<span className="headword">{word.name}</span>
					<span className="met-times">遇见 {this.state.times} 次</span>

					<button className="plus-button" data-known={this.state.known} disabled={this.state.met} onClick={() => this.plusOne(word.id, this.props.selectText, this.props.parent)}>+1</button>

					{this.state.times > 0 &&
						<button className="know-button" data-known={this.state.known} disabled={this.state.known} onClick={() => this.know(word.id)}>{getText}</button>
					}
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
								<a href={scene.url}>
									<span className="met-highlight" dangerouslySetInnerHTML={{ __html: scene.sentence }}></span>
								</a>
							</li>
						})}
					</ul>
				</div>
			</div>
		)
	}

	async queryPlusOne(scene: any) {
		try {
			const success = await browser.runtime.sendMessage({
				action: "plusOne",
				scene: scene
			})
			if (!success) {
				return false
			}

			return true
		} catch (err) {
			return false
		}
	}

	async plusOne(id: string, selectText: string, parent: Node) {
		// times += 1
		const selectedElement = getSelectedElement()!
		const times = this.state.times + 1
		selectedElement.setAttribute("data-times", "-".repeat(times))

		const text = getSceneSentence(parent, selectText)
		console.log("sentence:", text);

		const url = window.location.href
		const scene = {
			id: id,
			url: url,
			text: text
		}
		const success = await this.queryPlusOne(scene)
		if (!success) {
			return
		}
		this.setState({
			times: this.state.times + 1,
			met: true,
			known: false,
			scenes: this.state.scenes.concat({
				sentence: text,
				url: url
			})
		})
	}

	async queryKnow(id: string) {
		try {
			const success = await browser.runtime.sendMessage({
				action: "know",
				id: id,
			})
			if (!success) {
				return false
			}

			return true
		} catch (err) {
			return false
		}
	}

	async know(id: string) {
		const success = await this.queryKnow(id)
		if (!success) {
			return
		}
		const selectedElement = getSelectedElement()!
		selectedElement.setAttribute("data-times", "-".repeat(0))
		this.setState({
			known: true,
		})
	}
}

export default Word
