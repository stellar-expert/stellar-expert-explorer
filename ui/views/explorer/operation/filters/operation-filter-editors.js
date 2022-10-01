import React, {useState} from 'react'
import {StrKey} from 'stellar-sdk'
import DropdownMenu from '../../../components/dropdown-menu'
import {DateSelector} from '@stellar-expert/ui-framework'

function parseTypeGroupOptions(value = '', options) {
    const res = []
    if (!value) return res

    function addDelimiters(v) {
        return ',' + v + ','
    }

    value = addDelimiters(value)

    for (let opt of options.filter(f => f.value.includes(','))) {
        const matchCriteria = addDelimiters(opt.value),
            pos = value.indexOf(matchCriteria)
        if (pos < 0) continue
        value = value.replace(matchCriteria, ',')
        res.push(opt)
    }

    //jumping through hoops here in order to put type groups before the idividual types
    for (let o of value.split(',').filter(v => !!v)) {
        let match = options.find(opt => opt.value === o)
        if (match) {
            res.push(match)
        }
    }
    return res
}

function TypeEditor({value, setValue, options}) {
    const selectedOptions = parseTypeGroupOptions(value, options),
        availableOptions = options.filter(opt => !selectedOptions.includes(opt))

    function update() {
        setValue([].concat.apply([], selectedOptions.map(opt => opt.value)).join(','))
    }

    function remove(option) {
        option.splice(selectedOptions.indexOf(option))
        update()
    }

    function add(title) {
        selectedOptions.push(availableOptions.find(opt => opt.title === title))
        update()
    }

    return <span>
        {selectedOptions.map(opt => <span key={opt.title}>
            {opt.title}&nbsp;<a href="#" className="icon-cancel" onClick={() => remove(opt)}/>
        </span>)}
        <DropdownMenu title="add type filter" children={availableOptions.map(({title}) => ({value: title, title}))}
                      onClick={add}/>
    </span>
}

function AccountEditor({value, setValue}) {
    const [internalValue, setInternalValue] = useState(value || '')

    function onChange(e) {
        const v = e.target.value.trim()
        setInternalValue(v)
        setValue(StrKey.isValidEd25519PublicKey(v) ? v : undefined)
    }

    return <input type="text" value={internalValue} onChange={onChange} style={{width: '25em'}}/>
}

function TimestampEditor({value, setValue}) {
    return <DateSelector value={parseInt(value)} onChange={setValue}/>
}

function TextEditor({value, setValue, filter}) {
    const [internalValue, setInternalValue] = useState(value || '')

    function onChange(e) {
        let v = e.target.value.trim()
        if (filter instanceof RegExp) {
            v = v.replace(filter, '')
        }
        if (typeof filter === 'function') {
            v = filter(v)
        }
        setInternalValue(v)
    }

    function confirm() {
        setValue(internalValue)
    }

    function onKeyDown(e) {
        if (e.key === 'Enter') {
            confirm()
        }
        if (e.key === 'Escape') {
            setValue(value)
        }
    }

    return <span>
        <input type="text" value={internalValue} onChange={onChange} onKeyDown={onKeyDown}/>&nbsp;
        <a href="#" className="icon-ok" onClick={confirm}/>
    </span>
}


function AmountEditor({value, setValue}) {
    return <TextEditor value={value} setValue={setValue} filter={/[\D.]/g}/>
}

function OfferIdEditor({value, setValue}) {
    return <TextEditor value={value} setValue={setValue} filter={/[\D]/g}/>
}

function MemoEditor({value, setValue}) {
    return <TextEditor value={value} setValue={setValue} filter={v => v.substr(0, 64)}/>
}

const editorMapping = {
    type: TypeEditor,
    account: AccountEditor,
    asset: AccountEditor,
    from: TimestampEditor,
    to: TimestampEditor,
    memo: MemoEditor,
    amount: AmountEditor,
    offerId: OfferIdEditor
}

export function resolveOperationFilterEditor(field) {
    return editorMapping[field]
}