# Oxalate Portal frontend UI

This is the React-based frontend for the [Oxalate-Portal project](https://github.com/Oxalate-Portal/).

There are separate documentation for:

* [Setting up the frontend for testing and production](documentation/installation/index.md)
* [User documentation](documentation/user/index.md)

## Development

Oxalate frontend uses:

* [Ant Design](https://ant.design/) for UI components and forms
* [Ant Charts](https://charts.ant.design/en/) for charts and graphs
* Custom [CKEditor 5](https://ckeditor.com/docs/ckeditor5/) build for rich text editing
* [DomPurify](https://github.com/cure53/DOMPurify) for sanitizing HTML
* [i18next](https://www.i18next.com/) for internationalization
* [translation-check](https://github.com/locize/translation-check) for checking translations

### Set up

To set up development, copy the `.env` as `.env.local` and add `VITE_APP_SITE_KEY` as variable containing the Google ReCAPTCHA site key.

### Yarn 4 migration

This repository uses Yarn 4 (`packageManager: yarn@4.13.0`) instead of npm.

Before installing dependencies, enable Corepack and activate the pinned Yarn version:

```bash
corepack enable
corepack prepare yarn@4.13.0 --activate
```

Then use Yarn commands for daily work:

```bash
yarn install
yarn start
yarn test
yarn lint
```

## Available additional UIs

* Local [translation check](http://localhost:3000/?showtranslations) for checking translations.

# Licence

This code is published under the [GPL 2 License](LICENSE).

# Contributors

* Mikko Mustonen, founder, (React)
* Paul-Erik 'Poltsi' Törrönen, developer, (React)
* Pekka Palokorpi (Graphics)