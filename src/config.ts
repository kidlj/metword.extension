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

	collectionsURL: "http://app.metword.co:8080/api/collection/list",
	collectionURL: "http://app.metword.co:8080/api/collection",
}

const production = {
	meetsURL: "https://app.metword.co/meet/times",
	queryURL: "https://app.metword.co/word?word=",
	addSceneURL: "https://app.metword.co/scene",
	forgetSceneURL: "https://app.metword.co/scene?id=",
	knowURL: "https://app.metword.co/meet/toggle?id=",

	collectionsURL: "https://app.metword.co/api/collection/list",
	collectionURL: "https://app.metword.co/api/collection",
}

const config: Config = {
	development,
	production
}

export default config[env ?? "development"]