FROM node:8

ENV NODE_ENV production

RUN mkdir /app
WORKDIR /app
COPY yarn.lock .
RUN yarn
COPY ./ .
