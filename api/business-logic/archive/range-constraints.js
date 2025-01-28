class RangeConstraints {
    /**
     * @param [from]
     * @param [to]
     */
    constructor(from, to) {
        this.to = to
        this.from = from
    }

    to

    from

    get isEmpty() {
        return this.to === undefined
            && this.from === undefined
    }

    get isUnfeasible() {
        return this.to !== undefined
            && this.from !== undefined
            && this.to < this.from
    }

    addBottomConstraint(constraint) {
        if (this.from === undefined || constraint > this.from) {
            this.from = constraint
        }
    }

    addTopConstraint(constraint) {
        if (this.to === undefined || constraint < this.to) {
            this.to = constraint
        }
    }

    resolve() {
        const timeConstraints = {}
        if (this.from) {
            timeConstraints.gte = this.from.toString()
        }
        if (this.to) {
            timeConstraints.lte = this.to.toString()
        }
        return timeConstraints
    }
}

module.exports = RangeConstraints