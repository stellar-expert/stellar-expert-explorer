import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {InfoTooltip as Info, AssetLink, withErrorBoundary} from '@stellar-expert/ui-framework'

export default withErrorBoundary(function AssetListAssetsView({assetList}) {
    if (!assetList)
        return null
    return <>
        <h3>Assets <span className="text-small">({assetList.assets.length})</span></h3>
        <hr className="flare"/>
        <div className="asset-list-assets">
            {assetList.assets.map(asset => {
                const descriptor = asset.issuer ? new AssetDescriptor(asset.code, asset.issuer) : null
                return <div key={asset.contract || (asset.code + asset.issuer)} className="dual-layout micro-space">
                    <div>
                        <img src={asset.icon} alt={asset.icon} className="asset-icon"/>
                    </div>
                    <div className="asset-info">
                        <AssetLink asset={descriptor || asset.contract} icon={false}/> {asset.name}
                        <div className="text-tiny">
                            <div className="row">
                                <div className="column column-66">
                                    by <a href={'https://' + asset.domain} target="_blank" rel="noreferrer">{asset.org}</a>
                                </div>
                                <div className="column column-33 text-right dimmed">Decimals: {asset.decimals}</div>
                            </div>
                            {!!asset.comment && <div title="Comment from the list provider">
                                {asset.comment}
                            </div>}
                        </div>
                    </div>
                </div>
            })}
        </div>
    </>
})