export const getParams = () => {
  const queryString = window.location.search;
  console.log(`queryString = ${queryString}`);
  return new URLSearchParams(queryString);
};
