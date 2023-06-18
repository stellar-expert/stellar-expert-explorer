import React, {useState} from 'react'
import {StrKey} from 'stellar-sdk'
import {AccountAddress, useAutoFocusRef} from '@stellar-expert/ui-framework'

export function AccountEditor({value, setValue}) {
    const [internalValue, setInternalValue] = useState(value || '')
    if (!setValue)
        return <AccountAddress account={value} link={false}/>

    function onChange(e) {
        const v = e.target.value.trim()
        setInternalValue(v)
        if (StrKey.isValidEd25519PublicKey(v)) {
            setValue(v)
        }
    }

    return <input type="text" value={internalValue} onChange={onChange} ref={useAutoFocusRef}
                  style={{width: '26em', maxWidth: '56vw'}} className="condensed"/>
}