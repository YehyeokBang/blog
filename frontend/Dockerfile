FROM nginx:stable-alpine

# Copy custom Nginx configuration to support clean URLs and static routing
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy build output to Nginx document root
COPY out /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
