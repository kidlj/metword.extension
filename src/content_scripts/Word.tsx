
import React from 'react'
import { browser } from 'webextension-polyfill-ts'
import { getSceneSentence, getSelectedElement } from './lib'
import ErrorMessage from './ErrorMessage'
import { Toggle } from '@fluentui/react';

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
		const defs = word.defs.map((def) => {
			let dotIndex = def.indexOf(".")
			return {
				prefix: def.substring(0, dotIndex + 1),
				explain: def.substring(dotIndex + 1)
			}
		})
		if (this.state.message != undefined) {
			return <ErrorMessage message={this.state.message}></ErrorMessage>
		}
		return (
			<div className="word" >
				<div className="head">
					<span className="headword">{word.name}</span>

					<button className="plus-button" disabled={this.state.met || this.state.known} onClick={() => this.plusOne(word.id, this.props.selectText, this.props.parent)}>+1</button>

					{(this.state.times > 0 || this.state.known) &&
						<Toggle className="known-switch" checked={this.state.known} onChange={() => { this.toggleKnown(word.id) }} offText="未掌握" onText="已掌握" />
					}
				</div>
				<div className="phonetics">
					<span className="phonetic-label">US</span><span className="phonetic">[{word.usPhonetic}]</span>
					<span className="phonetic-label">UK</span><span className="phonetic">[{word.ukPhonetic}]</span>
				</div>
				<div className="defs">
					<ul>
						{defs.map((def) => (<li className="def"><span className="prefix">{def.prefix}</span><span className="explain">{def.explain}</span></li>))}
					</ul>
				</div>
				<div className="scenes">
					{this.state.times > 0 &&
						<span className="met-times">遇见 {this.state.times} 次</span>
					}
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
			</div >
		)
	}

	async plusOne(id: number, selectText: string, parent: Node) {
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

		// times += 1
		const selectedElement = getSelectedElement()!
		const times = this.state.times + 1
		selectedElement.setAttribute("data-times", "-".repeat(times))

		this.setState({
			times: this.state.times + 1,
			met: true,
			scenes: this.state.scenes.concat({
				id: result.scene.id,
				sentence: result.scene.text,
				url: result.scene.url,
			})
		})
	}

	async toggleKnown(id: number) {
		const result = await browser.runtime.sendMessage({
			action: "toggleKnown",
			id: id,
		})
		if (!result.success) {
			this.setState({
				message: result.message
			})
			return
		}
		// known
		if (result.state == 10) {
			this.setState({
				known: true,
			})
			// active
		} else if (result.state == 1) {
			this.setState({
				known: false,
			})
		}
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
