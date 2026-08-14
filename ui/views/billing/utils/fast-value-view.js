import React, {useCallback} from 'react'
import {Amount} from '@stellar-expert/ui-framework'

const fixValues = [
    {
        value: 100,
        name: <Amount amount={100}/>
    }, {
        value: 1_000,
        name: <Amount amount={1_000}/>
    }, {
        value: 10_000,
        name: <Amount amount={10_000}/>
    }
]

export default function FastValueView({values = fixValues, onClick, className}) {
    const applyValue = useCallback(e => {
        e.preventDefault()
        onClick(e)
    }, [onClick])

    return <div className={`${className} text-small`}>
        {values.map(val => <span key={val.value}>
            &emsp;
            <a href="#" data-amount={val.value} onClick={applyValue}>{val.name}</a>
        </span>)}
    </div>
}