# Usa una imagen base de Node.js. Alpine es ligera y recomendada.
FROM node:18-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia primero los archivos de dependencias para aprovechar el caché de Docker
COPY package*.json ./

# Instala las dependencias. Esto crea la carpeta /app/node_modules DENTRO de la imagen
# Aquí es donde se instalará 'nanoid' correctamente
RUN npm install

# Ahora, copia el resto del código fuente de tu aplicación
COPY . .

# El comando para iniciar la aplicación será proporcionado por docker-compose.yml,
# por lo que no necesitamos un CMD aquí para el desarrollo.