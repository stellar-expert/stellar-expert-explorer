import React from 'react'
import {QrCode} from '@stellar-expert/ui-framework'

export default function AccountQrCode({address}) {
    return <QrCode value={address} caption={address} size={256}/>
}