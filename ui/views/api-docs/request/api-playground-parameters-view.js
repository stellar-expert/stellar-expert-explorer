import React, {useCallback, useState} from 'react'
import {swapReference} from '../parsers/parse-component-references'
import {componentReferences} from '../api-docs-view'
import {Dropdown} from '@stellar-expert/ui-framework'

export default function ApiPlaygroundParametersView({params = [], updateRequestParam}) {
    return <div>
        <div className="micro-space"><h4>Parameters</h4></div>
        <div className="space">
            {!params.length && <span className="dimmed text-small">(no parameters)</span>}
            {params.map(p => {
                const param = swapReference(componentReferences[p.originalName || p.name], p)
                return param.schema.enum ?
                    <DropDownParamControl key={param.name} param={param} updateRequestParam={updateRequestParam}/> :
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
        updateRequestParam(prev => ({...prev, [param.name]: isArray ? val.split(',') : val}))
    }, [isArray])

    return <div className="micro-space">
        <label>
            <code>{param.name}
                {isArray && <span title="You can add multiple values separated by commas">[]</span>}</code>{' '}
            {!param.required && <span className="dimmed text-small">(optional)</span>}
        </label>
        <input type="text" onChange={onChange} value={value} className="primary"/>
    </div>
}

function DropDownParamControl({param, updateRequestParam}) {
    const [value, setValue] = useState(param.default || param.schema.enum[0] || '')

    const onChange = useCallback(val => {
        setValue(val)
        updateRequestParam(prev => ({...prev, [param.name]: val}))
    }, [updateRequestParam])

    return <div className="dropdown-control">
        <label>
            <code>{param.name}</code> {!param.required && <span className="dimmed text-small">(optional)</span>}
        </label>
        <Dropdown options={param.schema.enum} onChange={onChange}/>
    </div>
}