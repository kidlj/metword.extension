import * as React from 'react'
import { browser } from 'webextension-polyfill-ts'
import { getSceneSentence, getSelectedElement } from './lib'
import { Toggle, mergeStyleSets, Text, FontWeights } from '@fluentui/react'

interface WordProps {
	word: WordObject
	selectText: string
	parent: Node
}

export interface WordObject {
	id: number
	name: string
	usPhonetic: string
	ukPhonetic: string
	defs: string[]
	known: boolean
	scenes: SceneObject[]
}

export interface SceneObject {
	id: number
	sentence: string
	url: string
	createTime: Date
}


export function Word(props: WordProps) {
	const [times, setTimes] = React.useState(props.word.scenes.length)
	const [scenes, setScenes] = React.useState(props.word.scenes)
	const [met, setMet] = React.useState(false)
	const [known, setKnown] = React.useState(props.word.known)
	const [error, setError] = React.useState<string>()

	const word = props.word
	const defs = word.defs.map((def) => {
		let dotIndex = def.indexOf(".")
		return {
			prefix: def.substring(0, dotIndex + 1),
			explain: def.substring(dotIndex + 1)
		}
	})

	async function plusOne(id: number, selectText: string, parent: Node) {
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
			setError(result.message)
			return
		}

		const selectedElement = getSelectedElement()!
		selectedElement.setAttribute("data-times", "-".repeat(times + 1))

		setTimes(times + 1)
		setMet(true)
		setScenes(scenes.concat({
			id: result.scene.id,
			sentence: result.scene.text,
			url: result.scene.url,
			createTime: new Date(result.scene.create_time),
		}))
	}

	async function toggleKnown(id: number) {
		const result = await browser.runtime.sendMessage({
			action: "toggleKnown",
			id: id,
		})
		if (!result.success) {
			setError(result.message)
			return
		}
		if (result.state == 10) {
			// known
			setKnown(true)
			const selectedElement = getSelectedElement()!
			selectedElement.setAttribute("data-times", "-".repeat(0))
		} else if (result.state == 1) {
			// active
			setKnown(false)
			const selectedElement = getSelectedElement()!
			selectedElement.setAttribute("data-times", "-".repeat(times))
		}
	}

	async function forgetScene(id: number) {
		const result = await browser.runtime.sendMessage({
			action: "forgetScene",
			id: id,
		})
		if (!result.success) {
			setError(result.message)
			return
		}
		const selectedElement = getSelectedElement()!
		selectedElement.setAttribute("data-times", "-".repeat(times - 1))
		const newScenes = scenes.filter(scene => scene.id != id)
		setScenes(newScenes)
		setTimes(times - 1)
	}

	if (error != undefined) {
		return <Text>{error}</Text>
	}

	return (
		<div className="word" >
			<div className="head">
				<span className="headword">{word.name}</span>

				<button className="plus-button" disabled={met || known} onClick={() => plusOne(word.id, props.selectText, props.parent)}>+1</button>

				{(times > 0 || known) &&
					<Toggle className="known-switch" checked={known} onChange={() => { toggleKnown(word.id) }} offText="未掌握" onText="已掌握" />
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
				{times > 0 &&
					<span className="met-times">遇见 {times} 次</span>
				}
				<ul>
					{scenes.map((scene) => {
						return (
							<li className="scene" key={scene.id}>
								<a href={scene.url} title={scene.createTime.toLocaleString('zh-CN')}>
									<span className="met-scene" dangerouslySetInnerHTML={{ __html: scene.sentence }}></span>
								</a>
								<span className="met-forget" onClick={() => forgetScene(scene.id)}>✗</span>
							</li>
						)
					})}
				</ul>
			</div>
		</div >
	)
}