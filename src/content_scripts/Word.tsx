import * as React from 'react'
import { browser } from 'webextension-polyfill-ts'
import { getSceneSentence, getSelectedElement } from './lib'
import { mergeStyleSets, Text, FontWeights, IRenderFunction } from '@fluentui/react'
import { ActionButton, IButtonProps } from '@fluentui/react/lib/Button';
import { AddIcon, RingerIcon, RingerOffIcon } from '@fluentui/react-icons-mdl2';

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

	if (error) {
		return <Text>{error}</Text>
	}

	const onRenderIcon: IRenderFunction<IButtonProps> = (props: IButtonProps | undefined) => {
		if (props == undefined) {
			return null
		}
		switch (props.label) {
			case 'Add':
				return <AddIcon title="+1"></AddIcon>
			case 'Ringer':
				return <RingerIcon title="未掌握"></RingerIcon>
			case 'RingerOff':
				return <RingerOffIcon title="已掌握"></RingerOffIcon>
		}
		return null
	}

	return (
		<div className="metwords-word">
			<div className={styles.head}>
				<Text className={styles.title}>{word.name}</Text>
				<ActionButton className={styles.button} onRenderIcon={onRenderIcon} label="Add" disabled={met || known} onClick={() => plusOne(word.id, props.selectText, props.parent)} />
				{(times > 0 || known) &&
					<ActionButton className={styles.button} toggle onRenderIcon={onRenderIcon} label={known ? "RingerOff" : "Ringer"} onClick={() => { toggleKnown(word.id) }} />
				}
			</div>
			<div className="metwords-phonetics">
				<Text className="metwords-phonetic-label">US</Text><Text className="metwords-phonetic">[{word.usPhonetic}]</Text>
				<Text className="metwords-phonetic-label">UK</Text><Text className="metwords-phonetic">[{word.ukPhonetic}]</Text>
			</div>
			<div className="metwords-defs">
				<ul>
					{word.defs.map((def) => (
						<li className="metwords-def"><Text className="metwords-explain">{def}</Text></li>)
					)}
				</ul>
			</div>
			{times > 0 &&
				<Text className="metwords-times">遇见 {times} 次</Text>
			}
			<div className="metwords-scenes">
				<ul>
					{scenes.map((scene) => {
						return (
							<li key={scene.id}>
								<a href={scene.url} title={scene.createTime.toLocaleString('zh-CN')}>
									<span className="mewords-scene" dangerouslySetInnerHTML={{ __html: scene.sentence }}></span>
								</a>
								<Text className="metwords-forget" onClick={() => forgetScene(scene.id)}>✗</Text>
							</li>
						)
					})}
				</ul>
			</div>
		</div>
	)
}

const styles = mergeStyleSets({
	head: {
		marginBottom: 12,
		display: "flex",
		alignItems: "flex-end"
	},
	button: {
		lineHeight: 1,
		width: 16,
		height: 16,
		marginLeft: 16,
	},
	title: {
		fontWeight: FontWeights.semilight,
		fontSize: 42,
		lineHeight: "100%",
	},
})