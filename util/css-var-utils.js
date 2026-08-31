function hexToRgbArray(hex) {
    return hex.match(/[A-Za-z0-9]{2}/g).map(v => parseInt(v, 16))
}

function rgbArrayToRgba(rgbArray, opacity) {
    return `rgba(${rgbArray.join()},${opacity})`
}

function getCssVar(cssVarName) {
    return getComputedStyle(document.documentElement).getPropertyValue(cssVarName)
}

export {hexToRgbArray, getCssVar, rgbArrayToRgba}