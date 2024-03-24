import React, {useCallback, useEffect, useState} from 'react'
import {Dropdown} from '@stellar-expert/ui-framework'
import {parseQuery} from '@stellar-expert/navigation'
import {resolveOperationFilterEditor} from './tx-filter-editors'
import './tx-filter.scss'
import deepmerge from 'deepmerge'

const fieldDescriptionMapping = {
    account: {
        title: 'Account',
        description: 'Account in transaction',
        icon: 'hexagon-empty'
    },
    source: {
        title: 'Source account',
        description: 'Operation source account',
        icon: 'send-circle'
    },
    destination: {
        title: 'Destination account',
        description: 'Operation destination account',
        icon: 'receive-circle'
    },
    asset: {
        title: 'Asset',
        description: 'Asset in transaction',
        icon: 'trustlines'
    },
    src_asset: {
        title: 'Sent asset',
        description: 'Operation source asset',
        icon: 'remove-trustline'
    },
    dest_asset: {
        title: 'Received asset',
        description: 'Operation destination asset',
        icon: 'create-trustline'
    },
    type: {
        title: 'Operation type',
        description: 'Operation type',
        icon: 'puzzle'
    },
    offer: {
        title: 'Offer ID',
        description: 'DEX offer id',
        icon: 'div-circle'
    },
    pool: {
        title: 'Liquidity pool ID',
        description: 'Liquidity pool id',
        icon: 'droplet'
    },
    memo: {
        title: 'Memo',
        description: 'Transaction memo',
        icon: 'attach'
    },
    from: {
        title: 'After',
        description: 'After date',
        icon: 'angle-right',
        multi: false
    },
    to: {
        title: 'Before',
        description: 'Before date',
        icon: 'angle-left',
        multi: false
    }
}

function FilterCondition({field, value, setValue, removeFilter, edit}) {
    const updateValue = useCallback(function (value) {
        setValue(field, value)
    }, [field, setValue])

    const removeValue = useCallback(function () {
        removeFilter(field, value)
    }, [field, value, removeFilter])

    const childProps = {value}
    const filter = fieldDescriptionMapping[field]
    if (edit || filter.multi === false) {
        childProps.setValue = updateValue
    }

    const editor = resolveOperationFilterEditor(field)
    const title = !edit ? '' : (field === 'type' ? '' : filter.title)
    return <span className="op-filter-condition condensed" title={edit ? '' : filter.description}>
        <span className={'icon-' + filter.icon}/>
        {title} {React.createElement(editor, childProps)}
        {removeFilter ? <a href="#" className="icon-delete-circle" onClick={removeValue} title="Remove filter"/> : <>&emsp;</>}
    </span>
}

export function parseFiltersFromQuery() {
    const params = parseQuery()
    const filters = {}
    let isEmpty = true
    for (const [key, value] of Object.entries(params)) {
        const filterDescriptor = fieldDescriptionMapping[key]
        if (!filterDescriptor)
            continue //skip unrelated query parameters
        filters[key] = value
        isEmpty = false
    }
    return filters
}

function FiltersGroup({filters, replaceFilter, removeFilter, edit = false}) {
    if (!filters)
        return null
    return <>{Object.entries(filters).map(([field, values]) => {
        if (!(values instanceof Array)) {
            return <FilterCondition key={field} field={field} value={values} edit={edit} setValue={replaceFilter}
                                    removeFilter={removeFilter}/>
        }
        if (!values.length)
            return null
        return <React.Fragment key={field}>
            {values.map(value => <FilterCondition key={value} field={field} value={value} edit={edit}
                                                  setValue={replaceFilter} removeFilter={removeFilter}/>)}
        </React.Fragment>
    })}</>
}

export default function TxFilterView({presetFilter, onChange}) {
    const [filters, setFilters] = useState(presetFilter || {})
    const [serializedFilter, setSerializedFilter] = useState(JSON.stringify(filters))

    const availableFields = []
    const readyFilters = {}
    const editFilters = {}
    let editorMode = false
    for (const [field, props] of Object.entries(fieldDescriptionMapping)) {
        const values = filters[field]
        if (values !== undefined) {
            if (values instanceof Array) {
                const newValues = readyFilters[field] = []
                for (let i = 0; i < values.length; i++) {
                    const value = values[i]
                    if (!value) {
                        editFilters[field] = [value]
                        editorMode = true
                    } else if (!presetFilter || !presetFilter[field]?.includes(value)) {
                        newValues.push(value)
                    }
                }
            } else {
                if (!values) {
                    editFilters[field] = values
                    editorMode = true
                } else {
                    readyFilters[field] = values
                }
            }
        }
        if (props.multi !== false || !values) {
            availableFields.push({
                value: field,
                title: props.description,
                icon: 'icon-' + props.icon
            })
        }
    }

    const updateExternalFilters = useCallback(function (newFilters) {
        setSerializedFilter(prev => {
            const newValue = JSON.stringify(newFilters)
            if (prev !== newValue) {
                setTimeout(() => onChange(deepmerge(presetFilter, newFilters)), 100)
                return newValue
            }
            return prev
        })
    }, [onChange])

    useEffect(() => {
        const queryParams = parseFiltersFromQuery()
        setFilters(queryParams)
        updateExternalFilters(queryParams)
    }, [])


    const replaceFilter = useCallback((field, value) => setTimeout(() => setFilters(prev => {
        const newFilters = {...prev}
        const filter = fieldDescriptionMapping[field]
        //atomic values
        if (filter.multi === false) {
            if (value === null) {
                delete newFilters[field]
                updateExternalFilters(newFilters)
            } else {
                newFilters[field] = value
                if (value) {
                    updateExternalFilters(newFilters)
                }
            }
            return newFilters
        }
        //multi-values
        let values = newFilters[field]
        if (!values) {
            values = newFilters[field] = []
        }
        if (value !== null) {
            if (!values.includes(value)) {
                if (values[values.length - 1] === '') {
                    values.pop()
                }
                values.push(value)
                if (value) {
                    updateExternalFilters(newFilters)
                }
            }
        } else {
            const idx = values.indexOf('')
            if (idx >= 0) {
                values.splice(idx, 1)
                updateExternalFilters(newFilters)
            }
        }
        return newFilters
    }), 100), [updateExternalFilters])

    const removeFilter = useCallback((field, value) => setFilters(prev => {
        const newFilters = {...prev}
        const filter = fieldDescriptionMapping[field]
        //atomic value
        if (filter.multi === false) {
            if (newFilters[field]) {
                delete newFilters[field]
                updateExternalFilters(newFilters)
            }
            return newFilters
        }
        //multi-values
        const values = newFilters[field]
        const idx = values.indexOf(value)
        if (idx >= 0) {
            values.splice(idx, 1)
            updateExternalFilters(newFilters)
        }
        return newFilters
    }), [updateExternalFilters])

    const addFilter = useCallback(field => {
        replaceFilter(field, '')
    }, [replaceFilter])

    const title = <span className="nowrap"><span className="icon icon-add-circle"/>Add filter</span>

    return <div className="op-filters">
        <div className="mobile-only micro-space"/>
        <span className="icon-filter"/>&nbsp;Filters&emsp;
        <FiltersGroup filters={presetFilter}/>
        <FiltersGroup filters={readyFilters} replaceFilter={replaceFilter} removeFilter={removeFilter}/>
        {!editorMode ?
            <Dropdown title={title} options={availableFields} onChange={addFilter}/> :
            <div className="micro-space">
                <FiltersGroup filters={editFilters} replaceFilter={replaceFilter} removeFilter={removeFilter} edit/>
            </div>}
        <div className="micro-space"/>
    </div>
}