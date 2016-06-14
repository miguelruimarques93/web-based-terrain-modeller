
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

export { setProperty };