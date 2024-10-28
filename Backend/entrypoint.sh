#!/bin/bash

# Make migrations and migrate the database
echo "Making migrations and migrating the database"
python manage.py makemigrations
python manage.py migrate

# Collect static files
echo "Collecting static files"
python manage.py collectstatic --noinput

# Start the Django development server
echo "Starting Django development server"

python manage.py insert_data_ara
python manage.py insert_data_bkp
python manage.py insert_data_bxr
python manage.py insert_data_dnr
python manage.py insert_data_jmu
python manage.py insert_data_kiul
python manage.py insert_data_mka
python manage.py insert_data_pnbe
python manage.py insert_data_pnc
python manage.py insert_data_ppta
python manage.py insert_data_rjpb
python manage.py insert_role
python manage.py insert_user
python manage.py notified_user
python manage.py seeddata

python manage.py runserver 0.0.0.0:8000