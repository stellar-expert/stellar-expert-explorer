import React, {useCallback, useState} from 'react'
import {StrKey} from '@stellar/stellar-base'
import {AccountAddress, useAutoFocusRef} from '@stellar-expert/ui-framework'

export function AccountEditor({value, setValue}) {
    const [internalValue, setInternalValue] = useState(value || '')
    const onChange = useCallback(function (e) {
        const v = e.target.value.trim()
        setInternalValue(v)
        if (StrKey.isValidEd25519PublicKey(v) || StrKey.isValidContract(v)) {
            setValue(v)
        }
    }, [setValue])
    if (!setValue)
        return <AccountAddress account={value} link={false}/>

    return <input type="text" value={internalValue} onChange={onChange} ref={useAutoFocusRef}
                  style={{width: '26em', maxWidth: '56vw'}} className="condensed"/>
}