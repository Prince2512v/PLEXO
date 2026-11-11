import { AnalyticsEngine } from '../simulation/AnalyticsEngine';

describe('AnalyticsEngine - Software Data Analytics (SDA)', () => {
  describe('calculateDescriptiveStats', () => {
    test('calculates correct mean, median, min, and max for known dataset', () => {
      const data = [10, 20, 30, 40, 50];
      const stats = AnalyticsEngine.calculateDescriptiveStats(data);

      expect(stats.count).toBe(5);
      expect(stats.mean).toBe(30);
      expect(stats.median).toBe(30);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
      expect(stats.variance).toBe(250); // Sample variance = sum((x - 30)^2) / 4 = (400 + 100 + 0 + 100 + 400) / 4 = 1000 / 4 = 250
      expect(stats.stdDev).toBeCloseTo(15.81, 1);
    });

    test('handles empty dataset gracefully without errors', () => {
      const stats = AnalyticsEngine.calculateDescriptiveStats([]);
      expect(stats.count).toBe(0);
      expect(stats.mean).toBe(0);
      expect(stats.stdDev).toBe(0);
    });

    test('calculates IQR and percentiles accurately', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const stats = AnalyticsEngine.calculateDescriptiveStats(data);

      expect(stats.count).toBe(10);
      expect(stats.q1).toBeLessThan(stats.median);
      expect(stats.q3).toBeGreaterThan(stats.median);
      expect(stats.iqr).toBe(stats.q3 - stats.q1);
    });
  });

  describe('calculatePearsonCorrelation', () => {
    test('computes perfect positive correlation (+1.0)', () => {
      const x = [10, 20, 30, 40, 50];
      const y = [100, 200, 300, 400, 500];
      const r = AnalyticsEngine.calculatePearsonCorrelation(x, y);
      expect(r).toBe(1);
    });

    test('computes perfect negative correlation (-1.0)', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [50, 40, 30, 20, 10];
      const r = AnalyticsEngine.calculatePearsonCorrelation(x, y);
      expect(r).toBe(-1);
    });

    test('returns 0 for zero variance or insufficient data', () => {
      const x = [5, 5, 5, 5];
      const y = [1, 2, 3, 4];
      const r = AnalyticsEngine.calculatePearsonCorrelation(x, y);
      expect(r).toBe(0);
    });
  });

  describe('detectZScoreAnomalies', () => {
    test('identifies significant outliers exceeding the threshold', () => {
      const baseTimestamp = 1700000000000;
      const samples = [
        { timestamp: baseTimestamp, value: 30 },
        { timestamp: baseTimestamp + 1000, value: 32 },
        { timestamp: baseTimestamp + 2000, value: 29 },
        { timestamp: baseTimestamp + 3000, value: 31 },
        { timestamp: baseTimestamp + 4000, value: 30 },
        { timestamp: baseTimestamp + 5000, value: 28 },
        { timestamp: baseTimestamp + 6000, value: 33 },
        { timestamp: baseTimestamp + 7000, value: 300 }, // Clear anomaly
      ];

      const anomalies = AnalyticsEngine.detectZScoreAnomalies(samples, 2.0);
      expect(anomalies.length).toBeGreaterThan(0);
      const spike = anomalies.find(a => a.value === 300);
      expect(spike).toBeDefined();
      expect(spike?.zScore).toBeGreaterThan(2.0);
    });
  });
});
