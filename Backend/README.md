# SwachhStations_BE

## Installation

1. **Clone the repository**
    ```bash
    git clone https://github.com/s2pl/SwachhStations_BE.git -b <<branch_name>>
    ```

2. **Setup virtual environment (Use Python 3.9)**
    ```bash
    python -3.9 -m venv .env
    ```

3. **Activate the virtual environment**
    - For Windows:
        ```bash
        .env/Scripts/activate
        ```
    - For Linux:
        ```bash
        source .env/bin/activate
        ```

4. **Install dependencies**
    ```bash
    pip install -r requirements.txt
    ```

5. **Run the setup script**
    - Windows:
        ```bash
        .\run_windows.ps1   # Run in powershell
        ```
    - Linux:
        ```bash
        export ENV=LOCAL
        python manage.py run_migrations
        python manage.py collectstatic
        python manage.py seeddata
        ```

6. **Insert optional data**
    ```bash
    python manage.py insert_user    # or insert_single_user
    python manage.py notified_user
    ```

7. **Create Super User**
    ```bash
    python manage.py createsuperuser
    ```

## Development

1. **Set the environment variable to 'LOCAL'**
    - Linux:
        ```bash
        export ENV=LOCAL
        ```
    - Windows (PowerShell):
        ```bash
        Set-Item -Path Env:ENV -Value ("LOCAL")
        ```
    - Windows (Command Prompt):
        ```bash
        set ENV=LOCAL
        ```

2. **Run the development server**
    ```bash
    python manage.py runserver
    ```

2. **To Generate the ERD**
    - Generate the dot file
    ```bash
    python manage.py graph_models -a > erd.dot
    ```
    - Generate the diagram
    ```bash
    dot -Tpng erd.dot -o erd.png
    ```

## Deployment

1. **Install environment-specific dependencies**
    ```bash
    pip install -r requirements.txt
    ```

2. **Run migrations**
    ```bash
    python manage.py run_migrations
    ```

3. **Insert optional data**
    ```bash
    python manage.py insert_user    # or insert_single_user
    python manage.py notified_user
    ```

4. **Run the server**
    ```bash
    python gunicorn_config.py 8000  # here 8000 may vary
    ```
