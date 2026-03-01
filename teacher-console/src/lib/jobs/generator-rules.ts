export function determineModulesCount(durationWeeks: number): number {
    if (durationWeeks <= 2) return 4
    if (durationWeeks >= 3 && durationWeeks <= 4) return 6
    if (durationWeeks >= 5 && durationWeeks <= 8) return 8
    return 10
}

export function determineClassLength(durationWeeks: number): number {
    // each module needs to cover an hour's worth of content
    return 60
}

type ModuleLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export function getLevelPlan(targetAudience: string, durationWeeks: number, moduleCount: number, strictBeginner: boolean = false): ModuleLevel[] {
    const plan: ModuleLevel[] = []

    // Calculate raw counts based on audience constraints
    let b = 0, i = 0, a = 0

    if (targetAudience === 'Beginner') {
        if (durationWeeks <= 4) {
            b = strictBeginner ? moduleCount : moduleCount - 1
            i = strictBeginner ? 0 : 1
            a = 0
        } else if (durationWeeks <= 8) {
            b = strictBeginner ? moduleCount : Math.floor(moduleCount * 0.75)
            i = strictBeginner ? 0 : moduleCount - b
            a = 0
        } else {
            b = Math.floor(moduleCount * 0.6)
            a = strictBeginner ? 0 : 1
            i = moduleCount - b - a
        }
    } else if (targetAudience === 'Intermediate') {
        if (durationWeeks <= 4) {
            b = 1
            a = moduleCount === 6 ? 1 : 0
            i = moduleCount - b - a
        } else if (durationWeeks <= 8) {
            b = Math.floor(moduleCount * 0.2)
            a = Math.floor(moduleCount * 0.2)
            i = moduleCount - b - a
        } else {
            b = Math.floor(moduleCount * 0.15)
            a = Math.floor(moduleCount * 0.3)
            i = moduleCount - b - a
        }
    } else if (targetAudience === 'Advanced') {
        b = 0
        if (durationWeeks <= 4) {
            i = 1
            a = moduleCount - i
        } else if (durationWeeks <= 8) {
            i = Math.floor(moduleCount * 0.2)
            a = moduleCount - i
        } else {
            i = Math.floor(moduleCount * 0.25)
            a = moduleCount - i
        }
    } else {
        // Mixed
        if (durationWeeks <= 4) {
            b = Math.floor(moduleCount / 2)
            a = moduleCount === 6 ? 1 : 0
            i = moduleCount - b - a
        } else if (durationWeeks <= 8) {
            b = Math.floor(moduleCount * 0.3)
            a = Math.floor(moduleCount * 0.25)
            i = moduleCount - b - a
        } else {
            b = Math.floor(moduleCount * 0.25)
            a = Math.floor(moduleCount * 0.35)
            i = moduleCount - b - a
        }
    }

    // Safety checks ensuring we meet exactly moduleCount
    const total = b + i + a
    if (total !== moduleCount) {
        // adjust intermediate to absorb rounding errors
        i += (moduleCount - total)
    }

    // Ordering constraint: non-decreasing
    for (let k = 0; k < b; k++) plan.push('Beginner')
    for (let k = 0; k < i; k++) plan.push('Intermediate')
    for (let k = 0; k < a; k++) plan.push('Advanced')

    return plan
}
