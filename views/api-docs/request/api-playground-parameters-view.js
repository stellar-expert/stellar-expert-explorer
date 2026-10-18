import React, {useCallback} from 'react'
import cn from 'classnames'
import describeType, {describeConstraints} from '../api-type-description'

const locations = [
    {key: 'path', title: 'Path'},
    {key: 'query', title: 'Query'}
]

//enums with a few options render as a segmented switch, longer ones as a dropdown
const maxSegmentedOptions = 3

/**
 * Editable controls for the playground request arguments
 * @param {Array} params - dereferenced parameters list (without the "estimate" switch)
 * @param {{}} values - current argument values
 * @param {function(String, *)} onChange - argument value change handler
 */
export default function ApiPlaygroundParametersView({params, values, onChange}) {
    return locations.map(({key, title}) => {
        const group = params.filter(p => p.in === key)
        if (!group.length)
            return null
        return <div key={key} className="api-playground-group">
            <div className="api-caption">{title}</div>
            {group.map(param => <ParamControlView key={param.name} param={param} value={values[param.name]} onChange={onChange}/>)}
        </div>
    })
}

function ParamControlView({param, value, onChange}) {
    const schema = param.schema || {}
    const constraints = describeConstraints(schema)
    const setValue = useCallback(v => onChange(param.name, v), [param.name, onChange])
    //a flag is switched right in its label line
    const isFlag = schema.type === 'boolean'
    return <div className="api-playground-param">
        <div className="api-playground-label">
            <span className="api-field-name">{param.name}</span>
            <span className="api-type">{describeType(schema)}{!!constraints && <span className="dimmed"> · {constraints}</span>}</span>
            {!!param.required && <span className="api-required">required</span>}
            {isFlag && <ToggleView value={value} setValue={setValue}/>}
        </div>
        {!isFlag && <ParamInputView param={param} schema={schema} value={value} setValue={setValue}/>}
    </div>
}

function ToggleView({value, setValue}) {
    const onToggle = useCallback(e => setValue(e.target.checked), [setValue])
    return <label className="api-toggle">
        <input type="checkbox" checked={value === true || value === 'true'} onChange={onToggle}/>
        <span className="api-toggle-slider"/>
    </label>
}

function SegmentedView({options, value, setValue}) {
    return <div className="api-segmented" role="radiogroup">
        {options.map(option => <button key={option} type="button" role="radio" aria-checked={value === option}
                                       className={cn('api-segment', {selected: value === option})} onClick={() => setValue(option)}>
            {option}
        </button>)}
    </div>
}

function ParamInputView({param, schema, value, setValue}) {
    const onInputChange = useCallback(e => setValue(e.target.value), [setValue])
    const onArrayChange = useCallback(e => setValue(e.target.value.split(',')), [setValue])

    if (schema.enum?.length && schema.enum.length <= maxSegmentedOptions)
        return <SegmentedView options={schema.enum} value={value} setValue={setValue}/>
    if (schema.enum?.length)
        return <select value={value ?? ''} onChange={onInputChange}>
            {!param.required && <option value="">—</option>}
            {schema.enum.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
    if (schema.type === 'array')
        return <>
            <input type="text" value={Array.isArray(value) ? value.join(',') : (value ?? '')} onChange={onArrayChange}
                   placeholder={formatPlaceholder(param.example ?? schema.example ?? schema.items?.example)}/>
            <div className="api-playground-hint text-tiny dimmed">Multiple values separated by commas</div>
        </>
    const placeholder = formatPlaceholder(param.example ?? schema.example)
    if (schema.type === 'integer' || schema.type === 'number') {
        const range = {min: schema.minimum, max: schema.maximum, step: schema.type === 'integer' ? 1 : 'any'}
        return <input type="number" {...range} value={value ?? ''} onChange={onInputChange} placeholder={placeholder}/>
    }
    return <input type="text" value={value ?? ''} onChange={onInputChange} spellCheck={false} placeholder={placeholder}/>
}

function formatPlaceholder(example) {
    if (example === undefined || example === null)
        return ''
    return Array.isArray(example) ? example.join(',') : String(example)
}
