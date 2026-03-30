import {TimestampEditor} from '../../tx/filters/editors/tx-timestamp-filter-view'
import {TextEditor} from '../../tx/filters/tx-filter-editors'
import React from 'react'

export function TopicEditor({value, setValue}) {
    if (!setValue)
        return <code>{value}</code>
    return <TextEditor value={value} setValue={setValue}/>
}

const editorMapping = {
    topic: TopicEditor,
    from: TimestampEditor,
    to: TimestampEditor
}

export function resolveContractFilterEditor(field) {
    return editorMapping[field]
}