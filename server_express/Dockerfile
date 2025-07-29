FROM node:latest

COPY package*.json /usr/
WORKDIR /usr

RUN npm install
RUN npm install -g typescript 

WORKDIR /usr/app

COPY . .

#Take build from packaga.json in the section script
RUN npm run build
#RUN tsc

CMD [ "node", "./dist/app.js" ]
