
/** Set property to value in object.
 * @param {Object} object
 * @param {string} prop
 * @param {any} value
 */
function setProperty(object, prop, value) 
{
  var fields = prop.split(/[\.\[\]]/).filter(elem => elem.length > 0);
  var tempObj = object;
  for (var i = 0; i < fields.length - 1; ++i) 
  {
    if (tempObj[fields[i]] === undefined) 
    {
      tempObj[fields[i]] = {};
    }
    tempObj = tempObj[fields[i]];
  }
  tempObj[fields[fields.length - 1]] = value;
}

function deepCopy(obj) {
  if (Object.prototype.toString.call(obj) === '[object Array]') {
    var out = [], i = 0, len = obj.length;
    for ( ; i < len; i++ ) {
      out[i] = deepCopy(obj[i]);
    }
    return out;
  }
  if (typeof obj === 'object') {
    var out = {}, i;
    for ( i in obj ) {
      out[i] = deepCopy(obj[i]);
    }
    return out;
  }
  return obj;
}

function flatten(arr) {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

function uint8ArrayToBase64( bytes ) {
  let binary = '';
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode( bytes[ i ] );
  }
  return window.btoa( binary );
}

export { setProperty, deepCopy, flatten, uint8ArrayToBase64 };