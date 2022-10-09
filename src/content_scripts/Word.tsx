import { useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { getSceneSentence, getSelectedElement } from './lib'
import { ActionButton, IButtonProps } from '@fluentui/react/lib/Button';
import { AddIcon, RingerIcon, RingerOffIcon } from '@fluentui/react-icons-mdl2';
import ErrorMessage from './ErrorMessage';
import { styles } from "./styles"
import { Text, Stack, IStackTokens, IRenderFunction } from '@fluentui/react';

interface WordProps {
	word: IWord
	selectText: string
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

const stackTokens: IStackTokens = { childrenGap: 8 }

export function Word({ word, selectText }: WordProps) {
	const [times, setTimes] = useState(word.edges.meets ? word.edges.meets[0].times : 0)
	const [scenes, setScenes] = useState(word.edges.meets && word.edges.meets[0].edges.scenes ? word.edges.meets[0].edges.scenes : [])
	const [met, setMet] = useState(false)
	const [known, setKnown] = useState(word.edges.meets && word.edges.meets[0].state == 10 ? true : false)
	const [errMessage, setErrMessage] = useState<string | false>(false)

	async function addScene(id: number, selectText: string) {
		const text = getSceneSentence(selectText)

		const url = window.location.href
		const payload = {
			id: id,
			url: url,
			text: text
		}
		const { data, errMessage } = await browser.runtime.sendMessage({
			action: "addScene",
			scene: payload
		})
		if (errMessage) {
			setErrMessage(errMessage)
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
		const { data: state, errMessage } = await browser.runtime.sendMessage({
			action: "toggleKnown",
			id: id,
		})
		if (errMessage) {
			setErrMessage(errMessage)
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
		const { data, errMessage } = await browser.runtime.sendMessage({
			action: "forgetScene",
			id: id,
		})
		if (errMessage) {
			setErrMessage(errMessage)
			return
		}
		const selectedElement = getSelectedElement()!
		selectedElement.setAttribute("data-times", "-".repeat(times - 1))
		const newScenes = scenes.filter(scene => scene.id != id)
		setScenes(newScenes)
		setTimes(times - 1)
	}

	if (errMessage) {
		return <ErrorMessage errMessage={errMessage}></ErrorMessage>
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
		<Stack horizontalAlign="start" tokens={stackTokens}>
			<div className={styles.head}>
				<Text className={styles.title}>{word.name}</Text>
				<ActionButton className={styles.button} onRenderIcon={onRenderIcon} label="Add" disabled={met || known} onClick={() => addScene(word.id, selectText)} />
				{(times > 0 || known) &&
					<ActionButton className={styles.button} toggle onRenderIcon={onRenderIcon} label={known ? "RingerOff" : "Ringer"} onClick={() => { toggleKnown(word.id) }} />
				}
			</div>
			<div className={styles.phonetics}>
				{(word.us_phonetic) &&
					<span>
						<Text className={styles.phoneticLabel}>US</Text><Text className={styles.phonetic}>[{word.us_phonetic}]</Text>
					</span>
				}
				{(word.uk_phonetic) &&
					<span>
						<Text className={styles.phoneticLabel}>UK</Text><Text className={styles.phonetic}>[{word.uk_phonetic}]</Text>
					</span>
				}
			</div>
			<div className={styles.defs}>
				<ul>
					{word.def_zh.map((def, index) => (
						<li key={index}><Text>{def}</Text></li>)
					)}
				</ul>
			</div>
			{times > 0 &&
				<div className={styles.times}>
					<span>标记 {times} 次</span>
				</div>
			}
			<div className={styles.scenes}>
				<ul>
					{scenes.map((scene) => {
						const [pre, met, post] = extractScene(scene.text)
						return (
							<li key={scene.id}>
								<a href={scene.url} title={scene.url}>
									{pre}<span dangerouslySetInnerHTML={{ __html: met }}></span>{post}
								</a>
								<Text className={styles.sceneButton} onClick={() => forgetScene(scene.id)}>✗</Text>
							</li>
						)
					})}
				</ul>
			</div>
		</Stack>
	)
}

function extractScene(scene: string) {
	const re = /<xmet>.+<\/xmet>/
	const match = re.exec(scene)
	if (!match) {
		return ["", scene, ""]
	}
	const met = match[0]
	const index = match["index"]
	const postIndex = index + met.length
	return [scene.slice(0, index), met, scene.slice(postIndex)]
}
