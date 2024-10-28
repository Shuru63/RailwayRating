pip install -r requirements.txt
# for Migrations
sh migration_script.sh
# for inserting Data [Optional]
python manage.py collectstatic
python manage.py seeddata
python manage.py insert_user # or insert_single_user
python manage.py notified_user
# for running server
python gunicorn_config.py 8000 # here 8000 may vary
python manage.py runserver # either gunicorn or manage runserver