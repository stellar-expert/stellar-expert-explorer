import React, {useState} from 'react'
import DropdownMenu from '../../../components/dropdown-menu'
import {resolveOperationFilterEditor} from './operation-filter-editors'
import './operations-filter.scss'

const operators = {
    eq: '=',
    ne: '≠',
    gt: '>',
    lt: '<',
    gte: '≥',
    lte: '≤'
}

const fieldDescriptionMapping = {
    type: {
        description: 'Operation type',
        operators: ['eq'],
        options: [
            {
                title: 'Group: payments',
                description: 'Including Payment, PathPaymentStrictReceive, PathPaymentStrictSend, CreateClaimableBalance, ClaimClaimableBalance, Clawback, ClawbackClaimableBalance operations',
                value: '1,2,13,14,15,19,20' //TODO: include Create and Merge account ops as well
            },
            {
                title: 'Group: trustlines',
                description: 'Including ChangeTrust, AllowTrust, SetTrustLineFlags operations',
                value: '6,7,21'
            },
            {
                title: 'Group: DEX offers',
                description: 'Including ManageSellOffer, ManageBuyOffer, CreatePassiveSellOffer operations',
                value: '3,4,12'
            },
            {
                title: 'Group: account settings',
                description: 'Including CreateAccount, SetOptions, ChangeTrust, AllowTrust, AccountMerge, Inflation, ManageData, BumpSequence, BeginSponsoringFutureReserves, EndSponsoringFutureReserves, RevokeSponsorship, SetTrustLineFlags operations',
                value: '0,5,6,7,8,9,10,11,16,17,18,21'
            },
            {
                title: 'CreateAccount op',
                value: '0'
            },
            {
                title: 'Payment op',
                value: '1'
            },
            {
                title: 'PathPaymentStrictReceive op',
                value: '2'
            },
            {
                title: 'ManageSellOffer op',
                value: '3'
            },
            {
                title: 'CreatePassiveSellOffer op',
                value: '4'
            },
            {
                title: 'SetOptions op',
                value: '5'
            },
            {
                title: 'ChangeTrust op',
                value: '6'
            },
            {
                title: 'AllowTrust op',
                value: '7'
            },
            {
                title: 'AccountMerge op',
                value: '8'
            },
            {
                title: 'Inflation op',
                value: '9'
            },
            {
                title: 'ManageData op',
                value: '10'
            },
            {
                title: 'BumpSequence op',
                value: '11'
            },
            {
                title: 'ManageBuyOffer op',
                value: '12'
            },
            {
                title: 'PathPaymentStrictSend op',
                value: '13'
            },
            {
                title: 'CreateClaimableBalance op',
                value: '14'
            },
            {
                title: 'ClaimClaimableBalance op',
                value: '15'
            },
            {
                title: 'BeginSponsoringFutureReserves op',
                value: '16'
            },
            {
                title: 'EndSponsoringFutureReserves op',
                value: '17'
            },
            {
                title: 'RevokeSponsorship op',
                value: '18'
            },
            {
                title: 'Clawback op',
                value: '19'
            },
            {
                title: 'ClawbackClaimableBalance op',
                value: '20'
            },
            {
                title: 'SetTrustLineFlags op',
                value: '21'
            }
        ]
    },
    account: {
        description: 'Source or destination account',
        operators: ['eq']
    },
    asset: {
        description: 'Asset being sent/received/traded',
        operators: ['eq']
    },
    from: {
        description: 'Lower bound of time interval',
        operators: ['gte']
    },
    to: {
        description: 'Upper bound of time interval',
        operators: ['lte']
    },
    memo: {
        description: 'Memo attached to the transaction',
        operators: ['eq']
    },
    amount: {
        description: 'Payment/trade amount',
        operators: ['eq', 'gte', 'lte']
    },
    offerId: {
        description: 'Id of created/updated/deleted DEX offer',
        operators: ['eq']
    }
}


function FilterCondition({condition, setValue, onRemove}) {
    const {field, operator, value} = condition

    function updateValue(value) {
        setValue({field, operator, value})
    }

    return <div className="op-filter-condition">
        {field} {operators[operator]} {React.createElement(resolveOperationFilterEditor(field),
        {value, setValue: updateValue, options: fieldDescriptionMapping[field].options})}
        <a href="#" className="icon-cancel" onClick={onRemove}/>
    </div>
}

function formatFilter({field, operator, value}) {
    return `${field}=${operator}:${value}`
}

function parseFilter(filter) {
    const [field, c] = filter.split('='),
        [operator, value] = c.split(':')
}

export default function OperationsFilterView() {
    const [filters, setFilters] = useState([]),
        filteredFields = filters.map(f => f.field),
        availableFields = Object.keys(fieldDescriptionMapping)
            .filter(field => !filteredFields.includes(field))
            .map(field => ({value: field, title: fieldDescriptionMapping[field].description}))

    function addFilter(field) {
        setFilters([...filters, {field, value: '', operator: fieldDescriptionMapping[field].operators[0]}])
    }

    return <div className="op-filters">
        <label>Filters&nbsp;</label>
        <div className="op-filter-container">
            {filters.map(f => {
                function removeFilter() {
                    const newFilters = filters.slice()
                    newFilters.splice(filters.findIndex(filter => filter.field === f.field), 1)
                    setFilters(newFilters)
                }

                function replaceFilter(v) {
                    const newFilters = filters.slice()
                    newFilters.splice(filters.findIndex(filter => filter.field === f.field), 1, v)
                    setFilters(newFilters)
                }

                return <FilterCondition key={f} condition={f} onRemove={removeFilter} setValue={replaceFilter}/>
            })}

            <DropdownMenu title="add filter" children={availableFields} onClick={addFilter}/>
        </div>
    </div>
}