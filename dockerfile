FROM alpine:latest
USER root
# install curl
RUN apk update \
    && apk add --update curl rsync \
    && rm -rf /var/cache/apk/* \
    && apk upgrade

# install nodejs, npm
RUN apk add --update npm \
# install git
    && apk add --no-cache bash git openssh

WORKDIR /

# create a directory to shove the code into
RUN mkdir /logs

# clone branch
COPY . .

RUN npm install
RUN npm run build

CMD [ "node", "build/index.js" ]
