FROM node:10

EXPOSE 80
WORKDIR /home/node/app

CMD [ "npm", "start" ]

COPY package*.json ./

RUN npm install
RUN apt update
RUN apt install -y sqlite3

COPY . .

#VOLUME database.db:database.db

RUN npm run-script create-database

#COPY .envexample .env

