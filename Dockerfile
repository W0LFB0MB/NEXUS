FROM node:18

ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

WORKDIR /nexus-bot

COPY package.json ./
COPY package-lock.json ./

COPY tsconfig.json tsconfig.json
COPY ./src ./src

RUN npm ci

RUN npm run build

RUN rm -f tsconfig.json
RUN rm -rf ./src


COPY config.json config.json
COPY ./images ./images
COPY ./audio ./audio

CMD ["npm", "run", "start"]