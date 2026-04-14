FROM node:18

# Install dependencies
RUN apt-get update && apt-get install -y curl

# Install Datadog Agent
RUN DD_AGENT_MAJOR_VERSION=7 \
    DD_API_KEY=placeholder \
    DD_INSTALL_ONLY=true \
    bash -c "$(curl -L https://install.datadoghq.com/scripts/install_script_agent7.sh)"

# Configure Datadog Agent
RUN printf "\napm_config:\n  enabled: true\n  apm_non_local_traffic: true\nlogs_enabled: true\n" \
    >> /etc/datadog-agent/datadog.yaml

# Add Datadog logs config
RUN mkdir -p /etc/datadog-agent/conf.d/node.d
COPY logs.yaml /etc/datadog-agent/conf.d/node.d/conf.yaml

# Create app log directory
RUN mkdir -p /var/log/app

# Copy and install Node dependencies
COPY package.json /app/package.json
WORKDIR /app
RUN npm install

# Copy app code
COPY . /app

# Copy and set entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]