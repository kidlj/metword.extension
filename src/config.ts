export interface Config {
	[key: string]: {
		[key: string]: string
	}
}

const env = process.env.NODE_ENV

const development = {
	meetsURL: "http://app.metword.co:8080/meet/times",
	queryURL: "http://app.metword.co:8080/word?word=",
	addSceneURL: "http://app.metword.co:8080/scene",
	forgetSceneURL: "http://app.metword.co:8080/scene?id=",
	knowURL: "http://app.metword.co:8080/meet/toggle?id=",

	articleStateURL: "http://app.metword.co:8080/api/collection/state",
	collectionURL: "http://app.metword.co:8080/api/collection",

	sourceStateURL: "http://app.metword.co:8080/api/source/state",
	sourceURL: "http://app.metword.co:8080/source?id=",
	subscribeURL: "http://app.metword.co:8080/api/feed",
	homeURL: "http://app.metword.co:8080/"
}

const production = {
	meetsURL: "https://app.metword.co/meet/times",
	queryURL: "https://app.metword.co/word?word=",
	addSceneURL: "https://app.metword.co/scene",
	forgetSceneURL: "https://app.metword.co/scene?id=",
	knowURL: "https://app.metword.co/meet/toggle?id=",

	articleStateURL: "https://app.metword.co/api/collection/state",
	collectionURL: "https://app.metword.co/api/collection",

	sourceStateURL: "https://app.metword.co/api/source/state",
	sourceURL: "https://app.metword.co/source?id=",
	subscribeURL: "https://app.metword.co/api/feed",
	homeURL: "https://metword.co/"
}

const config: Config = {
	development,
	production
}

export default config[env ?? "development"]