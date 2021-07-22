import React from 'react'
import { browser } from 'webextension-polyfill-ts'
import ErrorMessage from './ErrorMessage'
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner'
import { Word, WordObject, SceneObject } from './Word'


interface TipProps {
	selectText: string
	word: string
	parent: Node
}

interface TipState {
	loading: boolean
	message: string | undefined
	words: any[]
}

class Tip extends React.Component<TipProps, TipState> {
	state: TipState = {
		loading: false,
		message: undefined,
		words: []
	}
	render() {
		if (this.state.loading) {
			return <Spinner size={SpinnerSize.medium} />
		}
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
		const spinner = setTimeout(() => this.setState({ loading: true }), 200)
		const word = this.props.word
		const result = await browser.runtime.sendMessage({
			action: "query",
			word: word
		})
		if (!result.success) {
			clearTimeout(spinner)
			this.setState({
				message: result.message,
				loading: false,
			})
			return
		}
		const owords: any[] = result.words
		const words: WordObject[] = []
		owords.forEach((w: any) => {
			const scenes: SceneObject[] = []
			let known = false
			if (w.edges.meets != null) {
				if (w.edges.meets[0].state == 10) {
					known = true
				}

				if (w.edges.meets[0].edges.scenes != null) {
					w.edges.meets[0].edges.scenes.forEach((sc: any) => {
						const scene: SceneObject = {
							id: sc.id,
							sentence: sc.text,
							url: sc.url,
							createTime: new Date(sc.create_time),
						}
						scenes.push(scene)
					})
				}
			}
			const word: WordObject = {
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
		clearTimeout(spinner)
		this.setState({
			loading: false,
			words: words
		})
	}
}

export default Tip
