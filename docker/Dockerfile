FROM ubuntu:16.04

MAINTAINER h2oai "h2o.ai"

ARG JENKINS_UID='2117'
ARG JENKINS_GID='2117'
ARG H2O_BRANCH

RUN \
    apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y git make curl g++ bzip2 && \
    curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
    apt-get install -y nodejs

RUN \
    groupadd -g ${JENKINS_GID} jenkins && \
    adduser --uid ${JENKINS_UID} -gid ${JENKINS_GID} --disabled-password --gecos "" jenkins

COPY scripts/warmup_caches /usr/bin
RUN \
    chmod +x /usr/bin/warmup_caches && \
    chown jenkins:jenkins /usr/bin/warmup_caches

USER jenkins
RUN \
    /usr/bin/warmup_caches

USER root
RUN \
    rm /usr/bin/warmup_caches
