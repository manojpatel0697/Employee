export const cookies = jest.fn(() => ({
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn(() => []),
}));

export const headers = jest.fn(() => new Headers());
