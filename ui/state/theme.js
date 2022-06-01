import {useState} from 'react'

function setGlobalTheme(theme) {
    localStorage.setItem('preferred-color-theme', theme)
    document.documentElement.attributes['data-theme'].value = theme
}

const preferredTheme = localStorage.getItem('preferred-color-theme')
if (preferredTheme) {
    setGlobalTheme(preferredTheme)
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    setGlobalTheme('night')
}

/**
 * @returns {[colorTheme: String, setTheme: Function]}
 */
export function useTheme() {
    const [theme, setTheme] = useState(localStorage.getItem('preferred-color-theme') || 'day')
    return [theme, function (newTheme) {
        setTheme(current => {
            if (typeof newTheme === 'function') {
                newTheme = newTheme(current)
            }
            setGlobalTheme(newTheme)
            return newTheme
        })
    }]
}