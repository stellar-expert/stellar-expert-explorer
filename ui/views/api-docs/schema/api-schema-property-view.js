import React from 'react'
import parseDocumentationText from '../parsers/parse-documentation-text'

export default function ApiSchemaPropertyView({prop, isCollapsible, isCollapsed, onToggleAll, compact = false}) {
    if (!prop)
        return null
    return <div className="text-small" style={{paddingLeft: '1rem'}}>
        {!compact && <div>
            <PropEnumView prop={prop}/>
            <PropDefaultView prop={prop}/>
            <PropExampleView prop={prop}/>
        </div>}
        <div className="nano-space">
            {parseDocumentationText(prop.description)}
        </div>
        <div className="nano-space"/>
    </div>
}

export function PropTypeView({prop = {}, isCollapsible, isCollapsed, onToggleAll}) {
    return <div className="dimmed text-tiny">
        {prop.typeDescription}&nbsp;
        {isCollapsible && <>|&nbsp;<span className="color-primary" onClick={onToggleAll} style={{cursor: 'pointer'}}>
            {isCollapsed ? 'Expend all' : 'Collapse all'}</span></>}
        <PropTypeRestrictionView prop={prop}/>
        <PropTypePatternView prop={prop}/>
    </div>
}

function PropTypeRestrictionView({prop = {}}) {
    return <span>
        <PropRangeView min={prop.minimum} max={prop.maximum}/>
        <PropRangeView min={prop.minLength} max={prop.maxLength} type={prop.type}/>
        <PropRangeView min={prop.minItems} max={prop.maxItems} type={prop.type}/>
        {prop.uniqueItems && <span><span className="badge outline">unique</span>&nbsp;</span>}
        {prop.format && <span><span className="badge outline">{prop.format}</span>&nbsp;</span>}
    </span>
}

function PropRangeView({min, max, type}) {
    const units = {
        array: 'items',
        string: 'characters',
    }
    if (min && max) {
        return <span><span className="badge outline">[{min} .. {max}] {units[type]}</span>&nbsp;</span>
    }
    if (min) {
        return <span><span className="badge outline">{`>=${min}`} {units[type]}</span>&nbsp;</span>
    }
    if (max) {
        return <span><span className="badge outline">{`<=${max}`} {units[type]}</span>&nbsp;</span>
    }
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
        <div className="text-tiny">[items <span className="badge info-color">{patternList.join(' or ')}</span>]</div> :
        <div className="badge info-color text-tiny">{patternList.join(' or ')}</div>
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

    return <div className="word-break nano-space">
        Example: <code>{resultString}</code>
    </div>
}

function PropDefaultView({prop = {}}) {
    const defaultValue = prop.default || prop.items?.default
    if (!defaultValue)
        return null

    return <div className="word-break nano-space">
        Default: <code>{defaultValue}</code>
    </div>
}

function PropEnumView({prop = {}}) {
    const enumValue = prop.enum || prop.schema?.enum || prop.items?.enum
    if (!enumValue)
        return null

    return <div className="word-break nano-space">
        Enum: {enumValue.map(item => {
            const isLastItem = enumValue.at(-1) === item
        return <span key={item} className="nowrap">
            <code>{`"${item}"`}</code>{!isLastItem ? <>&nbsp;,&nbsp;</> : <>&nbsp;</>}
        </span>
    })}
    </div>
}