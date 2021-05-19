import React from 'react'
import Word from './Word'

const queryURL = "http://127.0.0.1:8080/word?word="

interface TipProps {
    selectText: string
    word: string
    range: Range
}

interface TipState {
    words: any[]
}

class Tip extends React.Component<TipProps, TipState> {
    state: TipState = {
        words: []
    }
    render() {
        return (
            <div className="words">
                {
                    this.state.words.map((w: any) => (<Word word={w} selectText={this.props.selectText} range={this.props.range} />))
                }
            </div>
        )
    }

    async componentDidMount() {
        const query = queryURL + this.props.word
        try {
            const resp = await fetch(query)
            if (resp.status != 200) {
                return
            }
            const result = await resp.json()
            if (!result.success) {
                return <p>Error</p>
            }
            const owords: any[] = result.words
            const words: any[] = []
            owords.forEach((w: any) => {
                const scenes: any[] = []
                if (w.edges.meets != null) {
                    w.edges.meets[0].edges.scenes.forEach((sc: any) => {
                        const scene: any = {
                            sentence: sc.text,
                            url: sc.url
                        }
                        scenes.push(scene)
                    })
                }
                const word: any = {
                    id: w.id,
                    name: w.name,
                    usPhonetic: w.us_phonetic,
                    ukPhonetic: w.uk_phonetic,
                    defs: w.def_zh,
                    scenes: scenes
                }
                words.push(word)
            })
            this.setState({
                words: words
            })
        } catch (err) {
            console.log("query word error", err)
        }
    }
}

export default Tip
