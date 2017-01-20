FROM node:6.9.4-onbuild
MAINTAINER cru.org <apps@cru.org>

RUN apt-get update \
    && apt-get install -y ca-certificates curl git vim supervisor syslog-ng --no-install-recommends \
    && rm -r /var/lib/apt/lists/*

ENV RESTIFY_PORT=80
ENV SYSLOG_HOST=syslog.uscm.org
ENV SYSLOG_PORT=6010

EXPOSE $RESTIFY_PORT
COPY docker-files /
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]