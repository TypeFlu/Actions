# Base: Latest Ubuntu 24.04 LTS
FROM ubuntu:24.04

# Install core tools required before features run
RUN apt-get update && \
    apt-get install -y sudo wget curl git build-essential openssh-server && \
    rm -rf /var/lib/apt/lists/*

# Create the vscode user (default for GitHub Codespaces)
RUN useradd -ms /bin/bash vscode && \
    echo "vscode ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Configure SSH
RUN mkdir /var/run/sshd

USER vscode
WORKDIR /workspaces
