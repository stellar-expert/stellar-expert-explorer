import React, {useState} from 'react'
import {Dropdown} from '@stellar-expert/ui-framework'

export default function ContractFunctionSelectorView({functions, func, onChange}) {
    const [selected, setSelected] = useState(func || 'all')
    if (!functions)
        return null

    function select(value) {
        setSelected(value)
        onChange(value)
    }

    const options = [
        {title: 'all functions', value: 'all'},
        ...functions.map(f => ({
            title: <><code>{f.function}</code> <span className="dimmed text-tiny">({f.invocations} invocations)</span></>,
            value: f.function
        }))
    ]

    return <>
        <Dropdown onChange={select} value={selected} options={options}/>
    </>
}