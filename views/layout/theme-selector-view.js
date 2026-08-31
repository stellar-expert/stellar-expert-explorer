import React from 'react'
import {useTheme} from '../../state/theme'

export default function ThemeSelectorView() {
    const [theme, setTheme] = useTheme()
    return <a href="#" onClick={() => setTheme(current => current === 'day' ? 'night' : 'day')}>
        {theme === 'day' ?
            <><i className="icon icon-night"/> Dark theme</> :
            <><i className="icon icon-day"/> Light theme</>}
    </a>
}