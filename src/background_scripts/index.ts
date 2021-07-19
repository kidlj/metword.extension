import { resultContent } from "@fluentui/react/lib/components/FloatingPicker/PeoplePicker/PeoplePicker.scss"
import { browser } from "webextension-polyfill-ts"

const meetsURL = "http://words.metaphor.com:8080/meet/times"
const queryURL = "http://words.metaphor.com:8080/word?word="
const meetURL = "http://words.metaphor.com:8080/meet"
const knowURL = "http://words.metaphor.com:8080/meet/toggle?id="
const forgetSceneURL = "http://words.metaphor.com:8080/scene?id="
const loginURL = "http://words.metaphor.com:8080/account/login"

const loginMessage = `<span>请<a href="${loginURL}" target="_blank">登录</a>后使用。</span>`
const rateLimitMessage = "操作过于频繁。"
const notFoundMessage = "未找到定义。"
const errorMessage = "发生未知错误，请稍后再试。"
const networkMessage = "网络连接错误，请稍后再试。"

browser.runtime.onMessage.addListener(async (msg) => {
	switch (msg.action) {
		case "query":
			return await queryWord(msg.word)
		case 'getMeets':
			return await getMeets()
		case 'plusOne':
			return await plusOne(msg.scene)
		case 'toggleKnown':
			return await toggleKnown(msg.id)
		case 'forgetScene':
			return await forgetScene(msg.id)
	}
})

var valid = false
var meets: any = {}

function invalidate() {
	valid = false
}

async function plusOne(scene: any) {
	try {
		const body = {
			id: scene.id,
			url: scene.url,
			text: scene.text
		}
		let payload = JSON.stringify(body)
		let jsonHeaders = new Headers({
			'Content-Type': 'application/json'
		})

		const resp = await fetch(meetURL, {
			method: "POST",
			body: payload,
			headers: jsonHeaders
		})
		if (resp.status == 401) {
			return {
				success: false,
				message: loginMessage
			}
		}
		if (resp.status == 503) {
			return {
				success: false,
				message: rateLimitMessage
			}
		}
		if (resp.status != 200) {
			return {
				success: false,
				message: errorMessage
			}
		}
		const result = await resp.json()
		// invalidate cache
		invalidate()
		return {
			success: true,
			scene: result.scene,
		}
	} catch (err) {
		return {
			success: false,
			message: networkMessage
		}
	}
}

async function toggleKnown(id: number) {
	try {
		const url = knowURL + id
		const resp = await fetch(url, {
			method: "POST",
		})
		if (resp.status == 401) {
			return {
				success: false,
				message: loginMessage
			}
		}
		if (resp.status == 503) {
			return {
				success: false,
				message: rateLimitMessage
			}
		}
		if (resp.status != 200) {
			return {
				success: false,
				message: errorMessage
			}
		}
		const result = await resp.json()
		// invalidate cache
		invalidate()
		return {
			success: true,
			state: result.state
		}
	} catch (err) {
		return {
			success: false,
			message: networkMessage
		}
	}
}

async function forgetScene(id: number) {
	try {
		const url = forgetSceneURL + id
		const resp = await fetch(url, {
			method: "DELETE",
		})
		if (resp.status == 401) {
			return {
				success: false,
				message: loginMessage
			}
		}
		if (resp.status == 503) {
			return {
				success: false,
				message: rateLimitMessage
			}
		}
		if (resp.status != 200) {
			return {
				success: false,
				message: errorMessage
			}
		}
		// invalidate cache
		invalidate()
		return {
			success: true,
		}
	} catch (err) {
		return {
			success: false,
			message: networkMessage
		}
	}
}

async function queryWord(word: string) {
	try {
		const query = queryURL + word
		const resp = await fetch(query)
		if (resp.status == 401) {
			return {
				success: false,
				message: loginMessage
			}
		}
		if (resp.status == 503) {
			return {
				success: false,
				message: rateLimitMessage
			}
		}
		if (resp.status == 404) {
			return {
				success: false,
				message: notFoundMessage
			}
		}
		if (resp.status != 200) {
			return {
				success: false,
				message: errorMessage
			}
		}
		const result = await resp.json()
		return {
			success: true,
			words: result.words
		}
	} catch (err) {
		return {
			success: false,
			message: networkMessage
		}
	}
}

async function getMeets() {
	if (valid) {
		return meets
	}
	try {
		const resp = await fetch(meetsURL)
		if (resp.status != 200) {
			return meets
		}
		const result = JSON.parse(await resp.text())
		meets = result.meets
		valid = true
		return meets
	} catch (err) {
		console.log("Metwords extension: get words error", err)
		return meets
	}
}

const hideMark = `xmetword.x-metword-mark::before { display: none !important; }`

async function toggleDisabled() {
	try {
		const store = await browser.storage.local.get("disabled")
		if (store.disabled == undefined) {
			await browser.storage.local.set({
				"disabled": true
			})
			await browser.tabs.insertCSS({ code: hideMark })
			// invalidate cache
			invalidate()
		} else if (store.disabled = true) {
			await browser.storage.local.remove("disabled")
			await browser.tabs.removeCSS({ code: hideMark })
			await browser.tabs.reload()
		}
	} catch (err) {
		console.log(err)
	}
}

browser.browserAction.onClicked.addListener(toggleDisabled)