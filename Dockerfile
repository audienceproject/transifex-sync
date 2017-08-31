FROM node:8

ENV NODE_ENV production

RUN mkdir /app
WORKDIR /app
COPY yarn.lock .
RUN yarn
COPY ./ .
RUN ln -s /app/bin/transifex-sync.js /usr/bin/transifex-sync
