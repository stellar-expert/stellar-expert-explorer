import React from 'react'
import {UtcTimestamp} from '@stellar-expert/ui-framework'

export default function DirectoryChangesHistoryView({address, changesHistory}) {
    let prevState
    return <div className="space">
        <h4>Changes history</h4>
        <table className="table compact space striped text-small">
            <thead>
            <tr>
                <th className="collapsing">Time</th>
                <th>Changes</th>
            </tr>
            </thead>
            <tbody>
            {changesHistory.map(ch => {
                const diff = findDifference(prevState, ch)
                prevState = ch
                return <tr>
                    <td className="dimmed">
                        <UtcTimestamp date={ch.ts}/>
                    </td>
                    <td>
                        {diffKeys.map(prop => <EntryDiff key={prop} data={ch} prop={prop} changed={diff[prop]}/>)}
                    </td>
                </tr>
            })}
            </tbody>
        </table>
    </div>
}

const diffKeys = ['name', 'domain', 'tags']

function EntryDiff({data, prop, changed}) {
    const style = {}
    if (changed) {
        style.backgroundColor = 'var(--color-warning)'
        style.padding = '0 0.2em'
    }
    let v = data[prop]
    if (prop === 'tags') {
        v = (v || []).map(t => '#' + t).join(', ')
    }
    return <div>
        <span className="dimmed">{prop}:</span> <b style={style}>{v}</b>
    </div>
}

function findDifference(prevState, newState) {
    const res = {}
    if (prevState) {
        for (let key of diffKeys) {
            if (JSON.stringify(prevState[key]) !== JSON.stringify(newState[key])) {
                res[key] = 1
            }
        }
    }
    return res
}