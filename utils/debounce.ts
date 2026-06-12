let debounceTimeout: number | null = null;

export const debounce = (func: Function, delay: number) => {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
  debounceTimeout = window.setTimeout(func, delay); // ブラウザでは setTimeout は windowオブジェクト上にあります
};
