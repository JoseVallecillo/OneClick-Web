Aquí tienes la secuencia exacta de comandos en una sola lista para copiar y ejecutar:

composer install

npm install

cp .env.example .env

php artisan key:generate

php artisan migrate --seed

php artisan serve

npm run dev

Nota: Recuerda que los últimos dos (php artisan serve y npm run dev) deben ejecutarse al mismo tiempo en terminales separadas para que el proyecto funcione correctamente.

APP_NAME=Laravel APP_ENV=local APP_KEY=base64:nO63189Eg9BTw1qmyQ66EKgZ2kThOTp816mTawo3xJA= APP_DEBUG=true APP_URL=http://localhost

APP_LOCALE=en APP_FALLBACK_LOCALE=en APP_FAKER_LOCALE=en_US

APP_MAINTENANCE_DRIVER=file

APP_MAINTENANCE_STORE=database
PHP_CLI_SERVER_WORKERS=4
BCRYPT_ROUNDS=12

LOG_CHANNEL=stack LOG_STACK=single LOG_DEPRECATIONS_CHANNEL=null LOG_LEVEL=debug

DB_CONNECTION=pgsql DB_HOST=127.0.0.1 DB_PORT=5432 DB_DATABASE=one_click DB_USERNAME=postgres DB_PASSWORD=Josem@lo1989

SESSION_DRIVER=database SESSION_LIFETIME=120 SESSION_ENCRYPT=false SESSION_PATH=/ SESSION_DOMAIN=null

BROADCAST_CONNECTION=log FILESYSTEM_DISK=local QUEUE_CONNECTION=database

CACHE_STORE=database

CACHE_PREFIX=
MEMCACHED_HOST=127.0.0.1

REDIS_CLIENT=phpredis REDIS_HOST=127.0.0.1 REDIS_PASSWORD=null REDIS_PORT=6379

MAIL_MAILER=log MAIL_SCHEME=null MAIL_HOST=127.0.0.1 MAIL_PORT=2525 MAIL_USERNAME=null MAIL_PASSWORD=null MAIL_FROM_ADDRESS="hello@example.com" MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID= AWS_SECRET_ACCESS_KEY= AWS_DEFAULT_REGION=us-east-1 AWS_BUCKET= AWS_USE_PATH_STYLE_ENDPOINT=false

VITE_APP_NAME="${APP_NAME}"

Dev license PIN (solo desarrollo — dejar vacío en producción)
DEV_LICENSE_PIN=
