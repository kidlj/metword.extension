
import React from 'react'
import { browser } from 'webextension-polyfill-ts'
import { getSceneSentence, getSelectedElement } from './lib'
import ErrorMessage from './ErrorMessage'

interface WordProps {
	word: WordObject
	selectText: string
	parent: Node
}

interface WordObject {
	id: number
	name: string
	usPhonetic: string
	ukPhonetic: string
	defs: string[]
	known: boolean
	scenes: Scene[]
}

interface WordState {
	met: boolean
	known: boolean
	times: number
	scenes: Scene[]
	message: string | undefined
}

interface Scene {
	id: number
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
			message: undefined
		}
	}
	render() {
		const word = this.props.word
		const getText = this.state.known ? "✓" : "Get"
		if (this.state.message != undefined) {
			return <ErrorMessage message={this.state.message}></ErrorMessage>
		}
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
							return (
								<li className="scene" key={scene.id}>
									<a href={scene.url}>
										<span className="met-scene" dangerouslySetInnerHTML={{ __html: scene.sentence }}></span>
									</a>
									<span className="met-forget" onClick={() => this.forgetScene(scene.id)}>✗</span>
								</li>
							)
						})}
					</ul>
				</div>
			</div>
		)
	}

	async plusOne(id: number, selectText: string, parent: Node) {
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
		const result = await browser.runtime.sendMessage({
			action: "plusOne",
			scene: scene
		})
		if (!result.success) {
			this.setState({
				message: result.message
			})
			return
		}
		this.setState({
			times: this.state.times + 1,
			met: true,
			known: false,
			scenes: this.state.scenes.concat({
				id: result.scene.id,
				sentence: result.scene.text,
				url: result.scene.url,
			})
		})
	}

	async know(id: number) {
		const result = await browser.runtime.sendMessage({
			action: "know",
			id: id,
		})
		if (!result.success) {
			this.setState({
				message: result.message
			})
			return
		}
		const selectedElement = getSelectedElement()!
		selectedElement.setAttribute("data-times", "-".repeat(0))
		this.setState({
			known: true,
		})
	}

	async forgetScene(id: number) {
		const result = await browser.runtime.sendMessage({
			action: "forgetScene",
			id: id,
		})
		if (!result.success) {
			this.setState({
				message: result.message
			})
			return
		}
		const times = this.state.times - 1
		const selectedElement = getSelectedElement()!
		selectedElement.setAttribute("data-times", "-".repeat(times))
		const scenes = this.state.scenes.filter(scene => scene.id != id)
		this.setState({
			times: times,
			scenes: scenes,
		})
	}

}

export default Word
