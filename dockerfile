FROM node:12-buster-slim
LABEL maintainer="Kalisio <contact@kalisio.xyz>"

# Install script
COPY . /opt/k-population
WORKDIR /opt/k-population
RUN yarn

# Run the job
ENV NODE_PATH=/opt/k-population/node_modules
CMD node import-mongodb.js
