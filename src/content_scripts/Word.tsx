import { useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { markWords } from './lib'
import ErrorMessage from './ErrorMessage';
import config from '../config'

interface WordProps {
	word: IWord
	sceneText: string
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

.phonetic {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: start;
	column-gap: 1.0em;
	line-height: 1.4em;
}

img.play {
	width: 16px;
	height: 16px;
	cursor: pointer;
}

.defs {
	line-height: 1.4em;
}

.defs ul {
	list-style-type: none;
	max-width: max-content;
	padding-left: 0px;
	margin: 0px;
}

.times {
	line-height: 1.4em;
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
	line-height: 1.2em;
	margin-bottom: 4px;
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

const addIcon = browser.runtime.getURL("icons/add.svg")
const addDisabledIcon = browser.runtime.getURL("icons/add_off.svg")
const bellIcon = browser.runtime.getURL("icons/ring.svg")
const bellOffIcon = browser.runtime.getURL("icons/ring_off.svg")
const playIcon = browser.runtime.getURL("icons/speaker.svg")


export function Word({ word, sceneText }: WordProps) {
	const [times, setTimes] = useState(word.edges.meets ? word.edges.meets[0].times : 0)
	const [scenes, setScenes] = useState(word.edges.meets && word.edges.meets[0].edges.scenes ? word.edges.meets[0].edges.scenes : [])
	const [met, setMet] = useState(false)
	const [known, setKnown] = useState(word.edges.meets && word.edges.meets[0].state == 10)
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
						<a title="+1" onClick={() => addScene(word.id, sceneText)}>
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
						<span>US</span><span>[{word.us_phonetic}]</span><img className="play" src={playIcon} onClick={() => playAudio("us", word.name, word.id)}></img>
					</div>
				}
				{(word.uk_phonetic) &&
					<div className='phonetic'>
						<span>UK</span><span>[{word.uk_phonetic}]</span><img className="play" src={playIcon} onClick={() => playAudio("uk", word.name, word.id)}></img>
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

	function playAudio(label: string, name: string, id: number) {
		const fileName = name + "-" + id + ".mp3"
		const fileURL = `${config.audioURL}/${label}/${fileName}`
		new Audio(fileURL).play()
	}

	async function addScene(id: number, sceneText: string) {
		const url = window.location.href
		const payload = {
			id: id,
			url: url,
			text: sceneText
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

		setTimes(times + 1)
		setMet(true)
		setScenes(scenes.concat(scene))

		await markWords()
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
		} else if (state == 1) {
			// active
			setKnown(false)
		}

		await markWords()
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
		const newScenes = scenes.filter(scene => scene.id != id)
		setScenes(newScenes)
		setTimes(times - 1)

		await markWords()
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
