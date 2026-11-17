
# Install Webship JS

**Install Webship-js on your project. Simply execute the following command:**

```
npm install webship-js
```

The install script of the package scaffolds the test project: `cucumber.js`, `playwright.config.ts`, a `tests/` folder with a starter feature, the `test` scripts of `package.json`, and Chromium. When npm skips it (npm warns that webship-js has "install scripts not yet covered by allowScripts", or `--ignore-scripts` is set), scaffold it with:

```
npx init-webship-js
```

`npm install-scripts approve webship-js` lets the install script run on the next installs.

A project upgraded from webship-js 1.x has a `test` script that runs Nightwatch: the scaffold replaces it with the cucumber-js suite, keeps the old command as `npm run test:nightwatch`, and says so. `npx init-webship-js --force` rewrites the scaffold's files and scripts, but never `tests/step-definitions/custom.js`, which holds the project's own steps.

## Automated Functional Acceptance Testing

The starter feature opens the home page of your site:

```
LAUNCH_URL=https://your-site.example npm test
```

Without `LAUNCH_URL` the suite opens `http://localhost:8080`.

### Boost your site's success with automated testing

#### For Commercial Professional Support

[Contact Us](/contact)

## Documentation Structure

The page is part of the Webship JS 2.0.x documentation section, which includes:

- Global Settings
- Step Definitions
- API Step Definitions
- Advanced Screenshots
- Advanced Selectors
- Assertions
- Commands

There is also a subsection on "[DDEV Webship-JS](/docs/webship-js/2.0.x/install-webship-js/ddev-webship-js)" available under the installation guide.
