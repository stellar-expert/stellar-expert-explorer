import React from 'react'

function showQR(address) {
    import(/* webpackChunkName: "qr" */ './account-qr-code')
        .then(({default: QR}) => alert(<QR address={address}/>,{title:'QR code'}))
}

export default function AccountQrCodeToggle({account}) {
    return <a href="#" className="icon icon-qr" title="Show QR code for the account address" onClick={() => showQR(account)}/>
}