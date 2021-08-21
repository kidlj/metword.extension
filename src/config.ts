export interface Config {
	[key: string]: {
		[key: string]: string
	}
}

const env = process.env.NODE_ENV

const development = {
	loginURL: "http://words.metaphor.com:9000/login",
	meetsURL: "http://words.metaphor.com:9000/api/meet/times",
	queryURL: "http://words.metaphor.com:9000/api/word?word=",
	addSceneURL: "http://words.metaphor.com:9000/api/scene",
	forgetSceneURL: "http://words.metaphor.com:9000/api/scene?id=",
	knowURL: "http://words.metaphor.com:9000/api/meet/toggle?id="
}

const production = {
	loginURL: "https://www.metwords.com/login",
	meetsURL: "https://www.metwords.com/api/meet/times",
	queryURL: "https://www.metwords.com/api/word?word=",
	addSceneURL: "https://www.metwords.com/api/scene",
	forgetSceneURL: "https://www.metwords.com/api/scene?id=",
	knowURL: "https://www.metwords.com/api/meet/toggle?id="
}

const config: Config = {
	development,
	production
}

export default config[env ?? "development"]