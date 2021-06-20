import { browser } from "webextension-polyfill-ts"

const metsURL = "http://127.0.0.1:8080/word/mets"
const queryURL = "http://127.0.0.1:8080/word?word="
const meetURL = "http://127.0.0.1:8080/word/meet"

browser.runtime.onMessage.addListener(async (msg) => {
	switch (msg.action) {
		case "query":
			return await queryWord(msg.word)
		case 'getMets':
			return await getMets()
		case 'plusOne':
			return await plusOne(msg.scene)
	}
})

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

		const meetResult = await fetch(meetURL, {
			method: "POST",
			body: payload,
			headers: jsonHeaders
		})
		if (meetResult.status != 200) {
			console.log("meet word return:", status)
			return false
		}
		return true
	} catch (err) {
		console.log("meet word failed", err)
		return false
	}
}

async function queryWord(word: string) {
	try {
		const query = queryURL + word
		const resp = await fetch(query)
		if (resp.status != 200) {
			return []
		}
		const result = await resp.json()
		return result.words
	} catch (err) {
		console.log("query word error", err)
		return []
	}
}

async function getMets() {
	try {
		const res = await fetch(metsURL)
		if (res.status != 200) {
			return
		}
		const result = JSON.parse(await res.text())
		return result.mets
	} catch (err) {
		console.log("Metwords extension: get words error", err)
		return {}
	}
}