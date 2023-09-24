import {useDependantState, useExplorerApi, loadAccount, loadIssuedAssets} from '@stellar-expert/ui-framework'

export function useAccountInfo(address) {
    return useExplorerApi('account/' + address, {
        processResult(data) {
            if (data?.error && (data.status || data.error.status) === 404) {
                data.nonExistentAccount = true
            }
            data.address = address
            return data
        }
    })
}

export function useCompositeAccountInfo(address, muxedId) {
    const serverInfo = useAccountInfo(address)
    const [horizonInfo, setResult] = useDependantState(() => {
        if (serverInfo.loaded) {
            //fetch Horizon data
            loadAccount(address)
                .then(data => setResult({loaded: true, data}))
                .catch(e => {
                    console.error(e)
                    setResult({loaded: true, error: e, data: null})
                })
        }
        return {loaded: false, data: null}
    }, [address, serverInfo.loaded])

    if (!serverInfo.loaded || !horizonInfo.loaded) return {loaded: false, data: null}
    return {loaded: true, data: {...serverInfo.data, muxedId, ledgerData: horizonInfo.data}}
}

export function useAccountStatsHistory(address) {
    return useExplorerApi(`account/${address}/stats-history`, {
        processResult(data) {
            if (data?.error?.status === 404) {
                data.nonExistentAccount = true
            }
            data.address = address
            return data
        }
    })
}

export function useAccountBalanceHistory(address, asset) {
    return useExplorerApi(`account/${address}/balance/${asset}/history`)
}

export function useAccountIssuedAssets(address) {
    const [result, setResult] = useDependantState(() => {
        //fetch Horizon data
        loadIssuedAssets(address)
            .then(data => {
                if (data.length) {
                    data.sort((a, b) => a.asset_code - b.asset_code)
                }
                setResult({loaded: true, data})
            })
            .catch(e => {
                console.error(e)
                setResult({loaded: true, error: e, data: []})
            })
        return {loaded: false, data: []}
    }, [address])
    return result
}

