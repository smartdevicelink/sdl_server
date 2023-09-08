# Copyright (c) 2022, Livio, Inc.
FROM debian:11.7

ARG VERSION=master 

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        openssl \
        curl \
        wget \
        xz-utils \
        git

# Download SDL Server from github
WORKDIR /usr

RUN mkdir /usr/policy
RUN git clone https://github.com/smartdevicelink/sdl_server.git /usr/policy -b $VERSION --depth=1

# Install node + npm
RUN wget https://nodejs.org/dist/v16.20.1/node-v16.20.1-linux-x64.tar.xz
RUN tar xvf node-v16.20.1-linux-x64.tar.xz
RUN chmod +rx node-v16.20.1-linux-x64/bin/node node-v16.20.1-linux-x64/bin/npm
RUN ln -s /usr/node-v16.20.1-linux-x64/bin/node /usr/local/bin/node
RUN ln -s /usr/node-v16.20.1-linux-x64/bin/npm /usr/local/bin/npm

WORKDIR /usr/policy

RUN npm install --legacy-peer-deps
RUN npm install aws-sdk@2.1453.0 node-stream-zip@1.15.0 --save --legacy-peer-deps

COPY wait-for-it.sh wait-for-it.sh
COPY keys customizable/ca
COPY keys customizable/ssl
COPY webengine-bundle.js customizable/webengine-bundle/index.js

EXPOSE 3000 443

CMD ["npm", "start"]
