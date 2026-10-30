/** Small arithmetic parser. User input is never evaluated as JavaScript. */
export function calculateExpression(input: string): number {
  const text = input.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/\s/g, "");
  if (!text || text.length > 200 || /[^\d.+\-*/()%]/.test(text)) throw new Error("Enter a valid calculation.");
  let position = 0;
  function factor(): number {
    let value: number;
    if (text[position] === "+" || text[position] === "-") {
      const sign = text[position++];
      return (sign === "-" ? -1 : 1) * factor();
    }
    if (text[position] === "(") {
      position += 1;
      value = sum();
      if (text[position++] !== ")") throw new Error("Close the parentheses to finish.");
    } else {
      const number = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(text.slice(position));
      if (!number) throw new Error("Finish the calculation first.");
      position += number[0].length;
      value = Number(number[0]);
    }
    while (text[position] === "%") { value /= 100; position += 1; }
    return value;
  }
  function product(): number {
    let value = factor();
    while (text[position] === "*" || text[position] === "/") {
      const operator = text[position++];
      const next = factor();
      if (operator === "/" && next === 0) throw new Error("Cannot divide by zero.");
      value = operator === "*" ? value * next : value / next;
    }
    return value;
  }
  function sum(): number {
    let value = product();
    while (text[position] === "+" || text[position] === "-") {
      const operator = text[position++];
      const next = product();
      value = operator === "+" ? value + next : value - next;
    }
    return value;
  }
  const result = sum();
  if (position !== text.length) throw new Error("Enter a valid calculation.");
  if (!Number.isFinite(result) || Math.abs(result) > Number.MAX_SAFE_INTEGER / 100) throw new Error("That amount is too large.");
  return Number(result.toPrecision(14));
}
