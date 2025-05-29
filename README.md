структура базы данных во вложении "mysql7648xk-yrsuqk7klp9fujg.sql"


файлы конфигруции сайта хранятся в  

/etc/vdestor/config/.env
# === ОСНОВНЫЕ НАСТРОЙКИ ===
APP_NAME="VDE Store"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://vdestor.ru
APP_TIMEZONE=Europe/Moscow

# === ПУТИ ===
CONFIG_PATH=/etc/vdestor/config
LOG_PATH=/etc/vdestor/logs
CACHE_PATH=/etc/vdestor/cache
SESSION_PATH=/etc/vdestor/sessions

# === БЕЗОПАСНОСТЬ ===
SECURITY_KEY=vde_super_secret_key_2025_change_me
CSRF_TOKEN_NAME=_vde_token
SESSION_NAME=VDE_SESSION

# === ПРОИЗВОДИТЕЛЬНОСТЬ ===
CACHE_DRIVER=file
CACHE_TTL=3600
MAX_REQUEST_SIZE=10485760

# === ЛОГИРОВАНИЕ ===
LOG_LEVEL=info
LOG_MAX_FILES=30
LOG_MAX_SIZE=10485760

/etc/vdestor/config/app.ini
[session]
save_handler=db
gc_maxlifetime=1800
cookie_secure=true
cookie_httponly=true
cookie_samesite=Lax
name=VDE_SESSION
table=sessions
regenerate_interval=1800

[security]
max_login_attempts=5
lockout_duration=900
password_min_length=8
password_require_special=true
csrf_token_lifetime=3600
rate_limit_requests=60
rate_limit_window=60

[cache]
driver=file
default_ttl=3600
prefix=vde_
compress=true

[redis]
host=127.0.0.1
port=6379
password=m**DY
database=0
timeout=5
read_timeout=5

[email]
driver=smtp
host=smtp.yandex.ru
port=587
username=vde76ru@yandex.ru
password=your_app_password
encryption=tls
from_address=vde76ru@yandex.ru
from_name="VDE Store"

[logging]
channels[]=file
channels[]=database
max_file_size=10485760
max_files=30
compress_rotated=true

/etc/vdestor/config/config.php
<?php
return [
    'db' => [
        'host' => 'localhost',
        'username' => '**8',
        'password' => ';***',
        'dbname' => 'm***g'
    ]
];
?>

/etc/vdestor/config/database.ini
[mysql]
host=localhost
user=ad***
password=a***l
database=m***g


/etc/vdestor/config/generate_hash.php
<?php

// Задаём пароль вручную:
$plainPassword = 'C***6';  // <-- замените на свой

// Генерируем Bcrypt-хэш (cost по умолчанию = 10)
$hash = password_hash($plainPassword, PASSWORD_BCRYPT);

// Выводим его в консоль
echo "Ваш Bcrypt-хэш:\n" . $hash . "\n";


все эти файлы уже сущестуют!

конфигруация нашего сайта 
# -------------------  HTTP (80) блок: только редирект на HTTPS  -------------------
server {
    listen 79.133.183.86:80 default_server;
    server_name vdestor.ru www.vdestor.ru;
    root /var/www/www-root/data/site/vdestor.ru/public;

    # Перенаправление на HTTPS
    return 301 https://$host$request_uri;
}

# -------------------  HTTPS (443) основной блок  -------------------
server {
    listen 79.133.183.86:443 ssl http2 default_server;
    server_name vdestor.ru www.vdestor.ru;
    root /var/www/www-root/data/site/vdestor.ru/public;
    index index.php index.html;

    # SSL сертификаты
    ssl_certificate "/var/www/httpd-cert/www-root/vdestor.ru_le2.crtca";
    ssl_certificate_key "/var/www/httpd-cert/www-root/vdestor.ru_le2.key";
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_dhparam /etc/ssl/certs/dhparam4096.pem;
    ssl_ciphers EECDH:+AES256:-3DES:RSA+AES:!NULL:!RC4;

    # Безопасные заголовки (для всего сайта)
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header Content-Security-Policy "default-src 'self' https://vdestor.ru; script-src 'self' 'unsafe-inline' https://vdestor.ru; style-src 'self' 'unsafe-inline'; object-src 'none';" always;

    # Логи
    access_log /var/www/httpd-logs/vdestor.ru.access.log;
    error_log  /var/www/httpd-logs/vdestor.ru.error.log notice;

    # SSI, индексы, симлинки
    ssi on;
    disable_symlinks if_not_owner from=/var/www/www-root/data/site/vdestor.ru/public;
    charset off;

    # Включение Gzip
    gzip on;
    gzip_comp_level 5;
    gzip_disable "msie6";
    gzip_types text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript application/javascript image/svg+xml;

    # Подключение инклудов (если используются)
    include /etc/nginx/vhosts-includes/*.conf;
    include /etc/nginx/vhosts-resources/vdestor.ru/*.conf;

    # Редирект www на не-www
    if ($host = www.vdestor.ru) {
        return 301 https://vdestor.ru$request_uri;
    }

    # ----------------- Защита доступа к скрытым и важным файлам -----------------
    location ~ /\.env { deny all; return 404; }
    location ~ /\.(git|svn|ht|DS_Store) { deny all; }
    location ~ ^/config/(generate_hash\.php|config_bd\.ini)$ { deny all; return 404; }

    # ----------------- Основной роутинг -----------------
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Защита от прямого запуска .php и .phtml
    location ~ [^/]\.ph(p\d*|tml)$ {
        try_files /does_not_exists @php;
    }

    # Кеширование статики
    location ~* ^.+\.(jpg|jpeg|gif|png|svg|js|css|mp3|ogg|mpe?g|avi|zip|gz|bz2?|rar|swf|webp|woff|woff2)$ {
        expires 7d;
    }

    # ----------------- API: отдельная зона безопасности и лимит -----------------
    location /api/ {
        try_files $uri $uri/ =404;
        limit_req zone=api burst=10 nodelay;

        # Доп. безопасные заголовки
        add_header X-Content-Type-Options nosniff always;
        add_header X-Frame-Options DENY always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # ----------------- PHP-обработчик -----------------
    location @php {
        include /etc/nginx/vhosts-resources/vdestor.ru/dynamic/*.conf;
        fastcgi_index index.php;
        fastcgi_param PHP_ADMIN_VALUE "sendmail_path = /usr/sbin/sendmail -t -i -f vde76ru@yandex.ru";
        fastcgi_param  HTTPS               on;
        fastcgi_param  HTTP_X_FORWARDED_PROTO  $scheme;
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;
        fastcgi_split_path_info ^((?U).+\.ph(?:p\d*|tml))(/?.+)$;
        try_files $uri =404;
        include fastcgi_params;
    }
}
