# ha-joto-node: Home Assistant Joto Display

## Draws data from Home Assistant on the Joto whiteboard

![Sample](./joto.svg)

## Features
- Reads a template sensor from the HA API, allowing display of anything you can output in a template (almost)  
- 3 custom fields per tile
  - Title - Top line of text
  - Value - Large text or icon in the center
  - Label - small text at the bottom of the tile
- Can display a font-awsome icon in the value field

## Usage
1. Set up a sensor in Home Assistant - look at the sensor.joto.yml file for a full example of a template sensor with all the attributes needed.
1. Configure your enviroment variables
    - Vars are explained in the .env.example file
3. Run index.js
    - Use the 'start_dotenv' npm script if you want to just run locally and read variables from a .env file

## Limitations
- Uses https for the request to HA, not sure how this works with non-https HA installs
- Only supports drawing 4 sections in a 2x2 grid, I may add more configurable row/column layouts later
- Only supports values as strings and icons, the joto-svg package has support charts, so I may add those later

## Thanks
Thank you to NTag for the two packages that I'm using to work with the Joto
- [joto-svg](https://github.com/NTag/joto-svg): create SVGs with icons, text, charts, for your Joto
- [joto-api](https://github.com/NTag/joto-api): send SVGs to your Joto with NodeJS
