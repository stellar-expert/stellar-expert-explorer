import {formatWithAutoPrecision} from '@stellar-expert/formatter'

export default function ContractStorageInfo({stats}) {
    const {storage_entries: count} = stats
    if (!count)
        return null
    return <>
        <dt>Data Storage:</dt>
        <dd><a href={location.pathname + '/storage'}>{formatWithAutoPrecision(count)} {count > 1 ? 'entries' : 'entry'}</a></dd>
    </>
}