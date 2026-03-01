import { describe, expect, it } from 'vitest'
import { determineModulesCount, determineClassLength, determineModuleLevel } from '../lib/jobs/generator-rules'

describe('Generator Rules', () => {
    it('should generate 4 modules for courses <= 2 weeks', () => {
        expect(determineModulesCount(1)).toBe(4)
        expect(determineModulesCount(2)).toBe(4)
    })

    it('should generate 6 modules for courses 3-4 weeks', () => {
        expect(determineModulesCount(3)).toBe(6)
        expect(determineModulesCount(4)).toBe(6)
    })

    it('should generate 8 modules for courses 5-8 weeks', () => {
        expect(determineModulesCount(5)).toBe(8)
        expect(determineModulesCount(8)).toBe(8)
    })

    it('should generate 10 modules for courses > 8 weeks', () => {
        expect(determineModulesCount(9)).toBe(10)
        expect(determineModulesCount(12)).toBe(10)
    })

    it('should determine longer class lengths for longer courses', () => {
        expect(determineClassLength(4)).toBe(45)
        expect(determineClassLength(5)).toBe(90)
    })

    it('should assign correct levels for a 4-module course', () => {
        expect(determineModuleLevel(0, 4)).toBe('Beginner')
        expect(determineModuleLevel(1, 4)).toBe('Beginner')
        expect(determineModuleLevel(2, 4)).toBe('Intermediate')
        expect(determineModuleLevel(3, 4)).toBe('Advanced')
    })

    it('should assign correct levels for an 8-module course', () => {
        expect(determineModuleLevel(0, 8)).toBe('Beginner')
        expect(determineModuleLevel(2, 8)).toBe('Beginner') // 2 < 8/3 = 2.66
        expect(determineModuleLevel(3, 8)).toBe('Intermediate') // 3 >= 2.66
        expect(determineModuleLevel(5, 8)).toBe('Intermediate') // 5 < 16/3 = 5.33
        expect(determineModuleLevel(6, 8)).toBe('Advanced') // 6 >= 5.33
    })
})
