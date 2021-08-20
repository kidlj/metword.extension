export interface Config {
	[key: string]: {
		[key: string]: string
	}
}

const env = process.env.NODE_ENV

const development = {
	loginURL: "http://words.metaphor.com:8080/account/login",
	meetsURL: "http://words.metaphor.com:8080/meet/times",
	queryURL: "http://words.metaphor.com:8080/word?word=",
	addSceneURL: "http://words.metaphor.com:8080/scene",
	forgetSceneURL: "http://words.metaphor.com:8080/scene?id=",
	knowURL: "http://words.metaphor.com:8080/meet/toggle?id="
}

const production = {
	loginURL: "https://www.metwords.com/account/login",
	meetsURL: "https://www.metwords.com/meet/times",
	queryURL: "https://www.metwords.com/word?word=",
	addSceneURL: "https://www.metwords.com/scene",
	forgetSceneURL: "https://www.metwords.com/scene?id=",
	knowURL: "https://www.metwords.com/meet/toggle?id="
}

const config: Config = {
	development,
	production
}

console.log("env is:", env)

export default config[env ?? "development"]