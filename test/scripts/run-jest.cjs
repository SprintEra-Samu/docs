const fs = require('node:fs');
const path = require('node:path');
const { spawnSync, execFileSync } = require('node:child_process');
const testRoot = path.resolve(__dirname, '..');
const backendRoot = path.resolve(testRoot, '..');
const resultsDir = path.join(testRoot, 'results');
const rawPath = path.join(testRoot, '.jest-run.raw.json');
const coverage = process.argv.includes('--coverage');
const jestPath = path.join(path.dirname(require.resolve('jest/package.json', { paths: [backendRoot] })), 'bin/jest.js');
fs.mkdirSync(resultsDir, { recursive: true });
const result = spawnSync(process.execPath, [jestPath, '--detectOpenHandles', '--json', `--outputFile=${rawPath}`, ...(coverage ? ['--coverage'] : [])], {
  cwd: backendRoot,
  env: { ...process.env, NODE_ENV: 'test' },
  stdio: 'inherit'
});
if (result.error) throw result.error;
if (!fs.existsSync(rawPath)) {
  process.exitCode = result.status || 1;
} else {
  const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const cleanMessage = message => message.replace(/\u001b\[[0-9;]*m/g, '').split(backendRoot).join('<backend>');
  const report = {
    tool: 'Jest',
    backendRevision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: backendRoot, encoding: 'utf8' }).trim(),
    nodeVersion: process.version,
    startedAt: new Date(raw.startTime).toISOString(),
    completedAt: new Date().toISOString(),
    counts: {
      total: raw.numTotalTests, passed: raw.numPassedTests,
      failed: raw.numFailedTests, pending: raw.numPendingTests,
      suites: raw.numTotalTestSuites
    },
    results: raw.testResults.flatMap(suite => suite.assertionResults.map(assertion => ({
      file: path.relative(backendRoot, suite.name).replaceAll('\\', '/'),
      scenario: assertion.fullName,
      status: assertion.status,
      failures: assertion.failureMessages.map(cleanMessage)
    })))
  };
  fs.writeFileSync(path.join(resultsDir, 'jest-results.json'), JSON.stringify(report, null, 2) + '\n');
  const coveragePath = path.join(backendRoot, 'coverage/coverage-summary.json');
  if (coverage && fs.existsSync(coveragePath)) {
    const rawCoverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    const summary = Object.fromEntries(Object.entries(rawCoverage).map(([key, value]) =>
      [key === 'total' ? key : path.relative(backendRoot, key).replaceAll('\\', '/'), value]));
    fs.writeFileSync(path.join(resultsDir, 'coverage-summary.json'), JSON.stringify(summary, null, 2) + '\n');
  }
  fs.unlinkSync(rawPath);
  process.exitCode = result.status === null ? 1 : result.status;
}
