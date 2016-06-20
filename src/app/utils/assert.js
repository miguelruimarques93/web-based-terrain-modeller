
function require(condition, message)
{
  if (!condition)
  {
    let errorMessage = "Precondition failed";
    if (message)
      errorMessage += ": " + message;

    if (typeof Error !== "undefined")
    {
      throw new Error(errorMessage);
    }
    throw errorMessage; // Fallback
  }
}

function assert(condition, message) 
{
  if (!condition) 
  {
    let assertionMessage = "Assertion failed";
    if (message)
      assertionMessage += ": " + message;

    if (typeof Error !== "undefined") 
    {
      throw new Error(assertionMessage);
    }
    throw assertionMessage; // Fallback
  }
}

export { assert, require };