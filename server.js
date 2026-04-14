// dd-trace MUST be initialized before any other imports
const tracer = require('dd-trace').init({
  service: 'flex-node-service',
  env: process.env.DD_ENV || 'dev',
  logInjection: true  // enables automatic trace-log correlation with bunyan
});

const express = require('express');
const bunyan = require('bunyan');
const fs = require('fs');
const path = require('path');

// Set up Bunyan logger with stdout and file streams
const logger = bunyan.createLogger({
  name: 'flex-node-service',
  streams: [
    {
      // stdout -> GCP Cloud Logging
      stream: process.stdout,
      level: 'info'
    },
    {
      // file -> Datadog logs agent
      path: '/var/log/app/app.log',
      level: 'info'
    }
  ]
});

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
  const span = tracer.scope().active();

  // Build log context with trace correlation
  const logContext = {
    page: 'home',
    method: req.method,
    url: req.url
  };

  // Manually inject trace IDs if logInjection doesn't pick them up automatically
  if (span) {
    logContext.dd = {
      trace_id: span.context().toTraceId(),
      span_id: span.context().toSpanId(),
      service: 'flex-node-service',
      env: process.env.DD_ENV || 'dev'
    };
  }

  logger.info(logContext, 'Root endpoint hit');

  const dummyTimes = [
    new Date('2018-01-01T10:00:00'),
    new Date('2018-01-02T10:30:00'),
    new Date('2018-01-03T11:00:00')
  ];

  logger.info({ times_count: dummyTimes.length }, 'Rendering response');

  res.json({
    message: 'Hello from GAE Flex Node.js with Datadog!',
    times: dummyTimes
  });
});

// Diagnostic endpoints
app.get('/dd-status', (req, res) => {
  const { execSync } = require('child_process');
  let output = '';

  const commands = {
    'PROCESSES': 'ps aux',
    'AGENT BINARY': 'find /usr -name "datadog-agent" 2>/dev/null',
  };

  for (const [label, cmd] of Object.entries(commands)) {
    try {
      output += `${label}:\n${execSync(cmd).toString()}\n\n`;
    } catch (e) {
      output += `${label}: ERROR - ${e.message}\n\n`;
    }
  }

  res.send(`<pre>${output}</pre>`);
});

app.get('/dd-trace-check', (req, res) => {
  const { execSync } = require('child_process');
  try {
    const env = execSync('env').toString();
    res.send(`<pre>${env}</pre>`);
  } catch (e) {
    res.send(`<pre>ERROR: ${e.message}</pre>`);
  }
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, `Server started on port ${PORT}`);
});