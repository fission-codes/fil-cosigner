FROM node:14

# Create app directory
WORKDIR .

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)

# Bundle app source
COPY . .

# COPY package.json ./
# COPY yarn.lock ./

RUN yarn
RUN yarn build
# If you are building your code for production
# RUN npm ci --only=production

EXPOSE 3000
# CMD [ "yarn", "start" ]
