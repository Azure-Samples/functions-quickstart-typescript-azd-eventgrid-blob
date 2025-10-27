FROM mcr.microsoft.com/devcontainers/javascript-node:1-20

# Copy custom first notice message.
COPY first-run-notice.txt /tmp/staging/
RUN sudo mv -f /tmp/staging/first-run-notice.txt /usr/local/etc/vscode-dev-containers/ \
    && sudo rm -rf /tmp/staging

# Install Azure Functions Core Tools
RUN sudo npm install -g azure-functions-core-tools@4 --unsafe-perm true

# Install Azure Developer CLI
RUN curl -fsSL https://aka.ms/install-azd.sh | bash