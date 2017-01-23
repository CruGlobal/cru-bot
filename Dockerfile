FROM node:6.9.4
MAINTAINER cru.org <apps@cru.org>

RUN apt-get update \
    && apt-get install -y ca-certificates curl librecode0 libsqlite3-0 libxml2 git vim supervisor syslog-ng --no-install-recommends \
    && rm -r /var/lib/apt/lists/*

#OpenResty Configuration
ENV OPENRESTY_VERSION 1.9.3.2
ENV OPENRESTY_BUILD_DEPS libssl-dev \
		libpcre3-dev

ENV RESTIFY_PORT=3978
ENV SYSLOG_HOST=syslogng-staging.aws.cru.org
ENV SYSLOG_PORT=6010

# Install build tools and dependencies
RUN apt-get update \
	&& apt-get install -y \
		autoconf file g++ gcc libc-dev make pkg-config re2c \
		$OPENRESTY_BUILD_DEPS \
		--no-install-recommends \
	&& rm -r /var/lib/apt/lists/*

# Add GPG Keys
ENV GPG_KEYS 0BD78B5F97500D450838F95DFE857D9A90D90EC1 6E4F6AB321FDC07F2C332E3AC2BF0BC433CFC8B3 B550E09EA0E98066
RUN set -xe \
	&& for key in $GPG_KEYS; do \
		gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
	done

 # Install openresty (nginx + 3rd party modules) \
RUN set -x \
	&& mkdir -p /usr/src/openresty \
	&& cd /usr/src \
	&& curl -SL "https://openresty.org/download/ngx_openresty-$OPENRESTY_VERSION.tar.gz" -o openresty.tar.gz  \
	&& curl -SL "https://openresty.org/download/ngx_openresty-$OPENRESTY_VERSION.tar.gz.asc" -o openresty.tar.gz.asc  \
	&& gpg --verify openresty.tar.gz.asc \
	&& tar -xzf openresty.tar.gz -C /usr/src/openresty --strip-components=1 \
	&& rm openresty.tar.gz* \
	&& cd /usr/src/openresty \
	&& ./configure --with-pcre-jit --with-ipv6 \
	&& make \
	&& make install \
	&& mkdir -p /var/log/nginx \
	&& mkdir -p /usr/local/openresty/nginx/conf.d \
	&& cd .. \
	&& rm -rf /usr/src/openresty

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV $ENVIRONMENT
COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app
RUN set -x && cd webchat && npm install && npm run build && cp botchat.* dist/ && cd ..

COPY docker-files /
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]

# ONBUILD RUN set -x && cd webchat && npm install && npm run build && cd ..