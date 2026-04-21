# Datadog on Google App Engine Flexible - Node.js

A sample Express app demonstrating how to run the Datadog Agent on Google App Engine Flexible environment, with APM tracing, log collection via Bunyan, trace-log correlation, and App & API Protection (AppSec).

## Features

- ✅ Infrastructure metrics
- ✅ APM tracing via `dd-trace`
- ✅ Log collection with Bunyan
- ✅ Trace-log correlation
- ✅ App & API Protection (AppSec / IAST)
- ✅ SBOM / Software Composition Analysis

## Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and authenticated
- A [Datadog account](https://www.datadoghq.com/) with an API key
- A GCP project with App Engine enabled

## Project Structure

```
.
├── app.yaml              # GAE Flex configuration
├── Dockerfile            # Custom runtime container definition
├── entrypoint.sh         # Container startup script
├── logs.yaml             # Datadog logs agent configuration
├── package.json          # Node.js dependencies
├── server.js             # Express application
└── static/               # Static files
```

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/mturolski/dd-gae-flex-node.git
cd dd-gae-flex-node
```

### 2. Set your Datadog API key

In `app.yaml`, add your Datadog API key:

```yaml
env_variables:
  DD_API_KEY: "your_api_key_here"
```

> ⚠️ Do not commit your API key to source control. Consider using [GCP Secret Manager](https://cloud.google.com/secret-manager) for production.

### 3. Deploy to App Engine

```bash
gcloud app deploy
```

### 4. Verify the deployment

```bash
gcloud app browse
```

## How It Works

### Dockerfile

The container uses a custom runtime based on `node:18`. During the build:

1. The Datadog Agent v7 is installed via the official install script
2. APM is enabled by appending `apm_config` to `datadog.yaml`
3. A log directory `/var/log/app` is created for the logs agent to tail

### entrypoint.sh

On container startup:
1. The Datadog main agent starts in the background
2. The trace agent is started separately with the correct config path
3. The Express app is started via `node server.js`

> **Note:** The trace agent binary on GAE Flex is located at `/opt/datadog-agent/embedded/bin/trace-agent` and must be started manually with `--config /etc/datadog-agent/datadog.yaml`.

### APM

`dd-trace` must be initialized **before any other imports** in `server.js`. The `logInjection: true` option enables automatic trace-log correlation with Bunyan.

### Logging with Bunyan

Bunyan writes logs to both stdout (for GCP Cloud Logging) and `/var/log/app/app.log` (for the Datadog logs agent). Trace context (`dd.trace_id`, `dd.span_id`) is injected into each log entry for correlation.

### App & API Protection

AppSec is enabled via `DD_APPSEC_ENABLED=true` in `app.yaml` combined with `dd-trace` initialization.

## Verifying in Datadog

| Feature | Where to look |
|---|---|
| Infrastructure | Infrastructure → Host Map |
| APM traces | APM → Traces, filter by `service:flex-node-service` |
| Logs | Logs, filter by `service:flex-node-service` |
| Trace-log correlation | Click a trace → Logs tab |
| AppSec | Security → Application Security |
| Vulnerabilities (IAST) | Security → Vulnerabilities |
| SCA / SBOM | Security → Software Composition Analysis |


## Known Limitations

- The trace agent must be started manually in `entrypoint.sh`
- `type: stdout` in the logs config does not work on GAE Flex — use `type: file` instead
- GAE Flex containers are ephemeral — each deploy creates a new host in Datadog
