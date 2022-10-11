import { useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { getSceneSentence, getSelectedElement } from './lib'
import ErrorMessage from './ErrorMessage';

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

export const wordStyles = `
.word {
	padding: 4px;
	display: flex;
	flex-direction: column;
	align-items: start;
	font-size: 14px;
	row-gap: 1em;
}

.button {
	cursor: pointer;
	margin-left: 20px;
	height: 18px;
	width: 18px;
}

.button img {
	height: 18px;
	width: 18px;
}

.disabled {
	cursor: default;
}

.message {
	display: flex;
	flex-direction: row;
	vertical-align: center;
	justify-content: space-between;
}

.head {
	display: flex;
	flex-direction: row;
	align-items: flex-end;
}

.title {
	font-weight: 200;
	font-size: 42px;
	line-height: 1.0em;
}

.phonetic-label {
	margin-right: 6px;
}

.defs ul {
	list-style-type: none;
	max-width: max-content;
	padding-left: 0px;
	margin: 0px;
}

.times {
	background-color: black;
	color: white;
}

.scenes {
	padding-left: 1px;
	font-weight: 400;
}

.scenes ul {
	padding-left: 0px;
	margin: 0px;
}

.scenes ul li {
	list-style-position: inside;
	list-style-type: disc;
}

.scenes a {
	text-decoration: none;
	color: black;
}

.scenes a:hover {
	text-decoration: none;
	color: #1d67a0;
}

.forgetButton {
	opacity: 0;
	font-size: 14px;
	padding: 1px 10px;
	cursor: pointer;
}

.forgetButton:hover {
	opacity: 100;
	cursor: pointer;
}

xmet {
	font-weight: 600;
}
`

const addIcon = browser.runtime.getURL("icons_normal/plus.png")
const addDisabledIcon = browser.runtime.getURL("icons_normal/plus-disabled.png")
const bellIcon = browser.runtime.getURL("icons_normal/notification.png")
const bellOffIcon = browser.runtime.getURL("icons_normal/notificationoff.png")


export function Word({ word, selectText }: WordProps) {
	const [times, setTimes] = useState(word.edges.meets ? word.edges.meets[0].times : 0)
	const [scenes, setScenes] = useState(word.edges.meets && word.edges.meets[0].edges.scenes ? word.edges.meets[0].edges.scenes : [])
	const [met, setMet] = useState(false)
	const [known, setKnown] = useState(word.edges.meets && word.edges.meets[0].state == 10 ? true : false)
	const [errMessage, setErrMessage] = useState<string | false>(false)

	if (errMessage) return (
		<div className='message'>
			<ErrorMessage errMessage={errMessage}></ErrorMessage>
		</div>
	)

	return (
		<div className='word'>
			<div className="head">
				<span className="title">{word.name}</span>
				{(met || known) &&
					<div className='button disabled'>
						<a>
							<img src={addDisabledIcon}></img>
						</a>
					</div>
				}
				{!(met || known) &&
					<div className='button'>
						<a title="+1" onClick={() => addScene(word.id, selectText)}>
							<img src={addIcon}></img>
						</a>
					</div>
				}
				{(times > 0 && !known) &&
					<div className='button'>
						<a title="未掌握" onClick={() => toggleKnown(word.id)}>
							<img src={bellIcon}></img>
						</a>
					</div>
				}
				{(times > 0 && known) &&
					<div className='button'>
						<a title="已掌握" onClick={() => toggleKnown(word.id)}>
							<img src={bellOffIcon}></img>
						</a>
					</div>
				}
			</div>
			<div className="phonetics">
				{(word.us_phonetic) &&
					<div className='phonetic'>
						<span className="phonetic-label">US</span><span>[{word.us_phonetic}]</span>
					</div>
				}
				{(word.uk_phonetic) &&
					<div className='phonetic'>
						<span className="phonetic-label">UK</span><span>[{word.uk_phonetic}]</span>
					</div>
				}
			</div>
			<div className="defs">
				<ul>
					{word.def_zh.map((def, index) => (
						<li key={index}><span>{def}</span></li>)
					)}
				</ul>
			</div>
			{times > 0 &&
				<div className="times">
					<span>标记 {times} 次</span>
				</div>
			}
			<div className="scenes">
				<ul>
					{scenes.map((scene) => {
						const [pre, met, post] = extractScene(scene.text)
						return (
							<li key={scene.id}>
								<a href={scene.url} title={scene.url} target="blanck">
									{pre}<span dangerouslySetInnerHTML={{ __html: met }}></span>{post}
								</a>
								<span className="forgetButton" onClick={() => forgetScene(scene.id)}>✗</span>
							</li>
						)
					})}
				</ul>
			</div>
		</div>
	)

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
