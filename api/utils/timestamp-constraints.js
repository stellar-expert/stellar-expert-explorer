const {Int32} = require('bson')

class TimestampConstraints {
    to = Number.POSITIVE_INFINITY

    from = 0

    get isUnfeasible() {
        return this.to < this.from
    }

    addBottomConstraint(constraint) {
        if (constraint > this.from) {
            this.from = constraint
        }
    }

    addTopConstraint(constraint) {
        if (constraint < this.to) {
            this.to = constraint
        }
    }

    resolve() {
        let timeConstraints = {},
            filtered = false
        if (this.from > 0) {
            timeConstraints.$gte = new Int32(this.from)
            filtered = true
        }
        if (this.to < Number.POSITIVE_INFINITY) {
            timeConstraints.$lte = new Int32(this.to)
            filtered = true
        }
        if (filtered) return {ts: timeConstraints}
    }
}

module.exports = TimestampConstraints