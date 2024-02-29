export const convertNumberEnumToArray = (target: { [key: string]: string | number }) => {
  return Object.values(target).filter((value) => typeof value === 'number') as number[]
}

export const covertStringEnumToArray = (target: { [key: string]: string }) => {
  return Object.values(target)
}
