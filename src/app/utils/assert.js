import ExtendableError from 'es6-error';

class RequirementError extends ExtendableError { }

class AssertionError extends ExtendableError { }

function require(condition, message)
{
  if (!condition)
  {
    throw new RequirementError(message);
  }
}

function assert(condition, message) 
{
  if (!condition) 
  {
    throw new AssertionError(message);
  }
}

export { assert, require };