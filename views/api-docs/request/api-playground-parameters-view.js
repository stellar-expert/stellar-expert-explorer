import React, {useCallback, useState} from 'react'
import {swapReference} from '../api-component-ref-parser'
import {componentReference} from '../api-docs-view'

export default function ApiPlaygroundParametersView({params, updateRequestParam}) {
    return <div className="card">
        <h4>Parameters</h4>
        <hr/>
        <div className="space">
            {params.map(p => {
                const param = swapReference(componentReference[p.originalName || p.name], p)
                return param.schema.enum ?
                    <SelectParamControl key={param.name} param={param} updateRequestParam={updateRequestParam}/> :
                    <TextParamControlView key={param.originalName || param.name} param={param} updateRequestParam={updateRequestParam}/>
            })}
        </div>
    </div>
}

function TextParamControlView({param, updateRequestParam}) {
    const [value, setValue] = useState(param.default || param.schema.default || '')
    const isArray = param.schema.type === 'array'

    const onChange = useCallback(e => {
        const val = e.target.value
        setValue(val)
        updateRequestParam(prev => ({ ...prev, [param.name]: isArray ? val.split(',') : val }))
    }, [isArray])

    return <div className="micro-space">
        <label>
            <code>{param.name}</code> {!param.required && <span className="dimmed text-small">(optional)</span>}
        </label>
        <input type="text" onChange={onChange} value={value} className="primary"/>
        {isArray && <div className="dimmed text-tiny text-right" style={{marginTop: '-0.5rem'}}>
            You can add multiple values separated by commas</div>}
    </div>
}

function SelectParamControl({param, inProgress, updateRequestParam}) {
    const [value, setValue] = useState(param.default || '')

    const changeNetwork = useCallback(e => {
        const val = e.target.value
        setValue(val)
        updateRequestParam(prev => ({ ...prev, [param.name]: val }))
    }, [updateRequestParam])

    return <div>
        <label>
            <code>{param.name}</code> {!param.required && <span className="dimmed text-small">(optional)</span>}
        </label>
        <select value={value} disabled={inProgress} onChange={changeNetwork}>
            {param.schema.enum.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
    </div>
}