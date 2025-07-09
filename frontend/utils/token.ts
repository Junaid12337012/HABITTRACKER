export const getToken = () => localStorage.getItem('token') || '';
export const setToken = (t: string) => localStorage.setItem('token', t);
export const clearToken = () => localStorage.removeItem('token');
