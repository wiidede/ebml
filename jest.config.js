export default {
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: './coverage',
  coverageReporters: ['json', 'lcov', 'text', 'html'],
  testURL: 'http://localhost/',
}
