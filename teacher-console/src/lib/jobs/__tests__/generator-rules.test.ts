import { getLevelPlan } from '../generator-rules'

describe('Level Distribution Policy', () => {

    describe('Beginner Audience Consistency', () => {
        it('4 weeks - allows 1 intermediate if not strict (5B, 1I)', () => {
            const plan = getLevelPlan('Beginner', 4, 6, false)
            expect(plan.length).toBe(6)
            expect(plan.filter(p => p === 'Beginner').length).toBe(5)
            expect(plan.filter(p => p === 'Intermediate').length).toBe(1)
            expect(plan.filter(p => p === 'Advanced').length).toBe(0)

            // Check non-decreasing ordering
            expect(plan).toEqual(['Beginner', 'Beginner', 'Beginner', 'Beginner', 'Beginner', 'Intermediate'])
        })

        it('4 weeks - strict mode forces 100% Beginner (6B, 0I)', () => {
            const plan = getLevelPlan('Beginner', 4, 6, true)
            expect(plan.filter(p => p === 'Beginner').length).toBe(6)
            expect(plan.filter(p => p === 'Intermediate').length).toBe(0)
        })

        it('10 weeks - allows at most 1 Advanced (max 10% of 10), placed at end', () => {
            const plan = getLevelPlan('Beginner', 10, 10, false)
            expect(plan.filter(p => p === 'Beginner').length).toBe(6)
            expect(plan.filter(p => p === 'Intermediate').length).toBe(3)
            expect(plan.filter(p => p === 'Advanced').length).toBe(1)
            // Last one should be advanced
            expect(plan[9]).toBe('Advanced')
        })

        it('10 weeks - strict mode allows 0 Advanced', () => {
            const plan = getLevelPlan('Beginner', 10, 10, true)
            expect(plan.filter(p => p === 'Advanced').length).toBe(0)
        })
    })

    describe('Intermediate Audience Consistency', () => {
        it('4 weeks - moduleCount 6 => mostly Intermediate, at most 2 Beginner, max 1 Advanced', () => {
            const plan = getLevelPlan('Intermediate', 4, 6, false)
            expect(plan.length).toBe(6)
            expect(plan.filter(p => p === 'Beginner').length).toBeLessThanOrEqual(2)
            expect(plan.filter(p => p === 'Advanced').length).toBeLessThanOrEqual(1)

            // Expected deterministic calculation: b=1, a=1, i=4
            expect(plan.filter(p => p === 'Intermediate').length).toBe(4)
        })

        it('8 weeks - progressive jump (e.g. 1B, 5I, 2A)', () => {
            const plan = getLevelPlan('Intermediate', 8, 8, false)
            expect(plan.filter(p => p === 'Intermediate').length).toBeGreaterThanOrEqual(4)
            // Advanced must only be at the end
            const firstAdvanced = plan.indexOf('Advanced')
            expect(firstAdvanced).toBeGreaterThan(4) // Only in last 30%
        })
    })

    describe('Advanced Audience Consistency', () => {
        it('4 weeks - moduleCount 6 => mostly Advanced, 0 Beginner, max 1 Intermediate', () => {
            const plan = getLevelPlan('Advanced', 4, 6, false)
            expect(plan.length).toBe(6)
            expect(plan.filter(p => p === 'Beginner').length).toBe(0)
            expect(plan.filter(p => p === 'Intermediate').length).toBe(1)
            expect(plan.filter(p => p === 'Advanced').length).toBe(5)
            // Starts with Intermediate
            expect(plan[0]).toBe('Intermediate')
        })
    })

    describe('Mixed Audience Consistency', () => {
        it('8 weeks - progressive distribution and constraints satisfied', () => {
            const plan = getLevelPlan('Mixed', 8, 8, false)
            // Expect roughly 30% Beginner (2), 45% Intermediate (4), 25% Advanced (2)
            // We wrote raw rules: b=2, a=2, i=4. Total = 8.
            expect(plan.filter(p => p === 'Beginner').length).toBeGreaterThan(1)
            expect(plan.filter(p => p === 'Intermediate').length).toBeGreaterThan(1)
            expect(plan.filter(p => p === 'Advanced').length).toBeGreaterThan(1)

            // Check ordering
            const firstIntermediate = plan.indexOf('Intermediate')
            const firstAdvanced = plan.indexOf('Advanced')
            expect(firstIntermediate).toBeGreaterThan(0)
            expect(firstAdvanced).toBeGreaterThan(firstIntermediate)
        })
    })
})
