// regex email: not start with special character and not end with special character (before @ symbot)
// two special character not come near
export const emailRegex =
  /^(?:(?!.*?[.]{2})[a-zA-Z0-9](?:[a-zA-Z0-9_.+!%-]{1,64}|)[^!@#$%^&*()_+'" -])@[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// regex email: same validate as emailRegex but also allow single % character before domain
export const wildcardEmailRegex = 
  /^(%|(?:(?!.*?[.]{2})[a-zA-Z0-9](?:[a-zA-Z0-9_.+!-]{0,63})[^!@#$%^&*()_+'" -]))@[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;