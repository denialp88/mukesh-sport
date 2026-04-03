FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Run migrations and seeds on start
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'npx knex migrate:latest --knexfile src/db/knexfile.js' >> /app/start.sh && \
    echo 'npx knex seed:run --knexfile src/db/knexfile.js' >> /app/start.sh && \
    echo 'node src/index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000

CMD ["/bin/sh", "/app/start.sh"]
