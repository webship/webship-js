/**
 * Get Element 
 *
 * Find field with specified id|name|label|value. 
 */
 function getElement(fieldDefinition) {

  var el = document.getElementById(fieldDefinition);
  if(el != null){
    return el;
  }

  var el = document.getElementsByName(fieldDefinition);
  if(el.length > 0){
    return el[0];
  }

  var labels = document.getElementsByTagName('label');
  var el;
  for (var i = 0; i < labels.length; i++) {
    const lblText = labels[i].innerText.replace(":", '');
    const fieldKey = fieldDefinition.replace(":", '');

      if (lblText == fieldKey) {
        el = document.getElementById(labels[i].htmlFor);
        if(el != null){
          break;
        }
      }
  }
  
  if(el != null){
    if(el.length > 0){
        return el;
      }
  }
  
  var els = document.getElementsByTagName('input');
  var el;

  for (var i = 0, length = els.length; i < length; i++) {
      var localEl = els[i];

      if (localEl.value.toLowerCase() == fieldDefinition.toLowerCase()) {
        el = localEl;
        break;
      }
  }
  if(el != null){
    return el;
  }
}

/**
 * Button object 
 *
 * Find button object by type and value and return. 
 */
function getButtonByValue(value) {
  var els = document.getElementsByTagName('input');

  for (var i = 0, length = els.length; i < length; i++) {
      var el = els[i];

      if (el.type.toLowerCase() == 'button' && el.value.toLowerCase() == value.toLowerCase()) {
          return el;
          break;
      }
  }
}

/**
 * Link object 
 *
 * Find link object by text and value and return. 
 */
 function getLinkByValue(value) {
  var els = document.getElementsByTagName('a');

  for (var i = 0, length = els.length; i < length; i++) {
      var el = els[i];

      if (el.text == value) {
        return el;
          break;
      }
  }
}

/**
 * Find Element 
 *
 * Looking for element by id|name|label|value and return
 * if exist or not. 
 */
 function FindElement(field) {
  var els = document.getElementsByTagName(field);

  for (var i = 0, length = els.length; i < length; i++) {
      var el = els[i];

      if (el.text == value) {
        return el;
          break;
      }
  }
}

module.exports = {
  getElement:getElement
}