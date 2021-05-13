//@ts-check
const fs = require('fs');
const https = require('https');
const JotoSVG = require('joto-svg');
const JotoAPI = require('joto-api');

const fileMode = process.env.FILE_MODE;

(async function() {

    /**
     * @type https.RequestOptions
     */
    const requestOptions = {
        hostname: process.env.HA_HOST,
        port: process.env.HA_PORT,
        path: '/api/states/' + process.env.HA_SENSOR,
        headers: {
        'Authorization': 'Bearer ' + process.env.HA_TOKEN
        }
    }

    // Get data from HA
    verboseLog('Fetching: ' + requestOptions.hostname + ':' + requestOptions.port + requestOptions.path);

    let sensorData = {};
    try {
        const rawSensorData = await fetch(requestOptions);
        verboseLog(rawSensorData);

        const sensorState = JSON.parse(rawSensorData);
        sensorData = sensorState.attributes;
    } catch (error) {
        console.error(error);
    }
    
    // Create the svg elements
    // @ts-ignore
    const joto = new JotoSVG();

    // Draw sections
    const width = 500;
    const height = 500;
    const cols = 2;
    const rows = 2;

    const titleSize = 30;
    const labelSize = 20;
    const padding = 10;
    const valueSize = 50;
    const smallValueSize = 30;

    // Starting Coords
    let sectionX = 0;
    let sectionY = 0;
    const rowHeight = height / rows;
    const colWidth = width / cols;
    const titleYOffset = padding;
    const labelYOffset = (height / rows) - (labelSize + padding);
    const valueYOffset = ((height / rows) / 2);

    for (let i = 0; i < sensorData.sectionCount; i++) {
        const title = sensorData['section_' + i + '_title'].toString();
        const label = sensorData['section_' + i + '_label'].toString();
        const value = sensorData['section_' + i + '_value'];
        const type = sensorData['section_' + i + '_type'].toString();

        const row = Math.floor(i / cols);
        const col = i % cols;

        sectionY = row * rowHeight;
        sectionX = (col * colWidth) + (colWidth / 2);

        verboseLog(col + ',' + row + ': ' + title + ' - ' + value.toString() + ' - ' + label);
        
        // Title
        joto.addString({ x: sectionX, y: sectionY + titleYOffset, size: titleSize, str: title, align: 'center' });

        // Label
        joto.addString({ x: sectionX, y: sectionY + labelYOffset, size: labelSize, str: label, align: 'center' });

        // Value
        switch (type) {
            case 'string':
                joto.addString({ x: sectionX, y: sectionY + (valueYOffset - (valueSize / 2)), size: valueSize, str: value.toString(), align: 'center' });
                break;
            case 'string-small':
                joto.addString({ x: sectionX, y: sectionY + (valueYOffset - (smallValueSize / 2)), size: smallValueSize, str: value.toString(), align: 'center' });
                break;
        
            default:
                break;
        }
    }

    // Draw separators
    // Cols
    for (let i = 1; i < cols; i++) {
        joto.addPath({ x: colWidth * i, y: 0, d: 'M0,0L0,500' });
    }
    // Rows
    for (let i = 1; i < cols; i++) {
        joto.addPath({ x: 0, y: rowHeight * i, d: 'M0,0L500,0' });
    }

    // Compile svg
    const svg = joto.getSVG();

    // Send to Joto
    if ( process.env.SEND_JOT === 'true' ){
        verboseLog('Sending Jot...');
        await JotoAPI.login(process.env.JOTO_USER, process.env.JOTO_PASSWORD);
        await JotoAPI.selectJoto(); // If you have multiple Jotos, you can pass the "Decide ID" or "Device Name" as a parameter
        await JotoAPI.drawSVG(svg);
    }
    
    // Write to filesystem
    if ( process.env.WRITE_FILE === 'true' ){
        fs.writeFileSync('./joto.svg', svg, { encoding: 'utf8' });
        verboseLog('File written.');
    }


})();

async function fetch(options) {
  return new Promise((resolve, reject) => {
    const request = https.get(options, (res) => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        return reject(new Error(`HTTP status code ${res.statusCode}`))
      }

      const body = []
      res.on('data', (chunk) => body.push(chunk))
      res.on('end', () => {
        const resString = Buffer.concat(body).toString()
        resolve(resString)
      })
    })

    request.on('error', (err) => {
      reject(err)
    })
    request.on('timeout', () => {
      request.destroy()
      reject(new Error('timed out'))
    })
  })
}

function verboseLog(message){
    if ( process.env.VERBOSE ){
        console.log(message);
    }
}