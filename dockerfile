FROM node:18

# ARG BOT_TOKEN
# ENV BOT_TOKEN=$BOT_TOKEN

# ARG DATABASE_URL
# ENV DATABASE_URL=$DATABASE_URL

# ARG YOUTUBE_API_KEY
# ENV YOUTUBE_API_KEY=$YOUTUBE_API_KEY

WORKDIR /nexus-bot

COPY package.json ./
COPY package-lock.json ./

COPY ./scripts ./scripts
COPY tsconfig.json tsconfig.json
COPY ./src ./src


RUN npm ci

RUN npm run build

RUN rm -rf ./scripts
RUN rm -f tsconfig.json
RUN rm -rf ./src


COPY config.json config.json
COPY ./images ./images
COPY ./audio ./audio
COPY .env .env

CMD ["npm", "run", "start"]