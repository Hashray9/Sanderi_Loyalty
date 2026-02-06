import { calculatePoints } from '../src/services/pointService';

describe('pointService', () => {
  describe('calculatePoints', () => {
    it('should calculate points correctly with default rate', () => {
      expect(calculatePoints(100, 100)).toBe(1);
      expect(calculatePoints(500, 100)).toBe(5);
      expect(calculatePoints(1000, 100)).toBe(10);
    });

    it('should floor partial points', () => {
      expect(calculatePoints(150, 100)).toBe(1);
      expect(calculatePoints(199, 100)).toBe(1);
      expect(calculatePoints(250, 100)).toBe(2);
    });

    it('should return 0 for amounts less than conversion rate', () => {
      expect(calculatePoints(50, 100)).toBe(0);
      expect(calculatePoints(99, 100)).toBe(0);
    });

    it('should handle different conversion rates', () => {
      expect(calculatePoints(200, 50)).toBe(4);
      expect(calculatePoints(1000, 200)).toBe(5);
    });
  });
});
