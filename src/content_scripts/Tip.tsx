import React from 'react'
import { browser } from 'webextension-polyfill-ts'
import Word from './Word'
import ErrorMessage from './ErrorMessage'


interface TipProps {
	selectText: string
	word: string
	parent: Node
}

interface TipState {
	message: string | undefined
	words: any[]
}

class Tip extends React.Component<TipProps, TipState> {
	state: TipState = {
		message: undefined,
		words: []
	}
	render() {
		if (this.state.message != undefined) {
			return <ErrorMessage message={this.state.message}></ErrorMessage>
		}
		return (
			<div className="words">
				{
					this.state.words.map((w: any) => (<Word word={w} selectText={this.props.selectText} parent={this.props.parent} />))
				}
			</div>
		)
	}

	async componentDidMount() {
		const word = this.props.word
		const result = await browser.runtime.sendMessage({
			action: "query",
			word: word
		})
		if (!result.success) {
			this.setState({
				message: result.message
			})
			return
		}
		const owords: any[] = result.words
		const words: any[] = []
		owords.forEach((w: any) => {
			const scenes: any[] = []
			let known = false
			if (w.edges.meets != null) {
				if (w.edges.meets[0].state == 10) {
					known = true
				}

				if (w.edges.meets[0].edges.scenes != null) {
					w.edges.meets[0].edges.scenes.forEach((sc: any) => {
						const scene: any = {
							id: sc.id,
							sentence: sc.text,
							url: sc.url
						}
						scenes.push(scene)
					})
				}
			}
			const word: any = {
				id: w.id,
				name: w.name,
				usPhonetic: w.us_phonetic,
				ukPhonetic: w.uk_phonetic,
				defs: w.def_zh,
				known: known,
				scenes: scenes
			}
			words.push(word)
		})
		this.setState({
			words: words
		})
	}
}

export default Tip
