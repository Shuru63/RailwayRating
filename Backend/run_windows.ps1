# Set the environment variable
Set-Item -Path Env:ENV -Value ("LOCAL")

# # Run migrations
python manage.py run_migrations

# Insert Data
python manage.py collectstatic
python manage.py seeddata
