import React from 'react'
import ApiDocsText from '../api-docs-text'

export default function ApiSchemaPropertyView({prop, compact = false}) {
    if (!prop)
        return null
    return <div>
        <PropTypeView prop={prop}/>
        {!compact && <div>
            <PropEnumView prop={prop}/>
            <PropDefaultView prop={prop}/>
            <PropExampleView prop={prop}/>
        </div>}
        <div className="nano-space"><ApiDocsText text={prop.description}/></div>
    </div>
}

function PropTypeView({prop = {}}) {
    return <div className="dimmed text-small text-monospace condensed">
        {prop.typeDescription}&nbsp;
        <PropTypeRestrictionView prop={prop}/>
        {/*<PropTypePatternView prop={prop}/>*/}
    </div>
}

function PropTypeRestrictionView({prop = {}}) {
    return <span>
        <PropRangeView min={prop.minimum} max={prop.maximum}/>
        <PropRangeView min={prop.minLength} max={prop.maxLength} type={prop.type}/>
        <PropRangeView min={prop.minItems} max={prop.maxItems} type={prop.type}/>
        {prop.uniqueItems && <span className="text-monospace dimmed condensed"><span className="badge outline">unique</span>&nbsp;</span>}
        {prop.format && <span className="text-monospace dimmed condensed"><span className="badge outline">{prop.format}</span>&nbsp;</span>}
    </span>
}

function PropRangeView({min, max, type}) {
    const units = {
        array: 'items',
        string: 'characters'
    }
    let content
    if (min && max) {
        content = `[${min}..${max}] ${units[type]}`
    }
    if (min) {
        content = `>=${min} ${units[type]}`
    }
    if (max) {
        content = `<=${min} ${units[type]}`
    }
    if (content)
        return <span className="text-monospace dimmed condensed"><span className="badge outline">{content}</span>&nbsp;</span>
    return null
}

function PropTypePatternView({prop = {}}) {
    const propArray = prop.anyOf || prop.oneOf
    const patternArray = propArray?.map(item => item.pattern) || []
    const pattern = prop.items?.pattern || prop.pattern
    const patternList = pattern ? [pattern] : patternArray
    if (!patternList[0])
        return null
    return prop.type === 'array' ?
        <span>[items <span className="badge info-color">{patternList.join(' or ')}</span>]</span> :
        <span className="badge info-color">{patternList.join(' or ')}</span>
}

function PropExampleView({prop = {}}) {
    const name = prop.name
    const example = prop.example || prop.items?.example
    if (!example)
        return null
    let resultString = (prop.in === 'path') ? example :
        (example instanceof Array) ?
            name + '[]=' + example.join(`&${name}[]=`) :
            `${name}=${example}`

    return <div className="word-break dimmed text-monospace condensed">
        Example: <code>{resultString}</code>
    </div>
}

function PropDefaultView({prop = {}}) {
    const defaultValue = prop.default || prop.items?.default
    if (!defaultValue)
        return null

    return <div className="word-break dimmed text-monospace condensed">
        Default: <code>{defaultValue}</code>
    </div>
}

function PropEnumView({prop = {}}) {
    const enumValue = prop.enum || prop.schema?.enum || prop.items?.enum
    if (!enumValue)
        return null

    return <div className="word-break dimmed text-monospace condensed">
        Enum: {enumValue.map((item, i) => <span key={item}>
        {i > 0 && '|'}
        <code>{`"${item}"`}</code>
        </span>)}
    </div>
}