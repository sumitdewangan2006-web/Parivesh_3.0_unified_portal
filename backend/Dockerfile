FROM node:20-alpine

WORKDIR /app

# Install Python runtime for AI risk analyzer (PDF parsing + LLM client)
RUN apk add --no-cache python3 py3-pip
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci

# Install Python dependencies for the analyzer
COPY ai/requirements.txt ./ai/requirements.txt
RUN pip3 install --no-cache-dir -r ./ai/requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads
RUN chmod +x /app/scripts/docker-start.sh

EXPOSE 5000

CMD ["/app/scripts/docker-start.sh"]
