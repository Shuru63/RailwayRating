#!/bin/bash

# Change to the 'xyz' directory
echo changing directory to ~/SwachhStations_BE
cd ~/SwachhStations_BE

# Activate the virtual environment
echo activating virtual environment
source ~/env/bin/activate

# Pull the latest code from the 'uat' branch
echo pulling latest code
git pull origin main

# Install pip requirements
echo installing requirements
pip install -r requirements-linux.txt

# Migration Commands
echo running makemigrations
python manage.py makemigrations comment
python manage.py makemigrations feedback
python manage.py makemigrations file_upload
python manage.py makemigrations inspection_feedback
python manage.py makemigrations notified_task
python manage.py makemigrations notified_data
python manage.py makemigrations notified_users
python manage.py makemigrations pax_deployed
python manage.py makemigrations ratings
python manage.py makemigrations shift
python manage.py makemigrations station
python manage.py makemigrations task
python manage.py makemigrations task_shift_occurrence
python manage.py makemigrations user_onboarding
python manage.py makemigrations pdf
python manage.py makemigrations

# Migrate Commands
echo running migrate
python manage.py migrate comment
python manage.py migrate feedback
python manage.py migrate file_upload
python manage.py migrate inspection_feedback
python manage.py migrate notified_task
python manage.py migrate notified_data
python manage.py migrate notified_users
python manage.py migrate pax_deployed
python manage.py migrate ratings
python manage.py migrate shift
python manage.py migrate station
python manage.py migrate task
python manage.py migrate task_shift_occurrence
python manage.py migrate user_onboarding
python manage.py migrate pdf
python manage.py migrate


# Check if there's a process running on port 5000 and kill it
echo killing existing process
existing_pid=$(lsof -ti :8000)
if [ -n "$existing_pid" ]; then
    echo "Killing existing process on port 5000 (PID: $existing_pid)..."
    kill -9 "$existing_pid"
fi

# Start the server
echo starting server
nohup python manage.py runserver 0.0.0.0:8000 &