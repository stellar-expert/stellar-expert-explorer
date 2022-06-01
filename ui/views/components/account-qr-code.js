import React from 'react'
import QR from 'qrcode.react'

export default function AccountQrCode({address}) {
    return <div className="text-center">
        <QR value={address} size={256} level="Q" includeMargin/>
        <div className="text-small dimmed condensed word-break">{address}</div>
    </div>
}