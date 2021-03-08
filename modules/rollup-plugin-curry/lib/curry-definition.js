import parse from './parse'
import curryPrint from './curry-print'

export default function cd (functionDeclaration) {
  const definition = parse(functionDeclaration)
  return curryPrint(definition)
}
