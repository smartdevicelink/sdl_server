#!/bin/sh
cd /var/www/sdlserver
apt-get install git
npm install --prefix /var/www/sdlserver
./node_modules/bower/bin/bower install --allow-root