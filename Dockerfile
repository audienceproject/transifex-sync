FROM node:8

ENV NODE_ENV production

RUN mkdir /app
WORKDIR /app
COPY yarn.lock .
RUN yarn
COPY ./ .

RUN echo 'export DEBUG="transifex-sync:*"' >> ~/.profile
RUN echo 'export TRANSIFEX_SYNC_CONFIG=".transifex-sync.yaml"' >> ~/.profile
