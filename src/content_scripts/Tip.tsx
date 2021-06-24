import React from 'react'
import { browser } from 'webextension-polyfill-ts'
import Word from './Word'


interface TipProps {
	selectText: string
	word: string
	parent: Node
}

interface TipState {
	words: any[]
}

class Tip extends React.Component<TipProps, TipState> {
	state: TipState = {
		words: []
	}
	render() {
		return (
			<div className="words">
				{
					this.state.words.map((w: any) => (<Word word={w} selectText={this.props.selectText} parent={this.props.parent} />))
				}
			</div>
		)
	}

	async queryWord(word: string) {
		const words = await browser.runtime.sendMessage({
			action: "query",
			word: word
		})
		return words
	}

	async componentDidMount() {
		const word = this.props.word
		try {
			const owords: any[] = await this.queryWord(word)
			const words: any[] = []
			owords.forEach((w: any) => {
				const scenes: any[] = []
				if (w.edges.meets != null) {
					w.edges.meets[0].edges.scenes.forEach((sc: any) => {
						const scene: any = {
							sentence: sc.text,
							url: sc.url
						}
						scenes.push(scene)
					})
				}
				const word: any = {
					id: w.id,
					name: w.name,
					usPhonetic: w.us_phonetic,
					ukPhonetic: w.uk_phonetic,
					defs: w.def_zh,
					scenes: scenes
				}
				words.push(word)
			})
			this.setState({
				words: words
			})
		} catch (err) {
			console.log("query word error", err)
		}
	}
}

export default Tip
