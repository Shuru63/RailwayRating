#!/bin/bash

echo "single deploy script"

echo changing directory to ~/SwachhStations_BE
cd ~/SwachhStations_BE

# Activate the virtual environment
echo activating virtual environment
source ~/env/bin/activate

# Pull the latest code from the 'uat' branch
echo pulling latest code
git pull origin main

# Add your code here
##########################







##########################
# remove the code on next push

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