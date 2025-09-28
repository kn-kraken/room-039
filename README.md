# Install `bun`

You can find the installation instructions [here](https://bun.com/docs/installation).

# Build and bundle the project

To create the production bundle run `bun run build`. The output bundle should be created in the `build` directory.

# Start the server

To run the server you must provide the `CONSUMER_KEY` and `CONSUMER_SECRET` environment variables with values defined by USOS for this project.

Run `bun ./build` to start serving the webpage. You can find configuration options for the server [here](https://svelte.dev/docs/kit/adapter-node).
