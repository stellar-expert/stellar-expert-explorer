import React from 'react'
import TxMemoView from '../tx/tx-memo-view'
import OpTextDescriptionView from './operation-text-description-view'
import {convertApiOperation} from './operation-api-converter'

export default function OperationRowDescriptionView({op}) {
    return <>
        <OpTextDescriptionView {...convertApiOperation(op)} />
        {op.memo && <TxMemoView memo={op.memo} memoType={op.memo_type} className="text-tiny"/>}
    </>
}