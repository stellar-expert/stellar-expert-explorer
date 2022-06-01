import React from 'react'
import DatePicker from 'react-datepicker'
import './date-selector.scss'

const minSelectableValue = new Date('2015-09-30T16:46:54Z')

export default function DateSelector({value, onChange, placeholder}) {
    function selectDate(newDate) {
        const d = newDate / 1000
        if (value !== d && onChange) {
            onChange(d)
        }
    }

    return <span>
            <DatePicker onChange={selectDate}
                        showTimeSelect
                        selected={value && new Date(value * 1000) || null}
                        closeOnScroll
                        dateFormat="yyyy/MM/dd - HH:mm:ss"
                        utcOffset={0}
                        minDate={minSelectableValue}
                        maxDate={new Date()}
                        placeholderText={placeholder}/>
        </span>
}