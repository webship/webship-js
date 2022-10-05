/**
 * Step definitions list format
 *
 * List format values:
 * -dl : to return Clean Step definitions list
 * -di : return Step definitions list with step information
 */
let ListFormat = '-dl'; 
function setListFormat(value) 
{  ListFormat = value; }  
export { ListFormat, setListFormat }; 

/**
 * Start with Function.
 *
 * Return list of array items that start with (Given, Then, When, *).
 *
 * @param StepDef_Arr 
 * @returns array
 */
function StartWith(StepDef_Arr) {
  if(ListFormat == '-dl')
  {
    return( StepDef_Arr.startsWith('Given') 
       || StepDef_Arr.startsWith('Then') 
       || StepDef_Arr.startsWith('When')) ;
  }
  else if(ListFormat == '-di')
  {
   return(StepDef_Arr.startsWith('Given') 
       || StepDef_Arr.startsWith('Then') 
       || StepDef_Arr.startsWith('When') 
       || StepDef_Arr.startsWith('/**') 
       || StepDef_Arr.startsWith('* ') 
       || StepDef_Arr.startsWith('*/'));
  }
}

/**
 * Filter Step Definitions
 * 
 * @param {*} StepDef_Arr 
 * @returns 
 */
function FilterStepDefinitions(StepDef_Arr){
  return StepDef_Arr.filter(StartWith);
}

/**
 * Clean Steps List
 * 
 * Return list of array items cleand from unreadable chars
 * 
 * @param ListArr 
 * @returns 
 */
function CleanStepsList(ListArr) {
  var StepComment = '';
  var NewArr = Array();

  ListArr.forEach((element, index) => {

    if(element.startsWith("/**") || element.startsWith("* ") || element.startsWith("*/")){
        if(StepComment == '')
          StepComment = element;
        else
          StepComment = StepComment + '\r\n' + element;
    }
    else
    {
      const Filter1 = element.split("$/");
      const Filter2 = Filter1[0].replace("(/^", ' ');

      NewArr.push(Filter2 + '\r\n' + StepComment);
      StepComment = '';
    }
      
  });
  return NewArr;
}

export{
  FilterStepDefinitions,
  CleanStepsList
}