# Use latest Ubuntu 24.04 LTS base image
FROM ubuntu:24.04

# Install essential packages required for Android SDK feature install and development
RUN apt-get update && \
    apt-get install -y sudo wget curl git build-essential && \
    rm -rf /var/lib/apt/lists/*

# Add vscode user and allow sudo without password (Codespaces default user)
RUN useradd -ms /bin/bash vscode && \
    echo "vscode ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER vscode
WORKDIR /home/vscode
