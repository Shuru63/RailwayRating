
import api from './api';

describe('Axios Instance Configuration', () => {
  it('creates an instance with the correct baseURL', () => {
    expect(api.defaults.baseURL).toBe('https://cmsapi.suvidhaen.com/');
  });
});
