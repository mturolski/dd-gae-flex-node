#!/bin/bash

# Start Datadog Agent
/usr/bin/datadog-agent start &
sleep 10

# Start Trace Agent with correct config path
/opt/datadog-agent/embedded/bin/trace-agent run --config /etc/datadog-agent/datadog.yaml &
sleep 5

# Start Node app
exec node server.js