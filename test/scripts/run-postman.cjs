const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const testRoot = path.resolve(__dirname, '..');
const newman = require(require.resolve('newman', { paths: [path.join(testRoot, 'config'), path.resolve(testRoot, '..')] }));
const resultsDir = path.join(testRoot, 'results');
fs.mkdirSync(resultsDir, { recursive: true });

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) =>
    [key, /password|token|secret|authorization/i.test(key) ? '[REDACTED]' : redact(item)]));
}
function revision() {
  const backendRoot = path.resolve(testRoot, '..');
  if (!fs.existsSync(path.join(backendRoot, 'server.js'))) return null;
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: backendRoot, encoding: 'utf8' }).trim();
}
newman.run({
  collection: path.join(testRoot, 'postman/SprintEra-week2.postman_collection.json'),
  environment: path.join(testRoot, 'postman/SprintEra-local.postman_environment.json'),
  ...(process.env.QA_BASE_URL ? { envVar: [{ key: 'baseUrl', value: process.env.QA_BASE_URL }] } : {}),
  reporters: ['cli'],
  timeoutRequest: 5000
}, (error, summary) => {
  if (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }
  const results = summary.run.executions.map(execution => {
    let response = null;
    try { response = redact(execution.response.json()); } catch { /* Swagger HTML/JS gövdesi rapora alınmaz. */ }
    return {
      scenario: execution.item.name,
      method: execution.request.method,
      url: execution.request.url.toString(),
      statusCode: execution.response ? execution.response.code : null,
      response,
      assertions: (execution.assertions || []).map(assertion => ({
        name: assertion.assertion,
        status: assertion.skipped ? 'skipped' : assertion.error ? 'failed' : 'passed',
        ...(assertion.error ? { error: assertion.error.message } : {})
      }))
    };
  });
  const report = {
    tool: 'Newman',
    backendRevision: revision(),
    nodeVersion: process.version,
    startedAt: new Date(summary.run.timings.started).toISOString(),
    completedAt: new Date(summary.run.timings.completed).toISOString(),
    stats: summary.run.stats,
    failures: summary.run.failures.map(failure => ({
      scenario: failure.source && failure.source.name,
      test: failure.error && failure.error.test,
      message: failure.error && failure.error.message
    })),
    results
  };
  fs.writeFileSync(path.join(resultsDir, 'postman-results.json'), JSON.stringify(report, null, 2) + '\n');
  process.exitCode = summary.run.failures.length ? 1 : 0;
});
