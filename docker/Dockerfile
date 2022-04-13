# Copyright (c) 2022, Livio, Inc.
FROM node:12

ARG VERSION=master 

RUN apt-get update && apt-get install -y --no-install-recommends \
        openssl \
        curl \
        git

# Download SDL Server from github
WORKDIR /usr

RUN mkdir /usr/policy
RUN git clone https://github.com/smartdevicelink/sdl_server.git /usr/policy -b $VERSION --depth=1

WORKDIR /usr/policy

RUN npm install
RUN npm install aws-sdk node-stream-zip --save

COPY wait-for-it.sh wait-for-it.sh
COPY keys customizable/ca
COPY keys customizable/ssl
COPY webengine-bundle.js customizable/webengine-bundle/index.js

EXPOSE 3000 443

CMD ["npm", "start"]
