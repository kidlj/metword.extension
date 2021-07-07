
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
					<span className="met-times">遇见 {this.state.times} 次</span>
					<button className="plus-one" key={word.id} disabled={this.state.met} onClick={() => this.plusOne(word.id, this.props.selectText, this.props.parent)}>+1</button>
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
			scenes: this.state.scenes.concat({
				sentence: text,
				url: url
			})
		})
	}
}

export default Word
