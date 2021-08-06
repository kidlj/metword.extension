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
const timeOutMessage = "请求超时。"
const networkMessage = "网络连接异常。"
const otherErrorMessage = "未知错误。"

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

async function fetchResult(input: RequestInfo, init?: RequestInit) {
	try {
		const resp = await fetch(input, init)
		if (resp.status == 401) {
			return {
				success: false,
				message: loginMessage
			}
		}
		if (resp.status == 404) {
			return {
				success: false,
				message: notFoundMessage
			}
		}
		if (resp.status == 503) {
			return {
				success: false,
				message: rateLimitMessage
			}
		}
		if (resp.status == 504) {
			return {
				success: false,
				message: timeOutMessage
			}
		}
		if (resp.status != 200) {
			return {
				success: false,
				message: otherErrorMessage
			}
		}
		const data = await resp.json()
		return {
			success: true,
			data: data
		}
	} catch (err) {
		return {
			success: false,
			message: networkMessage
		}
	}

}

async function plusOne(scene: any) {
	const body = {
		id: scene.id,
		url: scene.url,
		text: scene.text
	}
	let payload = JSON.stringify(body)
	let jsonHeaders = new Headers({
		'Content-Type': 'application/json'
	})

	const result = await fetchResult(meetURL, {
		method: "POST",
		body: payload,
		headers: jsonHeaders
	})
	if (result.success) {
		// invalidate cache
		invalidate()
		return {
			success: true,
			scene: result.data.scene
		}
	}
	return result
}

async function toggleKnown(id: number) {
	const url = knowURL + id
	const result = await fetchResult(url, {
		method: "POST",
	})
	if (result.success) {
		// invalidate cache
		invalidate()
		return {
			success: true,
			state: result.data.state
		}
	}
	return result
}

async function forgetScene(id: number) {
	const url = forgetSceneURL + id
	const result = await fetchResult(url, {
		method: "DELETE",
	})
	if (result.success) {
		// invalidate cache
		invalidate()
		return {
			success: true,
		}
	}
	return result
}

async function queryWord(word: string) {
	const url = queryURL + word
	const result = await fetchResult(url)
	if (result.success) {
		return {
			success: true,
			words: result.data.words
		}
	}
	return result
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