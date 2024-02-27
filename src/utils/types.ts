// override type properties for already exist type
export type Modify<T, U> = Omit<T, keyof U> & U
