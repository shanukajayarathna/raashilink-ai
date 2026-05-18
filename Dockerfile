FROM node:20-bookworm

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server/python/requirements.txt server/python/requirements.txt
RUN python3 -m pip install --no-cache-dir --upgrade pip \
  && python3 -m pip install --no-cache-dir -r server/python/requirements.txt

COPY . .

ENV NODE_ENV=production
ENV PORT=8080

CMD ["npm","run","api"]

