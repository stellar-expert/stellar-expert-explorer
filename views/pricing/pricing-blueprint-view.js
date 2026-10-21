import React from 'react'

const thin = 'rgba(255, 255, 255, 0.15)'
const axis = 'rgba(255, 255, 255, 0.12)'

/**
 * Join repeated strokes into a single path
 * @param {Number} from - first coordinate
 * @param {Number} to - last coordinate, inclusive
 * @param {Number} step
 * @param {function(Number): String} draw - path commands for one coordinate
 * @return {String}
 * @private
 */
function repeatStroke(from, to, step, draw) {
    let path = ''
    for (let v = from; v <= to; v += step) {
        path += draw(v)
    }
    return path
}

const hullHatch = repeatStroke(164, 497, 9, y => `M95 ${y}L100 ${y - 6}`)
const towerBracing = repeatStroke(90, 510, 30, y => `M140 ${y}L164 ${y + 30}M164 ${y}L140 ${y + 30}`)
const groundHatch = repeatStroke(10, 166, 12, x => `M${x} 600L${x - 8} 610`)
//ticks between the two outer rings of the cross-section, slanted 5° clockwise
const ringTicks = repeatStroke(0, 350, 10, angle => {
    const point = (r, deg) => [65 + r * Math.cos(deg * Math.PI / 180), 62 + r * Math.sin(deg * Math.PI / 180)]
        .map(v => v.toFixed(1)).join(' ')
    return `M${point(41, angle)}L${point(46, angle + 5)}`
})

/**
 * Side elevation of a rocket on the launch pad, drawn in the corner of the self-hosted block
 * @return {JSX.Element}
 */
export function BlueprintRocketView() {
    return <svg className="subscription-blueprint rocket" viewBox="0 0 172 616" preserveAspectRatio="xMaxYMax meet"
                fill="none" stroke="rgba(255, 255, 255, 0.26)" aria-hidden="true">
        <path d="M70 18V612" stroke={axis} strokeDasharray="14 4 2 4"/>
        <path d="M40 150C40 92 58 58 70 40C82 58 100 92 100 150" strokeWidth="1.4"/>
        <path d="M40 150V500H100V150Z" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M40 170H70M40 310H70M40 450H70" stroke={thin}/>
        <path d="M52 190V290M52 330V430" stroke={thin} strokeDasharray="2 4"/>
        <path d="M95 154V496"/>
        <path d={hullHatch} stroke={thin}/>
        <path d="M70 182H78A16 16 0 0 1 94 198V284A16 16 0 0 1 78 300H70" strokeWidth="1.2"/>
        <path d="M70 322H78A16 16 0 0 1 94 338V424A16 16 0 0 1 78 440H70" strokeWidth="1.2"/>
        <path d="M74 300V322M74 440V468" strokeWidth="1.2"/>
        <path d="M70 468H84V486L78 500H70" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M70 96H84V130H70M84 113H92" strokeDasharray="4 3"/>
        <path d="M56 500L44 536H96L84 500" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M40 428L8 496V520L40 500M100 428L132 496V520L100 500" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M22 240H118" strokeDasharray="14 4 2 4"/>
        <path d="M22 234V246M118 234V246M22 234 28 226M22 234 16 226M118 234 124 226M118 234 112 226"
              strokeWidth="1.2" strokeLinecap="round"/>
        <text x="22" y="220">A</text>
        <text x="118" y="220">A</text>
        <path d="M140 90V540M164 90V540M136 90H168" strokeWidth="1.2"/>
        <path d={towerBracing} stroke={thin}/>
        <path d="M140 200H100M140 330H100M140 196H104V204" strokeWidth="1.2"/>
        <path d="M0 540H172M0 556H172M0 540V556M172 540V556" strokeWidth="1.2"/>
        <path d="M46 556L56 586H84L94 556" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M30 540V536H46M94 536H110V540" stroke={thin}/>
        <path d="M0 600H172" strokeWidth="1.2"/>
        <path d={groundHatch} stroke={thin}/>
    </svg>
}

/**
 * Cross-section A-A of the rocket hull
 * @return {JSX.Element}
 */
export function BlueprintSectionView() {
    return <svg className="subscription-blueprint section" viewBox="0 0 130 148" fill="none"
                stroke="rgba(255, 255, 255, 0.26)" aria-hidden="true">
        <path d="M7 62H123M65 4V120" stroke={axis} strokeDasharray="10 4 2 4"/>
        <circle cx="65" cy="62" r="46" strokeWidth="1.4"/>
        <circle cx="65" cy="62" r="41"/>
        <circle cx="65" cy="62" r="31" strokeWidth="1.2"/>
        <circle cx="65" cy="62" r="4"/>
        <path d={ringTicks} stroke={thin}/>
        <text x="65" y="140" letterSpacing="1.5">SECTION A–A</text>
    </svg>
}
