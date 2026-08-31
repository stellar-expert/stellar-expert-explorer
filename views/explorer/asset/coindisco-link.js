import React, {useEffect, useState} from 'react'

export default React.memo(function CoindiscoLink({asset}) {
    const [aid, setAid] = useState(null)
    useEffect(() => {
        getAssetId(asset)
            .then(assetId => setAid(assetId))
            .catch(e => console.error(e))
    }, [asset])
    if (!aid) //do not render anything if asset is not available
        return null
    const [symbol] = asset.split('-')
    const link = `https://widget.coindisco.com/?defaultAsset=${aid}&supportedNetworks=stellar&defaultNetwork=stellar&publicKey=pk_prod_01JVXZ32Q4BMYRZKQN61CFPJAW`
    const disco = <>Coindisco<sup>✦</sup></>
    return <a href={link} target="_blank" rel="noopener">
        <span className="desktop-only"><i className="icon-open-new-window"/>Purchase {symbol} with credit card or bank transfer on {disco}</span>
        <span className="mobile-only text-small"><i className="icon-open-new-window"/>Purchase with credit card on {disco}</span>
    </a>
})

let supportedAssets

async function getAssetId(asset) {
    if (!supportedAssets) { //init and cache
        try {
            supportedAssets = new Map()
            const fetched = await fetch('https://api.coindisco.com/api/market/widget/v2/cryptocurrency/?networks=stellar&page_size=1000', {referrerPolicy: 'no-referrer'})
            if (!fetched.ok)
                return null
            const list = await fetched.json()
            for (const a of list.results) {
                if (a.symbol.length > 12)
                    continue //skip contract assets
                let name = a.symbol
                if (a.issuer) {
                    name += '-' + a.issuer
                }
                supportedAssets.set(name, a.letter_id)
            }
        } catch (e) {
            console.error(e)
        }
    }
    return supportedAssets.get(asset)
}