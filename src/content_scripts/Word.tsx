import { useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { getSceneSentence, getSelectedElement } from './lib'
import { mergeStyleSets, Text, FontWeights, IRenderFunction } from '@fluentui/react'
import { ActionButton, IButtonProps } from '@fluentui/react/lib/Button';
import { AddIcon, RingerIcon, RingerOffIcon } from '@fluentui/react-icons-mdl2';
import ErrorMessage from './ErrorMessage';

interface WordProps {
	word: IWord
	selectText: string
	parent: Node
}

export interface IWord {
	id: number,
	name: string,
	us_phonetic: string,
	uk_phonetic: string,
	def_zh: string[],
	edges: IWordEdges,
}

interface IWordEdges {
	meets: IMeet[]
}

interface IMeet {
	state: number,
	times: number,
	edges: IMeetEdges
}

interface IMeetEdges {
	scenes: IScene[]
}

interface IScene {
	id: number,
	text: string,
	url: string,
	create_time: number
}

export function Word({ word, selectText, parent }: WordProps) {
	const [times, setTimes] = useState(word.edges.meets ? word.edges.meets[0].times : 0)
	const [scenes, setScenes] = useState(word.edges.meets && word.edges.meets[0].edges.scenes ? word.edges.meets[0].edges.scenes : [])
	const [met, setMet] = useState(false)
	const [known, setKnown] = useState(word.edges.meets && word.edges.meets[0].state == 10 ? true : false)
	const [errorCode, setErrorCode] = useState<number | false>(false)

	async function addScene(id: number, selectText: string, parent: Node) {
		const text = getSceneSentence(parent, selectText)
		console.log("sentence:", text);

		const url = window.location.href
		const payload = {
			id: id,
			url: url,
			text: text
		}
		const { data, errorCode } = await browser.runtime.sendMessage({
			action: "addScene",
			scene: payload
		})
		if (errorCode) {
			setErrorCode(errorCode)
			return
		}

		const scene = data as IScene

		const selectedElement = getSelectedElement()!
		selectedElement.setAttribute("data-times", "-".repeat(times + 1))

		setTimes(times + 1)
		setMet(true)
		setScenes(scenes.concat(scene))
	}

	async function toggleKnown(id: number) {
		const { data: state, errorCode } = await browser.runtime.sendMessage({
			action: "toggleKnown",
			id: id,
		})
		if (errorCode) {
			setErrorCode(errorCode)
			return
		}
		if (state == 10) {
			// known
			setKnown(true)
			const selectedElement = getSelectedElement()!
			selectedElement.setAttribute("data-times", "-".repeat(0))
		} else if (state == 1) {
			// active
			setKnown(false)
			const selectedElement = getSelectedElement()!
			selectedElement.setAttribute("data-times", "-".repeat(times))
		}
	}

	async function forgetScene(id: number) {
		const { data, errorCode } = await browser.runtime.sendMessage({
			action: "forgetScene",
			id: id,
		})
		if (errorCode) {
			setErrorCode(errorCode)
			return
		}
		const selectedElement = getSelectedElement()!
		selectedElement.setAttribute("data-times", "-".repeat(times - 1))
		const newScenes = scenes.filter(scene => scene.id != id)
		setScenes(newScenes)
		setTimes(times - 1)
	}

	if (errorCode) {
		return <ErrorMessage errorCode={errorCode}></ErrorMessage>
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
				<ActionButton className={styles.button} onRenderIcon={onRenderIcon} label="Add" disabled={met || known} onClick={() => addScene(word.id, selectText, parent)} />
				{(times > 0 || known) &&
					<ActionButton className={styles.button} toggle onRenderIcon={onRenderIcon} label={known ? "RingerOff" : "Ringer"} onClick={() => { toggleKnown(word.id) }} />
				}
			</div>
			<div className="metwords-phonetics">
				<Text className="metwords-phonetic-label">US</Text><Text className="metwords-phonetic">[{word.us_phonetic}]</Text>
				<Text className="metwords-phonetic-label">UK</Text><Text className="metwords-phonetic">[{word.uk_phonetic}]</Text>
			</div>
			<div className="metwords-defs">
				<ul>
					{word.def_zh.map((def, index) => (
						<li key={index} className="metwords-def"><Text className="metwords-explain">{def}</Text></li>)
					)}
				</ul>
			</div>
			{times > 0 &&
				<span className="metwords-times">遇见 {times} 次</span>
			}
			<div className="metwords-scenes">
				<ul>
					{scenes.map((scene) => {
						return (
							<li key={scene.id}>
								<a href={scene.url} title={new Date(scene.create_time).toLocaleString('zh-CN')}>
									<span className="mewords-scene" dangerouslySetInnerHTML={{ __html: scene.text }}></span>
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
		lineHeight: "1.0",
		width: 24,
		height: 16,
		marginLeft: 16,
	},
	title: {
		fontWeight: 200,
		fontSize: 42,
		lineHeight: "1.0",
	},
})