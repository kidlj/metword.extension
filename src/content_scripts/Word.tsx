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
:host {
	visibility: visible !important;
}

.word {
	padding: 4px;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	font-size: 14px;
	row-gap: 1em;
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
	justify-content: flex-start;
	gap: 30px;

}

.head a {
	display: flex;
	flex-direction: column;
	align-items: center;
	cursor: pointer;
}

.head img {
	width: 18px;
	height: 18px;
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
	justify-content: flex-start;
	column-gap: 1.0em;
	line-height: 1.4em;
}

img.play {
	width: 14px;
	height: 14px;
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
	color: #479ef5;
}

.sceneaction {
	display: inline-flex;
	flex-direction: row;
	column-gap: 10px;
	align-items: center;
	justify-content: space-between;
	padding: 0 10px;
}

.hostname {
	color: #666;
}

.forgetButton {
	opacity: 0;
	font-size: 14px;
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
const bellIcon = browser.runtime.getURL("icons/altert.svg")
const bellOffIcon = browser.runtime.getURL("icons/alert_off.svg")
const playIcon = browser.runtime.getURL("icons/speaker.svg")


export function Word({ word, sceneText }: WordProps) {
	const [times, setTimes] = useState(word.edges.meets ? word.edges.meets[0].times : 0)
	const [scenes, setScenes] = useState(word.edges.meets && word.edges.meets[0].edges.scenes ? word.edges.meets[0].edges.scenes : [])
	const [met, setMet] = useState(false)
	const [known, setKnown] = useState(word.edges.meets && word.edges.meets[0].state == 10 ? true : false)
	const [errMessage, setErrMessage] = useState<string | false>(false)
	const addTitle = times == 0 ? "将单词加入生词本，在下次遇见时获得提醒" : "+1"

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
					<a>
						<img src={addDisabledIcon} className='disabled'></img>
					</a>
				}
				{!(met || known) &&
					<a title={addTitle} onClick={() => addScene(word.id, sceneText)}>
						<img src={addIcon}></img>
					</a>
				}
				{(times > 0 && !known) &&
					<a title="标记中" onClick={() => toggleKnown(word.id)}>
						<img src={bellIcon}></img>
					</a>
				}
				{(times > 0 && known) &&
					<a title="已掌握" onClick={() => toggleKnown(word.id)}>
						<img src={bellOffIcon}></img>
					</a>
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
						return (
							<li key={scene.id}>
								<a href={scene.url} title={new Date(scene.create_time).toLocaleString()}>
									<span dangerouslySetInnerHTML={{ __html: scene.text }}></span>
								</a>
								<div className="sceneaction">
									<span className="hostname">({new URL(scene.url).hostname})</span>
									<span className="forgetButton" onClick={() => forgetScene(scene.id)}>✗</span>
								</div>
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