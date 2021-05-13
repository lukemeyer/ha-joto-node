# ha-joto-node: Home Assistant Joto Display

## Draws data from Home Assistant on the Joto whiteboard

![Sample](./joto.svg)

## Usage
1. Set up a sensor in Home Assistant - look at the sensor.joto.yml file for a full example of a template sensor with all the atrtributes needed.
1. Configure your enviroment variables
    - Vars are explained in the .env.example file
3. Run index.js
    - Use the 'start_dotenv' npm script if you want to just run locally and read variables from a .env file

## Limitations
- Uses https for the request to HA, not sure how this works with non-https HA installs
- Only supports drawing 4 sections in a 2x2 grid, I may add more configurable row/column layouts later
- Only supports values as strings, the joto-svg package has support for icons and charts, so I may add those later

## Thanks
Thank you to NTag for the two packages that I'm using to work with the Joto
- [joto-svg](https://github.com/NTag/joto-svg): create SVGs with icons, text, charts, for your Joto
- [joto-api](https://github.com/NTag/joto-api): send SVGs to your Joto with NodeJS
