import React, {useCallback, useState} from 'react'
import {StrKey} from '@stellar/stellar-base'
import {shortenString} from '@stellar-expert/formatter'
import {AssetLink, useAutoFocusRef} from '@stellar-expert/ui-framework'
import {TypeEditor} from './editors/tx-type-filter-view'
import {AssetEditor} from './editors/tx-asset-filter-view'
import {AccountEditor} from './editors/tx-account-filter-view'
import {TimestampEditor} from './editors/tx-timestamp-filter-view'

function TextEditor({value, setValue, mask}) {
    const [internalValue, setInternalValue] = useState(value || '')

    const onChange = useCallback(function (e) {
        let v = e.target.value.trim()
        if (mask instanceof RegExp) {
            v = v.replace(mask, '')
        }
        if (typeof mask === 'function') {
            v = mask(v)
        }
        setInternalValue(v)
    }, [mask])

    const confirm = useCallback(function () {
        setInternalValue(internalValue => {
            setValue(internalValue)
            return internalValue
        })
    }, [setValue])

    const onKeyDown = useCallback(function (e) {
        if (e.key === 'Enter') {
            confirm()
        }
        if (e.key === 'Escape') {
            setValue(value)
        }
    }, [confirm, setValue, value])

    if (!setValue) {
        value = value.toString()
        return <span>{value.length > 20 ? shortenString(value, 12) : value}</span>
    }

    return <>
        <input type="text" value={internalValue} ref={useAutoFocusRef} onChange={onChange} onKeyDown={onKeyDown}
               style={{width: '16em', maxWidth: '50vw'}}/>&nbsp;
        <a href="#" className="icon-ok" onClick={confirm}/>
    </>
}

function OfferIdEditor({value, setValue}) {
    return <TextEditor value={value} setValue={setValue} mask={/[\D]/g}/>
}

function LiquidityPoolEditor({value, setValue}) {
    if (!setValue) {
        if (/^[a-f0-9]{64}$/.test(value)) { //remap hex format to pool id format
            try {
                value = StrKey.encodeLiquidityPool(Buffer.from(value, 'hex'))
            } catch (_) {
            }
        }
        if (!StrKey.isValidLiquidityPool(value))
            return <span className="dimmed">(Invalid pool)</span>
        if (value.startsWith('native'))
            return <span className="dimmed">(Native pool)</span>
        return <AssetLink asset={value} link={false}/>
    }
    return <TextEditor value={value} setValue={setValue} mask={/[\W]/g}/>
}

function MemoEditor({value, setValue}) {
    return <TextEditor value={value} setValue={setValue} mask={v => v.substring(0, 64)}/>
}

const editorMapping = {
    type: TypeEditor,
    account: AccountEditor,
    source: AccountEditor,
    destination: AccountEditor,
    asset: AssetEditor,
    src_asset: AssetEditor,
    dest_asset: AssetEditor,
    from: TimestampEditor,
    to: TimestampEditor,
    memo: MemoEditor,
    offer: OfferIdEditor,
    pool: LiquidityPoolEditor
}

export function resolveOperationFilterEditor(field) {
    return editorMapping[field]
}