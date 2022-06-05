# Webship JS

[![Webship-js CI](https://github.com/webship/webship-js/actions/workflows/github-actions.yml/badge.svg?branch=1.0.x)](https://github.com/webship/webship-js/actions)
[![CircleCI](https://circleci.com/gh/webship/webship-js/tree/1.0.x.svg?style=svg)](https://circleci.com/gh/webship/webship-js/tree/1.0.x)
[![pipeline status](https://gitlab.com/webship/webship-js/badges/master/pipeline.svg)](https://gitlab.com/webship/webship-js/-/pipelines)

Webship JS has a ready step definitions for automated functional testing.

### Using:
* Nightwatch.js
* Cucumber-js


### Webship-js Documentations
All you need to know about [webship-js Docs](https://webship.gitbook.io/webship-js-docs/).


## How to install using NPM

```
npm i webship-js
```

## How to install using Yarn

```
yarn i webship-js
```

## How to configure your project to test using webship-js steps

### Install node js and yarn

```
sudo apt install nodejs
sudo npm install yarn
```

### Install Java

```
sudo apt install java
```

### Download Latest Chrome Driver

```
CHROME_DRIVER_VERSION=$(wget -qO- chromedriver.storage.googleapis.com/LATEST_RELEASE);
echo $CHROME_DRIVER_VERSION;
wget http://chromedriver.storage.googleapis.com/$CHROME_DRIVER_VERSION/chromedriver_linux64.zip
unzip chromedriver_linux64.zip
chmod +x chromedriver
mkdir -p $HOME/.composer/vendor/bin
mv -f chromedriver $HOME/.composer/vendor/bin/
rm chromedriver_linux64.zip
```

### Install/Update Chrome Driver

```
export CHROME_BIN=/usr/bin/google-chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt-get clean
sudo apt-get update
sudo apt-get install dpkg
sudo dpkg -i google-chrome-stable_current_amd64.deb
rm google-chrome-stable_current_amd64.deb
google-chrome --version
```

### Run selenium standalone server



