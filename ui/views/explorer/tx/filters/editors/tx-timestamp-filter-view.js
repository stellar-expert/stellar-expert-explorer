import React, {useCallback, useState} from 'react'
import {DateSelector, UtcTimestamp, useAutoFocusRef} from '@stellar-expert/ui-framework'

export function TimestampEditor({value, setValue}) {
    value = parseInt(value, 10)
    const [internalValue, setInternalValue] = useState(value || undefined)

    const confirm = useCallback(function () {
        setInternalValue(internalValue => {
            if (internalValue) {
                setValue(internalValue)
            }
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
    if (!setValue)
        return <UtcTimestamp date={value} className="condensed"/>
    return <>
        <DateSelector value={internalValue} onChange={setInternalValue} onKeyDown={onKeyDown} ref={useAutoFocusRef}/>
        <a href="#" className="icon-ok" onClick={confirm}/>
        &nbsp;
    </>
}