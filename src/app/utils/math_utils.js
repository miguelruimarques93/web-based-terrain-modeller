function randomUInt()
{
  return Math.floor(Math.random() * (Math.ceil(2, 32) - 1));
}

function isPowerOf2(num)
{
  return num > 0 && ((num & (num - 1)) === 0);
}

export { randomUInt, isPowerOf2 };