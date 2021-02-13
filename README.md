# CanvasReplace

It's a project to recreate a simple /r/place canvas.

# Dependencies

This program requires `sqlite3` and `node`.

# Docker

If you want to use Docker, a Dockerfile and docker-compose.yml files are included.
Running `docker-compose up` will start the canvas on port 8000.

# Installation

```sh
npm install
npm run-script create-database
cp .envexample .env
<edit .env here>
``` 

# Usage

```sh
npm start
```

# Environment variables

These are used by the application.
They can be set in the `.env` file, in the docker-compose file, on the command-line etc.

`PORT`: The port on which to run the app. If you use docker, you'll need to expose it in a proper way.

`WIDTH`: Horizontal dimension of the canvas in pixels.

`HEIGHT`: Vertical dimension of the canvas in pixels.

`TIMER`: Minimum time between two pixel placements.

`DISCORD`: Discord adress to be displayed in the "Welcome panel".

`BASE_URL`: Base URL on which to run the canvas.

`DATETIME_WHITELIST`: String of the form `yyyy-mm-dd hh:mm:ss#yyyy-mm-dd hh:mm:ss;yyyy-mm-dd hh:mm:ss#yyyy-mm-dd hh:mm:ss`.
It defines times during which drawing on the canvas is allowed.
If `DATETIME_WHITELIST` isn't specified, or is empty, canvas edition is allowed without time constraint.

