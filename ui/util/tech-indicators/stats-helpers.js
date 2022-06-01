function standardDeviation(values) {
    const avg = average(values),
        squareDiffs = values.map(value => (value - avg) ** 2),
        variance = average(squareDiffs)

    return Math.sqrt(variance)
}

function average(data) {
    return data.reduce((sum, value) => sum + value, 0) / data.length
}

function mean(data) {
    data = data.slice(0).sort()
    const middle = (data.length - 1) / 2
    if (middle % 1 === 0) return data[middle]
    const lowMiddle = Math.floor(middle)
    return (data[lowMiddle] + data[lowMiddle + 1]) / 2
}

module.exports = {
    standardDeviation,
    average,
    mean
}