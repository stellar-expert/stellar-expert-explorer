import React, {useState} from 'react'
import {AccountAddress, useExplorerApi, withErrorBoundary} from '@stellar-expert/ui-framework'
import ContractUsersChartView from './contract-users-chart-view'
import ContractFunctionSelectorView from './contract-function-selector-view'

export default withErrorBoundary(function ContractUsersView({contract, functions}) {
    const [func, setFunc] = useState('all')
    const since = Math.floor(new Date().getTime() / 1000) - 30 * 24 * 60 * 60
    let apiUrl = `contract/${contract}/users`
    if (func !== 'all') {
        apiUrl += '?func=' + encodeURIComponent(func)
    }
    const users = useExplorerApi(apiUrl)
    if (!users.loaded || !functions)
        return <div className="segment blank">
            <div className="loader large"/>
        </div>
    if (!users.data?.length)
        return <div className="segment blank">
            <div className="space dimmed text-center text-small">(invocations history not available)</div>
        </div>

    const title = <>Contract activity <ContractFunctionSelectorView functions={functions} onChange={setFunc}/></>
    return <>
        <ContractUsersChartView contract={contract} users={users.data} title={title}/>
        <div className="segment blank space">
            <table className="table">
                <thead>
                <tr>
                    <td>Address</td>
                    <td className="text-right" style={{width: '5em'}}>Invocations</td>
                </tr>
                </thead>
                <tbody>
                {users.data.map(user => <tr key={user.address}>
                    <td><AccountAddress account={user.address} chars="all"/></td>
                    <td className="text-right">{user.invocations}</td>
                </tr>)}
                </tbody>
            </table>
        </div>
    </>
})