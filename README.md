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


# Frontend SWACHHSTATIONS


## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

#### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

#### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
