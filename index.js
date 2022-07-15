//@ts-check
const fs = require('fs');
const https = require('https');
const JotoSVG = require('joto-svg');
const JotoAPI = require('joto-api');
const icons = require('@fortawesome/free-solid-svg-icons');

(async function () {

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

  // Define drawing space
  const width = 500;
  const height = 500;
  const cols = 2;
  const rows = 2;

  // Size constants
  const titleSize = 35;
  const labelSize = 25;
  const padding = 15;
  const valueSize = 50;
  const smallValueSize = 30;
  const iconSize = 70;

  // Calc positions from coonstants
  const rowHeight = height / rows;
  const colWidth = width / cols;
  const titleYOffset = padding;
  const labelYOffset = (height / rows) - (labelSize + padding);
  const valueYOffset = ((height / rows) / 2);

  for (let i = 0; i < sensorData.sectionCount; i++) {
    // Extract tile parts  
    const title = sensorData['section_' + i + '_title'].toString();
    const label = sensorData['section_' + i + '_label'].toString();
    const value = sensorData['section_' + i + '_value'];
    const type = sensorData['section_' + i + '_type'].toString();

    // Find tile coord
    const row = Math.floor(i / cols);
    const col = i % cols;

    // Calc initial positions
    const sectionY = row * rowHeight;
    const sectionX = (col * colWidth) + (colWidth / 2);

    verboseLog(col + ',' + row + ': ' + title + ' - ' + value.toString() + ' - ' + label);

    // Draw Tile

    // Title
    if (title) {
      joto.addString({ x: sectionX, y: sectionY + titleYOffset, size: titleSize, str: title, align: 'center' });
    }

    // Label
    if (label) {
      joto.addString({ x: sectionX, y: sectionY + labelYOffset, size: labelSize, str: label, align: 'center' });
    }

    // Value
    switch (type) {
      case 'string':
        joto.addString({ x: sectionX, y: sectionY + (valueYOffset - (valueSize / 2)), size: valueSize, str: value.toString(), align: 'center' });
        break;
      case 'string-small':
        joto.addString({ x: sectionX, y: sectionY + (valueYOffset - (smallValueSize / 2)), size: smallValueSize, str: value.toString(), align: 'center' });
        break;
      case 'string-multiline':
        // Split lines
        let lines = value.toString().split(/\r?\n/);
        // Remove empty lines
        lines = lines.filter((line) => { return line.length });

        // Calc position
        const lineHeight = smallValueSize * 1.4;
        const totalHeight = lines.length * lineHeight;
        const yStart = sectionY + (valueYOffset - (totalHeight / 2));

        // Draw lines
        for (let i = 0; i < lines.length; i++) {
          joto.addString({ x: sectionX, y: yStart + (lineHeight * i), size: smallValueSize, str: lines[i], align: 'center' });
        }

        break;
      case 'icon':
        joto.addFAIcon({ x: sectionX - (iconSize / 2), y: sectionY + (valueYOffset - (iconSize / 2)), size: iconSize, icon: icons[value.toString()] });
        break;
      case 'sparkline':
        const data = value;//[{x:0,y:1},{x:3,y:3},{x:5,y:3},{x:9,y:2},{x:10,y:5}];
        // Sort by x
        // Get min/max
        let dataStats = {x:{min:Number.POSITIVE_INFINITY,max:Number.NEGATIVE_INFINITY},y:{min:Number.POSITIVE_INFINITY,max:Number.NEGATIVE_INFINITY}};
        dataStats = data.reduce((previous,current)=>{
          
          const stats = previous;
          stats.x.min = current.x < stats.x.min ? current.x : stats.x.min;
          stats.x.max = current.x > stats.x.max ? current.x : stats.x.max;

          stats.y.min = current.y < stats.y.min ? current.y : stats.y.min;
          stats.y.max = current.y > stats.y.max ? current.y : stats.y.max;
          return stats;
        },dataStats);
        dataStats.x.delta = dataStats.x.max - dataStats.x.min;
        dataStats.y.delta = dataStats.y.max - dataStats.y.min;

        //verboseLog(dataStats);
        //const step = Math.min((colWidth / 2) / dataStats.x.delta,((rowHeight / 2) / dataStats.y.delta));
        const xStep = (colWidth * .8) / dataStats.x.delta;
        const yStep = 0 - ((rowHeight / 2) / dataStats.y.delta);

        //verboseLog('Steps: ' + xStep + ',' + yStep);

        const xOrigin = sectionX - (colWidth * .4);
        const yOrigin = sectionY + (rowHeight / 4);
        
        //verboseLog('Origin: ' + xOrigin + ',' + yOrigin);

        // Draw line from current -> next data point
        //data.unshift({x:0,y:0});
        let path = '';//'M' + xOrigin + ' ' + yOrigin;
        for (let i = 0; i < data.length; i++ ){
          
          const xStart = xOrigin + (xStep * data[i].x);
          const yStart = yOrigin + (yStep * data[i].y);
          //verboseLog([data[i],{'x':xStart,'y':yStart}]);
          if ( i === 0 ){
            path += 'M ' + xStart + ',' + yStart;
          } else {
            path += ' L ' + xStart + ',' + yStart;
          }

        }
        verboseLog(path);
        joto.addPath({x:xOrigin, y:yOrigin, d: path});
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
  for (let i = 1; i < rows; i++) {
    joto.addPath({ x: 0, y: rowHeight * i, d: 'M0,0L500,0' });
  }

  // Compile svg
  const svg = joto.getSVG();

  // Send to Joto
  if (process.env.SEND_JOT === 'true') {
    verboseLog('Sending Jot...');
    await JotoAPI.login(process.env.JOTO_USER, process.env.JOTO_PASSWORD);
    await JotoAPI.selectJoto(); // If you have multiple Jotos, you can pass the "Decide ID" or "Device Name" as a parameter
    await JotoAPI.drawSVG(svg);
  }

  // Write to filesystem
  if (process.env.WRITE_FILE === 'true') {
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

function verboseLog(message) {
  if (process.env.VERBOSE) {
    console.log(message);
  }
}