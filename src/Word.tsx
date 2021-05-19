
import React from 'react'
import { getSceneSentence } from './lib'

const meetURL = "http://127.0.0.1:8080/word/meet"

interface WordProps {
    word: WordObject
    selectText: string
    range: Range
}

interface WordObject {
    id: string
    name: string
    usPhonetic: string
    ukPhonetic: string
    defs: string[]
    scenes: Scene[]
}

interface WordState {
    met: boolean,
    times: number
    scenes: Scene[]
}

interface Scene {
    sentence: string
    url: string
}


class Word extends React.Component<WordProps, WordState> {
    state: WordState = {
        times: this.props.word.scenes.length,
        scenes: this.props.word.scenes,
        met: false
    }
    render() {
        const word = this.props.word
        return (
            < div className="word" >
                <div className="head">
                    <span className="headword">{word.name}</span>
                    <span className="met-times">{this.state.times}</span>
                    <button className="plus-one" key={word.id} disabled={this.state.met} onClick={() => this.plusOne(word.id, this.props.selectText, this.props.range)}>+1</button>
                </div>
                <div className="phonetic">
                    <span>US /{word.usPhonetic}/ UK /{word.ukPhonetic}/</span>
                </div>
                <div className="defs">
                    <ul>
                        {word.defs.map((def) => (<li className="def">{def}</li>))}
                    </ul>
                </div>
                <div className="scenes">
                    <ul>
                        {this.state.scenes.map((scene) => {
                            return <li className="scene">
                                <a href={scene.url}>{scene.sentence}</a>
                            </li>
                        })}
                    </ul>
                </div>
            </div>
        )
    }

    async plusOne(id: string, selectText: string, range: Range) {
        const text = getSceneSentence(range, selectText)
        console.log("sentence:", text)
        const url = window.location.href
        try {
            const body = {
                id: id,
                url: url,
                text: text
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
                return
            }
        } catch (err) {
            console.log("meet word failed", err)
        }
        this.setState({
            times: this.state.times + 1,
            met: true,
            scenes: this.state.scenes.concat({
                sentence: text,
                url: url
            })
        })
    }
}

export default Word
