FROM node:17-alpine

WORKDIR /app

ADD package.json /app/

RUN npm i

COPY . /app/

CMD [ "npm", "run", "start" ]